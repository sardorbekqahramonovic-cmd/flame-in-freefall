# EMBER: Exploration Microgravity Burn Evidence Reasoner

**NASA Space Apps Challenge 2026 · Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data**

EMBER turns decades of NASA microgravity combustion experiments into ranked, explained fire-safety insights for Moon and Mars missions. Pick a mission (ISS, lunar habitat, pressurized rover, Mars habitat, Mars transit, spacesuit) and every view re-ranks and re-interprets the evidence for that atmosphere and gravity level.

## What it does

| View | What you get |
|---|---|
| **Overview** | Ten fire-safety insights ranked by mission impact, each with a recommended action and citations; the top investigations for your mission; a timeline from Apollo 1 to FM2. |
| **Investigation Atlas** | 19 curated investigations (BASS, BASS-II, BASS-M, Saffire I–VI, SoFIE, FLEX, FLEX-2, CFI, CFI-G, ACME, SPICE, SLICE, SAME, DAFT, SSCE, SOFBALL, FM2, FLARE) with objectives, fuels and sample sizes, O₂ / pressure / flow, diluents, diagnostics, findings and prevention / detection / suppression implications. Full-text search, filters, and side-by-side comparison of up to three. |
| **Flammability Map** | Every investigation's tested O₂–pressure envelope against real spacecraft atmospheres (ISS, Shuttle 10.2 psia, Moon base, 8.2 psia exploration atmosphere, spacesuit, Apollo 1). Shows at a glance that most data sits at 21 % O₂ / 1 atm, and how little covers exploration atmospheres. |
| **Fire Risk Explorer** | A transparent, physics-informed screening model: choose material, O₂, pressure, gravity and ventilation, and see whether a flame can spread, the margin to the limit, a limiting-O₂-vs-flow curve with Moon / Mars / Earth markers, and which flight data supports the estimate. |
| **Mission Ranker** | Scores every investigation for the mission with adjustable weights (atmosphere match, hazard relevance, fire scale, data richness, recency) and explains each score. |
| **Ask EMBER** | Natural-language Q&A. BM25 retrieval over 139 evidence passages, then Claude answers only from those passages with citations. Offline, a local reasoner answers from the same evidence, runs the model and the ranker, and flags research gaps. |
| **Gaps & Earth** | Ranked research gaps (partial gravity, exploration atmospheres, detection of cool flames…) linked to planned investigations, NASA spinoffs, and the full reference list. |

## Run it

It is a static site with no build step.

```bash
python3 -m http.server 8080   # then open http://localhost:8080
```

**Deploy with AI (Vercel):** import the repo in Vercel, add the environment variable `ANTHROPIC_API_KEY`, deploy. `api/ask.js` becomes a serverless function and the Ask EMBER panel switches to Claude automatically. Without a key (for example on GitHub Pages) the app runs fully with the offline reasoner.

**Tests:** `npm test` checks the flammability model calibration, the physical trends it must reproduce, ranking integrity, citations and retrieval.

## The flammability model (Fire Risk Explorer)

Kept deliberately simple so judges and engineers can audit it:

1. Flow at the flame = vector sum of ventilation and buoyant flow, with buoyant flow ≈ 30 cm/s × (g/g₀)^⅓.
2. The limiting O₂ concentration is U-shaped in that flow, as measured for solids in microgravity: oxygen starvation and quenching at very low flow (SSCE), a minimum a few points below the 1 g limit at low-speed flow (BASS), blow-off at high flow.
3. Lower pressure raises the limit slightly (+3 × ln(101.3 / P)).
4. Calibrated so that at 1 g and 1 atm the limit equals the material's Limiting Oxygen Index.

It reproduces the key flight trends: thin fuels self-extinguish in quiescent microgravity, burn with ventilation, Nomex is safe in ISS air but flammable at 34 % O₂ / 8.2 psia, and PTFE stays non-flammable. It is a screening and teaching tool, not a certification method (NASA-STD-6001 remains the standard). Partial-gravity results are always flagged as extrapolations because PSI has no lunar or Mars combustion data yet.

## Data

All records are curated from public NASA sources and link back to them: the [PSI Data Repository](https://psi.nasa.gov/physci/repo/search?q=combustion), [NASA Glenn Combustion Science](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/), NASA investigation fact sheets, and [A Researcher's Guide to ISS Combustion Science](https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/). Values marked ≈ are curator estimates where the source gives no explicit range. Data lives in `data/investigations.js` and `data/insights.js`, so adding an investigation means adding one object.

## Project layout

```
index.html, styles.css   UI shell and design tokens (light and dark)
app.js                   views, charts (hand-built SVG), drawer, chat UI
model.js                 flammability model, mission ranker, BM25 retrieval
ai.js                    Claude client + offline reasoner
api/ask.js               serverless Claude endpoint (key stays server-side)
data/                    curated investigations, atmospheres, materials, insights
docs/                    submission text and demo video script
tests/                   model checks
```

## License

MIT. NASA data is public domain; see the References panel in the app for every source.
