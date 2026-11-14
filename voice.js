/*
 * EMBER voice: speech in, speech out.
 * - With OPENAI_API_KEY on the server (/api/voice): recorded speech goes to OpenAI speech
 *   recognition, answers are read with an OpenAI voice. Best quality, works for Uzbek too.
 * - Otherwise: the browser's Web Speech API (SpeechRecognition + speechSynthesis), free.
 * - "Hey EMBER" wake word always uses the browser recogniser, so listening for it costs nothing.
 */
(function () {
  const E = window.EMBER;
  const API = (window.EMBER_CONFIG && window.EMBER_CONFIG.voiceUrl) || "api/voice";
  const BCP = { en: "en-US", ru: "ru-RU", uz: "uz-UZ" };
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let server = null; // null = unknown, false, or { stt, tts }
  let audio = null; // current <audio> for server speech
  const ttsCache = new Map();

  async function status() {
    if (server !== null) return server;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3500);
      const r = await fetch(API, { signal: ctrl.signal });
      clearTimeout(timer);
      const j = r.ok ? await r.json() : null;
      server = j && (j.stt || j.tts) ? { stt: !!j.stt, tts: !!j.tts } : false;
    } catch (e) {
      server = false;
    }
    return server;
  }
  const canRecord = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  const canBrowserListen = () => !!Rec;

  /* ---------- listening ---------- */
  let active = null; // { stop() } for the current capture

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result).split(",")[1] || "");
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }

  // Record until the speaker pauses (or 15 s), using a simple loudness gate.
  async function recordUntilSilence(onState) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find((m) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || "";
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
    const chunks = [];
    rec.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = AC ? new AC() : null;
    let an = null, buf = null;
    if (ctx) { an = ctx.createAnalyser(); an.fftSize = 1024; ctx.createMediaStreamSource(stream).connect(an); buf = new Uint8Array(an.fftSize); }
    let heard = !ctx, lastLoud = performance.now();
    const t0 = performance.now();
    return new Promise((resolve) => {
      const finish = () => { if (rec.state === "recording") rec.stop(); };
      // a manual stop means the user spoke, even if the loudness gate missed it
      active = { stop: () => { if (performance.now() - t0 > 600) heard = true; finish(); } };
      const tick = () => {
        if (rec.state !== "recording") return;
        const now = performance.now();
        if (an) {
          an.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) { const x = (buf[i] - 128) / 128; sum += x * x; }
          if (Math.sqrt(sum / buf.length) > 0.02) { heard = true; lastLoud = now; }
        }
        if ((heard && an && now - lastLoud > 1400) || now - t0 > 15000 || (!heard && now - t0 > 7000)) finish();
        else setTimeout(tick, 100);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        if (ctx) ctx.close();
        active = null;
        resolve(heard && chunks.length ? new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" }) : null);
      };
      rec.start(250);
      onState && onState("listening");
      tick();
    });
  }

  async function transcribeOnServer(blob, lang) {
    const r = await fetch(API, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "stt", audio: await blobToBase64(blob), mime: blob.type, lang }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()).text || "";
  }

  // One utterance through the browser recogniser.
  function browserListenOnce(lang, onState) {
    return new Promise((resolve, reject) => {
      const r = new Rec();
      r.lang = BCP[lang] || "en-US";
      r.interimResults = false;
      r.maxAlternatives = 1;
      let text = "";
      r.onresult = (e) => { text = Array.from(e.results).map((x) => x[0].transcript).join(" "); };
      r.onerror = (e) => (e.error === "no-speech" ? resolve("") : reject(Object.assign(new Error(e.error), { code: e.error })));
      r.onend = () => { active = null; resolve(text.trim()); };
      active = { stop: () => r.stop() };
      r.start();
      onState && onState("listening");
    });
  }

  /* Capture one spoken question. onState("listening" | "transcribing"). Resolves to text ("" if nothing heard). */
  async function listen(lang, onState) {
    const st = await status();
    if (st && st.stt && canRecord()) {
      const blob = await recordUntilSilence(onState);
      if (!blob) return "";
      onState && onState("transcribing");
      try { return await transcribeOnServer(blob, lang); }
      catch (e) { if (!canBrowserListen()) throw e; } // fall through to the browser recogniser
    }
    if (canBrowserListen()) return browserListenOnce(lang, onState);
    throw Object.assign(new Error("unsupported"), { code: "unsupported" });
  }
  const stopListening = () => active && active.stop();
  const isListening = () => !!active;

  /* ---------- speaking ---------- */
  let speaking = false;
  const listeners = new Set();
  const setSpeaking = (v) => { speaking = v; listeners.forEach((f) => f(v)); };

  function stopSpeaking() {
    if (audio) { audio.pause(); audio = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function browserVoice(lang) {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    return voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(lang)) || null;
  }
  // voices load asynchronously in some browsers
  const voicesReady = () => new Promise((resolve) => {
    if (!window.speechSynthesis || window.speechSynthesis.getVoices().length) return resolve();
    const done = () => resolve();
    window.speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1200);
  });

  /* Speak text. Resolves when finished; resolves { spoken:false, reason } when it cannot. */
  async function speak(text, lang) {
    stopSpeaking();
    text = String(text || "").trim().slice(0, 500);
    if (!text) return { spoken: false, reason: "empty" };
    const st = await status();
    if (st && st.tts) {
      try {
        const key = lang + "|" + text;
        let url = ttsCache.get(key);
        if (!url) {
          const r = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "tts", text, lang }) });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          url = URL.createObjectURL(await r.blob());
          ttsCache.set(key, url);
          if (ttsCache.size > 30) { const [k, u] = ttsCache.entries().next().value; URL.revokeObjectURL(u); ttsCache.delete(k); }
        }
        audio = new Audio(url);
        setSpeaking(true);
        await new Promise((resolve) => { audio.onended = audio.onerror = resolve; audio.play().catch(resolve); });
        audio = null;
        setSpeaking(false);
        return { spoken: true };
      } catch (e) { /* fall back to the browser voice */ }
    }
    if (!window.speechSynthesis) return { spoken: false, reason: "unsupported" };
    await voicesReady();
    const v = browserVoice(lang);
    if (!v) return { spoken: false, reason: "novoice" };
    const u = new SpeechSynthesisUtterance(text);
    u.voice = v; u.lang = v.lang; u.rate = 1;
    setSpeaking(true);
    await new Promise((resolve) => { u.onend = u.onerror = resolve; window.speechSynthesis.speak(u); });
    setSpeaking(false);
    return { spoken: true };
  }

  /* ---------- "Hey EMBER" wake word (browser recogniser, free) ---------- */
  const WAKE_RX = /(?:^|[^\p{L}])(?:(?:hey|hi|ok|okay|эй|хэй|хей|привет|salom)[\s,]*)?(?:ember|emb[aeə]r|эмбер|эмбэр|амбер|эмбр)(?!\p{L})[\s,.!?]*/iu;
  let wake = null; // { rec, onWake, paused, on }

  function startWake(lang, onWake) {
    if (!Rec) return false;
    stopWake();
    const w = { on: true, paused: false, onWake, lang };
    const begin = () => {
      if (!w.on || w.paused) return;
      const r = new Rec();
      r.lang = BCP[lang] || "en-US";
      r.continuous = true;
      r.interimResults = false;
      r.onresult = (e) => {
        const res = e.results[e.results.length - 1];
        if (!res.isFinal) return;
        const said = res[0].transcript.trim();
        const m = WAKE_RX.exec(said);
        if (!m) return;
        const rest = said.slice(m.index + m[0].length).trim();
        w.paused = true;
        try { r.stop(); } catch (err) { /* already stopped */ }
        onWake(rest);
      };
      r.onerror = (e) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") { w.on = false; w.denied = true; } };
      r.onend = () => { w.rec = null; if (w.on && !w.paused) setTimeout(begin, 250); }; // Chrome stops after a while
      w.rec = r;
      try { r.start(); } catch (err) { /* start called twice */ }
    };
    w.begin = begin;
    wake = w;
    begin();
    return true;
  }
  function pauseWake() { if (wake) { wake.paused = true; if (wake.rec) try { wake.rec.stop(); } catch (e) { /* ignore */ } } }
  function resumeWake() { if (wake && wake.on) { wake.paused = false; if (!wake.rec) wake.begin(); } }
  function stopWake() { if (wake) { wake.on = false; if (wake.rec) try { wake.rec.abort(); } catch (e) { /* ignore */ } wake = null; } }
  const wakeDenied = () => !!(wake && wake.denied);

  E.voice = {
    status, listen, stopListening, isListening, speak, stopSpeaking,
    isSpeaking: () => speaking, onSpeaking: (f) => listeners.add(f),
    canBrowserListen, canRecord, startWake, pauseWake, resumeWake, stopWake, wakeDenied, WAKE_RX,
  };
})();
