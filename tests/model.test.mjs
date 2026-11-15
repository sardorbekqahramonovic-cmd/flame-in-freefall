// Sanity checks for the VULKAN flammability model and ranker. Run: npm test
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
const E = window.VULKAN, M = E.model;
E.setLang("en");

for (const m of E.MATERIALS) {
  // calibration: at 1 g, no ventilation, at the pressure NASA measured it, the limit equals the anchor
  // (NASA-STD-6001 Test 1 MOC where published, otherwise the LOI)
  const an = M.anchor(m);
  const a = M.assess({ o2: 21, p: an.kPa, g: 1, vent: 0, materialId: m.id });
  assert.ok(Math.abs(a.loc - an.o2) < 0.05, `${m.id}: 1 g limit ${a.loc} should equal its anchor ${an.o2}`);
  assert.ok(a.range[0] < a.loc && a.loc < a.range[1], `${m.id}: band brackets the estimate`);
  // microgravity minimum is below the 1 g limit (BASS-II: 2.4 points)
  const min = Math.min(...M.curve(m, an.kPa).map(([, o]) => o));
  assert.ok(Math.abs(an.o2 - min - 2.4) < 0.05, `${m.id}: microgravity minimum should sit 2.4 points below the 1 g limit`);
}
// NASA pressure rule: lower pressure raises the limit by ~0.6 points per psi
{
  const hi = M.assess({ o2: 21, p: 101.3, g: 1, vent: 0, materialId: "nomex" }).loc;
  const lo = M.assess({ o2: 21, p: 70.3, g: 1, vent: 0, materialId: "nomex" }).loc;
  assert.ok(Math.abs((lo - hi) / (31 / 6.89476) - 0.607) < 0.01, "pressure slope 0.607 %/psi");
}
// still microgravity air starves thin fuels (BASS-II: flames always quenched when the fan stopped)
assert.ok(M.assess({ o2: 21, p: 101.3, g: 0, vent: 0, materialId: "paper" }).cls <= 1);
// ... but oxygen-enriched still air lets paper burn (SSCE, 35% O2)
assert.ok(M.assess({ o2: 35, p: 101.3, g: 0, vent: 0, materialId: "paper" }).cls >= 2);
// paper burns in ISS air with ventilation
assert.ok(M.assess({ o2: 21, p: 101.3, g: 0, vent: 10, materialId: "paper" }).cls >= 2);
// Nomex: passes NASA's 1 g test in ISS air, flammable in the 8.2 psia / 34% exploration atmosphere
assert.ok(M.assess({ o2: 21, p: 101.3, g: 1, vent: 0, materialId: "nomex" }).cls <= 1);
assert.ok(M.assess({ o2: 34, p: 56.5, g: 0.166, vent: 15, materialId: "nomex" }).cls >= 2);
// Kapton film: NASA MOC 26% at 14.7 psia, so it can burn in Moon-base air (the old LOI 37% said it could not)
assert.ok(M.assess({ o2: 30, p: 70.3, g: 0.166, vent: 10, materialId: "kapton" }).cls >= 2);
// PTFE stays non-flammable even at 34%
assert.equal(M.assess({ o2: 34, p: 56.5, g: 0.166, vent: 15, materialId: "ptfe" }).cls, 0);
// partial gravity is nearly the most flammable condition: lunar limit below the 1 g limit at the same pressure
assert.ok(M.assess({ o2: 30, p: 56.5, g: 0.166, vent: 0, materialId: "nomex" }).loc < M.assess({ o2: 30, p: 56.5, g: 1, vent: 0, materialId: "nomex" }).loc);
// validation against NASA measurements: v2 never calls a material safe where NASA saw it burn
{
  const v = M.validate();
  assert.equal(v.n, M.CHECKS.length);
  assert.equal(v.v2.unsafe, 0, "v2 has no unsafe misses");
  assert.ok(v.v1.unsafe >= 5, "v1 (LOI-based) had unsafe misses");
  assert.ok(v.v2.ok >= 10, `v2 correct on ${v.v2.ok} of ${v.n}`);
  for (const r of v.rows) assert.ok(E.SRC[r.src] || r.src === "ssce", `${r.id}: known source`);
}
// FM2 pre-registered predictions: Nomex burns at 37/33/29% and is too close to call at 25%;
// its lunar limit falls inside NASA's expected 24–26% window for the FM2 fabric
{
  const nomex = M.fm2Predictions().find((x) => x.material.id === "nomex");
  assert.deepEqual(nomex.tests.map((x) => x.call), ["burn", "burn", "burn", "edge"]);
  assert.ok(nomex.loc >= 24 && nomex.loc <= 26, `Nomex lunar limit ${nomex.loc}`);
}
// every NASA-anchored material cites a known source
for (const m of E.MATERIALS) if (m.moc) assert.ok(E.SRC[m.moc.src], `${m.id}: MOC source`);
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
assert.equal(M.assess({ o2: 21, p: 101.3, g: 0, vent: 10, materialId: "ptfe" }).state, "Self-extinguishing");

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

