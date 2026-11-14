/*
 * SARDOR voice: speech in, speech out.
 * - With OPENAI_API_KEY on the server (/api/voice): recorded speech goes to OpenAI speech
 *   recognition, answers are read with an OpenAI voice. Best quality, works for Uzbek too.
 * - Otherwise: the browser's Web Speech API (SpeechRecognition + speechSynthesis), free.
 * - "Hey SARDOR" wake word always uses the browser recogniser, so listening for it costs nothing.
 */
(function () {
  const E = window.SARDOR;
  const API = (window.SARDOR_CONFIG && window.SARDOR_CONFIG.voiceUrl) || "api/voice";
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
  async function listen(lang, onState, opts = {}) {
    // right after the wake word the browser recogniser is already proven to hear this speaker
    if (opts.browser && canBrowserListen()) return browserListenOnce(lang, onState);
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
    const voices = window.speechSynthesis.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith(lang));
    return voices.find((v) => /natural|online|neural/i.test(v.name)) || voices[0] || null;
  }
  // voices load asynchronously in some browsers
  const voicesReady = () => new Promise((resolve) => {
    if (!window.speechSynthesis || window.speechSynthesis.getVoices().length) return resolve();
    const done = () => resolve();
    window.speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1200);
  });

  /* ---------- Uzbek text for speech ----------
   * Voices read digits, units and acronyms in English unless they are written out,
   * so Uzbek answers are turned into words first ("28,1%" -> "yigirma sakkiz butun o'ndan bir foiz"). */
  const UZ1 = ["nol", "bir", "ikki", "uch", "to'rt", "besh", "olti", "yetti", "sakkiz", "to'qqiz"];
  const UZ10 = ["", "o'n", "yigirma", "o'ttiz", "qirq", "ellik", "oltmish", "yetmish", "sakson", "to'qson"];
  function uzInt(n) {
    if (!Number.isFinite(n) || n > 999999999) return String(n);
    if (n === 0) return "nol";
    const chunk = (x) => {
      const h = Math.floor(x / 100), t = Math.floor((x % 100) / 10), u = x % 10, w = [];
      if (h) w.push(h === 1 ? "yuz" : UZ1[h] + " yuz");
      if (t) w.push(UZ10[t]);
      if (u) w.push(UZ1[u]);
      return w.join(" ");
    };
    const m = Math.floor(n / 1e6), k = Math.floor((n % 1e6) / 1000), r = n % 1000, out = [];
    if (m) out.push(chunk(m) + " million");
    if (k) out.push(k === 1 ? "ming" : chunk(k) + " ming");
    if (r) out.push(chunk(r));
    return out.join(" ");
  }
  const uzOrdinal = (n) => { const w = uzInt(n); return w + (/[aeiou]$/.test(w) ? "nchi" : "inchi"); };
  function uzNumber(int, frac) {
    let w = uzInt(Number(int));
    if (frac && Number(frac) > 0) w += " butun " + (frac.length === 1 ? "o'ndan " : frac.length === 2 ? "yuzdan " : "mingdan ") + uzInt(Number(frac));
    return w;
  }
  const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };
  const UZ_UNITS = [
    ["cm/s", "santimetr sekundiga"], ["sm/s", "santimetr sekundiga"], ["m/s", "metr sekundiga"],
    ["kPa", "kilopaskal"], ["psia", "psi"], ["psi", "psi"], ["mkm", "mikrometr"], ["µm", "mikrometr"],
    ["mm", "millimetr"], ["kg", "kilogramm"], ["kW", "kilovatt"], ["W", "vatt"], ["m", "metr"], ["g", "ge"], ["s", "soniya"],
  ];
  const ACRONYMS = [["ISS", "Xalqaro kosmik stansiya", ""], ["LOI", "kislorod indeks", "i"], ["NASA-STD-6001", "NASA standarti 6001", ""]];
  function uzSpeech(text) {
    let t = String(text || "");
    t = t.replace(/\s*\([^()]*\b[A-Za-z]+\d[\w-]*[^()]*\)/g, ""); // product codes like (HT90-40)
    t = t.replace(/\s*[()]\s*/g, ", ").replace(/\s+\/\s+/g, ", ").replace(/\s*×\s*/g, " ga ");
    t = t.replace(/CO₂|CO2/g, "karbonat angidrid").replace(/O₂|\bO2\b/g, "kislorod");
    // a suffix written after an acronym's letter name (LOI'si) loses its buffer consonant after a spelled-out word
    const attach = (word, suf) => (suf && /[^aeiouʻ']$/.test(word) && /^s[aeiou]/.test(suf) ? word + suf.slice(1) : word + (suf || ""));
    for (const [a, word, bare] of ACRONYMS) {
      t = t.replace(new RegExp(a + "(?:['’ʼ](\\p{Ll}+))?(?![\\p{L}\\d])", "gu"), (m, suf) => attach(word, suf || bare));
    }
    t = t.replace(/\b([A-Z][A-Z0-9-]+|Saffire|Nomex|Kapton|Artemis)['’ʼ](\p{Ll}+)/gu, "$1$2"); // BASS'da -> BASSda
    t = t.replace(/(\p{L}{2,})-(I{1,3}|IV|VI?)(?![\p{L}\d])/gu, (m, a, r) => a + " " + uzInt(ROMAN[r])); // BASS-II, Saffire-I
    t = t.replace(/(?<![\p{L}\d])(I{1,3}|IV|VI?)\s*[–-]\s*(I{1,3}|IV|VI?)(?![\p{L}])/gu, (m, a, b) => uzInt(ROMAN[a]) + "dan " + uzInt(ROMAN[b]) + "gacha");
    t = t.replace(/(?<![\p{L}\d])(I{1,3}|IV|VI?)(?![\p{L}\d])/gu, (m) => uzInt(ROMAN[m]));
    t = t.replace(/\b([A-Z]{2,})(\d)\b/g, (m, a, d) => a + " " + uzInt(Number(d))); // FM2
    t = t.replace(/\s*%/g, " foiz");
    for (const [u, word] of UZ_UNITS) {
      t = t.replace(new RegExp("(\\d)\\s*" + u.replace(/\//g, "\\/") + "(?:['’ʼ](\\p{Ll}+)|\\s+(dan|da|ga|gacha|dagi)(?![\\p{L}]))?(?![\\p{L}\\d/])", "gu"), (m, d, s1, s2) => d + " " + attach(word, s1 || s2));
    }
    t = t.replace(/(\p{L})\/(\p{L})/gu, "$1 va $2"); // FM2/FLARE
    t = t.replace(/(?<![\p{L}\d])(\d+)-(\p{L}+)/gu, (m, n, w) => uzOrdinal(Number(n)) + " " + w); // 2016-yil, 1-sinov
    t = t.replace(/(?<![\p{L}\d])(\d+)(?:,(\d+))?(?!\d)/gu, (m, i, f) => uzNumber(i, f));
    t = t.replace(/\s*[–—]\s*/g, ", ");
    // official Uzbek letters: oʻ gʻ (U+02BB) and the tutuq belgisi ʼ (U+02BC)
    t = t.replace(/([oOgG])['’‘`ʻ]/g, "$1ʻ").replace(/(\p{L})['’‘`](\p{L})/gu, "$1ʼ$2");
    return t.replace(/\s{2,}/g, " ").replace(/\s+([.,;:!?])/g, "$1").replace(/,([.,;:!?])/g, "$1").replace(/^[,\s]+|[,\s]+$/g, "").trim();
  }
  const speechText = (text, lang) => (lang === "uz" ? uzSpeech(text) : String(text || "")).replace(/\bSARDOR\b/g, "Sardor").trim().slice(0, 700);

  // A native voice installed in the browser (Edge has Uzbek Microsoft voices) beats an English-trained one.
  async function nativeVoice(lang) {
    if (lang !== "uz" || !window.speechSynthesis) return null;
    await voicesReady();
    return browserVoice(lang);
  }

  /* Speak text. Resolves when finished; resolves { spoken:false, reason } when it cannot. */
  async function speak(text, lang) {
    stopSpeaking();
    text = speechText(text, lang);
    if (!text) return { spoken: false, reason: "empty" };
    const st = await status();
    const native = await nativeVoice(lang);
    if (st && st.tts && !native) {
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
    const v = native || browserVoice(lang);
    if (!v) return { spoken: false, reason: "novoice" };
    const u = new SpeechSynthesisUtterance(text);
    u.voice = v; u.lang = v.lang; u.rate = 1;
    setSpeaking(true);
    await new Promise((resolve) => { u.onend = u.onerror = resolve; window.speechSynthesis.speak(u); });
    setSpeaking(false);
    return { spoken: true };
  }

  /* ---------- "Hey SARDOR" wake word (browser recogniser, free) ----------
   * Sardor is a common Uzbek name, so the Uzbek and Russian recognisers spell it reliably; English ones
   * may write "Sardar" or "Sarder". Every alternative the recogniser offers is checked, and a watchdog
   * restarts listening if Chrome drops it. */
  const WAKE_RX = /(?:^|[^\p{L}])(?:(?:hey|hi|hay|ok|okay|xey|ey|эй|хэй|хей|привет|salom)[\s,!]*)?(?:s[ae]rd[aoe]r|sardo|сард[оа]р)(?:ga|jon|bek|га|жон)?(?![\p{L}\d])[\s,.!?]*/iu;
  let wake = null; // { rec, live, paused, on, timer, begin, drop }

  function startWake(lang, onWake, onHeard) {
    if (!Rec) return false;
    stopWake();
    const w = { on: true, paused: false, rec: null, live: false, started: 0, lang };
    const drop = (r) => {
      if (w.rec === r) { w.rec = null; w.live = false; }
      try { r.abort(); } catch (err) { /* already ended */ }
    };
    const begin = () => {
      if (!w.on || w.paused || w.rec) return;
      const r = new Rec();
      r.lang = BCP[lang] || "en-US";
      r.continuous = true;
      r.interimResults = false;
      r.maxAlternatives = 3;
      r.onstart = () => { if (w.rec === r) w.live = true; };
      r.onresult = (e) => {
        if (w.rec !== r || w.paused) return;
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (!res.isFinal) continue;
          let said = res[0].transcript.trim(), m = null;
          for (let k = 0; k < res.length && !m; k++) {
            const alt = res[k].transcript.trim(), hit = WAKE_RX.exec(alt);
            if (hit) { said = alt; m = hit; }
          }
          if (!m) { if (said && onHeard) onHeard(said); continue; }
          w.paused = true;
          drop(r);
          onWake(said.slice(m.index + m[0].length).trim());
          return;
        }
      };
      r.onerror = (e) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") { w.on = false; w.denied = true; } };
      r.onend = () => {
        if (w.rec !== r) return; // an old session we already replaced
        w.rec = null; w.live = false;
        if (w.on && !w.paused) setTimeout(begin, 250); // Chrome ends sessions after a while
      };
      w.rec = r; w.started = Date.now();
      try { r.start(); } catch (err) { w.rec = null; setTimeout(begin, 1000); } // busy microphone: try again
    };
    // watchdog: a session that never started, or listening that silently stopped, is restarted
    w.timer = setInterval(() => {
      if (!w.on || w.paused) return;
      if (w.rec && !w.live && Date.now() - w.started > 5000) drop(w.rec);
      if (!w.rec) begin();
    }, 3000);
    w.begin = begin; w.drop = drop;
    wake = w;
    begin();
    return true;
  }
  function pauseWake() { if (wake) { wake.paused = true; if (wake.rec) wake.drop(wake.rec); } }
  function resumeWake() {
    if (!wake || !wake.on) return;
    wake.paused = false;
    const w = wake;
    setTimeout(() => w.begin(), 300); // let the microphone and speaker settle first
  }
  function stopWake() { if (wake) { wake.on = false; clearInterval(wake.timer); if (wake.rec) wake.drop(wake.rec); wake = null; } }
  const wakeDenied = () => !!(wake && wake.denied);

  E.voice = {
    status, listen, stopListening, isListening, speak, stopSpeaking,
    isSpeaking: () => speaking, onSpeaking: (f) => listeners.add(f),
    canBrowserListen, canRecord, startWake, pauseWake, resumeWake, stopWake, wakeDenied, WAKE_RX,
    speechText, uzInt,
  };
})();
