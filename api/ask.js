// EMBER AI endpoint (Vercel serverless function, Node 18+).
// Keeps the Anthropic API key on the server. Set ANTHROPIC_API_KEY in the
// Vercel project settings. GET returns status; POST answers a question from
// the evidence passages the browser retrieved.
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-5-5";
const client = new Anthropic(); // reads ANTHROPIC_API_KEY

const SYSTEM = `You are EMBER, a fire-safety analyst for human space exploration.
You answer questions about NASA microgravity combustion research for engineers, researchers and students.

Rules:
- Use ONLY the evidence passages provided in the user turn. If they do not answer the question, say what is missing.
- Cite every factual claim with the passage id in square brackets, e.g. [BASS] or [FLEX#1]. Never invent ids.
- Passage MODEL is EMBER's screening model output. Present it as an estimate, not as measured data.
- PSI holds no partial-gravity (Moon or Mars) combustion data. When the question involves the Moon or Mars, say that results are extrapolated from microgravity and 1 g data.
- Rocket and propellant fires are out of scope.
- Structure: a one-sentence direct answer first, then 2-5 short bullet points starting with "- ", then one line starting with "**Recommended action:**" when an action follows from the evidence.
- Plain language, under 220 words. Use **bold** sparingly. No headings, no tables.`;

// The interface language chosen in the browser. Evidence passages arrive in that
// language; investigation names, ids, units and numbers stay as they are.
const LANGS = {
  en: { name: "English", refusal: "I can't answer that one. Try asking about a specific investigation, material or fire-safety topic." },
  ru: { name: "Russian", refusal: "На этот вопрос я ответить не могу. Спросите о конкретном исследовании, материале или теме пожарной безопасности." },
  uz: { name: "Uzbek (Latin script)", refusal: "Bu savolga javob bera olmayman. Muayyan tadqiqot, material yoki yong'in xavfsizligi mavzusi haqida so'rang." },
};
function systemFor(lang) {
  const L = LANGS[lang] || LANGS.en;
  return `${SYSTEM}\n- Write the whole answer in ${L.name}, including the "**Recommended action:**" label. Keep investigation names, passage ids in brackets, units and numbers unchanged.`;
}

function clean(s, max) {
  return String(s ?? "").replace(/[\u0000-\u0008\u000b-\u001f]/g, " ").slice(0, max);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ ok: Boolean(process.env.ANTHROPIC_API_KEY), model: MODEL });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Use GET or POST" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: "AI not configured" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const question = clean(body.question, 1500).trim();
  if (!question) return res.status(400).json({ error: "Missing question" });
  const sc = body.scenario || {};
  const contexts = Array.isArray(body.contexts) ? body.contexts.slice(0, 12) : [];
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  const lang = Object.prototype.hasOwnProperty.call(LANGS, body.lang) ? body.lang : "en";

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
  // The API expects the conversation to start with a user turn.
  while (messages.length && messages[0].role !== "user") messages.shift();

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: systemFor(lang),
      messages,
    });
    if (response.stop_reason === "refusal") {
      return res.status(200).json({ answer: LANGS[lang].refusal, model: response.model });
    }
    const answer = response.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    return res.status(200).json({ answer, model: response.model });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "Rate limited, try again shortly" });
    if (err instanceof Anthropic.APIError) return res.status(502).json({ error: `AI service error ${err.status ?? ""}`.trim() });
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