// ---- Ask VULKAN knows its own model: how it works, its NASA check, its FM2 predictions, material limits ----
for (const [lang, acc, fm2, kapton, smokeQ] of [
  ["en", "How accurate is VULKAN's fire model?", "What does VULKAN predict for NASA's FM2 Moon test?", "Is Kapton safe in a Moon base at 30% oxygen?", "How does VULKAN detect smoke?"],
  ["ru", "Насколько точна модель VULKAN?", "Что VULKAN предсказывает для FM2?", "Безопасен ли каптон на лунной базе при 30% кислорода?", "Как VULKAN обнаруживает дым?"],
  ["uz", "VULKAN modeli qanchalik aniq?", "FM2 tajribasi uchun VULKAN nimani bashorat qiladi?", "Oy bazasida 30% kislorodda Kapton xavfsizmi?", "VULKAN tutunni qanday aniqlaydi?"],
]) {
  E.setLang(lang);
  const ids = M.buildChunks().map((c) => c.id);
  for (const id of ["MODEL-1", "MODEL-2", "MODEL-3", ...E.MATERIALS.map((m) => `MAT-${m.id}`)]) assert.ok(ids.includes(id), `${lang}: knowledge base has ${id}`);
  const v = M.validationNumbers();
  const a = await E.ai.ask(acc, E.SCENARIOS[1]);
  assert.match(a.text, /\[MODEL-2\]/, `${lang}: accuracy answer cites the model check`);
  assert.ok(a.text.includes(`${v.v2o}`) && a.text.includes(`${v.v1u}`), `${lang}: accuracy answer gives the numbers`);
  const f = await E.ai.ask(fm2, E.SCENARIOS[1]);
  assert.match(f.text, /\[MODEL-3\]/, `${lang}: FM2 answer cites the frozen predictions`);
  assert.ok(f.text.includes(E.num(M.fm2Predictions()[0].loc, 1)), `${lang}: FM2 answer gives the Nomex limit`);
  const k = await E.ai.ask(kapton, E.SCENARIOS[1]);
  assert.match(k.text, /\[MAT-kapton\]/, `${lang}: material answer names its NASA anchor`);
  assert.equal(E.ai.emergency(smokeQ), null, `${lang}: a short question about smoke is not the smoke command`);
}
E.setLang("en");
assert.equal(E.ai.parseConditions("Is PET film flammable at 34% oxygen?", E.SCENARIOS[1]).materialId, "pet");
assert.equal(E.ai.parseConditions("polysulfone housing in a lunar habitat", E.SCENARIOS[1]).materialId, "psu");
assert.equal(E.ai.parseConditions("Is the pet food safe at 30%?", E.SCENARIOS[1]).materialId, "nomex", "lower-case pet is not PET film");
assert.equal(E.int(2250), "2,250"); E.setLang("uz"); assert.equal(E.int(2250), "2\u00a0250"); E.setLang("en");
console.log("All VULKAN model and language checks passed.");

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
for (const said of ["Hey Vulkan", "hey vulkan what is BASS", "Xey Vulqon, savol", "Vulqonga", "Salom Vulkan", "Эй, Вулкан", "вулкан", "Hey Vulcan", "ok volkan"]) assert.ok(E.voice.WAKE_RX.test(said), `wake: ${said}`);
for (const said of ["vulkanizatsiya", "volcanic", "Sardor", "hey ember", "M1"]) assert.ok(!E.voice.WAKE_RX.test(said), `not wake: ${said}`);
assert.equal(E.voice.speechText("VULKAN says", "en"), "Vulkan says");
assert.ok(E.voice.speechText("VULKAN javob beradi", "uz").startsWith("Vulkan"));
console.log("Uzbek speech text checks passed.");

