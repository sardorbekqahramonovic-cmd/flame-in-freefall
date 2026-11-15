/*
 * VULKAN reasoning core: flammability model, mission-relevance ranking and
 * retrieval index. Pure functions, no DOM. Works offline.
 */
(function () {
  const E = window.VULKAN;
  const t = (k, v) => (E.t ? E.t(k, v) : k);
  const G_EARTH_BUOYANT_FLOW = 30; // cm/s, typical buoyancy-induced flow at a burning surface in 1 g

  /* ---------------- Flammability model (v2, checked against NASA data) ----------------
   * Transparent and deliberately simple. Every constant comes from a NASA measurement:
   * 1. Normal-gravity anchor: the NASA-STD-6001 Test 1 Maximum Oxygen Concentration (MOC,
   *    upward burning) at the pressure NASA measured it (WSTF; NTRS 20100015582, 20110008636).
   *    Materials without a published MOC fall back to their Limiting Oxygen Index and are
   *    flagged as unverified with a wider band.
   * 2. Pressure: NASA WSTF's linear MOC rule, 0.607 % O2 per psi lower pressure on average
   *    (range 0.251–0.975; NTRS 20110008636).
   * 3. Microgravity: the minimum limit sits 2.4 points below the normal-gravity limit
   *    (BASS-II, 1/4-in PMMA rod: 13.6% O2 in orbit vs 16% in 1 g; NASA says to derate by at
   *    least that much; NTRS 20160000593).
   * 4. Flow: flat bottom in microgravity, quenching below ~5 cm/s for thin fabrics (BASS-II
   *    SIBAL quenched at 2.2–5 cm/s) and ~1.5 cm/s for thick acrylic, blow-off above ~40 cm/s
   *    (SIBAL kept burning at 53 cm/s; NTRS 20150008962). Still air keeps a small flame-induced
   *    flow (SSCE: paper spread in still air only when oxygen-enriched).
   * 5. Gravity: buoyant flow 30 cm/s × g^(1/3) feeds the flame; buoyant stretch adds back the
   *    2.4-point penalty as √g, so partial gravity is nearly the most flammable condition, as
   *    NASA's lunar-gravity ground tests indicate (Ferkul, LPSC 2026).
   */
  const PSI = 6.89476; // kPa per psi
  const V2 = {
    derate: 2.4,
    slope: 0.607, slopeLo: 0.251, slopeHi: 0.975,
    thin: { uQ: 5, kQ: 4.5 },
    thick: { uQ: 1.5, kQ: 3.0 },
    uBlow: 40, kBlow: 2.0,
    uFloor: 1.5,
    bandMoc: 1, bandEst: 2, bandLoi: 3, bandFlow: 0.5,
  };
  const PARAMS = V2;

  function buoyantFlow(g) {
    return g <= 0 ? 0 : G_EARTH_BUOYANT_FLOW * Math.cbrt(g);
  }
  /** Normal-gravity anchor: { o2, kPa, kind: "moc" | "est" | "loi" }. */
  function anchor(material) {
    if (material.moc) return { o2: material.moc.o2, kPa: material.moc.psia * PSI, kind: material.moc.est ? "est" : "moc" };
    return { o2: material.loi, kPa: 101.3, kind: "loi" };
  }
  function flowTerm(material, u) {
    const f = material.thin ? V2.thin : V2.thick;
    const uu = Math.max(u, V2.uFloor);
    const q = uu < f.uQ ? f.kQ * Math.log(f.uQ / uu) ** 2 : 0;
    const b = uu > V2.uBlow ? V2.kBlow * Math.log(uu / V2.uBlow) ** 2 : 0;
    return q + b;
  }
  /** Limiting O2 (%) for a material at effective flow uEff (cm/s), pressure p (kPa), gravity g (g0). */
  function limitingO2(material, uEff, p, g = 0) {
    const a = anchor(material);
    const pTerm = V2.slope * (a.kPa - Math.max(p, 5)) / PSI;
    const gTerm = V2.derate * Math.sqrt(Math.max(0, g));
    return Math.min(100, a.o2 - V2.derate + flowTerm(material, uEff) + pTerm + gTerm);
  }
  /** Uncertainty band [lo, hi] around limitingO2: anchor quality plus the spread of NASA's pressure slopes. */
  function band(material, uEff, p, g = 0) {
    const a = anchor(material), loc = limitingO2(material, uEff, p, g);
    const w = a.kind === "moc" ? V2.bandMoc : a.kind === "est" ? V2.bandEst : V2.bandLoi;
    const dPsi = (a.kPa - Math.max(p, 5)) / PSI;
    const sLo = dPsi * (dPsi >= 0 ? V2.slopeLo - V2.slope : V2.slopeHi - V2.slope);
    const sHi = dPsi * (dPsi >= 0 ? V2.slopeHi - V2.slope : V2.slopeLo - V2.slope);
    const fw = g < 1 ? V2.bandFlow : 0;
    return [Math.max(0, loc - w - fw + Math.min(0, sLo)), Math.min(100, loc + w + fw + Math.max(0, sHi))];
  }

  /* v1 (LOI-calibrated, before the NASA check). Kept only to show what the check changed. */
  const V1 = { thin: { uOpt: 10, delta: 2.5, lowSteep: 3.0 }, thick: { uOpt: 15, delta: 1.5, lowSteep: 2.4 }, kPressure: 3.0 };
  function limitingO2v1(material, uEff, p) {
    if (material.loi == null) return null;
    const prm = material.thin ? V1.thin : V1.thick;
    const u = Math.max(uEff, 0.3);
    const A = prm.delta / Math.log(G_EARTH_BUOYANT_FLOW / prm.uOpt) ** 2;
    const x = Math.log(u / prm.uOpt);
    const steep = x < 0 ? prm.lowSteep : 1;
    return Math.min(100, material.loi - prm.delta + A * steep * x * x + V1.kPressure * Math.log(101.3 / Math.max(p, 5)));
  }

  function assess({ o2, p, g, vent, materialId }) {
    const material = E.MATERIALS.find((m) => m.id === materialId) || E.MATERIALS[0];
    const ub = buoyantFlow(g);
    const uEff = Math.sqrt(vent * vent + ub * ub);
    const loc = limitingO2(material, uEff, p, g);
    const range = band(material, uEff, p, g);
    const loc1g = limitingO2(material, Math.sqrt(vent * vent + G_EARTH_BUOYANT_FLOW ** 2), 101.3, 1);
    const margin = o2 - loc;
    const ppO2 = (o2 / 100) * p;
    const cls = margin < -3 ? 0 : margin < 0 ? 1 : margin < 6 ? 2 : 3;
    const state = t("st." + cls), text = t("stx." + cls);
    // relative spread index: opposed-flow spread grows roughly with O2 excess and ppO2
    const spreadIdx = margin <= 0 ? 0 : Math.min(10, (margin / 10) * Math.sqrt(ppO2 / 21.3) * 4);
    const coverage = evidenceCoverage({ o2, p, g, material });
    // 0..100 risk gauge
    const gauge = Math.max(0, Math.min(100, 50 + margin * 5));
    return { material, anchor: anchor(material), ub, uEff, loc, range, loc1g, margin, ppO2, state, cls, text, spreadIdx, coverage, gauge };
  }

  function curve(material, p, maxU = 60, g = 0) {
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const u = 0.5 * Math.pow(maxU / 0.5, i / 120);
      pts.push([u, limitingO2(material, u, p, g)]);
    }
    return pts;
  }

  /* ---------------- Validation against NASA measurements ----------------
   * kind "limit": NASA measured a limit (or a range for it); "burns": a flame survived at o2;
   * "noburn": no flame survived at o2. tuned = the observation was used to set a constant. */
  const kPa = (psia) => psia * PSI;
  const CHECKS = [
    { id: "c-nomex", mat: "nomex", o2: 25, p: kPa(10.2), g: 1, vent: 0, kind: "limit", lo: 25, hi: 26, src: "hirsch2010", tuned: true },
    { id: "c-kapton", mat: "kapton", o2: 26, p: kPa(14.7), g: 1, vent: 0, kind: "limit", lo: 26, hi: 27, src: "hirsch2011", tuned: true },
    { id: "c-silicone", mat: "silicone", o2: 22, p: kPa(14.7), g: 1, vent: 0, kind: "limit", lo: 22, hi: 23, src: "hirsch2011", tuned: true },
    { id: "c-pmma", mat: "pmma", o2: 14, p: kPa(14.7), g: 1, vent: 0, kind: "limit", lo: 14, hi: 15, src: "hirsch2011", tuned: true },
    { id: "i-nomex-uloi", mat: "nomex", o2: 23.5, p: 101.3, g: 1, vent: 0, kind: "limit", lo: 20.5, hi: 22.5, src: "bass2013", tuned: false },
    { id: "i-pmma-ug", mat: "pmma", o2: 13.6, p: 101.3, g: 0, vent: 3, kind: "burns", src: "bass2014", tuned: true },
    { id: "i-sibal-53", mat: "sibal", o2: 16.9, p: 101.3, g: 0, vent: 53, kind: "burns", src: "zhao2015", tuned: true },
    { id: "i-sibal-q", mat: "sibal", o2: 16.9, p: 101.3, g: 0, vent: 2.8, kind: "noburn", src: "zhao2015", tuned: true },
    { id: "i-sibal-ign", mat: "sibal", o2: 16.4, p: 101.3, g: 0, vent: 10, kind: "noburn", src: "zhao2015", tuned: false },
    { id: "i-nomex-ug", mat: "nomex", o2: 21.5, p: 101.3, g: 0, vent: 15, kind: "noburn", src: "bass2013", tuned: false },
    { id: "i-still", mat: "sibal", o2: 21, p: 101.3, g: 0, vent: 0, kind: "noburn", src: "bass2019", tuned: true },
    { id: "i-ssce", mat: "paper", o2: 35, p: 101.3, g: 0, vent: 0, kind: "burns", src: "ssce", tuned: true },
  ];
  /** verdict: "ok" | "unsafe" (model says no flame where NASA saw one, or a limit too high) | "cons" (too cautious) */
  function verdict(c, loc) {
    if (loc == null) return "na";
    if (c.kind === "limit") return loc > c.hi + 0.05 ? "unsafe" : loc < c.lo - 0.05 ? "cons" : "ok";
    if (c.kind === "burns") return loc <= c.o2 ? "ok" : "unsafe";
    return loc >= c.o2 ? "ok" : "cons";
  }
  function validate() {
    const rows = CHECKS.map((c) => {
      const m = E.MATERIALS.find((x) => x.id === c.mat);
      const ub = buoyantFlow(c.g), uEff = Math.sqrt(c.vent * c.vent + ub * ub);
      const v1 = limitingO2v1(m, uEff, c.p), v2 = limitingO2(m, uEff, c.p, c.g);
      return { ...c, material: m, v1, v2, v1v: verdict(c, v1), v2v: verdict(c, v2) };
    });
    const tally = (k) => ({ ok: rows.filter((r) => r[k] === "ok").length, unsafe: rows.filter((r) => r[k] === "unsafe").length, cons: rows.filter((r) => r[k] === "cons").length });
    const indep = rows.filter((r) => !r.tuned);
    const tallyI = (k) => ({ ok: indep.filter((r) => r[k] === "ok").length, unsafe: indep.filter((r) => r[k] === "unsafe").length, cons: indep.filter((r) => r[k] === "cons").length });
    return { rows, v1: tally("v1v"), v2: tally("v2v"), v1i: tallyI("v1v"), v2i: tallyI("v2v"), n: rows.length, nIndep: indep.length };
  }

  /* ---------------- FM2: pre-registered predictions ----------------
   * FM2 (Flammability of Materials on the Moon) plans four upward-burning tests in lunar gravity at
   * 8.2 psia with 37, 33, 29 and 25% O2 (Ferkul, LPSC 2026, NTRS 20260001966). NASA expects its test
   * fabric to have a lunar limit of 24–26%. These predictions were frozen on FM2_FROZEN, before FM2 flies. */
  const FM2_FROZEN = "2026-11-14";
  const FM2_TESTS = [37, 33, 29, 25];
  function fm2Predictions(materialIds = ["nomex", "sibal", "pet"]) {
    const g = 0.166, p = kPa(8.2), uEff = buoyantFlow(g);
    return materialIds.map((id) => E.MATERIALS.find((m) => m.id === id)).filter(Boolean).map((m) => {
      const loc = limitingO2(m, uEff, p, g), range = band(m, uEff, p, g);
      return { material: m, loc, range, tests: FM2_TESTS.map((o2) => ({ o2, call: o2 > range[1] ? "burn" : o2 < range[0] ? "out" : "edge" })) };
    });
  }

  /* ---------------- New test results ----------------
   * Results published after the curated record (FM2, FLARE, new White Sands tests). Reviewed ones ship in
   * data/results.js (window.VULKAN_RESULTS); anyone can add more in their browser. Each result is checked
   * against the model exactly like CHECKS, and FM2 results score the frozen FM2 predictions. */
  const RESULTS_KEY = "vulkan:results";
  function localResults() {
    try { const a = JSON.parse(localStorage.getItem(RESULTS_KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function saveLocalResults(list) {
    try { localStorage.setItem(RESULTS_KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
  }
  const finite = (x) => typeof x === "number" && isFinite(x);
  function validResult(r) {
    return !!r && typeof r === "object" && E.MATERIALS.some((m) => m.id === r.mat) && ["burns", "noburn", "limit"].includes(r.kind)
      && finite(r.o2) && r.o2 > 0 && r.o2 <= 100 && finite(r.p) && r.p > 0 && finite(r.g) && r.g >= 0 && typeof r.exp === "string" && r.exp.trim() !== "";
  }
  function scoreResult(r) {
    const m = E.MATERIALS.find((x) => x.id === r.mat);
    const vent = finite(r.vent) && r.vent > 0 ? r.vent : 0;
    const ub = buoyantFlow(r.g), uEff = Math.sqrt(vent * vent + ub * ub);
    const loc = limitingO2(m, uEff, r.p, r.g), range = band(m, uEff, r.p, r.g);
    const lo = r.kind === "limit" ? r.o2 - 1 : null, hi = r.kind === "limit" ? r.o2 + 1 : null;
    const v = verdict(r.kind === "limit" ? { kind: "limit", lo, hi } : { kind: r.kind, o2: r.o2 }, loc);
    let fm2 = null;
    if (/\bfm-?2\b/i.test(r.exp) && Math.abs(r.p - kPa(8.2)) < 3.5 && Math.abs(r.g - 0.166) < 0.03) {
      const pred = fm2Predictions([r.mat])[0];
      if (pred && r.kind === "limit") {
        fm2 = { outcome: hi >= pred.range[0] && lo <= pred.range[1] ? "hit" : "miss" };
      } else if (pred) {
        const test = pred.tests.find((x) => Math.abs(x.o2 - r.o2) <= 0.6);
        if (test) fm2 = { call: test.call, outcome: test.call === "edge" ? "edge" : (test.call === "burn") === (r.kind === "burns") ? "hit" : "miss" };
      }
    }
    return { ...r, material: m, vent, loc, range, lo, hi, v, fm2 };
  }
  function results() {
    const shipped = (Array.isArray(window.VULKAN_RESULTS) ? window.VULKAN_RESULTS : []).map((r) => ({ ...r, local: false }));
    const local = localResults().map((r) => ({ ...r, local: true }));
    return shipped.concat(local).filter(validResult).map((r, i) => scoreResult({ ...r, n: i + 1 }));
  }

  /* Plain-text descriptions shared by the knowledge base and the offline reasoner. */
  const num1 = (x) => (E.num ? E.num(x, 1) : Number(x).toFixed(1));
  function anchorText(material) {
    const a = anchor(material), ps = num1(a.kPa / PSI);
    const src = material.moc && E.SRC && E.SRC[material.moc.src] ? E.SRC[material.moc.src].label : "";
    if (a.kind === "moc") return t("ch.anchorMoc", { o2: num1(a.o2), psia: ps, src });
    if (a.kind === "est") return t("ch.anchorEst", { o2: num1(a.o2), psia: ps, src });
    return t("ch.anchorLoi", { o2: num1(a.o2) });
  }
  function fm2Line(pred) {
    const calls = pred.tests.map((x) => `${x.o2}%: ${t("fm." + x.call)}`).join(", ");
    return t("ch.m3line", { m: pred.material.label, x: num1(pred.loc), lo: num1(pred.range[0]), hi: num1(pred.range[1]), calls });
  }
  function resultText(r) {
    const cond = `${num1(r.p / PSI)} psia, ${r.g === 0 ? t("va.orbit") : (E.num ? E.num(r.g, 3) : r.g) + " g"}, ${num1(r.vent)} cm/s`;
    const obs = r.kind === "limit" ? t("nr.obsLimit", { o2: num1(r.o2) }) : t(r.kind === "burns" ? "va.obsBurns" : "va.obsNoburn", { o2: num1(r.o2) });
    let s = t("ch.res", { exp: r.exp, date: r.date || "—", m: r.material.label, cond, obs, x: num1(r.loc), v: t("va.v." + r.v), src: r.src || "—" });
    if (r.fm2) s += " " + t("ch.resFm2", { o: t("nr.fm." + r.fm2.outcome) });
    if (r.note) s += " " + r.note;
    return s;
  }
  function validationNumbers() {
    const v = validate();
    return { n: v.n, v1u: v.v1.unsafe, v1o: v.v1.ok, v2o: v.v2.ok, v2u: v.v2.unsafe, v2c: v.v2.cons, nt: v.n - v.nIndep, ni: v.nIndep };
  }
  function materialText(m) {
    const lunar = (E.SCENARIOS || []).find((s) => s.id === "lunar") || { o2: 30, p: 70.3, g: 0.166, vent: 10 };
    const earth = assess({ o2: 21, p: 101.3, g: 1, vent: 10, materialId: m.id });
    const moon = assess({ o2: lunar.o2, p: lunar.p, g: lunar.g, vent: lunar.vent, materialId: m.id });
    return t("ch.mat", { m: m.label, anchor: anchorText(m), note: m.note || "", l1: num1(earth.loc), lm: num1(moon.loc), st: moon.state.toLowerCase() });
  }

  function envDist(inv, o2, p) {
    const dO2 = Math.max(0, inv.o2[0] - o2, o2 - inv.o2[1]) / 15;
    const dP = Math.max(0, inv.p[0] - p, p - inv.p[1]) / 40;
    return Math.sqrt(dO2 * dO2 + dP * dP);
  }

  function evidenceCoverage({ o2, p, g, material }) {
    const solids = E.INVESTIGATIONS.filter((i) => i.category === "solid" && !i.planned);
    const near = solids
      .map((i) => ({ inv: i, d: envDist(i, o2, p) }))
      .sort((a, b) => a.d - b.d);
    const inside = near.filter((x) => x.d === 0);
    // level stays an English key ("High"…); the UI translates it with t("lv." + level)
    let level, note;
    if (inside.length >= 2) { level = "High"; note = t("cov.many", { n: inside.length }); }
    else if (inside.length === 1) { level = "Medium"; note = t("cov.one", { name: inside[0].inv.name }); }
    else if (near[0] && near[0].d < 0.6) { level = "Low"; note = t("cov.near", { name: near[0].inv.name }); }
    else { level = "Very low"; note = t("cov.none"); }
    const flags = [];
    if (g > 0 && g < 1) {
      const order = ["High", "Medium", "Low", "Very low"];
      level = order[Math.min(3, order.indexOf(level) + 1)];
      note += " " + t("cov.gravity");
      flags.push(t("flag.g"));
    }
    if (o2 > 40) flags.push(t("flag.o2"));
    if (p < 50) flags.push(t("flag.p"));
    return { level, note, near: near.slice(0, 3), flags };
  }

  /* ---------------- Mission relevance ranking ---------------- */
  const CAT_RELEVANCE = {
    iss: { solid: 1, detection: 0.95, droplet: 0.75, cool: 0.6, gas: 0.6, future: 0.3 },
    lunar: { solid: 1, detection: 0.9, droplet: 0.7, cool: 0.65, gas: 0.55, future: 0.8 },
    rover: { solid: 1, detection: 0.9, droplet: 0.7, cool: 0.7, gas: 0.55, future: 0.75 },
    mars: { solid: 1, detection: 0.9, droplet: 0.7, cool: 0.65, gas: 0.55, future: 0.7 },
    transit: { solid: 1, detection: 0.95, droplet: 0.75, cool: 0.6, gas: 0.6, future: 0.4 },
    suit: { solid: 1, detection: 0.4, droplet: 0.3, cool: 0.9, gas: 0.5, future: 0.6 },
  };
  const DEFAULT_WEIGHTS = { atmosphere: 35, hazard: 25, scale: 15, data: 15, recency: 10 };

  function rank(scenario, weights = DEFAULT_WEIGHTS) {
    const sumW = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
    const rel = CAT_RELEVANCE[scenario.id] || CAT_RELEVANCE.iss;
    return E.INVESTIGATIONS.map((inv) => {
      const d = envDist(inv, scenario.o2, scenario.p);
      let atmosphere = Math.exp(-3 * d * d);
      if (inv.gravity && scenario.g > 0) atmosphere = Math.min(1, atmosphere + 0.35); // partial-g data
      const hazard = rel[inv.category] ?? 0.5;
      const scale = inv.scaleCm > 0 ? Math.min(1, Math.log10(1 + inv.scaleCm) / 2) : 0.2;
      const data = inv.planned ? 0.1 : Math.min(1, Math.log10(1 + (inv.tests || 1)) / 3) * 0.8 + (inv.links.some((l) => l.url.includes("psi.nasa.gov")) ? 0.2 : 0);
      const recency = Math.max(0, Math.min(1, (inv.years[1] - 1990) / 37));
      const parts = { atmosphere, hazard, scale, data, recency };
      const score = Object.keys(parts).reduce((a, k) => a + parts[k] * (weights[k] || 0), 0) / sumW * 100;
      const why = explain(inv, parts, scenario);
      return { inv, parts, score, why };
    }).sort((a, b) => b.score - a.score);
  }

  function explain(inv, parts, sc) {
    const bits = [];
    const label = E.lang && E.lang !== "en" ? sc.label : sc.label.toLowerCase();
    const fmt = E.fmt || String;
    if (parts.atmosphere > 0.85) bits.push(t(inv.planned ? "why.plannedCover" : "why.tested", { s: label }));
    else if (parts.atmosphere < 0.3) bits.push(t("why.far", { o2: fmt(sc.o2), p: fmt(sc.p) }));
    if (parts.scale > 0.8) bits.push(t("why.scale"));
    if (parts.data > 0.8) bits.push(t("why.data"));
    if (inv.planned) bits.push(t("why.gap"));
    if (inv.category === "detection") bits.push(t("why.detector"));
    if (inv.id === "FLEX") bits.push(t("why.suppressant"));
    return bits.slice(0, 3).join(" · ") || E.CATEGORIES[inv.category].label.toLowerCase();
  }

  /* ---------------- Retrieval index (BM25) ---------------- */
  const STOP = new Set("a an the of in on at to for and or is are was were be by with from as that this it its into than then do does did can could how what which who why when where about vs versus more most less into our we you i me my your their there these those has have had not no".split(" "));
  const SYN = {
    extinguish: ["suppression", "suppressant", "extinction", "extinguishment"],
    extinguisher: ["suppression", "suppressant"],
    suppress: ["suppression", "suppressant", "extinguish"],
    smoke: ["detection", "detector", "aerosol", "particle"],
    detector: ["detection", "smoke"],
    moon: ["lunar", "partial", "gravity"],
    lunar: ["moon", "partial"],
    mars: ["martian", "partial", "gravity"],
    oxygen: ["o2"],
    o2: ["oxygen"],
    fabric: ["textile", "cotton", "sibal", "nomex"],
    cloth: ["textile", "cotton", "nomex"],
    plastic: ["pmma", "acrylic", "polyethylene"],
    acrylic: ["pmma"],
    droplet: ["fuel", "heptane", "methanol"],
    soot: ["smoke"],
    habitat: ["exploration", "atmosphere", "lunar"],
    suit: ["spacesuit", "eva"],
    cool: ["cool", "low-temperature"],
    pressure: ["psia", "kpa"],
  };
  // Russian and Uzbek: stop words, a few canonical stems and synonyms (keys are stems)
  const STOP_X = new Set(("и в во на с со по для что как это не при из от до или а но ли же о об к у за ли ни бы то так все его её их мы вы он она они "
    + "какие какой какая каких почему зачем где когда чем есть был была были будет можно нужно ещё также очень "
    + "va bilan uchun bu u ular qanday nima nimani qaysi nega qayerda qachon da ham esa emas kabi yoki lekin bir har men biz siz edi bo'ladi "
    + "haqida bo'yicha boshqa yana juda").split(/\s+/).map((w) => w.replace(/['ʻʼ’‘`]/g, "")));
  const CANON = [["лун", "лун"], ["марс", "марс"], ["дым", "дым"], ["туш", "туш"], ["огнету", "туш"], ["oyda", "oy"], ["oydagi", "oy"]];
  const SYN_X = {
    "туш": ["подавление", "затухание"], "подав": ["туш"], "дым": ["датчик", "обнаружение", "аэрозоль", "частицы"], "датчи": ["обнаружение", "дым"],
    "лун": ["частичная"], "марс": ["частичная"], "ткань": ["ткани", "хлопок", "sibal", "nomex"], "пласт": ["pmma", "акрил"], "сажа": ["сажи", "дым"],
    "ochir": ["so'nish", "o'chiruvchi"], "tutun": ["aniqlash", "datchik", "aerozol", "zarracha"], "datch": ["aniqlash", "tutun"],
    "oy": ["qisman"], "mars": ["qisman"], "mato": ["matolar", "paxta", "sibal", "nomex"], "qurum": ["tutun"], "plast": ["pmma", "akril"],
  };
  function tokensX(s) {
    return (s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/['ʻʼ’‘`]/g, "").match(/[\p{L}\p{N}][\p{L}\p{N}\-]*/gu) || [])
      .filter((w) => !STOP.has(w) && !STOP_X.has(w))
      .map((w) => { const c = CANON.find(([p]) => w.startsWith(p)); return c ? c[1] : w.length > 5 ? w.slice(0, 5) : w; })
      .filter((w) => w.length > 1);
  }
  function tokens(s) {
    if (E.lang && E.lang !== "en") return tokensX(s);
    return (s.toLowerCase().normalize("NFKD").match(/[a-z0-9][a-z0-9\-]*/g) || [])
      .map((t) => t.replace(/(ing|ed|es|s)$/, (m) => (t.length > 5 ? "" : m)))
      .filter((t) => !STOP.has(t) && t.length > 1);
  }
  function expand(q) {
    const t = tokens(q);
    const out = [...t];
    const syn = E.lang && E.lang !== "en" ? SYN_X : SYN;
    t.forEach((w) => (syn[w] || []).forEach((s) => out.push(...tokens(s))));
    return out;
  }

  function buildChunks() {
    const chunks = [];
    const fmt = E.fmt || String;
    const r2 = (a) => `${fmt(a[0])}–${fmt(a[1])}`;
    E.INVESTIGATIONS.forEach((inv) => {
      const cond = t("ch.cond", { o2: r2(inv.o2), p: r2(inv.p), f: r2(inv.flow) });
      chunks.push({ id: `${inv.id}`, inv: inv.id, title: `${inv.name}: ${inv.full}`, text: `${inv.name} (${inv.full}), ${inv.years[0]}${inv.years[1] !== inv.years[0] ? "–" + inv.years[1] : ""}, ${inv.platform}. ${t("ch.objective")}: ${inv.objectives} ${t("ch.fuels")}: ${inv.fuels}. ${cond} ${t("ch.diag")}: ${inv.sensors.join(", ")}.` });
      inv.findings.forEach((f, i) => chunks.push({ id: `${inv.id}#${i + 1}`, inv: inv.id, title: `${inv.name} ${t("ch.finding")} ${i + 1}`, text: `${inv.name}: ${f}` }));
      ["prevention", "detection", "suppression"].forEach((k) => {
        if (inv.implications[k]) chunks.push({ id: `${inv.id}:${k}`, inv: inv.id, title: `${inv.name} · ${t("layer." + k)}`, text: `${inv.name}, ${t("ch.impl", { k: t("layer." + k).toLowerCase() })}: ${inv.implications[k]}` });
      });
    });
    E.INSIGHTS.forEach((s) => chunks.push({ id: `INSIGHT-${s.rank}`, inv: s.cites[0], title: s.title, text: `${s.title}. ${s.text} ${t("ch.action")}: ${s.action}` }));
    E.INCIDENTS.filter((x) => x.kind === "incident").forEach((x) => chunks.push({ id: `HIST-${x.year}`, title: `${x.year} ${x.title}`, text: `${x.year} ${x.title}: ${x.text}` }));
    E.GAPS.forEach((g, i) => chunks.push({ id: `GAP-${i + 1}`, inv: g.inv[0], title: `${t("ch.gap")}: ${g.title}`, text: `${t("ch.gap")}: ${g.title}. ${g.text}` }));
    E.SCENARIOS.forEach((s) => chunks.push({ id: `ATM-${s.id}`, title: `${t("cite.ATM")}: ${s.label}`, text: t("ch.atm", { s: s.label, o2: fmt(s.o2), p: fmt(s.p), psia: fmt((s.p / 6.895).toFixed(1)), g: fmt(s.g), note: s.note }) }));
    E.SPINOFFS.forEach((s, i) => chunks.push({ id: `EARTH-${i + 1}`, title: `${t("ch.earth")}: ${s.title}`, text: `${t("ch.earth")} (${s.era}): ${s.title}. ${s.text}` }));
    E.PRIMER.forEach((p, i) => chunks.push({ id: `PHYS-${i + 1}`, title: p.title, text: `${p.title}. ${p.text}` }));
    // the model itself: how it works, how it was checked against NASA data, its frozen FM2 predictions, material limits
    chunks.push({ id: "MODEL-1", title: t("ch.m1Title"), text: t("ch.m1") });
    chunks.push({ id: "MODEL-2", title: t("ch.m2Title"), text: t("ch.m2", validationNumbers()) });
    chunks.push({ id: "MODEL-3", title: t("ch.m3Title"), text: t("ch.m3", { d: FM2_FROZEN, lines: fm2Predictions().map(fm2Line).join(" ") }) });
    E.MATERIALS.forEach((m) => chunks.push({ id: `MAT-${m.id}`, title: t("ch.matTitle", { m: m.label }), text: materialText(m) }));
    results().forEach((r) => chunks.push({ id: `RES-${r.n}`, title: t("ch.resTitle", { exp: r.exp, m: r.material.label }), text: resultText(r) }));
    return chunks;
  }

  function makeIndex(chunks) {
    const docs = chunks.map((c) => {
      const tf = {};
      tokens(c.title + " " + c.text + " " + (c.inv || "")).forEach((t) => (tf[t] = (tf[t] || 0) + 1));
      return { c, tf, len: Object.values(tf).reduce((a, b) => a + b, 0) };
    });
    const df = {};
    docs.forEach((d) => Object.keys(d.tf).forEach((t) => (df[t] = (df[t] || 0) + 1)));
    const avg = docs.reduce((a, d) => a + d.len, 0) / docs.length;
    const N = docs.length;
    function search(q, k = 6) {
      const qt = expand(q);
      const k1 = 1.4, b = 0.7;
      const invHits = E.INVESTIGATIONS.filter((i) => new RegExp(`\\b${i.id.split("-")[0].replace(/[^A-Za-z]/g, "")}`, "i").test(q)).map((i) => i.id);
      return docs
        .map((d) => {
          let s = 0;
          qt.forEach((t) => {
            const f = d.tf[t];
            if (!f) return;
            const idf = Math.log(1 + (N - df[t] + 0.5) / (df[t] + 0.5));
            s += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / avg)));
          });
          if (d.c.inv && invHits.some((h) => d.c.inv.startsWith(h.split("-")[0]))) s *= 1.6;
          return { c: d.c, s };
        })
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, k);
    }
    return { search };
  }

  E.model = { assess, curve, buoyantFlow, limitingO2, limitingO2v1, band, anchor, anchorText, validate, validationNumbers, CHECKS, fm2Predictions, fm2Line, FM2_FROZEN, FM2_TESTS, results, localResults, saveLocalResults, resultText, PSI, rank, DEFAULT_WEIGHTS, envDist, buildChunks, makeIndex, tokens, PARAMS };
})();
