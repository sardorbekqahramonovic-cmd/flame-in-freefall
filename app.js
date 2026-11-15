/* VULKAN UI */
(function () {
  const E = window.VULKAN;
  const M = E.model;
  const t = (k, v) => E.t(k, v);
  const fmt = (v) => E.fmt(v);
  const n1 = (v) => E.num(v, 1);
  const KPA = () => " " + t("u.kpa"), CMS = () => " " + t("u.cms");
  const lv = (level) => t("lv." + level);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem("vulkan:" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("vulkan:" + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };
  const psia = (kpa) => n1(kpa / 6.895);
  const range = (a, approx, unit = "") => `${approx ? "≈" : ""}${a[0] === a[1] ? fmt(a[0]) : fmt(a[0]) + "–" + fmt(a[1])}${unit}`;
  const yearStr = (i) => `${i.approx && i.approx.years ? "≈" : ""}${i.years[0]}${i.years[1] !== i.years[0] ? "–" + i.years[1] : ""}`;
  const invById = (id) => E.INVESTIGATIONS.find((i) => i.id === id);
  const catPill = (c) => `<span class="pill" style="color:${E.CATEGORIES[c].color}">${esc(E.CATEGORIES[c].label)}</span>`;

  const state = {
    scenario: store.get("scenario", "lunar"),
    compare: [],
    atlas: { q: "", cats: [], sort: "relevance" },
    sim: null,
    weights: store.get("weights", { ...M.DEFAULT_WEIGHTS }),
    chat: [],
    mapCats: Object.keys(E.CATEGORIES),
    voiceMode: store.get("voiceMode", false), // read answers aloud, short answers
    wake: false, // "Hey VULKAN" hands-free listening (needs a click to start, never persisted)
  };
  const scenario = () => E.SCENARIOS.find((s) => s.id === state.scenario) || E.SCENARIOS[0];

  /* ---------------- tooltip ---------------- */
  const tip = $("#tooltip");
  function showTip(html, ev) {
    tip.innerHTML = html; tip.hidden = false;
    const x = Math.min(window.innerWidth - tip.offsetWidth - 12, ev.clientX + 14);
    const y = Math.min(window.innerHeight - tip.offsetHeight - 12, ev.clientY + 14);
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  const hideTip = () => (tip.hidden = true);

  /* ---------------- markdown-ish renderer with citation chips ---------------- */
  function renderAnswer(text, sources = []) {
    const src = new Map(sources.map((s) => [s.id, s]));
    const lines = esc(text).split(/\n+/);
    let html = "", inList = false;
    lines.forEach((ln) => {
      let l = ln.trim();
      if (!l) return;
      l = l.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\[([A-Za-z0-9\-#:]+)\]/g, (m, id) => {
          const base = id.split(/[#:]/)[0];
          if (invById(base)) return `<button class="cite" data-inv="${base}" type="button">${esc(invById(base).name)}</button>`;
          if (id === "GENERAL") return `<span class="cite general" title="${esc(t("cite.GENERALtip"))}">${esc(t("cite.GENERAL"))}</span>`;
          if (/^NTRS-\d+$/.test(id)) {
            const s = src.get(id), url = s ? s.url : `https://ntrs.nasa.gov/citations/${id.slice(5)}`;
            return `<a class="cite ntrs" href="${esc(url)}" target="_blank" rel="noopener" title="${esc(s ? s.title : id)}">${esc(t("cite.NTRS", { y: s && s.year ? s.year : "" }).trim())}</a>`;
          }
          if (/^RES-\d+$/.test(id)) return `<button class="cite model" type="button" data-goto="new-results">${esc(t("cite.RES"))}</button>`;
          if (/^MODEL(-[1-3])?$/.test(id) || /^MAT-[a-z]+$/.test(id)) {
            const goto = id === "MODEL-2" ? "validation" : id === "MODEL-3" ? "fm2" : "view-risk";
            const label = id.startsWith("MAT-") ? t("cite.MAT") : t("cite." + id.replace("-", ""));
            return `<button class="cite model" type="button" data-goto="${goto}"${id.startsWith("MAT-") ? ` data-mat="${id.slice(4)}"` : ""}>${esc(label)}</button>`;
          }
          const pre = id.split("-")[0];
          const kind = ["ATM", "GAP", "HIST", "PHYS", "INSIGHT", "EARTH"].includes(pre) ? t("cite." + pre) : id;
          return `<span class="cite" style="cursor:default">${esc(kind)}</span>`;
        });
      if (/^[-•]\s+/.test(l)) {
        if (!inList) { html += "<ul>"; inList = true; }
        html += `<li>${l.replace(/^[-•]\s+/, "")}</li>`;
      } else {
        if (inList) { html += "</ul>"; inList = false; }
        html += `<p>${l}</p>`;
      }
    });
    if (inList) html += "</ul>";
    return html;
  }
  document.addEventListener("click", (e) => {
    const c = e.target.closest(".cite[data-inv]");
    if (c) openDrawer(c.dataset.inv);
    const g = e.target.closest(".cite[data-goto]");
    if (g) {
      const mat = g.dataset.mat;
      if (mat && E.MATERIALS.some((m) => m.id === mat)) { store.set("material", mat); if (state.sim) state.sim.materialId = mat; }
      $("#drawer-root").innerHTML = "";
      // Jump without animation: Chrome can drop a smooth scroll that starts right after a view switch.
      const go = () => {
        const el = document.getElementById(g.dataset.goto);
        if (!el) return;
        el.scrollIntoView({ block: "start" });
        if (el.classList.contains("panel")) { el.classList.remove("jump-flash"); void el.offsetWidth; el.classList.add("jump-flash"); setTimeout(() => el.classList.remove("jump-flash"), 1800); }
      };
      if (location.hash !== "#risk") { window.addEventListener("hashchange", () => setTimeout(go, 30), { once: true }); location.hash = "risk"; } else { render("risk"); go(); }
    }
  });

  /* ---------------- top bar ---------------- */
  function fillScenarios() {
    const sel = $("#scenario");
    sel.innerHTML = E.SCENARIOS.map((s) => `<option value="${s.id}">${esc(s.label)}</option>`).join("");
    sel.value = state.scenario;
  }
  // static texts in index.html carry data-i18n (text), data-i18n-html (markup) or data-i18n-aria
  function applyStatic() {
    $$("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    $$("[data-i18n-html]").forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
    $$("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    $$("#lang-switch [data-lang]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === E.lang ? "true" : "false"));
  }
  function setLanguage(lang) {
    if (lang === E.lang) return;
    E.setLang(lang);
    // views that keep their own DOM are rebuilt; the chat restarts in the new language
    state.chat = [];
    if (E.voice) { E.voice.stopWake(); E.voice.stopSpeaking(); state.wake = false; }
    ["#view-atlas", "#view-ask"].forEach((sel) => delete $(sel).dataset.init);
    $("#drawer-root").innerHTML = "";
    fillScenarios();
    applyStatic();
    refreshAll();
  }
  function initTop() {
    const sel = $("#scenario");
    fillScenarios();
    sel.addEventListener("change", () => { state.scenario = sel.value; store.set("scenario", sel.value); state.sim = null; refreshAll(); });
    $$("#lang-switch [data-lang]").forEach((b) => b.addEventListener("click", () => setLanguage(b.dataset.lang)));
    applyStatic();
    $("#theme-btn").addEventListener("click", () => {
      const root = document.documentElement;
      const cur = root.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
      root.dataset.theme = cur === "dark" ? "light" : "dark";
      store.set("theme", root.dataset.theme);
      refreshAll();
    });
    const th = store.get("theme", null);
    if (th) document.documentElement.dataset.theme = th;
    $$(".tab").forEach((b) => b.addEventListener("click", () => { location.hash = b.dataset.view; }));
    window.addEventListener("hashchange", route);
  }
  function updateChip() {
    const s = scenario();
    $("#atm-chip").textContent = `${fmt(s.o2)}% O₂ · ${fmt(s.p)}${KPA()} (${psia(s.p)} psia) · ${s.g === 0 ? "µg" : fmt(s.g) + " g"}`;
    $("#atm-chip").title = `${s.note} ${t("top.source")}: ${s.src}`;
  }
  const VIEWS = ["overview", "atlas", "map", "risk", "rank", "ask", "gaps"];
  function route() {
    const v = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "overview";
    $$(".view").forEach((s) => (s.hidden = s.dataset.view !== v));
    $$(".tab").forEach((b) => b.setAttribute("aria-selected", b.dataset.view === v ? "true" : "false"));
    render(v);
    if (window.scrollY > 120) window.scrollTo({ top: 0 });
  }
  const rendered = {};
  function render(v) {
    ({ overview: renderOverview, atlas: renderAtlas, map: renderMap, risk: renderRisk, rank: renderRank, ask: renderAsk, gaps: renderGaps })[v]();
    rendered[v] = true;
  }
  function refreshAll() {
    updateChip();
    const v = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "overview";
    render(v);
  }

  /* ---------------- flames (hero) ---------------- */
  function drawFlame(canvas, micro) {
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth || 260, H = canvas.clientHeight || 170;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let t = 0;
    function frame() {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, base = H * 0.72;
      // wick
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--muted");
      ctx.fillRect(cx - 1.5, base - 4, 3, 22);
      if (micro) {
        const r = 34 + Math.sin(t / 30) * 1.5;
        const cy = base - 6;
        const g = ctx.createRadialGradient(cx, cy, r * 0.35, cx, cy, r);
        g.addColorStop(0, "rgba(40,90,255,0)");
        g.addColorStop(0.72, "rgba(70,140,255,0.55)");
        g.addColorStop(0.9, "rgba(120,190,255,0.35)");
        g.addColorStop(1, "rgba(120,190,255,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      } else {
        const h = 92 + Math.sin(t / 7) * 5, w = 22 + Math.sin(t / 11) * 1.5;
        const sway = Math.sin(t / 13) * 2;
        const g = ctx.createLinearGradient(0, base, 0, base - h);
        g.addColorStop(0, "rgba(70,120,255,0.9)");
        g.addColorStop(0.15, "rgba(255,200,90,0.95)");
        g.addColorStop(0.7, "rgba(255,140,40,0.85)");
        g.addColorStop(1, "rgba(255,90,20,0)");
        ctx.fillStyle = g; ctx.beginPath();
        ctx.moveTo(cx, base + 4);
        ctx.bezierCurveTo(cx - w * 1.2, base - h * 0.15, cx - w * 0.5 + sway, base - h * 0.6, cx + sway * 2, base - h);
        ctx.bezierCurveTo(cx + w * 0.5 + sway, base - h * 0.6, cx + w * 1.2, base - h * 0.15, cx, base + 4);
        ctx.fill();
      }
      t++;
      if (!reduce && document.body.contains(canvas)) requestAnimationFrame(frame);
    }
    frame();
  }

  /* ---------------- overview ---------------- */
  function renderOverview() {
    const s = scenario();
    const flown = E.INVESTIGATIONS.filter((i) => !i.planned);
    const tests = flown.reduce((a, i) => a + (i.tests || 0), 0);
    const yrs = [Math.min(...flown.map((i) => i.years[0])), Math.max(...flown.map((i) => i.years[1]))];
    const top = M.rank(s).slice(0, 3);
    const cats = Object.keys(E.CATEGORIES).map((c) => ({ c, n: E.INVESTIGATIONS.filter((i) => i.category === c).length }));
    const maxN = Math.max(...cats.map((c) => c.n));
    $("#view-overview").innerHTML = `
      <div class="hero">
        <div>
          <div class="eyebrow">${t("ov.eyebrow")}</div>
          <h1 style="margin-top:10px">${t("ov.h1")}</h1>
          <p class="lede">${t("ov.lede", { n: E.INVESTIGATIONS.length })}</p>
          <div class="hero-actions">
            <a class="btn primary" href="#risk">${t("ov.btnRisk", { s: esc(s.label) })}</a>
            <a class="btn" href="#ask">${t("ov.btnAsk")}</a>
          </div>
        </div>
        <div class="flame-compare">
          <div class="flame-card"><canvas id="flame-1g" aria-label="${esc(t("ov.flame1Aria"))}"></canvas><div class="cap">${t("ov.flame1")}</div></div>
          <div class="flame-card"><canvas id="flame-ug" aria-label="${esc(t("ov.flame2Aria"))}"></canvas><div class="cap">${t("ov.flame2")}</div></div>
        </div>
      </div>
      ${gapLine()}
      <section class="steps" aria-labelledby="steps-h">
        <h2 class="sr-only" id="steps-h">${t("ov.stepsTitle")}</h2>
        <button type="button" class="step" data-step="mission"><span class="step-n">1</span><span><b>${t("ov.s1t")}</b><span>${t("ov.s1d")}</span></span></button>
        <a class="step" href="#risk"><span class="step-n">2</span><span><b>${t("ov.s2t")}</b><span>${t("ov.s2d")}</span></span></a>
        <a class="step" href="#ask"><span class="step-n">3</span><span><b>${t("ov.s3t")}</b><span>${t("ov.s3d")}</span></span></a>
      </section>
      <div class="grid g4">
        <div class="panel kpi"><span class="v num">${E.INVESTIGATIONS.length}</span><span class="l">${t("ov.kpi1", { f: flown.length, p: E.INVESTIGATIONS.length - flown.length })}</span></div>
        <div class="panel kpi"><span class="v num">${yrs[0]}–${yrs[1]}</span><span class="l">${t("ov.kpi2")}</span></div>
        <div class="panel kpi"><span class="v num">≈${E.int(Math.round(tests / 50) * 50)}</span><span class="l">${t("ov.kpi3")}</span></div>
        <div class="panel kpi"><span class="v num">10–85%</span><span class="l">${t("ov.kpi4")}</span></div>
      </div>
      <div class="split">
        <div class="panel">
          <div class="panel-title"><h2>${t("ov.insights")}</h2><span class="eyebrow">${t("ov.rankedBy")}</span></div>
          <div class="insights">${E.INSIGHTS.map(insightCard).join("")}</div>
        </div>
        <div class="grid" style="align-content:start">
          <div class="panel">
            <div class="panel-title"><h3>${t("ov.mostRel", { s: esc(s.label) })}</h3><a href="#rank" class="eyebrow">${t("ov.rankerLink")}</a></div>
            ${top.map((x, n) => `<div class="rank-row" style="grid-template-columns:28px minmax(0,1fr) 48px"><span class="n">${n + 1}</span><div><button class="cite" data-inv="${x.inv.id}" type="button">${esc(x.inv.name)}</button> <span class="why">${esc(x.why)}</span></div><span class="score">${x.score.toFixed(0)}</span></div>`).join("")}
          </div>
          <div class="panel">
            <div class="panel-title"><h3>${t("ov.evidence")}</h3><span class="eyebrow">${t("ov.byType")}</span></div>
            ${cats.map((c) => `<div style="display:grid;grid-template-columns:150px minmax(0,1fr) 24px;gap:10px;align-items:center;margin:6px 0"><span style="font-size:.85rem">${esc(E.CATEGORIES[c.c].label)}</span><div class="bar"><span style="width:${(c.n / maxN) * 100}%;background:${E.CATEGORIES[c.c].color}"></span></div><span class="num" style="text-align:right">${c.n}</span></div>`).join("")}
            <p class="note" style="margin-top:10px">${t("ov.evNote")}</p>
          </div>
          <div class="panel">
            <div class="panel-title"><h3>${t("ov.timeline")}</h3></div>
            <div class="timeline">${E.INCIDENTS.map((x) => `<div class="tl-item ${x.kind}"><span class="tl-year">${x.year}</span><div><strong>${esc(x.title)}</strong><p class="muted" style="font-size:.88rem">${esc(x.text)} ${x.inv ? `<button class="cite" data-inv="${x.inv}" type="button">${esc(invById(x.inv).name)}</button>` : x.link ? `<a href="${x.link.url}" target="_blank" rel="noopener">${t("ov.source")}</a>` : ""}</p></div></div>`).join("")}</div>
          </div>
        </div>
      </div>`;
    const stepM = $("#view-overview [data-step=mission]");
    if (stepM) stepM.addEventListener("click", () => { window.scrollTo({ top: 0, behavior: "smooth" }); const sel = $("#scenario"); sel.focus(); if (sel.showPicker) { try { sel.showPicker(); } catch (e) { /* not allowed without a gesture */ } } });
    drawFlame($("#flame-1g"), false);
    drawFlame($("#flame-ug"), true);
  }
  /* The evidence gap in one line: which solid-fuel flight investigations tested which air. */
  function evidenceGap() {
    const solids = E.INVESTIGATIONS.filter((i) => i.category === "solid" && !i.planned);
    const covers = (i, o2, p) => o2 >= i.o2[0] && o2 <= i.o2[1] && p >= i.p[0] && p <= i.p[1];
    const ref = (id) => E.REF_ATMOS.find((r) => r.id === id);
    const sea = ref("sea"), moon = ref("lunar"), ea = ref("ea");
    return {
      solids,
      iss: solids.filter((i) => covers(i, sea.o2, sea.p)),
      moon: solids.filter((i) => covers(i, moon.o2, moon.p) && covers(i, ea.o2, ea.p)),
      gravity: solids.filter((i) => i.gravity),
    };
  }
  function gapLine() {
    const g = evidenceGap(), n = g.solids.length;
    return `<section class="panel gapline" aria-labelledby="gapline-h">
        <h2 class="eyebrow" id="gapline-h">${t("gl.title")}</h2>
        <div class="gapline-row">
          <div class="gl"><span class="gl-n num">${g.iss.length}<small>/${n}</small></span><span class="gl-l">${t("gl.iss")}</span></div>
          <div class="gl warn"><span class="gl-n num">${g.moon.length}<small>/${n}</small></span><span class="gl-l">${t("gl.moon")}</span></div>
          <div class="gl hot"><span class="gl-n num">${g.gravity.length}<small>/${n}</small></span><span class="gl-l">${t("gl.grav")}</span></div>
        </div>
        <p class="note">${t("gl.note", { n, names: g.solids.map((i) => esc(i.name)).join(", ") })} <a href="#map">${t("gl.map")}</a></p>
      </section>`;
  }
  function insightCard(s) {
    return `<article class="insight"><div class="rank">${s.rank}</div><div><h3>${esc(s.title)}</h3><p style="font-size:.92rem">${esc(s.text)}</p><p style="font-size:.88rem;margin-top:6px"><strong>${t("ov.action")}</strong> ${esc(s.action)}</p><div class="meta">${s.tags.map((g) => `<span class="pill ${g === "gap" ? "warn" : g === "suppression" ? "ember" : "flame"}">${esc(t("tag." + g))}</span>`).join("")}${s.cites.map((c) => `<button class="cite" data-inv="${c}" type="button">${esc(invById(c).name)}</button>`).join("")}</div></div></article>`;
  }

  /* ---------------- atlas ---------------- */
  function renderAtlas() {
    const v = $("#view-atlas");
    if (!v.dataset.init) {
      v.dataset.init = "1";
      v.innerHTML = `
        <div class="view-head"><div><h2>${t("at.title")}</h2><p>${t("at.desc")}</p></div></div>
        <div class="panel grid" style="gap:12px">
          <div class="toolbar">
            <input type="search" id="atlas-q" placeholder="${esc(t("at.search"))}" aria-label="${esc(t("at.searchAria"))}" value="${esc(state.atlas.q)}">
            <select id="atlas-sort" aria-label="${esc(t("at.sortAria"))}">${[["relevance", "at.sortRel"], ["year", "at.sortYear"], ["o2", "at.sortO2"], ["name", "at.sortName"]].map(([v, k]) => `<option value="${v}" ${state.atlas.sort === v ? "selected" : ""}>${t(k)}</option>`).join("")}</select>
          </div>
          <div class="chips" id="atlas-cats">${Object.entries(E.CATEGORIES).map(([k, c]) => `<button class="chip" data-cat="${k}" aria-pressed="${state.atlas.cats.includes(k)}" type="button">${esc(c.label)}</button>`).join("")}</div>
        </div>
        <div class="cards" id="atlas-cards"></div>
        <div id="compare-bar"></div>`;
      $("#atlas-q").addEventListener("input", (e) => { state.atlas.q = e.target.value; drawCards(); });
      $("#atlas-sort").addEventListener("change", (e) => { state.atlas.sort = e.target.value; drawCards(); });
      $$("#atlas-cats .chip").forEach((b) => b.addEventListener("click", () => {
        const k = b.dataset.cat, i = state.atlas.cats.indexOf(k);
        i >= 0 ? state.atlas.cats.splice(i, 1) : state.atlas.cats.push(k);
        b.setAttribute("aria-pressed", i >= 0 ? "false" : "true");
        drawCards();
      }));
    }
    drawCards();
  }
  function drawCards() {
    const q = state.atlas.q.trim().toLowerCase();
    const ranks = Object.fromEntries(M.rank(scenario()).map((r) => [r.inv.id, r.score]));
    let list = E.INVESTIGATIONS.filter((i) => (!state.atlas.cats.length || state.atlas.cats.includes(i.category)));
    if (q) {
      const terms = q.split(/\s+/);
      const hayOf = (i) => [i.name, i.full, i.fuels, i.objectives, i.findings.join(" "), i.sensors.join(" "), i.team, i.platform, i.diluents].join(" ");
      // search the shown language and the English record, so "smoke" and "дым" both work
      list = list.filter((i) => { const hay = (hayOf(i) + " " + hayOf(E.origInv(i.id) || i)).toLowerCase().replace(/[ʻʼ’‘`]/g, "'"); return terms.every((w) => hay.includes(w.replace(/[ʻʼ’‘`]/g, "'"))); });
    }
    const sorters = { relevance: (a, b) => ranks[b.id] - ranks[a.id], year: (a, b) => b.years[1] - a.years[1], o2: (a, b) => b.o2[1] - a.o2[1], name: (a, b) => a.name.localeCompare(b.name) };
    list.sort(sorters[state.atlas.sort]);
    $("#atlas-cards").innerHTML = list.length ? list.map((i) => `
      <article class="inv-card" data-inv="${i.id}" tabindex="0" role="button" aria-label="${esc(t("at.open", { name: i.name }))}">
        <div class="top"><div><div class="acr">${esc(i.name)}</div><div class="full">${esc(i.full)}</div></div><span class="num" title="${esc(t("at.relTitle"))}" style="font-weight:700;color:var(--flame)">${ranks[i.id].toFixed(0)}</span></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${catPill(i.category)}<span class="pill">${yearStr(i)}</span>${i.planned ? `<span class="pill warn">${t("at.planned")}</span>` : ""}</div>
        <p style="font-size:.88rem">${esc(i.findings[0])}</p>
        <div class="cond"><div><div class="k">O₂</div><div class="v">${range(i.o2, i.approx && i.approx.o2, "%")}</div></div><div><div class="k">${t("at.pressure")}</div><div class="v">${range(i.p, i.approx && i.approx.p)}${KPA()}</div></div><div><div class="k">${t("at.flow")}</div><div class="v">${range(i.flow, i.approx && i.approx.flow)}${CMS()}</div></div></div>
        <label class="cmp-toggle" onclick="event.stopPropagation()"><input type="checkbox" data-cmp="${i.id}" ${state.compare.includes(i.id) ? "checked" : ""}> ${t("at.compare")}</label>
      </article>`).join("") : `<div class="panel muted">${esc(t("at.noMatch", { q }))}</div>`;
    $$("#atlas-cards .inv-card").forEach((c) => {
      c.addEventListener("click", () => openDrawer(c.dataset.inv));
      c.addEventListener("keydown", (e) => { if (e.key === "Enter") openDrawer(c.dataset.inv); });
    });
    $$("#atlas-cards [data-cmp]").forEach((cb) => cb.addEventListener("change", () => {
      const id = cb.dataset.cmp;
      if (cb.checked) { if (state.compare.length >= 3) { cb.checked = false; return; } state.compare.push(id); }
      else state.compare = state.compare.filter((x) => x !== id);
      drawCompareBar();
    }));
    drawCompareBar();
  }
  function drawCompareBar() {
    const bar = $("#compare-bar");
    if (!bar) return;
    bar.innerHTML = state.compare.length ? `<div class="compare-bar"><strong>${t("at.selected", { n: state.compare.length })}</strong> ${state.compare.map((id) => esc(invById(id).name)).join(", ")}<span style="margin-left:auto;display:flex;gap:8px"><button class="btn" id="cmp-clear" type="button">${t("at.clear")}</button><button class="btn primary" id="cmp-go" type="button" ${state.compare.length < 2 ? "disabled" : ""}>${t("at.compare")}</button></span></div>` : "";
    if (state.compare.length) {
      $("#cmp-clear").onclick = () => { state.compare = []; drawCards(); };
      $("#cmp-go").onclick = openCompare;
    }
  }
  function openCompare() {
    const invs = state.compare.map(invById);
    const rows = [
      [t("cmp.type"), (i) => E.CATEGORIES[i.category].label],
      [t("cmp.years"), yearStr],
      [t("dr.platform"), (i) => i.platform],
      [t("dr.fuels"), (i) => i.fuels],
      ["O₂ (%)", (i) => range(i.o2, i.approx && i.approx.o2)],
      [`${t("at.pressure")} (${t("u.kpa")})`, (i) => range(i.p, i.approx && i.approx.p)],
      [`${t("at.flow")} (${t("u.cms")})`, (i) => range(i.flow, i.approx && i.approx.flow)],
      [t("dr.diluents"), (i) => i.diluents],
      [t("dr.diagnostics"), (i) => i.sensors.join(", ")],
      [t("cmp.largest"), (i) => (i.scaleCm ? fmt(i.scaleCm) + " " + t("u.cm") : "—")],
      [t("cmp.keyFinding"), (i) => i.findings[0]],
      [t("layer.prevention"), (i) => i.implications.prevention || "—"],
      [t("layer.detection"), (i) => i.implications.detection || "—"],
      [t("layer.suppression"), (i) => i.implications.suppression || "—"],
    ];
    const s = scenario();
    const same = [], diff = [];
    // compare on the English record so translated wording does not count as a difference
    const fields = { platform: t("cmp.hardware"), category: t("cmp.fireType") };
    Object.entries(fields).forEach(([k, label]) => (new Set(invs.map((x) => { const i = E.origInv(x.id) || x; return k === "platform" ? i.platform.split("·")[1] || i.platform : i[k]; })).size === 1 ? same : diff).push(label));
    const o2Overlap = Math.max(...invs.map((i) => i.o2[0])) <= Math.min(...invs.map((i) => i.o2[1]));
    (o2Overlap ? same : diff).push(t("cmp.o2range"));
    showDrawer(`
      <h2>${t("cmp.title")}</h2>
      <p class="muted">${t("cmp.shared")}: ${same.join(", ") || t("cmp.none")} · ${t("cmp.different")}: ${diff.join(", ") || t("cmp.none")}.</p>
      <div class="table-wrap"><table><thead><tr><th></th>${invs.map((i) => `<th>${esc(i.name)}</th>`).join("")}</tr></thead><tbody>
      ${rows.map(([k, f]) => `<tr><th scope="row">${k}</th>${invs.map((i) => `<td>${esc(f(i))}</td>`).join("")}</tr>`).join("")}
      <tr><th scope="row">${t("cmp.relevance", { s: esc(s.label) })}</th>${invs.map((i) => `<td class="num">${M.rank(s).find((r) => r.inv.id === i.id).score.toFixed(0)}/100</td>`).join("")}</tr>
      </tbody></table></div>`);
  }

  /* ---------------- drawer ---------------- */
  function showDrawer(html) {
    const root = $("#drawer-root");
    root.innerHTML = `<div class="drawer-backdrop"></div><aside class="drawer" role="dialog" aria-modal="true"><button class="icon-btn close" type="button" aria-label="${esc(t("dr.closeAria"))}">${t("dr.close")}</button>${html}</aside>`;
    const close = () => (root.innerHTML = "");
    $(".drawer-backdrop", root).onclick = close;
    $(".close", root).onclick = close;
    document.addEventListener("keydown", function k(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", k); } });
    $(".close", root).focus();
  }
  function openDrawer(id) {
    const i = invById(id);
    if (!i) return;
    const s = scenario();
    const r = M.rank(s).find((x) => x.inv.id === id);
    showDrawer(`
      <div><div class="eyebrow">${esc(E.CATEGORIES[i.category].label)} · ${yearStr(i)}</div><h2 style="margin-top:6px">${esc(i.name)}</h2><p class="muted">${esc(i.full)}</p></div>
      <p>${esc(i.objectives)}</p>
      <dl class="kv">
        <dt>${t("dr.platform")}</dt><dd>${esc(i.platform)}</dd>
        <dt>${t("dr.team")}</dt><dd>${esc(i.team)}</dd>
        <dt>${t("dr.fuels")}</dt><dd>${esc(i.fuels)}</dd>
        <dt>${t("dr.oxygen")}</dt><dd class="num">${range(i.o2, i.approx && i.approx.o2, "%")}</dd>
        <dt>${t("dr.pressure")}</dt><dd class="num">${range(i.p, i.approx && i.approx.p)}${KPA()} (${psia(i.p[0])}${i.p[0] !== i.p[1] ? "–" + psia(i.p[1]) : ""} psia)</dd>
        <dt>${t("dr.flow")}</dt><dd class="num">${range(i.flow, i.approx && i.approx.flow)}${CMS()}</dd>
        <dt>${t("dr.diluents")}</dt><dd>${esc(i.diluents)}</dd>
        <dt>${t("dr.diagnostics")}</dt><dd>${i.sensors.map((x) => `<span class="pill" style="margin:0 4px 4px 0;display:inline-block">${esc(x)}</span>`).join("")}</dd>
        <dt>${t("dr.tests")}</dt><dd class="num">${i.tests ? (i.approxTests ? "≈" : "") + i.tests : i.planned ? t("at.planned") : t("dr.inProgress")}</dd>
      </dl>
      ${i.approx ? `<p class="note">${t("dr.approx")}</p>` : ""}
      <div><h3>${t("dr.findings")}</h3><ul class="findings" style="margin-top:8px">${i.findings.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div>
      <div><h3 style="margin-bottom:8px">${t("dr.implications")}</h3><div class="implic">${["prevention", "detection", "suppression"].map((k) => `<div><h4 style="color:${k === "prevention" ? "var(--flame)" : k === "detection" ? "var(--ok)" : "var(--ember)"}">${t("layer." + k)}</h4>${esc(i.implications[k] || t("dr.notFocus"))}</div>`).join("")}</div></div>
      <div class="ai-box"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><strong>${t("dr.meansFor", { s: esc(s.label) })}</strong><span class="pill flame">${t("dr.relevance")} ${r.score.toFixed(0)}/100</span></div><div id="interp" class="muted">${t("dr.generating")}</div></div>
      <div><h3>${t("dr.sources")}</h3><ul class="findings" style="margin-top:8px">${i.links.map((l) => `<li><a href="${l.url}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join("")}</ul></div>`);
    E.ai.interpret(i, s).then((res) => { const el = $("#interp"); if (el) { el.classList.remove("muted"); el.innerHTML = renderAnswer(res.text) + `<div class="engine" style="margin-top:6px">${res.engine === "offline" ? t("eng.offline") : E.ai.providerName(res.provider)} · ${t("eng.confidence")}: ${esc(lv(res.confidence))}</div>`; } });
  }

  /* ---------------- SVG helpers ---------------- */
  const svgNS = (w, h, inner) => `<svg viewBox="0 0 ${w} ${h}" role="img" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  const logScale = (d0, d1, r0, r1) => (v) => r0 + ((Math.log(v) - Math.log(d0)) / (Math.log(d1) - Math.log(d0))) * (r1 - r0);
  const linScale = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);

  /* ---------------- flammability map ---------------- */
  function renderMap() {
    const v = $("#view-map");
    const s = scenario();
    const W = 940, H = 540, ml = 58, mr = 24, mt = 20, mb = 50;
    const xs = logScale(20, 320, ml, W - mr), ys = linScale(0, 100, H - mb, mt);
    const css = getComputedStyle(document.documentElement);
    const col = (c) => (c.startsWith("var(") ? css.getPropertyValue(c.slice(4, -1)).trim() : c);
    let g = "";
    // grid
    [20, 30, 50, 70, 101.3, 150, 200, 300].forEach((p) => { g += `<g class="grid"><line x1="${xs(p)}" x2="${xs(p)}" y1="${mt}" y2="${H - mb}"/></g><text x="${xs(p)}" y="${H - mb + 18}" text-anchor="middle">${fmt(p)}</text>`; });
    [0, 20, 40, 60, 80, 100].forEach((o) => { g += `<g class="grid"><line x1="${ml}" x2="${W - mr}" y1="${ys(o)}" y2="${ys(o)}"/></g><text x="${ml - 8}" y="${ys(o) + 4}" text-anchor="end">${o}%</text>`; });
    g += `<text x="${(ml + W - mr) / 2}" y="${H - 8}" text-anchor="middle">${esc(t("map.xAxis"))}</text>`;
    g += `<text transform="translate(14 ${(mt + H - mb) / 2}) rotate(-90)" text-anchor="middle">${esc(t("map.yAxis"))}</text>`;
    // normoxic curve
    let path = "";
    for (let p = 21.3; p <= 320; p *= 1.03) path += `${path ? "L" : "M"}${xs(p).toFixed(1)},${ys(Math.min(100, 2130 / p)).toFixed(1)}`;
    g += `<path d="${path}" fill="none" stroke="${col("var(--muted)")}" stroke-dasharray="5 5" stroke-width="1.2"/>`;
    g += `<text class="lbl" x="${xs(300)}" y="${ys(2130 / 300) + 18}" text-anchor="end">${esc(t("map.dashed"))}</text>`;
    // envelopes
    const invs = E.INVESTIGATIONS.filter((i) => state.mapCats.includes(i.category));
    const pointGroups = {};
    const rects = [], points = [];
    invs.forEach((i) => {
      const isPoint = i.o2[0] === i.o2[1] && i.p[0] === i.p[1];
      if (isPoint) { const k = i.o2[0] + "|" + i.p[0]; (pointGroups[k] = pointGroups[k] || []).push(i); }
      else rects.push(i);
    });
    rects.sort((a, b) => (b.o2[1] - b.o2[0]) * Math.log(b.p[1] / b.p[0] + 1.01) - (a.o2[1] - a.o2[0]) * Math.log(a.p[1] / a.p[0] + 1.01));
    rects.forEach((i) => {
      let x0 = xs(Math.max(20, i.p[0])), x1 = xs(Math.min(320, i.p[1])), y0 = ys(i.o2[1]), y1 = ys(i.o2[0]);
      if (x1 - x0 < 8) { const c = (x0 + x1) / 2; x0 = c - 4; x1 = c + 4; }
      if (y1 - y0 < 8) { const c = (y0 + y1) / 2; y0 = c - 4; y1 = c + 4; }
      const c = col(E.CATEGORIES[i.category].color);
      g += `<rect class="env" data-inv="${i.id}" x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="3" fill="${c}" fill-opacity="${i.planned ? 0.06 : 0.16}" stroke="${c}" stroke-width="1.4" ${i.planned ? 'stroke-dasharray="4 3"' : ""} style="cursor:pointer"/>`;
    });
    Object.values(pointGroups).forEach((grp) => {
      const cx = xs(grp[0].p[0]), cy = ys(grp[0].o2[0]);
      grp.forEach((i, n) => {
        const ang = (n / grp.length) * Math.PI * 2, rad = grp.length > 1 ? 13 : 0;
        const c = col(E.CATEGORIES[i.category].color);
        points.push(`<circle class="env" data-inv="${i.id}" cx="${cx + Math.cos(ang) * rad}" cy="${cy + Math.sin(ang) * rad}" r="5.5" fill="${c}" stroke="${col("var(--panel)")}" stroke-width="1.5" style="cursor:pointer"/>`);
      });
      if (grp.length > 2) g += `<text class="lbl" x="${cx + 22}" y="${cy + 40}">${esc(t("map.cluster", { n: grp.length }))}</text>`;
    });
    g += points.join("");
    // reference atmospheres
    E.REF_ATMOS.forEach((a) => {
      const x = xs(a.p), y = ys(a.o2);
      const c = a.incident ? col("var(--crit)") : col("var(--fg)");
      g += `<path d="M${x},${y - 7} L${x + 7},${y} L${x},${y + 7} L${x - 7},${y} Z" fill="${col("var(--bg)")}" stroke="${c}" stroke-width="1.8"/>`;
      g += `<text class="lbl" x="${x + a.dx}" y="${y + a.dy}" text-anchor="${a.anchor}" style="fill:${c}">${esc(a.label)}</text>`;
    });
    // current mission
    g += `<circle cx="${xs(s.p)}" cy="${ys(s.o2)}" r="14" fill="none" stroke="${col("var(--flame)")}" stroke-width="2.5"><animate attributeName="r" values="12;17;12" dur="2.4s" repeatCount="indefinite"/></circle>`;

    const inside = E.INVESTIGATIONS.filter((i) => !i.planned && M.envDist(i, s.o2, s.p) === 0);
    const solidsInside = inside.filter((i) => i.category === "solid");
    v.innerHTML = `
      <div class="view-head"><div><h2>${t("map.title")}</h2><p>${t("map.desc", { s: esc(s.label) })}</p></div></div>
      <div class="split">
        <div class="panel">
          <div class="chips" id="map-cats" style="margin-bottom:10px">${Object.entries(E.CATEGORIES).map(([k, c]) => `<button class="chip" data-cat="${k}" aria-pressed="${state.mapCats.includes(k)}" type="button"><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${c.color};margin-right:6px"></i>${esc(c.label)}</button>`).join("")}</div>
          <div class="chart" id="map-chart">${svgNS(W, H, g)}</div>
          <div class="legend"><span><i style="border:1.5px solid var(--fg);border-radius:0;transform:rotate(45deg);width:9px;height:9px"></i>${t("map.legAtm")}</span><span><i style="border:1.5px solid var(--crit);transform:rotate(45deg);width:9px;height:9px;border-radius:0"></i>${t("map.legAcc")}</span><span><i style="border:1.5px dashed var(--warn)"></i>${t("map.legPlanned")}</span><span><i style="border:2px solid var(--flame);border-radius:50%"></i>${t("map.legMission")}</span></div>
        </div>
        <div class="grid" style="align-content:start">
          <div class="panel">
            <h3>${t("map.evTitle", { o2: fmt(s.o2), p: fmt(s.p) })}</h3>
            <p style="margin-top:8px"><span class="num" style="font-size:2rem;font-weight:700;color:${inside.length > 3 ? "var(--ok)" : inside.length ? "var(--warn)" : "var(--crit)"}">${inside.length}</span> ${t("map.evText", { k: solidsInside.length })}</p>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">${inside.map((i) => `<button class="cite" data-inv="${i.id}" type="button">${esc(i.name)}</button>`).join("") || `<span class="muted">${t("map.evNone")}</span>`}</div>
          </div>
          <div class="panel">
            <h3>${t("map.howTitle")}</h3>
            <ul class="findings" style="margin-top:8px;font-size:.9rem">
              ${["map.how1", "map.how2", "map.how3", "map.how4"].map((k) => `<li>${t(k)}</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>`;
    $$("#map-cats .chip").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.cat, i = state.mapCats.indexOf(k);
      i >= 0 ? state.mapCats.splice(i, 1) : state.mapCats.push(k);
      renderMap();
    }));
    $$("#map-chart .env").forEach((el) => {
      const i = invById(el.dataset.inv);
      el.addEventListener("mousemove", (e) => showTip(`<strong>${esc(i.name)}</strong> · ${esc(E.CATEGORIES[i.category].label)}<br><span class="mono">${range(i.o2, i.approx && i.approx.o2, "% O₂")} · ${range(i.p, i.approx && i.approx.p, KPA())}</span><br>${esc(i.findings[0])}`, e));
      el.addEventListener("mouseleave", hideTip);
      el.addEventListener("click", () => { hideTip(); openDrawer(i.id); });
    });
  }

  /* ---------------- risk explorer ---------------- */
  function renderRisk() {
    const v = $("#view-risk");
    const s = scenario();
    if (!state.sim) state.sim = { o2: s.o2, p: s.p, g: s.g, vent: s.vent, materialId: store.get("material", "nomex") };
    const sim = state.sim;
    v.innerHTML = `
      <div class="print-only print-head" id="print-head"></div>
      <div class="view-head"><div><h2>${t("rk.title")}</h2><p>${t("rk.desc")}</p></div><button type="button" class="btn" id="print-report">${t("rp.button")}</button></div>
      <div class="split split-narrow-left">
        <div class="panel controls">
          <div class="presets">${E.SCENARIOS.map((x) => `<button class="chip" data-preset="${x.id}" type="button" aria-pressed="${x.id === s.id}">${esc(x.label.split(" (")[0])}</button>`).join("")}</div>
          <div class="ctrl"><label for="sim-mat">${t("rk.material")}</label><select id="sim-mat">${E.MATERIALS.map((m) => `<option value="${m.id}" ${m.id === sim.materialId ? "selected" : ""}>${esc(m.label)} · ${anchorShort(m)}</option>`).join("")}</select><div class="hint" id="mat-note"></div></div>
          <div class="ctrl"><label for="sim-o2">${t("rk.oxygen")} <output id="o-o2"></output></label><input type="range" id="sim-o2" min="15" max="100" step="0.5" value="${sim.o2}"></div>
          <div class="ctrl"><label for="sim-p">${t("rk.pressure")} <output id="o-p"></output></label><input type="range" id="sim-p" min="20" max="160" step="0.5" value="${sim.p}"></div>
          <div class="ctrl"><label for="sim-g">${t("rk.gravity")} <output id="o-g"></output></label><input type="range" id="sim-g" min="0" max="1" step="0.001" value="${sim.g}"><div class="hint">${t("rk.gHint")}</div></div>
          <div class="ctrl"><label for="sim-v">${t("rk.vent")} <output id="o-v"></output></label><input type="range" id="sim-v" min="0" max="50" step="0.5" value="${sim.vent}"><div class="hint">${t("rk.vHint")}</div></div>
          <p class="note">${t("rk.note")}</p>
        </div>
        <div class="grid" style="align-content:start">
          <div class="verdict" id="verdict"></div>
          <div class="panel"><div class="panel-title"><h3>${t("rk.chart")}</h3><span class="eyebrow">${t("rk.shaded")}</span></div><div class="chart" id="risk-chart"></div></div>
          <div class="grid g2">
            <div class="panel"><h3>${t("rk.worlds")}</h3><div class="table-wrap" style="margin-top:8px"><table id="gravity-table"></table></div></div>
            <div class="panel"><h3>${t("rk.evidence")}</h3><div id="evidence" style="margin-top:8px"></div></div>
          </div>
        </div>
      </div>
      ${validationPanel()}
      ${fm2Panel()}
      ${resultsPanel()}`;
    wireResults();
    const inputs = { o2: "#sim-o2", p: "#sim-p", g: "#sim-g", vent: "#sim-v" };
    Object.entries(inputs).forEach(([k, sel]) => $(sel).addEventListener("input", (e) => { sim[k] = parseFloat(e.target.value); updateRisk(); }));
    $("#sim-mat").addEventListener("change", (e) => { sim.materialId = e.target.value; store.set("material", sim.materialId); updateRisk(); });
    $("#print-report").addEventListener("click", printReport);
    $$("[data-preset]").forEach((b) => b.addEventListener("click", () => {
      const x = E.SCENARIOS.find((y) => y.id === b.dataset.preset);
      Object.assign(sim, { o2: x.o2, p: x.p, g: x.g, vent: x.vent });
      Object.entries(inputs).forEach(([k, sel]) => ($(sel).value = sim[k]));
      $$("[data-preset]").forEach((y) => y.setAttribute("aria-pressed", y === b ? "true" : "false"));
      updateRisk();
    }));
    updateRisk();
  }
  function updateRisk() {
    const sim = state.sim;
    const a = M.assess(sim);
    $("#o-o2").textContent = `${n1(sim.o2)}%`;
    $("#o-p").textContent = `${n1(sim.p)}${KPA()} · ${psia(sim.p)} psia`;
    $("#o-g").textContent = sim.g === 0 ? t("rk.orbit") : `${E.num(sim.g, 3)} g`;
    $("#o-v").textContent = `${n1(sim.vent)}${CMS()}`;
    $("#mat-note").textContent = a.material.note;
    const vd = $("#verdict");
    vd.className = `verdict panel s${a.cls}`;
    vd.innerHTML = `<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:baseline"><div><div class="eyebrow">${esc(a.material.label)}</div><div class="state">${a.state}</div></div><span class="pill ${a.coverage.level === "High" ? "ok" : a.coverage.level === "Medium" ? "warn" : "crit"}">${t("rk.evLevel", { l: lv(a.coverage.level) })}</span></div>
      <p>${a.text}</p>
      <div class="gauge" aria-hidden="true"><span style="left:${a.gauge}%"></span></div>
      <div class="metrics">
        <div><div class="k">${t("rk.loc")}</div><div class="v">${n1(a.loc)}%</div><div class="k">${t("rk.range", { lo: n1(a.range[0]), hi: n1(a.range[1]) })}</div></div>
        <div><div class="k">${t("rk.margin")}</div><div class="v" style="color:${a.margin > 0 ? "var(--crit)" : "var(--ok)"}">${a.margin >= 0 ? "+" : ""}${n1(a.margin)} ${t("rk.pts")}</div></div>
        <div><div class="k">${t("rk.pp")}</div><div class="v">${n1(a.ppO2)}${KPA()}</div></div>
        <div><div class="k">${t("rk.ueff")}</div><div class="v">${n1(a.uEff)}${CMS()}</div></div>
      </div>
      <p class="note anchor-note">${anchorLong(a.material)}</p>
      ${a.coverage.flags.map((f) => `<p class="note" style="border-color:var(--warn)">⚠ ${esc(f)}</p>`).join("")}`;
    drawRiskChart(a);
    // gravity table
    const worlds = [[t("w.orbit"), 0], [t("w.moon"), 0.166], [t("w.mars"), 0.378], [t("w.earth"), 1]];
    $("#gravity-table").innerHTML = `<thead><tr><th>${t("rk.thG")}</th><th class="num">${t("rk.thLimit")}</th><th>${t("rk.thState")}</th></tr></thead><tbody>${worlds.map(([n, g]) => { const r = M.assess({ ...sim, g }); return `<tr><td>${n}</td><td class="num">${n1(r.loc)}%</td><td><span class="pill ${["ok", "warn", "ember", "crit"][r.cls]}">${r.state}</span></td></tr>`; }).join("")}</tbody>`;
    $("#evidence").innerHTML = `<p style="font-size:.9rem">${esc(a.coverage.note)}</p><div style="display:grid;gap:8px;margin-top:10px">${a.coverage.near.map((n) => `<div style="font-size:.86rem"><button class="cite" data-inv="${n.inv.id}" type="button">${esc(n.inv.name)}</button> ${n.d === 0 ? t("rk.testedHere") : t("rk.nearest")}: <span class="mono">${range(n.inv.o2, false, "%")} · ${range(n.inv.p, false, KPA())}</span></div>`).join("")}</div><p class="note" style="margin-top:10px">${t("rk.physics")}</p>`;
  }
  /* Fire-risk report: the current estimate as a printable page (Print, or Save as PDF). Light theme on paper. */
  let printTheme = null;
  function fillPrintHead() {
    const el = $("#print-head"), sim = state.sim;
    if (!el || !sim) return;
    const a = M.assess(sim), url = location.href.split("#")[0];
    el.innerHTML = `<div class="eyebrow">VULKAN</div><h1>${t("rp.title")}</h1><p>${t("rp.meta", { date: new Date().toISOString().slice(0, 10), m: esc(a.material.label), o2: n1(sim.o2), p: n1(sim.p), psia: psia(sim.p), g: sim.g === 0 ? t("rk.orbit") : `${E.num(sim.g, 3)} g`, v: n1(sim.vent) })}</p><p class="note">${t("rp.foot", { url: esc(url) })}</p>`;
  }
  function startPrint() {
    if (printTheme !== null) return;
    const root = document.documentElement;
    printTheme = root.dataset.theme || "";
    root.dataset.theme = "light";
    document.body.classList.add("print-report");
    renderRisk();
    fillPrintHead();
  }
  function endPrint() {
    if (printTheme === null) return;
    const root = document.documentElement;
    if (printTheme) root.dataset.theme = printTheme; else delete root.dataset.theme;
    printTheme = null;
    document.body.classList.remove("print-report");
    if (!$("#view-risk").hidden) renderRisk();
  }
  function printReport() {
    startPrint();
    setTimeout(() => window.print(), 60); // the page returns to normal on "afterprint"
  }
  window.addEventListener("beforeprint", () => { if (!$("#view-risk").hidden && state.sim) startPrint(); });
  window.addEventListener("afterprint", endPrint);
  function anchorShort(m) {
    const a = M.anchor(m);
    return a.kind === "loi" ? t("rk.optLoi", { o2: n1(a.o2) }) : t("rk.optMoc", { o2: n1(a.o2) });
  }
  function srcLink(key) {
    const sr = E.SRC[key] || E.SRC.guide;
    return `<a href="${sr.url}" target="_blank" rel="noopener">${esc(sr.label)}</a>`;
  }
  function anchorLong(m) {
    const a = M.anchor(m), ps = n1(a.kPa / 6.89476);
    if (a.kind === "moc") return t("rk.anchorMoc", { o2: n1(a.o2), psia: ps, src: srcLink(m.moc.src) });
    if (a.kind === "est") return t("rk.anchorEst", { o2: n1(a.o2), psia: ps, src: srcLink(m.moc.src) });
    return t("rk.anchorLoi", { o2: n1(a.o2) });
  }
  function checkCond(c) {
    const parts = [c.g === 0 ? t("va.orbit") : c.g === 1 ? "1 g" : `${E.num(c.g, 3)} g`, `${psia(c.p)} psia`];
    if (c.g < 1) parts.push(c.vent === 0 ? t("va.still") : `${n1(c.vent)}${CMS()}`);
    return parts.join(" · ");
  }
  function checkObs(c) {
    if (c.id === "i-nomex-uloi") return t("va.obsUloi", { o2: n1(c.o2), lo: n1(c.lo), hi: n1(c.hi) });
    if (c.kind === "limit") return t("va.obsMoc", { o2: n1(c.o2) });
    return t(c.kind === "burns" ? "va.obsBurns" : "va.obsNoburn", { o2: n1(c.o2) });
  }
  const VCLS = { ok: "ok", unsafe: "crit", cons: "warn", na: "" };
  function vCell(loc, v, lbl) {
    if (loc == null) return `<td class="num muted" data-l="${lbl}">—</td>`;
    return `<td class="num" data-l="${lbl}"><span>${n1(loc)}% <span class="pill ${VCLS[v]}">${t("va.v." + v)}</span></span></td>`;
  }
  function validationPanel() {
    const v = M.validate();
    const tally = (x) => `<span class="pill ok">${t("va.ok", { n: x.ok })}</span> <span class="pill crit">${t("va.unsafe", { n: x.unsafe })}</span> <span class="pill warn">${t("va.cons", { n: x.cons })}</span>`;
    return `<section class="panel model-check" id="validation" aria-labelledby="va-h">
        <div class="panel-title"><h2 id="va-h">${t("va.title")}</h2><span class="eyebrow">${t("va.eyebrow", { n: v.n })}</span></div>
        <p class="lede-sm">${t("va.lede", { n: v.n, u: v.v1.unsafe })}</p>
        <div class="va-sum">
          <div class="va-col"><div class="k">${t("va.before")}</div><div>${tally(v.v1)}</div></div>
          <div class="va-col now"><div class="k">${t("va.now")}</div><div>${tally(v.v2)}</div></div>
        </div>
        <div class="table-wrap"><table class="va-table va-cards">
          <thead><tr><th>${t("va.thMat")}</th><th>${t("va.thCond")}</th><th>${t("va.thObs")}</th><th class="num">${t("va.thBefore")}</th><th class="num">${t("va.thNow")}</th><th>${t("va.thSrc")}</th></tr></thead>
          <tbody>${v.rows.map((r) => `<tr><td class="t">${esc(r.material.label)}${r.tuned ? " †" : ""}</td><td class="mono" data-l="${t("va.thCond")}">${checkCond(r)}</td><td data-l="${t("va.thObs")}">${checkObs(r)}</td>${vCell(r.v1, r.v1v, t("va.thBefore"))}${vCell(r.v2, r.v2v, t("va.thNow"))}<td class="src" data-l="${t("va.thSrc")}">${srcLink(r.src === "ssce" ? "guide" : r.src)}</td></tr>`).join("")}</tbody>
        </table></div>
        <p class="note">${t("va.tuned", { n: v.nIndep })} ${t("va.limits")}</p>
      </section>`;
  }
  function fm2Panel() {
    const preds = M.fm2Predictions();
    const cell = (x, k) => `<td class="num tst" data-l="${M.FM2_TESTS[k]}% O₂"><span class="pill ${x.call === "burn" ? "crit" : x.call === "edge" ? "warn" : "ok"}">${t("fm." + x.call)}</span></td>`;
    return `<section class="panel model-check" id="fm2" aria-labelledby="fm-h">
        <div class="panel-title"><h2 id="fm-h">${t("fm.title")}</h2><span class="eyebrow">${t("fm.frozen", { d: M.FM2_FROZEN })}</span></div>
        <p class="lede-sm">${t("fm.lede")}</p>
        <div class="table-wrap"><table class="va-table va-cards fm">
          <thead><tr><th>${t("va.thMat")}</th><th class="num">${t("fm.thLimit")}</th>${M.FM2_TESTS.map((o) => `<th class="num">${o}% O₂</th>`).join("")}</tr></thead>
          <tbody>${preds.map((p) => `<tr><td class="t">${esc(p.material.label)}</td><td class="num lim" data-l="${t("fm.thLimit")}"><span>${n1(p.loc)}% <span class="muted">(${n1(p.range[0])}–${n1(p.range[1])})</span></span></td>${p.tests.map(cell).join("")}</tr>`).join("")}</tbody>
        </table></div>
        <p class="note">${t("fm.nasa", { x: n1((preds.find((p) => p.material.id === "nomex") || preds[0]).loc), src: srcLink("ferkul2026") })}</p>
      </section>`;
  }
  /* ---------------- new test results (FM2, FLARE, ...) ---------------- */
  function resultsPanel() {
    const list = M.results();
    const fm = (r) => r.fm2 ? `<span class="pill ${r.fm2.outcome === "hit" ? "ok" : r.fm2.outcome === "miss" ? "crit" : "warn"}">${t("nr.fm." + r.fm2.outcome)}</span>` : `<span class="muted">—</span>`;
    const obs = (r) => r.kind === "limit" ? t("nr.obsLimit", { o2: n1(r.o2) }) : t(r.kind === "burns" ? "va.obsBurns" : "va.obsNoburn", { o2: n1(r.o2) });
    const safeUrl = (u) => /^https:\/\//i.test(u || "");
    const rows = list.map((r) => `<tr><td class="t">${esc(r.exp)}${r.date ? ` <span class="muted">· ${esc(r.date)}</span>` : ""}${r.local ? ` <span class="pill">${t("nr.local")}</span>` : ""}</td>
      <td data-l="${t("va.thMat")}">${esc(r.material.label)}</td>
      <td class="mono" data-l="${t("va.thCond")}">${checkCond(r)}</td>
      <td data-l="${t("va.thObs")}">${obs(r)}${r.note ? `<div class="muted">${esc(r.note)}</div>` : ""}</td>
      ${vCell(r.loc, r.v, "VULKAN")}
      <td data-l="${t("nr.thFm2")}">${fm(r)}</td>
      <td class="src" data-l="${t("va.thSrc")}">${safeUrl(r.src) ? `<a href="${esc(r.src)}" target="_blank" rel="noopener">${esc(r.src.replace(/^https:\/\/(www\.)?/i, "").slice(0, 48))}</a>` : "—"}${r.local ? ` <button type="button" class="btn small" data-del="${esc(r.id)}">${t("nr.del")}</button>` : ""}</td></tr>`).join("");
    const nLocal = list.filter((r) => r.local).length;
    const num = (id, label, attrs, hint) => `<div class="ctrl"><label for="${id}">${label}</label><input type="number" id="${id}" inputmode="decimal" ${attrs}>${hint ? `<div class="hint">${hint}</div>` : ""}</div>`;
    return `<section class="panel model-check" id="new-results" aria-labelledby="nr-h">
        <div class="panel-title"><h2 id="nr-h">${t("nr.title")}</h2><span class="eyebrow">${t("nr.eyebrow", { n: list.length })}</span></div>
        <p class="lede-sm">${t("nr.lede")}</p>
        <p class="note nr-msg" id="nr-msg" role="status"></p>
        ${list.length ? `<div class="table-wrap"><table class="va-table va-cards nr">
          <thead><tr><th>${t("nr.exp")}</th><th>${t("va.thMat")}</th><th>${t("va.thCond")}</th><th>${t("va.thObs")}</th><th class="num">VULKAN</th><th>${t("nr.thFm2")}</th><th>${t("va.thSrc")}</th></tr></thead>
          <tbody>${rows}</tbody></table></div>` : `<p class="note">${t("nr.empty")}</p>`}
        <details class="nr-add"><summary>${t("nr.add")}</summary>
          <form id="nr-form" class="nr-form" novalidate>
            <div class="ctrl"><label for="nr-exp">${t("nr.exp")}</label><input type="text" id="nr-exp" maxlength="40" placeholder="FM2" autocomplete="off"></div>
            <div class="ctrl"><label for="nr-mat">${t("rk.material")}</label><select id="nr-mat">${E.MATERIALS.map((m) => `<option value="${m.id}">${esc(m.label)}</option>`).join("")}</select></div>
            <div class="ctrl"><label for="nr-kind">${t("nr.kind")}</label><select id="nr-kind"><option value="burns">${t("nr.kBurns")}</option><option value="noburn">${t("nr.kNoburn")}</option><option value="limit">${t("nr.kLimit")}</option></select></div>
            ${num("nr-o2", t("nr.o2"), 'min="1" max="100" step="0.1" placeholder="25"')}
            ${num("nr-p", t("nr.p"), 'min="0.5" max="30" step="0.1" placeholder="8.2"')}
            ${num("nr-g", t("nr.g"), 'min="0" max="3" step="0.001" placeholder="0.166"', t("rk.gHint"))}
            ${num("nr-v", t("nr.v"), 'min="0" max="200" step="0.1" placeholder="0"', t("nr.vHint"))}
            <div class="ctrl"><label for="nr-date">${t("nr.date")}</label><input type="date" id="nr-date"></div>
            <div class="ctrl wide"><label for="nr-src">${t("nr.src")}</label><input type="url" id="nr-src" placeholder="https://ntrs.nasa.gov/citations/…" autocomplete="off"></div>
            <div class="ctrl wide"><label for="nr-note">${t("nr.note")}</label><input type="text" id="nr-note" maxlength="200" autocomplete="off"></div>
            <div class="wide nr-actions"><button type="submit" class="btn primary">${t("nr.save")}</button><span class="note nr-err" id="nr-err" role="alert"></span></div>
          </form>
        </details>
        <div class="nr-foot"><p class="note">${t("nr.how")}</p>${nLocal ? `<button type="button" class="btn" id="nr-export">${t("nr.export")}</button>` : ""}</div>
      </section>`;
  }
  function resultsChanged(msg) {
    if (E.ai && E.ai.resetIndex) E.ai.resetIndex();
    renderRisk();
    const m = $("#nr-msg");
    if (m && msg) m.textContent = msg;
    const panel = document.getElementById("new-results");
    if (panel) panel.scrollIntoView({ block: "start" });
  }
  function wireResults() {
    const form = $("#nr-form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = (id) => ($("#" + id).value || "").trim();
      const numv = (id) => { const x = parseFloat(val(id).replace(",", ".")); return isFinite(x) ? x : NaN; };
      const r = { id: "u" + Date.now().toString(36), exp: val("nr-exp"), mat: val("nr-mat"), kind: val("nr-kind"), o2: numv("nr-o2"), p: numv("nr-p"), g: numv("nr-g"), vent: val("nr-v") === "" ? 0 : numv("nr-v"), src: val("nr-src"), date: val("nr-date"), note: val("nr-note") };
      const ok = r.exp && r.o2 > 0 && r.o2 <= 100 && r.p > 0 && r.p <= 30 && r.g >= 0 && r.g <= 3 && r.vent >= 0 && /^https:\/\/\S+\.\S+/i.test(r.src);
      if (!ok) { $("#nr-err").textContent = t("nr.err"); return; }
      r.p = Math.round(r.p * M.PSI * 100) / 100; // stored in kPa, like the rest of the model
      const list = M.localResults();
      list.push(r);
      if (!M.saveLocalResults(list)) { $("#nr-err").textContent = t("nr.err"); return; }
      resultsChanged(t("nr.saved"));
    });
    $$("[data-del]").forEach((b) => b.addEventListener("click", () => {
      M.saveLocalResults(M.localResults().filter((r) => r.id !== b.dataset.del));
      resultsChanged("");
    }));
    const ex = $("#nr-export");
    if (ex) ex.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(M.localResults(), null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "vulkan-results.json";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { URL.revokeObjectURL(link.href); link.parentNode.removeChild(link); }, 1000);
    });
  }
  function drawRiskChart(a) {
    const sim = state.sim;
    const W = 720, H = 330, ml = 50, mr = 18, mt = 16, mb = 44;
    const yMax = Math.max(50, Math.min(100, Math.ceil((sim.o2 + 8) / 10) * 10));
    const xs = logScale(0.5, 60, ml, W - mr), ys = linScale(0, yMax, H - mb, mt);
    const css = getComputedStyle(document.documentElement);
    const c = (n) => css.getPropertyValue(n).trim();
    const pts = M.curve(a.material, sim.p, 60, sim.g);
    const bandPts = pts.map(([u]) => [u, ...M.band(a.material, u, sim.p, sim.g)]);
    let g = "";
    [0.5, 1, 2, 5, 10, 20, 50].forEach((u) => { g += `<g class="grid"><line x1="${xs(u)}" x2="${xs(u)}" y1="${mt}" y2="${H - mb}"/></g><text x="${xs(u)}" y="${H - mb + 16}" text-anchor="middle">${fmt(u)}</text>`; });
    for (let o = 0; o <= yMax; o += 10) g += `<g class="grid"><line x1="${ml}" x2="${W - mr}" y1="${ys(o)}" y2="${ys(o)}"/></g><text x="${ml - 6}" y="${ys(o) + 4}" text-anchor="end">${o}%</text>`;
    g += `<text x="${(ml + W - mr) / 2}" y="${H - 6}" text-anchor="middle">${esc(t("rk.xAxis"))}</text>`;
    const clamp = (y) => Math.max(mt, Math.min(H - mb, y));
    const line = pts.map(([u, o], n) => `${n ? "L" : "M"}${xs(u).toFixed(1)},${clamp(ys(o)).toFixed(1)}`).join("");
    g += `<path d="${line} L${xs(60)},${mt} L${xs(0.5)},${mt} Z" fill="${c("--ember")}" fill-opacity="0.13"/>`;
    const bandPath = bandPts.map(([u, lo], n) => `${n ? "L" : "M"}${xs(u).toFixed(1)},${clamp(ys(lo)).toFixed(1)}`).join("") + bandPts.slice().reverse().map(([u, , hi]) => `L${xs(u).toFixed(1)},${clamp(ys(hi)).toFixed(1)}`).join("") + "Z";
    g += `<path d="${bandPath}" fill="${c("--ember")}" fill-opacity="0.16" stroke="none"><title>${esc(t("rk.bandTip"))}</title></path>`;
    g += `<path d="${line}" fill="none" stroke="${c("--ember")}" stroke-width="2.4"/>`;
    g += `<text x="${xs(0.7)}" y="${mt + 16}" style="fill:${c("--ember")}">${esc(t("rk.canSpread"))}</text><text x="${xs(0.7)}" y="${H - mb - 8}" style="fill:${c("--ok")}">${esc(t("rk.selfExt"))}</text>`;
    // O2 line
    g += `<line x1="${ml}" x2="${W - mr}" y1="${ys(sim.o2)}" y2="${ys(sim.o2)}" stroke="${c("--flame")}" stroke-dasharray="6 4" stroke-width="1.5"/><text x="${W - mr - 4}" y="${ys(sim.o2) - 6}" text-anchor="end" style="fill:${c("--flame")}">${esc(t("rk.cabinO2", { o2: fmt(sim.o2) }))}</text>`;
    // world markers
    [["µg", 0], [t("w.moon"), 0.166], [t("w.mars"), 0.378], [t("w.earth"), 1]].forEach(([n, gv], k) => {
      const u = Math.max(0.5, Math.sqrt(sim.vent ** 2 + M.buoyantFlow(gv) ** 2));
      const x = xs(Math.min(60, u));
      g += `<line x1="${x}" x2="${x}" y1="${mt}" y2="${H - mb}" stroke="${c("--muted")}" stroke-width="1" stroke-dasharray="2 3"/><text x="${x + 4}" y="${mt + 30 + k * 14}" style="fill:${c("--fg")}">${n}</text>`;
    });
    const ux = xs(Math.min(60, Math.max(0.5, a.uEff)));
    g += `<circle cx="${ux}" cy="${ys(sim.o2)}" r="7" fill="${c("--flame")}" stroke="${c("--panel")}" stroke-width="2"/>`;
    $("#risk-chart").innerHTML = svgNS(W, H, g);
  }

  /* ---------------- ranker ---------------- */
  function renderRank() {
    const v = $("#view-rank");
    const s = scenario();
    const labels = { atmosphere: t("rn.atmosphere"), hazard: t("rn.hazard"), scale: t("rn.scale"), data: t("rn.data"), recency: t("rn.recency") };
    const colors = { atmosphere: "var(--flame)", hazard: "var(--ember)", scale: "var(--cool)", data: "var(--ok)", recency: "var(--warn)" };
    v.innerHTML = `
      <div class="view-head"><div><h2>${t("rn.title")}</h2><p>${t("rn.desc", { s: esc(s.label), o2: fmt(s.o2), p: fmt(s.p), g: fmt(s.g) })}</p></div></div>
      <div class="split split-controls">
        <div class="panel controls">
          ${Object.keys(labels).map((k) => `<div class="ctrl"><label for="w-${k}"><span><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${colors[k]};margin-right:6px"></i>${labels[k]}</span><output id="wo-${k}">${state.weights[k]}</output></label><input type="range" id="w-${k}" min="0" max="50" value="${state.weights[k]}"></div>`).join("")}
          <button class="btn" id="w-reset" type="button">${t("rn.reset")}</button>
          <p class="note">${t("rn.note")}</p>
        </div>
        <div class="panel" id="rank-list"></div>
      </div>`;
    Object.keys(labels).forEach((k) => $(`#w-${k}`).addEventListener("input", (e) => { state.weights[k] = +e.target.value; $(`#wo-${k}`).textContent = e.target.value; store.set("weights", state.weights); drawRank(colors); }));
    $("#w-reset").onclick = () => { state.weights = { ...M.DEFAULT_WEIGHTS }; store.set("weights", state.weights); renderRank(); };
    drawRank(colors);
  }
  function drawRank(colors) {
    const s = scenario();
    const sumW = Object.values(state.weights).reduce((a, b) => a + b, 0) || 1;
    const r = M.rank(s, state.weights);
    $("#rank-list").innerHTML = r.map((x, n) => `
      <div class="rank-row"><span class="n">${n + 1}</span>
        <div style="min-width:0"><button class="cite" data-inv="${x.inv.id}" type="button">${esc(x.inv.name)}</button> ${x.inv.planned ? `<span class="pill warn">${t("at.planned")}</span>` : ""}<div class="why">${esc(x.why)}</div></div>
        <div class="barcell"><div class="bar" title="${esc(t("rn.contrib"))}">${Object.keys(colors).map((k) => `<span style="width:${(x.parts[k] * state.weights[k]) / sumW * 100}%;background:${colors[k]}"></span>`).join("")}</div></div>
        <span class="score">${x.score.toFixed(0)}</span></div>`).join("");
  }

  /* ---------------- ask ---------------- */
  function renderAsk() {
    const v = $("#view-ask");
    if (v.dataset.init) { updateEngine(); return; }
    v.dataset.init = "1";
    v.innerHTML = `
      <div class="view-head"><div><h2>${t("ask.title")}</h2><p>${t("ask.desc")}</p></div><span class="engine engine-pill" id="engine">${t("ask.checking")}</span></div>
      <p class="kb-line" id="kb-line">${t("kb.base", { inv: E.INVESTIGATIONS.length, ins: E.INSIGHTS.length })}</p>
      <div class="split">
        <div class="panel chat">
          <div class="chat-log" id="chat-log" aria-live="polite"></div>
          <div class="voice-live" id="v-live" aria-live="polite" hidden></div>
          <form class="chat-form" id="chat-form"><textarea id="chat-in" rows="1" placeholder="${esc(t("ask.placeholder"))}" aria-label="${esc(t("ask.aria"))}"></textarea><button class="icon-btn mic" id="mic" type="button" aria-label="${esc(t("v.mic"))}" title="${esc(t("v.mic"))}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button><button class="btn primary" type="submit">${t("ask.send")}</button></form>
        </div>
        <div class="grid" style="align-content:start">
          <div class="panel voice-panel">
            <h3>${t("v.title")}</h3>
            <p class="engine" id="v-eng" style="margin:6px 0 10px;line-height:1.4">${t("ask.checking")}</p>
            <label class="toggle"><input type="checkbox" id="v-read" ${state.voiceMode ? "checked" : ""}><span>${t("v.readAloud")}</span></label>
            <label class="toggle"><input type="checkbox" id="v-wake" ${state.wake ? "checked" : ""}><span>${t("v.wake")}</span></label>
            <p class="wake-diag" id="v-diag" aria-live="polite" hidden></p>
            <div class="quick"><span class="eyebrow">${t("v.quick")}</span><button class="chip danger" type="button" data-cmd="v.fire">🔥 ${t("v.fire")}</button><button class="chip danger" type="button" data-cmd="v.smoke">💨 ${t("v.smoke")}</button><button class="chip" type="button" id="v-stop" hidden>■ ${t("v.stop")}</button></div>
            <p class="hint">${t("v.cmdHint")}</p>
            <p class="hint">${t("v.aiVoice")}</p>
          </div>
          <div class="panel"><h3>${t("ask.try")}</h3><div class="suggest" style="margin-top:10px">${E.suggestions().map((q) => `<button type="button">${esc(q)}</button>`).join("")}</div></div>
          <div class="panel"><h3>${t("ask.how")}</h3><ul class="findings" style="margin-top:8px;font-size:.88rem">
            <li>${t("ask.how1", { n: E.ai.getIndex() && E.model.buildChunks().length })}</li>
            <li>${t("ask.how2")}</li>
            <li>${t("ask.how3")}</li>
            <li>${t("ask.how4")}</li></ul></div>
        </div>
      </div>`;
    const log = $("#chat-log");
    pushBot({ text: t("ask.hello", { n: E.INVESTIGATIONS.length, s: scenario().label }), cites: [], confidence: "", gaps: [], engine: "" });
    $$(".suggest button", v).forEach((b) => b.addEventListener("click", () => send(b.textContent)));
    $("#chat-form").addEventListener("submit", (e) => { e.preventDefault(); const q = $("#chat-in").value.trim(); if (q) send(q); });
    $("#chat-in").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#chat-form").requestSubmit(); } });
    updateEngine();
    function pushBot(res) {
      const div = document.createElement("div");
      div.className = "msg bot";
      const cited = (res.sources || []).filter((s) => res.text.includes(`[${s.id}]`));
      div.innerHTML = renderAnswer(res.text, res.sources) +
        (cited.length ? `<div class="sources"><span class="eyebrow">${t("ask.sources")}</span><ul>${cited.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>${s.year ? ` <span class="muted">(${s.year})</span>` : ""}</li>`).join("")}</ul></div>` : "") +
        (res.ntrs && res.ntrs.queries && res.ntrs.queries.length ? `<p class="note" style="margin-top:6px">${esc(t("ask.searched", { n: E.int(res.ntrs.total || 0), q: res.ntrs.queries[0].q }))}</p>` : "") +
        (res.confidence || res.gaps.length ? `<div class="badge-row">${res.confidence ? `<span class="pill ${/High/.test(res.confidence) ? "ok" : /Medium/.test(res.confidence) ? "warn" : "crit"}">${esc(t("ask.conf", { c: lv(res.confidence) }))}</span>` : ""}${res.gaps.map((g) => `<span class="pill warn" title="${esc(g)}">⚠ ${t("ask.gap")}: ${esc(g.split(/[.(;]/)[0])}</span>`).join("")}</div>` : "") +
        (res.notice ? `<p class="note" style="margin-top:8px">${esc(res.notice)}</p>` : "") +
        (res.engine ? `<div class="engine" style="margin-top:8px">${res.engine === "offline" ? t("eng.offline") : E.ai.providerName(res.provider) + " · " + esc(res.engine)}</div>` : "");
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
    }
    async function send(q, opts = {}) {
      $("#chat-in").value = "";
      if (E.ai.isStop(q)) { E.voice.stopSpeaking(); return; }
      const aloud = opts.voice || state.voiceMode;
      const u = document.createElement("div"); u.className = "msg user"; u.textContent = q; log.appendChild(u);
      const typing = document.createElement("div"); typing.className = "msg bot"; typing.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>'; log.appendChild(typing);
      log.scrollTop = log.scrollHeight;
      let res;
      try {
        res = await E.ai.ask(q, scenario(), state.chat, { mode: aloud ? "voice" : "text" });
        typing.remove();
        if (!res.emergency) state.chat.push({ role: "user", content: q }, { role: "assistant", content: res.text });
        pushBot(res);
      } catch (e) {
        typing.remove();
        pushBot({ text: t("ask.error", { e: e.message }), cites: [], confidence: "", gaps: [], engine: "" });
        return;
      }
      if (aloud) {
        const r = await E.voice.speak(res.spoken || E.ai.speakable(res.text), E.lang);
        if (!r.spoken && r.reason === "novoice") liveNote(t("v.noVoice", { lang: t("v.langName") }));
      }
    }

    /* ---- voice ---- */
    const mic = $("#mic"), live = $("#v-live");
    let noteTimer = null;
    function setLive(kind) {
      const txt = { listening: t("v.listening"), transcribing: t("v.transcribing"), wake: t("v.wakeOn"), heard: t("v.wakeHeard") }[kind] || "";
      live.textContent = txt; live.hidden = !txt; live.dataset.kind = kind || "";
      mic.classList.toggle("rec", kind === "listening");
    }
    function liveNote(msg) {
      live.textContent = msg; live.hidden = false; live.dataset.kind = "note";
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => setLive(state.wake ? "wake" : ""), 6000);
    }
    function beep() {
      try {
        const AC = window.AudioContext || window.webkitAudioContext, ctx = new AC(), o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880; g.gain.value = 0.08; o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.12);
        o.onended = () => ctx.close();
      } catch (e) { /* no audio */ }
    }
    async function voiceQuestion(pre, opts = {}) {
      E.voice.pauseWake();
      E.voice.stopSpeaking();
      try {
        const q = pre || (await E.voice.listen(E.lang, setLive, opts));
        setLive("");
        if (!q) liveNote(t("v.notHeard"));
        else await send(q, { voice: true });
      } catch (e) {
        setLive("");
        const denied = e.code === "not-allowed" || e.code === "service-not-allowed" || e.name === "NotAllowedError" || e.name === "SecurityError";
        liveNote(denied ? t("v.denied") : e.code === "unsupported" ? t("v.engNone") : t("ask.error", { e: e.message }));
      } finally {
        if (state.wake) { E.voice.resumeWake(); if (live.dataset.kind !== "note") setLive("wake"); }
      }
    }
    // Live state of the wake-word listener: microphone on or off, what it hears, the last error.
    const diag = { error: "", heard: "" };
    function wakeDiag(st) {
      const el = $("#v-diag");
      if (!el || !state.wake) return;
      if (st.error) diag.error = st.error;
      if (st.interim) { diag.heard = st.interim.slice(-70); diag.error = ""; }
      const names = { "uz-UZ": "O'zbek", "ru-RU": "Русский", "en-US": "English" };
      const parts = [(st.live ? "🎙 " + t("v.diagLive") : "○ " + t("v.diagOff")) + ` · ${names[st.lang] || st.lang}`];
      if (diag.heard) parts.push(t("v.diagHeard", { s: diag.heard }));
      if (diag.error) parts.push("⚠ " + (t("v.err." + diag.error) !== "v.err." + diag.error ? t("v.err." + diag.error) : t("v.errOther", { e: diag.error })));
      el.textContent = parts.join(" · ");
      el.hidden = false;
    }
    mic.addEventListener("click", () => (E.voice.isListening() ? E.voice.stopListening() : voiceQuestion()));
    $("#v-read").addEventListener("change", (e) => { state.voiceMode = e.target.checked; store.set("voiceMode", state.voiceMode); if (!state.voiceMode) E.voice.stopSpeaking(); });
    $("#v-wake").addEventListener("change", (e) => {
      state.wake = e.target.checked;
      if (!state.wake) { E.voice.stopWake(); setLive(""); $("#v-diag").hidden = true; return; }
      const ok = E.voice.startWake(E.lang, (rest) => {
        if (location.hash !== "#ask") location.hash = "ask";
        if (rest && rest.length > 2) voiceQuestion(rest);
        else { beep(); setLive("heard"); voiceQuestion("", { browser: true }); }
      }, (said) => {
        // show what was heard, so a missed wake word is visible instead of silent
        if (state.wake && !E.voice.isListening() && !E.voice.isSpeaking()) liveNote(t("v.wakeMiss", { s: said.slice(0, 60) }));
      }, wakeDiag);
      if (!ok) { e.target.checked = false; state.wake = false; liveNote(t("v.wakeUnsupported")); return; }
      setLive("wake");
    });
    $$("[data-cmd]", v).forEach((b) => b.addEventListener("click", () => send(t(b.dataset.cmd), { voice: true })));
    const stopBtn = $("#v-stop");
    stopBtn.addEventListener("click", () => E.voice.stopSpeaking());
    E.voice.onSpeaking((on) => { if (stopBtn.isConnected) stopBtn.hidden = !on; });
    E.voice.status().then((st) => {
      const canListen = (st && st.stt && E.voice.canRecord()) || E.voice.canBrowserListen();
      $("#v-eng").textContent = st && st.stt ? t("v.engOpenAI") : canListen ? t("v.engBrowser") : t("v.engNone");
      if (!canListen) { mic.disabled = true; mic.title = t("v.engNone"); }
      if (!E.voice.canBrowserListen()) { const w = $("#v-wake"); w.disabled = true; w.closest("label").title = t("v.wakeUnsupported"); }
    });
  }
  /* Offline app: service worker (http/https only), install button, live network status. */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => { /* offline mode simply unavailable */ }); });
  }
  let installEvt = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; const b = $("#install-btn"); if (b) b.hidden = false; });
  document.addEventListener("click", async (e) => {
    if (!e.target.closest || !e.target.closest("#install-btn") || !installEvt) return;
    installEvt.prompt();
    try { await installEvt.userChoice; } catch (err) { /* dismissed */ }
    installEvt = null; $("#install-btn").hidden = true;
  });
  window.addEventListener("online", () => updateEngine());
  window.addEventListener("offline", () => updateEngine());
  async function updateEngine() {
    const on = await E.ai.checkOnline();
    const el = $("#engine");
    if (el) { el.innerHTML = on ? t("ask.online", { p: E.ai.providerName(on.provider), m: esc(on.model) }) : t("ask.offline"); el.classList.toggle("on", !!on); el.classList.toggle("off", !on); }
    updateKb(on);
  }
  // Knowledge-base size: curated record plus the NASA reports that live search reaches.
  let corpus = null;
  async function updateKb(on) {
    const el = $("#kb-line");
    if (!el) return;
    const base = t("kb.base", { inv: E.INVESTIGATIONS.length, ins: E.INSIGHTS.length });
    if (!on) { el.innerHTML = base; return; }
    if (!corpus) {
      try {
        const r = await fetch((window.VULKAN_CONFIG && window.VULKAN_CONFIG.corpusUrl) || "api/corpus");
        corpus = r.ok ? (await r.json()).ntrs || {} : {};
      } catch (e) { corpus = {}; }
    }
    const nf = (n) => E.int(n || 0);
    const c = (k) => corpus[k] > 0;
    const v = { mc: nf(corpus["microgravity combustion"]), sf: nf(corpus["spacecraft fire"]), fl: nf(corpus["flammability"]), fs: nf(corpus["fire suppression"]), sd: nf(corpus["smoke detection"]) };
    const all = ["microgravity combustion", "spacecraft fire", "flammability", "fire suppression", "smoke detection"].every(c);
    el.innerHTML = base + " " + (all ? t("kb.ntrs", v) : c("microgravity combustion") && c("spacecraft fire") && c("flammability") ? t("kb.ntrs3", v) : t("kb.ntrsLive"));
  }

  /* ---------------- gaps & earth ---------------- */
  const MODEL_SRC = ["hirsch2010", "hirsch2011", "hirsch2007", "bass2013", "bass2014", "zhao2015", "bass2019", "ferkul2026"];
  function renderGaps() {
    const allSrc = new Map();
    E.INVESTIGATIONS.forEach((i) => i.links.forEach((l) => allSrc.set(l.url, l.label)));
    E.INCIDENTS.forEach((x) => x.link && allSrc.set(x.link.url, x.link.label));
    E.SPINOFFS.forEach((x) => allSrc.set(x.link.url, x.link.label));
    $("#view-gaps").innerHTML = `
      <div class="view-head"><div><h2>${t("gp.title")}</h2><p>${t("gp.desc")}</p></div></div>
      <div class="grid g2">
        ${E.GAPS.map((g) => `<div class="panel gap-card" style="border-left-color:var(--${g.severity === "crit" ? "crit" : g.severity === "warn" ? "warn" : "flame"})"><div class="panel-title"><h3>${esc(g.title)}</h3><span class="pill ${g.severity === "crit" ? "crit" : g.severity === "warn" ? "warn" : ""}">${t("gp." + g.severity)}</span></div><p style="font-size:.92rem">${esc(g.text)}</p><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${g.inv.map((id) => `<button class="cite" data-inv="${id}" type="button">${esc(invById(id).name)}</button>`).join("")}</div></div>`).join("")}
      </div>
      <h2>${t("gp.earth")}</h2>
      <div class="grid g4">${E.SPINOFFS.map((x) => `<div class="panel spin-card"><div class="eyebrow">${esc(x.era)}</div><h3 style="margin:6px 0">${esc(x.title)}</h3><p style="font-size:.9rem">${esc(x.text)}</p><p style="margin-top:8px;font-size:.85rem"><a href="${x.link.url}" target="_blank" rel="noopener">${esc(x.link.label)}</a></p></div>`).join("")}</div>
      <div class="panel"><h3>${t("gp.refs")}</h3><ul class="findings" style="margin-top:8px;font-size:.88rem">${[...allSrc].map(([u, l]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(l)}</a></li>`).join("")}</ul>
        <h4 style="margin-top:14px">${t("gp.refsModel")}</h4><ul class="findings" style="margin-top:8px;font-size:.88rem">${MODEL_SRC.filter((k) => E.SRC[k]).map((k) => `<li><a href="${E.SRC[k].url}" target="_blank" rel="noopener">${esc(E.SRC[k].label)}</a></li>`).join("")}<li>${t("gp.loi")}</li></ul></div>`;
  }

  /* ---------------- boot ---------------- */
  E.initLang();
  initTop();
  updateChip();
  route();
})();
