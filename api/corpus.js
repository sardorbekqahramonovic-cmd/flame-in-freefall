// GET -> { ntrs: { "<topic>": <number of NASA technical reports> }, source }
// Counts come from the public NTRS API and are cached for a day at the edge, so this costs nothing.
import { corpusStats, CORPUS_TOPICS } from "./_ntrs.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Use GET" });
  try {
    const ntrs = await corpusStats();
    const complete = Object.keys(ntrs).length === CORPUS_TOPICS.length && Object.values(ntrs).every((n) => n > 0);
    res.setHeader("cache-control", complete ? "public, s-maxage=86400, stale-while-revalidate=604800" : "public, s-maxage=300");
    return res.status(200).json({ ntrs, source: "https://ntrs.nasa.gov" });
  } catch (e) {
    return res.status(200).json({ ntrs: {}, source: "https://ntrs.nasa.gov" });
  }
}
