// Sanity checks for the EMBER flammability model and ranker. Run: npm test
import assert from "node:assert/strict";
import { createRequire } from "node:module";
globalThis.window = {};
const require = createRequire(import.meta.url);
require("../data/investigations.js");
require("../data/insights.js");
require("../data/l10n-ru.js");
require("../data/l10n-uz.js");
require("../i18n.js");
require("../model.js");
require("../ai.js");
require("../voice.js");
const E = window.EMBER, M = E.model;
E.setLang("en");

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

// ---- languages: every interface string exists in all three languages ----
for (const lang of ["ru", "uz"]) {
  E.setLang(lang);
  const L = E.L10N[lang];
  // translated records keep their structure (same ids, same number of findings)
  for (const [id, tr] of Object.entries(L.inv)) {
    const orig = E.origInv(id);
    assert.ok(orig, `${lang}: unknown investigation ${id}`);
    if (tr.findings) assert.equal(tr.findings.length, orig.findings.length, `${lang} ${id}: findings count`);
    if (tr.sensors) assert.equal(tr.sensors.length, orig.sensors.length, `${lang} ${id}: sensors count`);
  }
  assert.equal(Object.keys(L.inv).length, E.INVESTIGATIONS.length, `${lang}: all investigations translated`);
  assert.equal(L.gap.length, E.GAPS.length); assert.equal(L.inc.length, E.INCIDENTS.length);
  assert.equal(L.spin.length, E.SPINOFFS.length); assert.equal(L.prim.length, E.PRIMER.length);
  assert.equal(Object.keys(L.ins).length, E.INSIGHTS.length);
  // model output is translated, numbers are unchanged
  const a = M.assess({ o2: 34, p: 56.5, g: 0.166, vent: 15, materialId: "nomex" });
  assert.ok(a.cls >= 2 && a.state !== "Flammable" && a.state.length > 3, `${lang}: state ${a.state}`);
  // retrieval in the interface language
  const q = lang === "ru" ? "датчики дыма и размер частиц" : "tutun datchiklari va zarracha o'lchami";
  assert.equal(M.makeIndex(M.buildChunks()).search(q)[0].c.inv, "SAME", `${lang}: smoke query`);
  // offline answers parse conditions written with a decimal comma
  const res = await E.ai.ask(lang === "ru" ? "Горит ли Nomex при 34% кислорода и 8,2 psi на Луне?" : "Oyda 34% kislorod va 8,2 psi'da Nomex yonadimi?", E.SCENARIOS[1]);
  assert.match(res.text, /Nomex/); assert.match(res.text, /34% O₂/); assert.ok(res.gaps.length >= 2, `${lang}: gap flags`);
  for (const sug of E.suggestions()) {
    const r = await E.ai.ask(sug, E.SCENARIOS[1]);
    assert.ok(r.text.split("\n").length >= 2, `${lang}: thin answer for "${sug}"`);
  }
}
E.setLang("en");
assert.equal(M.assess({ o2: 21, p: 101.3, g: 0, vent: 10, materialId: "nomex" }).state, "Self-extinguishing");

// ---- voice: emergency commands, stop words and short spoken answers in every language ----
for (const [lang, fire, smoke, stop] of [["en", "Fire!", "smoke", "stop"], ["ru", "Пожар!", "дым", "стоп"], ["uz", "Yong'in!", "tutun", "to'xta"]]) {
  E.setLang(lang);
  assert.equal(E.ai.emergency(fire).emergency, "fire", `${lang} fire`);
  assert.equal(E.ai.emergency(smoke).emergency, "smoke", `${lang} smoke`);
  assert.equal(E.ai.emergency(E.t("v.fire")).emergency, "fire", `${lang} fire chip`);
  assert.ok(E.ai.isStop(stop), `${lang} stop`);
  const em = await E.ai.ask(fire, E.SCENARIOS[0]);
  assert.ok(em.spoken.length > 20 && !/\[/.test(em.spoken), `${lang} emergency spoken text`);
  // a question about fire is a question, not a command
  assert.equal(E.ai.emergency(E.suggestions()[2]), null, `${lang} long question is not a command`);
  for (const sug of E.suggestions()) {
    const r = await E.ai.ask(sug, E.SCENARIOS[1]);
    assert.ok(r.spoken && r.spoken.length > 15 && r.spoken.length <= 420 && !/\[|\*\*/.test(r.spoken), `${lang} spoken summary for "${sug}": ${r.spoken}`);
  }
}
E.setLang("en");
console.log("All EMBER model and language checks passed.");

// Uzbek speech text: digits, units and acronyms are read as Uzbek words
{
  const sp = (x) => E.voice.speechText(x, "uz");
  assert.equal(E.voice.uzInt(2016), "ikki ming o'n olti");
  assert.equal(sp("28,1%"), "yigirma sakkiz butun oʻndan bir foiz");
  assert.equal(sp("56,5 kPa'da"), "ellik olti butun oʻndan besh kilopaskalda");
  assert.equal(sp("34% O₂"), "oʻttiz toʻrt foiz kislorod");
  assert.equal(sp("2016-yil"), "ikki ming oʻn oltinchi yil");
  assert.equal(sp("Saffire I–III"), "Saffire birdan uchgacha");
  assert.equal(sp("ISS'da LOI'si"), "Xalqaro kosmik stansiyada kislorod indeksi");
  assert.equal(sp("1 mkm dan past"), "bir mikrometrdan past");
  assert.equal(sp("ma'lumot"), "maʼlumot");
  assert.ok(!/\d/.test(sp(E.ai.emergency("yong'in").spoken)));
  assert.equal(E.voice.speechText("21% O₂", "en"), "21% O₂"); // other languages unchanged
  E.setLang("uz");
  for (const q of E.suggestions()) {
    const r = await E.ai.ask(q, { label: "ISS", o2: 21, p: 101.3, g: 0 }, [], {});
    const said = sp(r.spoken);
    assert.ok(!/\d|%|₂/.test(said), `digits left in Uzbek speech: ${said}`);
    assert.ok(said.length <= 700);
  }
  E.setLang("en");
}
// wake word spellings the recognisers produce
for (const said of ["Hey Ember", "Xey Amber, savol", "Emberga", "Эй, Эмбер", "hey M1", "M1 marsda", "m 1", "M-1", "em bir", "hey Em1", "M one"]) assert.ok(E.voice.WAKE_RX.test(said), `wake: ${said}`);
for (const said of ["remember", "chamber", "M10", "members"]) assert.ok(!E.voice.WAKE_RX.test(said), `not wake: ${said}`);
console.log("Uzbek speech text checks passed.");

