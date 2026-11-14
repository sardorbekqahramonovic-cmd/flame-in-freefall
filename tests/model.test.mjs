// Sanity checks for the EMBER flammability model and ranker. Run: npm test
import assert from "node:assert/strict";
import { createRequire } from "node:module";
globalThis.window = {};
const require = createRequire(import.meta.url);
require("../data/investigations.js");
require("../data/insights.js");
require("../model.js");
const E = window.EMBER, M = E.model;

for (const m of E.MATERIALS) {
  // calibration: at 1 g, sea level, no ventilation, the limit equals the LOI
  const a = M.assess({ o2: 21, p: 101.3, g: 1, vent: 0, materialId: m.id });
  assert.ok(Math.abs(a.loc - m.loi) < 0.05, `${m.id}: 1 g limit ${a.loc} should equal LOI ${m.loi}`);
  // microgravity minimum is below the 1 g limit (BASS trend)
  const min = Math.min(...M.curve(m, 101.3).map(([, o]) => o));
  assert.ok(min < m.loi, `${m.id}: microgravity minimum should be below LOI`);
}
// quiescent microgravity starves thin fuels (SSCE trend)
assert.equal(M.assess({ o2: 21, p: 101.3, g: 0, vent: 0, materialId: "paper" }).cls, 0);
// paper burns in ISS air with ventilation
assert.ok(M.assess({ o2: 21, p: 101.3, g: 0, vent: 10, materialId: "paper" }).cls >= 2);
// Nomex: safe in ISS air, flammable in the 8.2 psia / 34% exploration atmosphere
assert.equal(M.assess({ o2: 21, p: 101.3, g: 0, vent: 10, materialId: "nomex" }).cls, 0);
assert.ok(M.assess({ o2: 34, p: 56.5, g: 0.166, vent: 15, materialId: "nomex" }).cls >= 2);
// PTFE stays non-flammable even at 34%
assert.equal(M.assess({ o2: 34, p: 56.5, g: 0.166, vent: 15, materialId: "ptfe" }).cls, 0);
// partial gravity always carries a data-gap flag
assert.ok(M.assess({ o2: 30, p: 70.3, g: 0.166, vent: 10, materialId: "pmma" }).coverage.flags.length > 0);
// ranking covers every investigation and is sorted
for (const sc of E.SCENARIOS) {
  const r = M.rank(sc);
  assert.equal(r.length, E.INVESTIGATIONS.length);
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].score >= r[i].score);
}
// every investigation has a NASA source and every insight cites known investigations
for (const i of E.INVESTIGATIONS) assert.ok(i.links.length > 0 && i.links.every((l) => l.url.startsWith("https://")), i.id);
for (const s of E.INSIGHTS) for (const c of s.cites) assert.ok(E.INVESTIGATIONS.some((i) => i.id === c), `${s.rank} cites ${c}`);
// retrieval finds SAME for a smoke-detector question
const idx = M.makeIndex(M.buildChunks());
assert.equal(idx.search("smoke detector particle size")[0].c.inv, "SAME");
console.log("All EMBER model checks passed.");
