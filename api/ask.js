// EMBER AI endpoint (Vercel serverless function, Node 18+).
// Keys stay on the server. Provider order:
//   ANTHROPIC_API_KEY set -> Claude
//   else OPENAI_API_KEY set -> OpenAI (OPENAI_MODEL, default gpt-4o-mini, cheap)
//   neither -> GET reports ok:false and the browser uses its offline reasoner.
// GET returns status; POST answers a question from the evidence passages the browser retrieved.
import Anthropic from "@anthropic-ai/sdk";
import { LANGS, pickLang, clean, readBody, guard, OPENAI_KEY, openaiJSON, openaiError } from "./_shared.js";

const CLAUDE_MODEL = "claude-opus-5-5";
const OPENAI_MODEL = () => process.env.OPENAI_MODEL || "gpt-4o-mini";
// gpt-4o-mini writes weak Uzbek (misspellings such as "lakin", invented words), so Uzbek uses a
// stronger model: about 1 US cent per answer instead of 0.1 cent.
const OPENAI_MODEL_FOR = (lang) => (lang === "uz" ? process.env.OPENAI_MODEL_UZ || "gpt-4.1" : OPENAI_MODEL());
let claude = null; // created on first use, only when a key exists

const SYSTEM = `You are EMBER, a fire-safety analyst for human space exploration.
You answer questions about NASA microgravity combustion research for engineers, researchers and students.

Rules:
- Use ONLY the evidence passages provided in the user turn. If they do not answer the question, say what is missing.
- Cite every factual claim with the passage id in square brackets, e.g. [BASS] or [FLEX#1]. Never invent ids.
- Passage MODEL is EMBER's screening model output. Present it as an estimate, not as measured data.
- PSI holds no partial-gravity (Moon or Mars) combustion data. When the question involves the Moon or Mars, say that results are extrapolated from microgravity and 1 g data.
- Rocket and propellant fires are out of scope.
- The mission context line is the cabin atmosphere the user picked in the app, not the natural atmosphere of the Moon or Mars. Say "in a cabin at ..." when you use it. Mars air is thin carbon dioxide and cannot sustain a fire; fires happen inside pressurised habitats, rovers and suits.`;

// Model-specific spelling slips seen in Uzbek output, fixed after the answer arrives.
const UZ_FIXES = [[/(^|[^\p{L}])([Ll])akin(?![\p{L}])/gu, (m, a, l) => a + (l === "L" ? "Lekin" : "lekin")]];
const fixUzbek = (text) => UZ_FIXES.reduce((t, [rx, to]) => t.replace(rx, to), text);

const UZBEK_STYLE = `
- Write correct standard literary Uzbek in Latin script, the way an Uzbek science journalist writes. Write oʻ and gʻ as o' and g'.
- Spelling to follow: lekin (never "lakin"), biroq, ammo, chunki, shuning uchun, shuningdek, kislorod, bosim, yonish, alanga, tutun, o't o'chirgich, mikrogravitatsiya, Oy, Mars, kema, ekipaj.
- Short, simple sentences. Never invent words; if you do not know the Uzbek term, use the English term.`;

const STYLE_TEXT = `
- Structure: a one-sentence direct answer first, then 2-5 short bullet points starting with "- ", then one line starting with "**Recommended action:**" when an action follows from the evidence.
- Plain language, under 220 words. Use **bold** sparingly. No headings, no tables.`;

// Voice mode: the answer is read aloud, so the key action comes first and it stays short.
const STYLE_VOICE = `
- This answer will be read aloud. Start with the single most important action or the direct answer in one sentence.
- Then at most two short sentences of supporting evidence, each with its citation in brackets (citations are removed before speaking).
- Under 70 words. No lists, no bold, no headings, no symbols that are hard to say; write units in words where natural.`;

const REFUSAL = {
  en: "I can't answer that one. Try asking about a specific investigation, material or fire-safety topic.",
  ru: "На этот вопрос я ответить не могу. Спросите о конкретном исследовании, материале или теме пожарной безопасности.",
  uz: "Bu savolga javob bera olmayman. Muayyan tadqiqot, material yoki yong'in xavfsizligi mavzusi haqida so'rang.",
};

