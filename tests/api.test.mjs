// Serverless functions with a mocked fetch: provider choice, request shape, cost caps. Run: npm test
import assert from "node:assert/strict";

const calls = [];
let deny = 0; // next N OpenAI calls answer 403, as OpenAI does briefly after a model list change
globalThis.fetch = async (url, init = {}) => {
  calls.push({ url: String(url), init });
  if (deny > 0) { deny--; return new Response(JSON.stringify({ error: { code: "model_not_found", message: "Project `proj_abc` does not have access to model `x`" } }), { status: 403 }); }
  if (String(url).endsWith("/chat/completions")) return new Response(JSON.stringify({ model: "gpt-4o-mini-2024-07-18", choices: [{ message: { content: "Turn the ventilation off [SSCE], lakin stay calm at 70.3 kPa, yog‘och ma’lumot.\n**Recommended action:** Act [FLEX-2.1]." } }] }), { status: 200 });
  if (String(url).endsWith("/audio/transcriptions")) return new Response(JSON.stringify({ text: "Is Nomex flammable?" }), { status: 200 });
  if (String(url).endsWith("/audio/speech")) return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "audio/mpeg" } });
  return new Response("{}", { status: 404 });
};
function fakeRes() {
  const r = { code: 0, headers: {}, body: null };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.send = (b) => { r.body = b; return r; };
  r.setHeader = (k, v) => { r.headers[k.toLowerCase()] = v; };
  return r;
}
const req = (method, body, headers = {}) => ({ method, body, headers: { host: "ember.test", ...headers }, socket: { remoteAddress: "1.2.3.4" } });

delete process.env.ANTHROPIC_API_KEY;
delete process.env.OPENAI_API_KEY;
const ask = (await import("../api/ask.js")).default;
const voice = (await import("../api/voice.js")).default;

// no keys: offline
let res = fakeRes(); await ask(req("GET"), res);
assert.deepEqual([res.code, res.body.ok], [200, false]);
res = fakeRes(); await voice(req("GET"), res);
assert.equal(res.body.stt, false);

// OpenAI key only: cheap OpenAI model answers, in voice mode with a small token cap
process.env.OPENAI_API_KEY = "test-key";
res = fakeRes(); await ask(req("GET"), res);
assert.deepEqual([res.body.ok, res.body.provider, res.body.model], [true, "openai", "gpt-4o-mini"]);
res = fakeRes();
await ask(req("POST", { question: "Fire in the lab?", lang: "uz", mode: "voice", scenario: { label: "Lunar", o2: 30, p: 70.3, g: 0.166 }, contexts: [{ id: "SSCE", title: "t", text: "x" }] }), res);
assert.equal(res.code, 200); assert.match(res.body.answer, /ventilation/); assert.equal(res.body.provider, "openai");
const chat = JSON.parse(calls.at(-1).init.body);
assert.match(res.body.answer, /lekin stay calm at 70,3 kPa, yog'och ma'lumot/); assert.doesNotMatch(res.body.answer, /lakin/); // Uzbek polish
assert.match(res.body.answer, /\*\*Tavsiya etilgan chora:\*\* Act \[FLEX-2\.1\]/); // label translated, ids untouched
assert.equal(chat.model, "gpt-4.1"); assert.ok(chat.max_completion_tokens <= 320); // Uzbek uses the stronger model
assert.match(chat.messages[0].content, /Uzbek/); assert.match(chat.messages[0].content, /read aloud/); assert.match(chat.messages[0].content, /lekin/);
assert.match(chat.messages[0].content, /cabin atmosphere/);
res = fakeRes();
await ask(req("POST", { question: "Fire?", lang: "en", scenario: {}, contexts: [] }), res);
assert.equal(JSON.parse(calls.at(-1).init.body).model, "gpt-4o-mini"); // English stays on the cheap model
assert.equal(calls.at(-1).init.headers.authorization, "Bearer test-key");

// a passing 403 is retried; a lasting one is reported with OpenAI's code and no account id
deny = 2; res = fakeRes();
await voice(req("POST", { action: "tts", text: "Fire", lang: "en" }), res);
assert.equal(res.code, 200);
deny = 3; res = fakeRes();
await voice(req("POST", { action: "tts", text: "Fire", lang: "en" }), res);
assert.equal(res.code, 502); assert.equal(res.body.code, "model_not_found"); assert.doesNotMatch(res.body.detail, /proj_abc/);

// other sites cannot spend the balance
res = fakeRes(); await ask(req("POST", { question: "hi" }, { origin: "https://evil.example" }), res);
assert.equal(res.code, 403);

// speech to text
res = fakeRes();
await voice(req("POST", { action: "stt", audio: Buffer.from("fake-audio").toString("base64"), mime: "audio/webm;codecs=opus", lang: "ru" }), res);
assert.deepEqual([res.code, res.body.text], [200, "Is Nomex flammable?"]);
const form = calls.at(-1).init.body;
assert.equal(form.get("model"), "gpt-4o-mini-transcribe-2025-03-20"); assert.equal(form.get("language"), "ru");
// OpenAI rejects language "uz": it must be left out and named in the prompt instead
res = fakeRes(); await voice(req("POST", { action: "stt", audio: Buffer.from("fake-audio").toString("base64"), mime: "audio/mpeg", lang: "uz" }), res);
const formUz = calls.at(-1).init.body;
assert.equal(res.code, 200); assert.equal(formUz.get("language"), null); assert.match(formUz.get("prompt"), /Uzbek/);
assert.match(formUz.get("file").name, /\.mp3$/);
res = fakeRes(); await voice(req("POST", { action: "stt", audio: Buffer.alloc(1_300_000).toString("base64"), lang: "en" }), res);
assert.equal(res.code, 413);

// text to speech, capped length
res = fakeRes(); await voice(req("POST", { action: "tts", text: "x".repeat(2000), lang: "en" }), res);
assert.equal(res.code, 200); assert.equal(res.headers["content-type"], "audio/mpeg");
const tts = JSON.parse(calls.at(-1).init.body);
assert.equal(tts.model, "gpt-4o-mini-tts-2025-03-20"); assert.ok(tts.input.length <= 700); assert.ok(tts.instructions);

// rate limit per IP
let limited = false;
for (let i = 0; i < 25; i++) { res = fakeRes(); await voice(req("POST", { action: "tts", text: "hi", lang: "en" }, {}), res); if (res.code === 429) limited = true; }
assert.ok(limited, "rate limit");

console.log("All EMBER API checks passed.");
