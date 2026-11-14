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
  const indexes = {}; // one retrieval index per interface language
  let online = null; // null = unknown, false, or { model }
  const t = (k, v) => E.t(k, v);
  const fmt = (v) => E.fmt(v);
  // lower-case and unify apostrophes (Uzbek o' / g' are typed many ways)
  const norm = (q) => q.toLowerCase().replace(/[ʻʼ’‘`]/g, "'").replace(/[–]/g, "-");

  function getIndex() {
    const k = E.lang || "en";
    if (!indexes[k]) indexes[k] = E.model.makeIndex(E.model.buildChunks());
    return indexes[k];
  }

  /* question patterns in English, Russian and Uzbek */
  const RX = {
    compare: /compar|differ|\bvs\b|versus|between|similar|сравн|разниц|отлич|между|taqqos|farq|solishtir/,
    rank: /rank|most relevant|which (investigation|experiment|study)|top \d|prioriti|most important|наиболее важн|самые важн|какие исследов|какие эксперимент|рейтинг|приоритет|eng muhim|qaysi tadqiqot|qaysi tajriba|reyting|ustuvor/,
    suppress: /suppress|extinguish|put out|fight|туш|подавл|o'chir|o'chg|söndir/,
    detect: /detect|smoke|alarm|sensor|обнаруж|дым|датчик|сигнализ|tutun|aniqla|datchik|sensor|signal/,
    prevent: /prevent|material|select|flammab|профилакт|предотвр|материал|горюч|oldini|material|yonuvchan/,
    moon: /\b(moon|lunar)\b|лун|\boy(da|dagi|ga|ning)?\b/,
    mars: /\bmars|martian\b|марс/,
    earth: /\b(earth|1 ?g|normal gravity)\b|на земле|обычной гравитац|oddiy gravitatsiya/,
    micro: /\b(microgravity|orbit|iss|station|zero.?g|transit)\b|микрогравит|невесом|орбит|мкс|mikrogravit|orbita|\bxks/,
    partial: /moon|lunar|mars|partial|reduced.?g|лун|марс|частичн|пониженн\w* гравит|\boy(da|dagi|ga)?\b|qisman/,
    highO2: /high.?oxygen|enriched|34%|30%|exploration atm|8[.,]2|10[.,]2|обогащ|высок\w* (содержан\w* )?кислор|yuqori kislorod|boyitilgan/,
    battery: /battery|lithium|li-ion|аккумул|батаре|лити|akkumul|batare|litiy/,
  };
  // material names and common words in the three languages (most specific first)
  const MAT_ALIAS = [
    ["nomex", ["nomex", "номекс"]], ["kapton", ["kapton", "каптон", "polyimide", "полиимид", "poliimid"]],
    ["ptfe", ["teflon", "ptfe", "тефлон"]], ["silicone", ["silicone", "силикон", "silikon"]],
    ["pc", ["polycarbonate", "lexan", "поликарбонат", "polikarbonat"]], ["pmma", ["pmma", "acrylic", "акрил", "akril", "plexiglas", "оргстекл"]],
    ["pe", ["polyethylene", "полиэтилен", "polietilen"]], ["paper", ["paper", "бумаг", "qog'oz", "cellulose", "целлюлоз", "tsellyuloza"]],
    ["sibal", ["sibal", "cotton", "fiberglass", "fabric", "хлоп", "ткан", "paxta", "mato"]],
  ];

  async function checkOnline() {
    if (online !== null) return online;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3500);
      const r = await fetch(API, { method: "GET", signal: ctrl.signal });
      clearTimeout(t);
      const j = r.ok ? await r.json() : null;
      online = j && j.ok ? { model: j.model, provider: j.provider || "anthropic" } : false;
    } catch (e) {
      online = false;
    }
    return online;
  }

  /* ---------- parse physical conditions out of a question ---------- */
  function parseConditions(q, scenario) {
    const s = norm(q);
    const out = {};
    const num = (x) => parseFloat(x.replace(",", "."));
    const o2m = s.match(/(\d{1,3}(?:[.,]\d+)?)\s*%/);
    if (o2m) out.o2 = Math.min(100, num(o2m[1]));
    const psi = s.match(/(\d{1,2}(?:[.,]\d+)?)\s*(?:psi|пси)/);
    const kpa = s.match(/(\d{1,3}(?:[.,]\d+)?)\s*(?:kpa|кпа)/);
    const atm = s.match(/(\d(?:[.,]\d+)?)\s*(?:atm|атм)/);
    if (psi) out.p = num(psi[1]) * 6.895;
    else if (kpa) out.p = num(kpa[1]);
    else if (atm) out.p = num(atm[1]) * 101.3;
    if (RX.moon.test(s)) out.g = 0.166;
    else if (RX.mars.test(s)) out.g = 0.378;
    else if (RX.earth.test(s)) out.g = 1;
    else if (RX.micro.test(s)) out.g = 0;
    const mat = MAT_ALIAS.find(([, words]) => words.some((w) => s.includes(w)));
    if (mat) out.materialId = mat[0];
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
    const s = norm(q);
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
    const s = norm(q);
    const flags = [];
    if (RX.partial.test(s) || (cond && cond.g > 0 && cond.g < 1)) flags.push(t("gapf.g"));
    if (RX.highO2.test(s) || (cond && cond.o2 > 27)) flags.push(t("gapf.o2"));
    if (RX.battery.test(s)) flags.push(t("gapf.bat"));
    return flags;
  }

  function firstSentences(t, n = 2) {
    const parts = t.split(/(?<=[.!?])\s+(?=[\p{Lu}0-9])/u);
    return parts.slice(0, n).join(" ").trim();
  }
  function chunkLine(c) {
    const inv = c.inv && E.INVESTIGATIONS.find((i) => i.id === c.inv);
    if (inv && c.id === inv.id) return t("ai.setOut", { name: inv.name, obj: /^\p{Lu}\p{Ll}/u.test(inv.objectives) ? inv.objectives.charAt(0).toLowerCase() + inv.objectives.slice(1) : inv.objectives });
    if (inv && c.id.includes(":")) { const k = c.id.split(":")[1]; return `**${t("layer." + k)}:** ${inv.implications[k]}`; }
    if (inv && c.id.includes("#")) return firstSentences(c.text.replace(/^[^:]+:\s*/, ""), 2);
    return firstSentences(c.text, 2);
  }
  const rng = (a, u) => (a[0] === a[1] ? `${fmt(a[0])}${u}` : `${fmt(a[0])}–${fmt(a[1])}${u}`);

  /* re-weight hits toward the fire-safety layer the question is about */
  function topical(q, hits, cond) {
    const s = norm(q);
    const layer = RX.suppress.test(s) ? "suppress" : RX.detect.test(s) ? "detect" : RX.prevent.test(s) ? "prevent" : null;
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
    const A = new Set(a.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) || []), B = new Set(b.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) || []);
    let n = 0; A.forEach((w) => B.has(w) && n++);
    return n / Math.max(1, Math.min(A.size, B.size));
  }

  /* ---------- emergency quick commands ("fire", "smoke") ----------
   * Answered locally and instantly, with no AI call, so they work offline and cost nothing. */
  const EM_RX = {
    fire: /\b(fire|flames?|burning)\b|пожар|огонь|горит|yong'in|olov|yonyapti/,
    smoke: /\bsmoke\b|дым|tutun/,
  };
  function emergency(q) {
    const s = norm(q).replace(/[!?.,]/g, " ").trim();
    if (!s || s.split(/\s+/).length > 4) return null; // only short commands, not questions about fire
    const kind = EM_RX.smoke.test(s) ? "smoke" : EM_RX.fire.test(s) ? "fire" : null;
    if (!kind) return null;
    const n = kind === "fire" ? 6 : 5;
    const lines = [t(`em.${kind}Title`)];
    for (let i = 1; i <= n; i++) lines.push(`- ${i}. ${t(`em.${kind}${i}`)}`);
    lines.push(t("em.note"));
    const cites = kind === "fire" ? ["SSCE", "ACME", "BASS", "FLEX", "CFI"] : ["SSCE", "SAME", "SAFFIRE-IV-VI"];
    return { text: lines.join("\n"), spoken: t(`em.${kind}Say`), cites, confidence: "", gaps: [], engine: "offline", emergency: kind };
  }
  const STOP_RX = /^(stop|be quiet|silence|стоп|хватит|тихо|замолчи|to'xta|bas|jim)(?![\p{L}'])/u;
  const isStop = (q) => STOP_RX.test(norm(q).replace(/[!?.,]/g, " ").trim());

  // text for speaking: no citations, markdown or list markers
  function speakable(text) {
    return String(text || "")
      .replace(/\[[^\]]+\]/g, "")
      .replace(/\*\*/g, "")
      .replace(/^\s*-\s*(\d+\.\s*)?/gm, "")
      .replace(/[≈~]/g, "")
      .replace(/\s+([.,;:])/g, "$1")
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  const firstSentence = (x) => firstSentences(speakable(x), 1);

  /* ---------- offline reasoner ---------- */
  function offlineAnswer(q, scenario) {
    const idx = getIndex();
    const cond = parseConditions(q, scenario);
    const hits = topical(q, idx.search(q, 14), cond).slice(0, 8);
    const invs = detectInvs(q);
    const s = norm(q);
    const lines = [];
    const cites = new Set();
    const spoken = []; // short voice version: key action or verdict first
    const n1 = (v) => E.num(v, 1);

    const wantsCompare = invs.length >= 2 && RX.compare.test(s);
    const wantsRank = RX.rank.test(s);

    if (wantsCompare) {
      lines.push(`**${t("ai.compare", { list: invs.map((i) => i.name).join(", ") })}**`);
      invs.slice(0, 3).forEach((i) => {
        lines.push("- " + t("ai.cmpLine", { name: i.name, years: `${i.years[0]}${i.years[1] !== i.years[0] ? "–" + i.years[1] : ""}`, cat: E.CATEGORIES[i.category].label.toLowerCase(), fuels: i.fuels.split(";")[0], o2: rng(i.o2, "%"), p: rng(i.p, " " + t("u.kpa")), flow: rng(i.flow, " " + t("u.cms")), f: i.findings[0] }) + ` [${i.id}]`);
        cites.add(i.id);
      });
      const shared = invs.every((i) => i.platform.includes("CIR")) ? t("ai.shareCIR") : invs.every((i) => i.platform.includes("MSG")) ? t("ai.shareMSG") : t("ai.shareNone");
      lines.push(shared);
      invs.slice(0, 2).forEach((i) => spoken.push(`${i.name}: ${firstSentence(i.findings[0])}`));
    } else if (wantsRank) {
      const r = E.model.rank(scenario);
      lines.push(t("ai.rankHead", { s: scenario.label, o2: fmt(scenario.o2), p: fmt(scenario.p), g: fmt(scenario.g) }));
      r.slice(0, 5).forEach((x, n) => {
        lines.push("- " + t("ai.rankLine", { n: n + 1, name: x.inv.name, sc: x.score.toFixed(0), why: x.why }) + ` [${x.inv.id}]`);
        cites.add(x.inv.id);
      });
      lines.push(t("ai.rankFoot"));
      spoken.push(t("sp.top", { s: scenario.label, list: r.slice(0, 3).map((x) => x.inv.name).join(", ") }));
    }

    if (cond) {
      const a = E.model.assess(cond);
      lines.push(t("ai.modelHead", { m: a.material.label, o2: fmt(cond.o2), p: n1(cond.p), psia: n1(cond.p / 6.895), g: fmt(cond.g) }));
      lines.push("- " + t("ai.model1", { loc: n1(a.loc), loc1: n1(a.loc1g), m: (a.margin >= 0 ? "+" : "") + n1(a.margin), st: a.state }));
      lines.push("- " + t("ai.model2", { u: n1(a.uEff), v: fmt(cond.vent), b: n1(a.ub), lv: t("lv." + a.coverage.level), note: a.coverage.note }));
      a.coverage.near.slice(0, 2).forEach((n) => cites.add(n.inv.id));
      spoken.unshift(t("sp.model", { m: a.material.label, st: a.state, loc: n1(a.loc), o2: fmt(cond.o2) }));
    }

    if (!wantsCompare && !wantsRank) {
      const used = hits.filter((h) => h.c.inv || h.c.id.startsWith("PHYS") || h.c.id.startsWith("HIST") || h.c.id.startsWith("GAP") || h.c.id.startsWith("ATM") || h.c.id.startsWith("EARTH")).slice(0, cond ? 3 : 5);
      if (used.length) {
        if (!cond) lines.push(t("ai.record"));
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
        lines.push(t("ai.notFound"));
      }
      const tag = RX.suppress.test(s) ? "suppression" : RX.detect.test(s) ? "detection" : null;
      const ins = (tag && E.INSIGHTS.find((x) => x.tags.includes(tag) && (x.cites.some((c) => cites.has(c)) || hits.some((h) => h.c.id === `INSIGHT-${x.rank}`)))) || (tag && E.INSIGHTS.find((x) => x.tags.includes(tag))) || E.INSIGHTS.find((x) => hits.some((h) => h.c.id === `INSIGHT-${x.rank}`));
      // voice: key action first; for a material question the yes/no verdict comes first, then the action
      if (ins) { lines.push(t("ai.action", { a: ins.action })); spoken.splice(cond ? 1 : 0, 0, t("sp.action", { a: ins.action })); }
      const firstEvidence = lines.find((l) => l.startsWith("- "));
      if (firstEvidence && spoken.length < 2) spoken.push(firstSentence(firstEvidence));
      if (!spoken.length && lines.length) spoken.push(firstSentence(lines[lines.length - 1]));
    }

    const top = hits[0] ? hits[0].s : 0;
    const confidence = cond ? (E.model.assess(cond).coverage.level === "High" ? "Medium" : "Low (extrapolated)") : top > 7 && hits.length >= 4 ? "High" : top > 3.5 ? "Medium" : "Low";
    return { text: lines.join("\n"), spoken: speakable(spoken.join(" ")).slice(0, 420), cites: [...cites], confidence, gaps: gapFlags(q, cond), engine: "offline" };
  }

  /* ---------- online (Claude) ---------- */
  async function onlineAnswer(q, scenario, history, mode) {
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
        lang: E.lang || "en",
        mode: mode === "voice" ? "voice" : "text",
      }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    if (!j.answer) throw new Error(j.error || "Empty answer");
    const cites = [...new Set((j.answer.match(/\[([A-Za-z0-9\-#:]+)\]/g) || []).map((m) => m.slice(1, -1).split(/[#:]/)[0]))].filter((id) => E.INVESTIGATIONS.some((i) => i.id === id));
    return { text: j.answer, spoken: speakable(j.answer).slice(0, 500), cites, confidence: j.confidence || (hits[0] && hits[0].s > 5 ? "High" : "Medium"), gaps: gapFlags(q, cond), engine: j.model || "ai", provider: j.provider || (online && online.provider) };
  }

  async function ask(q, scenario, history = [], opts = {}) {
    const em = emergency(q);
    if (em) return em;
    const on = await checkOnline();
    if (on) {
      try { return await onlineAnswer(q, scenario, history, opts.mode); }
      catch (e) { const res = offlineAnswer(q, scenario); res.notice = t("ask.unreachable", { e: e.message }); return res; }
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
    const label = E.lang === "en" ? scenario.label.toLowerCase() : scenario.label;
    const v = { s: label, o2: fmt(scenario.o2), p: fmt(scenario.p), io2: `${fmt(inv.o2[0])}–${fmt(inv.o2[1])}`, ip: `${fmt(inv.p[0])}–${fmt(inv.p[1])}` };
    const match = t(d === 0 ? "it.match0" : d < 0.6 ? "it.match1" : "it.match2", v);
    const lines = [
      t("it.head", { name: inv.name, s: scenario.label, m: match }),
      "- " + t("it.key", { f: inv.findings[0] }) + ` [${inv.id}]`,
    ];
    ["prevention", "detection", "suppression"].forEach((k) => { if (inv.implications[k]) lines.push(`- ${t("layer." + k)}: ${inv.implications[k]}`); });
    if (scenario.g > 0 && !inv.gravity) lines.push("- " + t("it.limit", { g: fmt(scenario.g) }));
    return { text: lines.join("\n"), cites: [inv.id], confidence: d === 0 ? "High" : d < 0.6 ? "Medium" : "Low", gaps: [], engine: "offline" };
  }

  const providerName = (p) => ((p || (online && online.provider)) === "openai" ? "OpenAI" : "Claude");
  E.ai = { ask, interpret, checkOnline, getIndex, parseConditions, emergency, isStop, speakable, providerName };
})();
