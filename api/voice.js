// EMBER voice endpoint (Vercel serverless function, Node 18+), OpenAI audio models.
//   GET                               -> { stt, tts } availability
//   POST { action:"stt", audio, mime, lang } -> { text }   (audio = base64, max ~20 s)
//   POST { action:"tts", text, lang }        -> audio/mpeg (text capped at 500 characters)
// Needs OPENAI_API_KEY. Without it the browser falls back to the Web Speech API.
import { pickLang, clean, readBody, guard, OPENAI_KEY, openaiJSON, openaiError } from "./_shared.js";

// Dated snapshots: OpenAI project model allowlists match exact names, and these are the ones usually listed.
const STT_MODEL = () => process.env.OPENAI_STT_MODEL || "gpt-4o-mini-transcribe-2025-03-20";
const TTS_MODEL = () => process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts-2025-03-20";
// cedar was the clearest in an Uzbek round trip (speech -> transcript): 6% word errors vs 25% for coral.
const TTS_VOICE = () => process.env.OPENAI_TTS_VOICE || "cedar";
// A listener may try another built-in voice; anything else falls back to the default.
const VOICES = new Set(["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse", "marin", "cedar"]);
const MAX_AUDIO_BYTES = 1_200_000; // about 20 s of compressed speech
const MAX_TTS_CHARS = 700; // Uzbek numbers are written out in words, which makes text longer

// Domain words help the recogniser spell names it would otherwise guess.
const VOCAB = "EMBER, NASA, ISS, BASS, Saffire, SoFIE, FLEX, CFI, ACME, SAME, DAFT, SPICE, SLICE, SSCE, SOFBALL, FM2, FLARE, Nomex, Kapton, PMMA, PTFE, SIBAL, psi, kPa, CO2, O2, Artemis.";

const STT_HINT = {
  en: "English speech about spacecraft fire safety.",
  ru: "Русская речь о пожарной безопасности на космических кораблях.",
  uz: "The speech is in Uzbek (Latin script), about spacecraft fire safety. Oʻzbek tilida: yongʻin, tutun, kislorod, oʻt oʻchirgich.",
};

const VOICE_STYLE = {
  en: "Calm, clear and confident, like a spacecraft safety officer briefing a crew. Moderate pace.",
  ru: "Спокойно, чётко и уверенно, как офицер безопасности корабля на инструктаже экипажа. Умеренный темп. Говори по-русски.",
  uz: "Speak Uzbek (Latin script) like a native speaker from Tashkent, with no English or Russian accent. Read every word as Uzbek: q is a deep uvular k, gʻ is a voiced uvular fricative like a French r, x is a rasping sound like German ch in Bach, h is soft, oʻ is a rounded vowel between o and u, and ʼ is a short glottal stop. Stress is usually on the last syllable. Calm, clear and confident, like a spacecraft safety officer briefing a crew. Moderate pace.",
};

export const config = { api: { bodyParser: { sizeLimit: "2mb" } } };

export default async function handler(req, res) {
  const on = Boolean(OPENAI_KEY());
  if (req.method === "GET") return res.status(200).json({ stt: on, tts: on, sttModel: on ? STT_MODEL() : null, ttsModel: on ? TTS_MODEL() : null });
  if (req.method !== "POST") return res.status(405).json({ error: "Use GET or POST" });
  if (!on) return res.status(503).json({ error: "Voice not configured" });
  if (!guard(req, res, { perMinute: 20 })) return;

  const body = readBody(req);
  const lang = pickLang(body.lang);

  try {
    if (body.action === "stt") {
      const b64 = String(body.audio || "");
      const buf = Buffer.from(b64, "base64");
      if (!buf.length) return res.status(400).json({ error: "Missing audio" });
      if (buf.length > MAX_AUDIO_BYTES) return res.status(413).json({ error: "Recording too long" });
      const mime = /^audio\/[\w.+-]+/.exec(String(body.mime || ""))?.[0] || "audio/webm";
      const ext = mime.includes("mp4") || mime.includes("m4a") ? "m4a" : mime.includes("mpeg") || mime.includes("mp3") ? "mp3" : mime.includes("ogg") ? "ogg" : mime.includes("wav") ? "wav" : "webm";
      const form = new FormData();
      form.append("file", new Blob([buf], { type: mime }), `speech.${ext}`);
      form.append("model", STT_MODEL());
      // OpenAI rejects the language code "uz"; naming the language in the prompt works instead.
      if (lang !== "uz") form.append("language", lang);
      form.append("prompt", `${STT_HINT[lang]} ${VOCAB}`);
      form.append("response_format", "json");
      const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { authorization: `Bearer ${OPENAI_KEY()}` },
        body: form,
      });
      if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ error: `Transcription failed (${r.status})`, ...(await openaiError(r)) });
      const j = await r.json();
      return res.status(200).json({ text: clean(j.text, 1500).trim() });
    }

    if (body.action === "tts") {
      const text = clean(body.text, MAX_TTS_CHARS).trim();
      if (!text) return res.status(400).json({ error: "Missing text" });
      const r = await openaiJSON("audio/speech", {
        model: TTS_MODEL(),
        voice: VOICES.has(body.voice) ? body.voice : TTS_VOICE(),
        input: text,
        instructions: VOICE_STYLE[lang],
        response_format: "mp3",
      });
      if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ error: `Speech failed (${r.status})`, ...(await openaiError(r)) });
      const audio = Buffer.from(await r.arrayBuffer());
      res.setHeader("content-type", "audio/mpeg");
      res.setHeader("cache-control", "no-store");
      return res.status(200).send(audio);
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