function systemFor(lang, voice) {
  return `${SYSTEM}${voice ? STYLE_VOICE : STYLE_TEXT}
- Write the whole answer in ${LANGS[lang].name}${voice ? "" : ', including the "**Recommended action:**" label'}. Keep investigation names, passage ids in brackets and numbers unchanged.${lang === "uz" ? UZBEK_STYLE : ""}`;
}

function provider() {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (OPENAI_KEY()) return "openai";
  return null;
}

async function askClaude(system, messages, voice) {
  claude = claude || new Anthropic();
  const response = await claude.beta.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: voice ? 800 : 2000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system,
    messages,
  });
  if (response.stop_reason === "refusal") return { refused: true, model: response.model };
  const answer = response.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  return { answer, model: response.model };
}

async function askOpenAI(system, messages, voice, lang) {
  const uz = lang === "uz"; // Uzbek needs more tokens per word
  const r = await openaiJSON("chat/completions", {
    model: OPENAI_MODEL_FOR(lang),
    max_completion_tokens: voice ? (uz ? 320 : 220) : uz ? 900 : 600, // small caps keep the prepaid balance going
    messages: [{ role: "system", content: system }, ...messages],
  });
  if (!r.ok) {
    const e = new Error(`OpenAI ${r.status}`);
    e.status = r.status;
    e.info = await openaiError(r);
    throw e;
  }
  const j = await r.json();
  const choice = j.choices && j.choices[0];
  if (choice && choice.message && choice.message.refusal) return { refused: true, model: j.model };
  return { answer: String((choice && choice.message && choice.message.content) || "").trim(), model: j.model };
}

export default async function handler(req, res) {
  const prov = provider();
  if (req.method === "GET") {
    return res.status(200).json({ ok: Boolean(prov), provider: prov, model: prov === "anthropic" ? CLAUDE_MODEL : prov === "openai" ? OPENAI_MODEL() : null });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Use GET or POST" });
  if (!prov) return res.status(503).json({ error: "AI not configured" });
  if (!guard(req, res, { perMinute: 20 })) return;

  const body = readBody(req);
  const question = clean(body.question, 1500).trim();
  if (!question) return res.status(400).json({ error: "Missing question" });
  const sc = body.scenario || {};
  const contexts = Array.isArray(body.contexts) ? body.contexts.slice(0, 12) : [];
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  const lang = pickLang(body.lang);
  const voice = body.mode === "voice";

  const evidence = contexts
    .map((c) => `<passage id="${clean(c.id, 40)}" title="${clean(c.title, 120)}">\n${clean(c.text, 1500)}\n</passage>`)
    .join("\n");

  const messages = [
    ...history
      .filter((m) => (m.role === "user" || m.role === "assistant") && m.content)
      .map((m) => ({ role: m.role, content: clean(m.content, 2000) })),
    {
      role: "user",
      content: `Mission context: ${clean(sc.label, 80)} (${Number(sc.o2) || 21}% O2, ${Number(sc.p) || 101.3} kPa, gravity ${Number(sc.g) || 0} g).\n\nEvidence passages:\n${evidence}\n\nQuestion: ${question}`,
    },
  ];
  // The conversation must start with a user turn.
  while (messages.length && messages[0].role !== "user") messages.shift();

  const system = systemFor(lang, voice);
  try {
    const out = prov === "anthropic" ? await askClaude(system, messages, voice) : await askOpenAI(system, messages, voice, lang);
    if (out.refused) return res.status(200).json({ answer: REFUSAL[lang], model: out.model });
    const answer = lang === "uz" ? fixUzbek(out.answer) : out.answer;
    return res.status(200).json({ answer, model: out.model, provider: prov });
  } catch (err) {
    const info = err.info || {};
    if (err instanceof Anthropic.RateLimitError || err.status === 429) return res.status(429).json({ error: "Rate limited or out of credit, try again later", ...info });
    if (err instanceof Anthropic.APIError || err.status) return res.status(502).json({ error: `AI service error ${err.status ?? ""}`.trim(), ...info });
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
