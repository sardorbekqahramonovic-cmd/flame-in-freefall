// NASA Technical Reports Server (NTRS) search, used to widen VULKAN's evidence beyond the curated record.
// Public API, no key: https://ntrs.nasa.gov/api/citations/search?q=...  (all query words must match)
import { clean } from "./_shared.js";

const NTRS = "https://ntrs.nasa.gov";
// Rocket and propellant fires are out of scope for the challenge.
const OFF_TOPIC = /propellant|rocket|scramjet|ramjet|turbine|combustor|detonation|hypersonic|nozzle|missile/i;

function yearOf(x) {
  const d = (x.publications && x.publications[0] && x.publications[0].publicationDate) || x.distributionDate || x.submittedDate || x.created || "";
  const m = /^(\d{4})/.exec(String(d));
  return m ? Number(m[1]) : null;
}

async function query(q, size, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${NTRS}/api/citations/search?q=${encodeURIComponent(q)}&page.size=${size}`, {
      signal: ctrl.signal,
      headers: { accept: "application/json" },
    });
    if (!r.ok) return { q, total: 0, results: [], failed: true };
    const j = await r.json();
    return { q, total: (j.stats && j.stats.total) || 0, results: Array.isArray(j.results) ? j.results : [] };
  } catch (e) {
    return { q, total: 0, results: [], failed: true };
  } finally {
    clearTimeout(timer);
  }
}

/* Run up to three keyword queries in parallel and merge the hits (specific query first).
 * Returns { docs: [{ id, title, year, url, type, text }], total, queries: [{ q, total }] }. */
export async function searchNTRS(queries, { size = 6, timeoutMs = 4000 } = {}) {
  const list = [...new Set((queries || []).map((q) => clean(q, 80).trim()).filter(Boolean))].slice(0, 3);
  if (!list.length) return { docs: [], total: 0, queries: [] };
  const outs = await Promise.all(list.map((q) => query(q, Math.min(size + 4, 12), timeoutMs)));
  for (let i = 0; i < outs.length; i++) if (outs[i].failed) outs[i] = await query(list[i], Math.min(size + 4, 12), timeoutMs); // one retry
  const seen = new Map();
  for (const o of outs) {
    for (const x of o.results) {
      if (!x || !x.id || !x.abstract || OFF_TOPIC.test(`${x.title} ${x.abstract.slice(0, 300)}`)) continue;
      if (!seen.has(x.id)) seen.set(x.id, x);
    }
  }
  const docs = [...seen.values()].slice(0, size).map((x) => ({
    id: `NTRS-${x.id}`,
    title: clean(x.title, 200),
    year: yearOf(x),
    url: `${NTRS}/citations/${x.id}`,
    type: clean(x.stiType, 40),
    text: clean(String(x.abstract).replace(/\s+/g, " "), 1400),
  }));
  return { docs, total: Math.max(0, ...outs.map((o) => o.total)), queries: outs.map((o) => ({ q: o.q, total: o.total })) };
}

/* How many NTRS records exist for the challenge's core topics (shown in the interface). */
export const CORPUS_TOPICS = ["microgravity combustion", "spacecraft fire", "flammability", "fire suppression", "smoke detection"];
// One topic at a time (NTRS drops some parallel requests); a failed count is left out, not shown as 0.
export async function corpusStats() {
  const counts = {};
  for (const q of CORPUS_TOPICS) {
    let o = await query(q, 1, 5000);
    if (o.failed) o = await query(q, 1, 5000);
    if (!o.failed) counts[q] = o.total;
  }
  return counts;
}

// Stop words for building a query without a language model (English only).
const STOP = new Set("a an and are as at be by can could do does for from how i if in into is it its me my of on or should so than that the their them then there these this to under was what when where which while who why will with would you your about after before during between".split(" "));
export function heuristicQueries(question, lang) {
  if (lang !== "en") return [];
  const words = String(question).toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
  if (!words.length) return [];
  return [words.slice(0, 3).join(" "), words.slice(0, 2).join(" ")];
}
