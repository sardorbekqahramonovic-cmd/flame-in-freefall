/*
 * EMBER AI layer.
 * Online: retrieval-augmented answers from Claude through the /api/ask serverless
 * function (API key stays on the server).
 * Offline: a local reasoner that answers from the same retrieved evidence, runs the
 * flammability model and the mission ranker, and flags research gaps. Every claim
 * carries a citation chip back to its investigation.
 */
(function () {
  const E = window.EMBER;
  const API = (window.EMBER_CONFIG && window.EMBER_CONFIG.apiUrl) || "api/ask";
  let index = null;
  let online = null; // null = unknown, false, or { model }

  function getIndex() {
    if (!index) index = E.model.makeIndex(E.model.buildChunks());
    return index;
  }

  async function checkOnline() {
    if (online !== null) return online;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3500);
      const r = await fetch(API, { method: "GET", signal: ctrl.signal });
      clearTimeout(t);
      const j = r.ok ? await r.json() : null;
      online = j && j.ok ? { model: j.model } : false;
    } catch (e) {
      online = false;
    }
    return online;
  }

  /* ---------- parse physical conditions out of a question ---------- */
  function parseConditions(q, scenario) {
    const s = q.toLowerCase();
    const out = {};
    const o2m = s.match(/(\d{1,3}(?:\.\d+)?)\s*%\s*(?:o2|oxygen)?/);
    if (o2m) out.o2 = Math.min(100, parseFloat(o2m[1]));
    const psi = s.match(/(\d{1,2}(?:\.\d+)?)\s*psi/);
    const kpa = s.match(/(\d{1,3}(?:\.\d+)?)\s*kpa/);
    const atm = s.match(/(\d(?:\.\d+)?)\s*atm/);
    if (psi) out.p = parseFloat(psi[1]) * 6.895;
    else if (kpa) out.p = parseFloat(kpa[1]);
    else if (atm) out.p = parseFloat(atm[1]) * 101.3;
    if (/\b(moon|lunar)\b/.test(s)) out.g = 0.166;
    else if (/\bmars|martian\b/.test(s)) out.g = 0.378;
    else if (/\b(earth|1 ?g|normal gravity)\b/.test(s)) out.g = 1;
    else if (/\b(microgravity|orbit|iss|station|zero.?g|transit)\b/.test(s)) out.g = 0;
    const mat = E.MATERIALS.find((m) => {
      const key = m.label.toLowerCase();
      return [m.id, ...key.split(/[^a-z]+/).filter((w) => w.length > 4)].some((w) => new RegExp(`\\b${w}`).test(s));
    });
    if (mat) out.materialId = mat.id;
    const has = out.o2 !== undefined || out.materialId || out.p !== undefined;
    if (!has) return null;
    return {
      o2: out.o2 ?? scenario.o2,
      p: out.p ?? scenario.p,
      g: out.g ?? scenario.g,
      vent: scenario.vent,
      materialId: out.materialId || "nomex",
    };
  }

  function detectInvs(q) {
    const s = q.toLowerCase().replace(/[–]/g, "-");
    const found = [];
    // exact full names first (e.g. "bass-ii", "cfi-g", "flex-2")
    E.INVESTIGATIONS.forEach((i) => {
      const n = i.name.toLowerCase().split(/[\s/]+/)[0];
      if (n.includes("-") && s.includes(n)) found.push(i);
    });
    // then families by base token: first record of each family only
    const seen = new Set(found.map((i) => i.name.toLowerCase().split(/[\s/-]+/)[0]));
    E.INVESTIGATIONS.forEach((i) => {
      const base = i.name.toLowerCase().split(/[\s/-]+/)[0].replace(/[^a-z0-9]/g, "");
      if (seen.has(base)) return;
      if (new RegExp(`\\b${base}\\b`).test(s)) { found.push(i); seen.add(base); }
    });
    return found;
  }

  function gapFlags(q, cond) {
    const s = q.toLowerCase();
    const flags = [];
    if (/moon|lunar|mars|partial|reduced.?g/.test(s) || (cond && cond.g > 0 && cond.g < 1)) flags.push("No partial-gravity combustion data in PSI yet (FM2, FLARE planned).");
    if (/high.?oxygen|enriched|34%|30%|exploration atm|8\.2|10\.2/.test(s) || (cond && cond.o2 > 27)) flags.push("Solid-material flight data above 27% O2 is limited to Saffire IV–VI and SoFIE.");
    if (/battery|lithium|li-ion/.test(s)) flags.push("Battery thermal runaway is not covered by PSI combustion investigations.");
    return flags;
  }

  function firstSentences(t, n = 2) {
    const parts = t.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
    return parts.slice(0, n).join(" ").trim();
  }
  function chunkLine(c) {
    const inv = c.inv && E.INVESTIGATIONS.find((i) => i.id === c.inv);
    if (inv && c.id === inv.id) return `${inv.name} set out to ${inv.objectives.charAt(0).toLowerCase() + inv.objectives.slice(1)}`;
    if (inv && c.id.includes(":")) { const k = c.id.split(":")[1]; return `**${k[0].toUpperCase() + k.slice(1)}:** ${inv.implications[k]}`; }
    if (inv && c.id.includes("#")) return firstSentences(c.text.replace(/^[^:]+:\s*/, ""), 2);
    return firstSentences(c.text, 2);
  }
  const rng = (a, u) => (a[0] === a[1] ? `${a[0]}${u}` : `${a[0]}–${a[1]}${u}`);

  /* re-weight hits toward the fire-safety layer the question is about */
  function topical(q, hits, cond) {
    const s = q.toLowerCase();
    const layer = /suppress|extinguish|put out|fight/.test(s) ? "suppress" : /detect|smoke|alarm|sensor/.test(s) ? "detect" : /prevent|material|select|flammab/.test(s) ? "prevent" : null;
    return hits
      .filter((h) => !(cond && h.c.id.startsWith("ATM")))
      .map((h) => {
        let w = h.s;
        if (layer && (h.c.id.includes(":" + layer) || h.c.text.toLowerCase().includes(layer))) w *= 1.8;
        return { c: h.c, s: w };
      })
      .sort((a, b) => b.s - a.s);
  }
  function overlap(a, b) {
    const A = new Set(a.toLowerCase().match(/[a-z0-9]{4,}/g) || []), B = new Set(b.toLowerCase().match(/[a-z0-9]{4,}/g) || []);
    let n = 0; A.forEach((w) => B.has(w) && n++);
    return n / Math.max(1, Math.min(A.size, B.size));
  }

  /* ---------- offline reasoner ---------- */
  function offlineAnswer(q, scenario) {
    const idx = getIndex();
    const cond = parseConditions(q, scenario);
    const hits = topical(q, idx.search(q, 14), cond).slice(0, 8);
    const invs = detectInvs(q);
    const s = q.toLowerCase();
    const lines = [];
    const cites = new Set();

    const wantsCompare = invs.length >= 2 && /compar|differ|vs|versus|between|similar/.test(s);
    const wantsRank = /rank|most relevant|which (investigation|experiment|study)|top \d|prioriti|most important/.test(s);

    if (wantsCompare) {
      lines.push(`**Comparison of ${invs.map((i) => i.name).join(", ")}**`);
      invs.slice(0, 3).forEach((i) => {
        lines.push(`- **${i.name}** (${i.years[0]}${i.years[1] !== i.years[0] ? "–" + i.years[1] : ""}, ${E.CATEGORIES[i.category].label.toLowerCase()}): ${i.fuels.split(";")[0]}. O2 ${rng(i.o2, "%")}, ${rng(i.p, " kPa")}, flow ${rng(i.flow, " cm/s")}. Key result: ${i.findings[0]} [${i.id}]`);
        cites.add(i.id);
      });
      const shared = invs.every((i) => i.platform.includes("CIR")) ? "They share the Combustion Integrated Rack." : invs.every((i) => i.platform.includes("MSG")) ? "They share the Microgravity Science Glovebox." : "They used different flight hardware.";
      lines.push(shared);
    } else if (wantsRank) {
      const r = E.model.rank(scenario);
      lines.push(`**Most relevant investigations for ${scenario.label}** (${scenario.o2}% O2, ${scenario.p} kPa, ${scenario.g} g):`);
      r.slice(0, 5).forEach((x, n) => {
        lines.push(`- ${n + 1}. **${x.inv.name}**, score ${x.score.toFixed(0)}/100: ${x.why}. [${x.inv.id}]`);
        cites.add(x.inv.id);
      });
      lines.push("Scores combine atmosphere match, hazard relevance, fire scale, data richness and recency. Adjust the weights in the Mission Ranker.");
    }

    if (cond) {
      const a = E.model.assess(cond);
      lines.push(`**Model estimate for ${a.material.label}** at ${cond.o2}% O2, ${cond.p.toFixed(1)} kPa (${(cond.p / 6.895).toFixed(1)} psia), ${cond.g} g:`);
      lines.push(`- Estimated limiting O2: **${a.loc.toFixed(1)}%** (at 1 g sea level: ${a.loc1g.toFixed(1)}%). Margin: ${a.margin >= 0 ? "+" : ""}${a.margin.toFixed(1)} points → **${a.state}**.`);
      lines.push(`- Effective flow at the flame ≈ ${a.uEff.toFixed(1)} cm/s (ventilation ${cond.vent} cm/s, buoyant ${a.ub.toFixed(1)} cm/s). Evidence coverage: ${a.coverage.level}. ${a.coverage.note}`);
      a.coverage.near.slice(0, 2).forEach((n) => cites.add(n.inv.id));
    }

    if (!wantsCompare && !wantsRank) {
      const used = hits.filter((h) => h.c.inv || h.c.id.startsWith("PHYS") || h.c.id.startsWith("HIST") || h.c.id.startsWith("GAP") || h.c.id.startsWith("ATM") || h.c.id.startsWith("EARTH")).slice(0, cond ? 3 : 5);
      if (used.length) {
        if (!cond) lines.push("**What the NASA record shows:**");
        const perInv = {}, said = [];
        used.forEach((h) => {
          const k = h.c.inv || h.c.id;
          const line = chunkLine(h.c);
          if ((perInv[k] || 0) >= 3 || said.some((x) => overlap(x, line) > 0.6)) return;
          perInv[k] = (perInv[k] || 0) + 1; said.push(line);
          lines.push(`- ${line} [${k}]`);
          if (h.c.inv) cites.add(h.c.inv);
        });
      } else if (!cond) {
        lines.push("I could not find this topic in the curated NASA combustion record. Try naming an investigation (BASS, FLEX, Saffire, SAME, ACME), a material, or a hazard such as smoke, suppression or oxygen.");
      }
      const tag = /suppress|extinguish/.test(s) ? "suppression" : /detect|smoke|alarm/.test(s) ? "detection" : null;
      const ins = (tag && E.INSIGHTS.find((x) => x.tags.includes(tag) && (x.cites.some((c) => cites.has(c)) || hits.some((h) => h.c.id === `INSIGHT-${x.rank}`)))) || (tag && E.INSIGHTS.find((x) => x.tags.includes(tag))) || E.INSIGHTS.find((x) => hits.some((h) => h.c.id === `INSIGHT-${x.rank}`));
      if (ins) lines.push(`**Recommended action:** ${ins.action}`);
    }

    const top = hits[0] ? hits[0].s : 0;
    const confidence = cond ? (E.model.assess(cond).coverage.level === "High" ? "Medium" : "Low (extrapolated)") : top > 7 && hits.length >= 4 ? "High" : top > 3.5 ? "Medium" : "Low";
    return { text: lines.join("\n"), cites: [...cites], confidence, gaps: gapFlags(q, cond), engine: "offline" };
  }

  /* ---------- online (Claude) ---------- */
  async function onlineAnswer(q, scenario, history) {
    const idx = getIndex();
    const cond = parseConditions(q, scenario);
    const hits = topical(q, idx.search(q, 16), cond).slice(0, 10);
    const contexts = hits.map((h) => ({ id: h.c.inv || h.c.id, title: h.c.title, text: h.c.text }));
    if (cond) {
      const a = E.model.assess(cond);
      contexts.unshift({ id: "MODEL", title: "EMBER flammability model output", text: `Material ${a.material.label} (1-g LOI ${a.material.loi}%), ${cond.o2}% O2, ${cond.p.toFixed(1)} kPa, gravity ${cond.g} g, ventilation ${cond.vent} cm/s. Estimated limiting O2 ${a.loc.toFixed(1)}%, margin ${a.margin.toFixed(1)} points, state "${a.state}". Effective flow ${a.uEff.toFixed(1)} cm/s. Evidence coverage ${a.coverage.level}: ${a.coverage.note} ${a.coverage.flags.join(" ")}` });
    }
    const r = await fetch(API, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question: q.slice(0, 1500),
        scenario: { label: scenario.label, o2: scenario.o2, p: scenario.p, g: scenario.g },
        contexts: contexts.slice(0, 12),
        history: history.slice(-6),
      }),
    });
    if (!r.ok) throw new Error(`AI service returned ${r.status}`);
    const j = await r.json();
    if (!j.answer) throw new Error(j.error || "Empty answer");
    const cites = [...new Set((j.answer.match(/\[([A-Za-z0-9\-#:]+)\]/g) || []).map((m) => m.slice(1, -1).split(/[#:]/)[0]))].filter((id) => E.INVESTIGATIONS.some((i) => i.id === id));
    return { text: j.answer, cites, confidence: j.confidence || (hits[0] && hits[0].s > 5 ? "High" : "Medium"), gaps: gapFlags(q, cond), engine: j.model || "claude" };
  }

  async function ask(q, scenario, history = []) {
    const on = await checkOnline();
    if (on) {
      try { return await onlineAnswer(q, scenario, history); }
      catch (e) { const res = offlineAnswer(q, scenario); res.notice = `Claude was unreachable (${e.message}); answered with the offline reasoner.`; return res; }
    }
    return offlineAnswer(q, scenario);
  }

  /* Short interpretation of one investigation for the current mission */
  async function interpret(inv, scenario) {
    const q = `Interpret ${inv.name} (${inv.full}) for a ${scenario.label} at ${scenario.o2}% O2 and ${scenario.p} kPa, gravity ${scenario.g} g. What does it mean for fire prevention, detection and suppression, and what are its limits?`;
    const on = await checkOnline();
    if (on) {
      try { return await onlineAnswer(q, scenario, []); } catch (e) { /* fall through */ }
    }
    const d = E.model.envDist(inv, scenario.o2, scenario.p);
    const match = d === 0 ? `It was tested inside the ${scenario.label.toLowerCase()} atmosphere (${scenario.o2}% O2, ${scenario.p} kPa), so its results apply directly.` : d < 0.6 ? `It was tested near, but not at, the ${scenario.label.toLowerCase()} atmosphere; results need modest extrapolation.` : `It was tested far from the ${scenario.label.toLowerCase()} atmosphere (${inv.o2[0]}–${inv.o2[1]}% O2, ${inv.p[0]}–${inv.p[1]} kPa vs ${scenario.o2}% / ${scenario.p} kPa); treat results as trends, not numbers.`;
    const lines = [
      `**${inv.name} for ${scenario.label}.** ${match}`,
      `- Key result: ${inv.findings[0]} [${inv.id}]`,
    ];
    ["prevention", "detection", "suppression"].forEach((k) => { if (inv.implications[k]) lines.push(`- ${k[0].toUpperCase() + k.slice(1)}: ${inv.implications[k]}`); });
    if (scenario.g > 0 && !inv.gravity) lines.push(`- Limit: flown in microgravity, while this mission runs at ${scenario.g} g. Partial-gravity behaviour is not yet measured.`);
    return { text: lines.join("\n"), cites: [inv.id], confidence: d === 0 ? "High" : d < 0.6 ? "Medium" : "Low", gaps: [], engine: "offline" };
  }

  E.ai = { ask, interpret, checkOnline, getIndex, parseConditions };
})();
