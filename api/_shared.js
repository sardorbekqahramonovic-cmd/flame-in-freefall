// Helpers shared by the serverless functions (Vercel ignores files that start with "_").
// Keys stay on the server: ANTHROPIC_API_KEY and/or OPENAI_API_KEY in the project settings.

export const LANGS = {
  en: { name: "English", bcp: "en" },
  ru: { name: "Russian", bcp: "ru" },
  uz: { name: "Uzbek (Latin script)", bcp: "uz" },
};
export const pickLang = (l) => (Object.prototype.hasOwnProperty.call(LANGS, l) ? l : "en");

export function clean(s, max) {
  return String(s ?? "").replace(/[\u0000-\u0008\u000b-\u001f]/g, " ").slice(0, max);
}

export function readBody(req) {
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body || "{}"); } catch (e) { return {}; }
  }
  return req.body || {};
}

/* Cost protection for a public demo with a small prepaid balance.
 * 1. Browsers send an Origin header on cross-site requests: only this site may call the API.
 * 2. A best-effort per-IP limit per warm instance (serverless instances do not share memory,
 *    so this slows abuse rather than stopping it; the prepaid balance is the hard cap). */
const hits = new Map();
export function guard(req, res, { perMinute = 20 } = {}) {
  const origin = req.headers.origin;
  if (origin) {
    let host = "";
    try { host = new URL(origin).host; } catch (e) { /* bad origin */ }
    const allowed = [req.headers.host, ...(process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim())].filter(Boolean);
    if (!allowed.includes(host)) {
      res.status(403).json({ error: "Origin not allowed" });
      return false;
    }
  }
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  if (list.length >= perMinute) {
    res.status(429).json({ error: "Too many requests, wait a minute" });
    return false;
  }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return true;
}

export const OPENAI_KEY = () => process.env.OPENAI_API_KEY;

// OpenAI's error code and message say why a key fails (no access to a model, region,
// out of credit). Key fragments and account ids are removed before they leave the server.
export async function openaiError(r) {
  let code = "", message = "";
  try {
    const j = await r.json();
    code = (j && j.error && (j.error.code || j.error.type)) || "";
    message = (j && j.error && j.error.message) || "";
  } catch (e) { /* not JSON */ }
  message = String(message).replace(/sk-[\w*-]+/g, "sk-...").replace(/\b(proj|org)[_-][\w-]+/g, "$1_...").slice(0, 200);
  console.error(`OpenAI ${r.status}${code ? " " + code : ""}: ${message}`);
  return { code: String(code).slice(0, 60), detail: message };
}

// OpenAI sometimes answers 403 "no access to model" for a while after a project's model list
// changes, then succeeds on the next try, so a 403 is retried twice before it counts.
export async function openaiFetch(path, init, { tries = 3, wait = 350 } = {}) {
  let r;
  for (let i = 0; i < tries; i++) {
    r = await fetch(`https://api.openai.com/v1/${path}`, init);
    if (r.status !== 403 || i === tries - 1) return r;
    await new Promise((ok) => setTimeout(ok, wait * (i + 1)));
  }
  return r;
}

export function openaiJSON(path, body) {
  return openaiFetch(path, {
    method: "POST",
    headers: { authorization: `Bearer ${OPENAI_KEY()}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
