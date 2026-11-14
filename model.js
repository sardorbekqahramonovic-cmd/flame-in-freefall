/*
 * EMBER reasoning core: flammability model, mission-relevance ranking and
 * retrieval index. Pure functions, no DOM. Works offline.
 */
(function () {
  const E = window.EMBER;
  const G_EARTH_BUOYANT_FLOW = 30; // cm/s, typical buoyancy-induced flow at a burning surface in 1 g

  /* ---------------- Flammability model ----------------
   * Physics-informed, deliberately simple and transparent:
   * 1. Effective flow at the flame = vector sum of ventilation and buoyant flow,
   *    u_b = 30 cm/s × (g/g0)^(1/3) (buoyant velocity scaling).
   * 2. Limiting O2 vs effective flow is U-shaped (quenching at low flow, blow-off at
   *    high flow), as measured for thin solids in microgravity (BASS, SSCE, NASA GRC
   *    flammability boundary work). Its minimum sits a few points below the 1-g LOI.
   * 3. Lower pressure raises the limit slightly: +k·ln(101.3/P).
   * Calibrated so that at 1 g and 101.3 kPa the limit equals the material's LOI.
   */
  const PARAMS = {
    thin: { uOpt: 10, delta: 2.5, lowSteep: 3.0 },
    thick: { uOpt: 15, delta: 1.5, lowSteep: 2.4 },
    kPressure: 3.0,
  };

  function buoyantFlow(g) {
    return g <= 0 ? 0 : G_EARTH_BUOYANT_FLOW * Math.cbrt(g);
  }

  function limitingO2(material, uEff, p) {
    const prm = material.thin ? PARAMS.thin : PARAMS.thick;
    const u = Math.max(uEff, 0.3);
    const ref = Math.log(G_EARTH_BUOYANT_FLOW / prm.uOpt) ** 2;
    const A = prm.delta / ref; // so LOC(u=30)=LOI at 1 atm
    const x = Math.log(u / prm.uOpt);
    const steep = x < 0 ? prm.lowSteep : 1;
    const locMin = material.loi - prm.delta;
    const pTerm = PARAMS.kPressure * Math.log(101.3 / Math.max(p, 5));
    return Math.min(100, locMin + A * steep * x * x + pTerm);
  }

  function assess({ o2, p, g, vent, materialId }) {
    const material = E.MATERIALS.find((m) => m.id === materialId) || E.MATERIALS[0];
    const ub = buoyantFlow(g);
    const uEff = Math.sqrt(vent * vent + ub * ub);
    const loc = limitingO2(material, uEff, p);
    const loc1g = limitingO2(material, Math.sqrt(vent * vent + G_EARTH_BUOYANT_FLOW ** 2), 101.3);
    const margin = o2 - loc;
    const ppO2 = (o2 / 100) * p;
    let state, cls, text;
    if (margin < -3) { state = "Self-extinguishing"; cls = 0; text = "Oxygen is well below the estimated limit for this flow. A flame is not expected to spread."; }
    else if (margin < 0) { state = "Near the limit"; cls = 1; text = "Within 3 points of the estimated limit. Small changes in flow or oxygen can make it burn."; }
    else if (margin < 6) { state = "Flammable"; cls = 2; text = "Oxygen is above the estimated limit. A flame can spread over this material."; }
    else { state = "Highly flammable"; cls = 3; text = "Oxygen is far above the estimated limit. Expect fast flame spread."; }
    // relative spread index: opposed-flow spread grows roughly with O2 excess and ppO2
    const spreadIdx = margin <= 0 ? 0 : Math.min(10, (margin / 10) * Math.sqrt(ppO2 / 21.3) * 4);
    const coverage = evidenceCoverage({ o2, p, g, material });
    // 0..100 risk gauge
    const gauge = Math.max(0, Math.min(100, 50 + margin * 5));
    return { material, ub, uEff, loc, loc1g, margin, ppO2, state, cls, text, spreadIdx, coverage, gauge };
  }

  function curve(material, p, maxU = 60) {
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const u = 0.5 * Math.pow(maxU / 0.5, i / 120);
      pts.push([u, limitingO2(material, u, p)]);
    }
    return pts;
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
    let level, note;
    if (inside.length >= 2) { level = "High"; note = `${inside.length} solid-fuel investigations tested this O2 / pressure.`; }
    else if (inside.length === 1) { level = "Medium"; note = `Only ${inside[0].inv.name} tested this O2 / pressure.`; }
    else if (near[0] && near[0].d < 0.6) { level = "Low"; note = `Closest data: ${near[0].inv.name}. This point is an extrapolation.`; }
    else { level = "Very low"; note = "No solid-fuel flight data near this atmosphere."; }
    const flags = [];
    if (g > 0 && g < 1) {
      const order = ["High", "Medium", "Low", "Very low"];
      level = order[Math.min(3, order.indexOf(level) + 1)];
      note += " Gravity differs from the flight data, so confidence is reduced one level.";
    }
    if (g > 0 && g < 1) flags.push("No partial-gravity flight data exists in PSI. Lunar and Mars values are model extrapolations (FM2, FLARE planned).");
    if (o2 > 40) flags.push("Above 40% O2, only gas-flame data (CFI-G, up to 85%) exists; no solid-material flight data.");
    if (p < 50) flags.push("Below 50 kPa only SoFIE's chamber reaches this range.");
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
    if (parts.atmosphere > 0.85) bits.push(inv.planned ? `planned to cover ${sc.label.toLowerCase()} conditions` : `tested at ${sc.label.toLowerCase()} O2 / pressure`);
    else if (parts.atmosphere < 0.3) bits.push(`tested far from ${sc.o2}% O2 / ${sc.p} kPa`);
    if (parts.scale > 0.8) bits.push("spacecraft-scale fire");
    if (parts.data > 0.8) bits.push("large public dataset");
    if (inv.planned) bits.push("fills the partial-gravity gap");
    if (inv.category === "detection") bits.push("drives detector design");
    if (inv.id === "FLEX") bits.push("sets suppressant margins");
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
  function tokens(s) {
    return (s.toLowerCase().normalize("NFKD").match(/[a-z0-9][a-z0-9\-]*/g) || [])
      .map((t) => t.replace(/(ing|ed|es|s)$/, (m) => (t.length > 5 ? "" : m)))
      .filter((t) => !STOP.has(t) && t.length > 1);
  }
  function expand(q) {
    const t = tokens(q);
    const out = [...t];
    t.forEach((w) => (SYN[w] || []).forEach((s) => out.push(...tokens(s))));
    return out;
  }

  function buildChunks() {
    const chunks = [];
    E.INVESTIGATIONS.forEach((inv) => {
      const cond = `Conditions: O2 ${inv.o2[0]}–${inv.o2[1]}%, pressure ${inv.p[0]}–${inv.p[1]} kPa, flow ${inv.flow[0]}–${inv.flow[1]} cm/s.`;
      chunks.push({ id: `${inv.id}`, inv: inv.id, title: `${inv.name}: ${inv.full}`, text: `${inv.name} (${inv.full}), ${inv.years[0]}${inv.years[1] !== inv.years[0] ? "–" + inv.years[1] : ""}, ${inv.platform}. Objective: ${inv.objectives} Fuels: ${inv.fuels}. ${cond} Diagnostics: ${inv.sensors.join(", ")}.` });
      inv.findings.forEach((f, i) => chunks.push({ id: `${inv.id}#${i + 1}`, inv: inv.id, title: `${inv.name} finding ${i + 1}`, text: `${inv.name}: ${f}` }));
      ["prevention", "detection", "suppression"].forEach((k) => {
        if (inv.implications[k]) chunks.push({ id: `${inv.id}:${k}`, inv: inv.id, title: `${inv.name} · ${k}`, text: `${inv.name} fire-safety implication for ${k}: ${inv.implications[k]}` });
      });
    });
    E.INSIGHTS.forEach((s) => chunks.push({ id: `INSIGHT-${s.rank}`, inv: s.cites[0], title: s.title, text: `${s.title}. ${s.text} Action: ${s.action}` }));
    E.INCIDENTS.filter((x) => x.kind === "incident").forEach((x) => chunks.push({ id: `HIST-${x.year}`, title: `${x.year} ${x.title}`, text: `${x.year} ${x.title}: ${x.text}` }));
    E.GAPS.forEach((g, i) => chunks.push({ id: `GAP-${i + 1}`, inv: g.inv[0], title: `Research gap: ${g.title}`, text: `Research gap: ${g.title}. ${g.text}` }));
    E.SCENARIOS.forEach((s) => chunks.push({ id: `ATM-${s.id}`, title: `Atmosphere: ${s.label}`, text: `${s.label} atmosphere: ${s.o2}% O2 at ${s.p} kPa (${(s.p / 6.895).toFixed(1)} psia), gravity ${s.g} g. ${s.note}` }));
    E.SPINOFFS.forEach((s, i) => chunks.push({ id: `EARTH-${i + 1}`, title: `Earth benefit: ${s.title}`, text: `Earth benefit (${s.era}): ${s.title}. ${s.text}` }));
    E.PRIMER.forEach((p, i) => chunks.push({ id: `PHYS-${i + 1}`, title: p.title, text: `${p.title}. ${p.text}` }));
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

  E.model = { assess, curve, buoyantFlow, limitingO2, rank, DEFAULT_WEIGHTS, envDist, buildChunks, makeIndex, tokens, PARAMS };
})();
