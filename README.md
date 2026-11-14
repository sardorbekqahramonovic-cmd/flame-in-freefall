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
| **Voice assistant** | A microphone button in Ask EMBER: speak a question, get the answer on screen and read aloud. Voice mode gives a short answer with the key action first. Hands-free mode listens for “Hey EMBER”. Saying or typing “fire” or “smoke” returns cited immediate actions instantly, with no AI call; “stop” silences the voice. Works in English, Russian and Uzbek. |
| **EN / RU / UZ** | The whole interface and the curated content (investigations, insights, gaps, history, atmospheres, materials) are available in English, Russian and Uzbek. The switch is in the top bar and is remembered per browser. Ask EMBER retrieves evidence in the chosen language, parses questions written in any of the three, and Claude answers in that language. |
| **Gaps & Earth** | Ranked research gaps (partial gravity, exploration atmospheres, detection of cool flames…) linked to planned investigations, NASA spinoffs, and the full reference list. |

## Run it

It is a static site with no build step.

```bash
python3 -m http.server 8080   # then open http://localhost:8080
```

**Deploy with AI and voice (Vercel):** import the repo in Vercel, add one or both keys as environment variables, deploy. `api/ask.js` and `api/voice.js` become serverless functions and keys never reach the browser.

| Variable | What it enables |
|---|---|
| `ANTHROPIC_API_KEY` | Claude answers in Ask EMBER (used first when set). |
| `OPENAI_API_KEY` | Voice: speech recognition (`gpt-4o-mini-transcribe`) and a natural voice (`gpt-4o-mini-tts`). Also answers questions with `gpt-4o-mini` when no Anthropic key is set. |
| `OPENAI_MODEL`, `OPENAI_STT_MODEL`, `OPENAI_TTS_MODEL`, `OPENAI_TTS_VOICE` | Optional overrides (defaults above, voice `coral`). OpenAI lists the current audio models as deprecated with shutdown in early 2027; set `OPENAI_STT_MODEL=gpt-transcribe` when switching. |
| `ALLOWED_ORIGINS` | Optional extra sites (comma-separated hosts) allowed to call the API. |

Cost controls for a small prepaid balance: questions use a cheap model with a capped answer length, recordings are limited to about 15 seconds, spoken text to 500 characters, each IP to 20 requests a minute per instance, and other websites cannot call the API. Emergency commands and the “Hey EMBER” wake word cost nothing (they run in the browser). Rough cost with OpenAI: about $0.001 per typed question and under $0.01 per spoken question with a spoken answer.

Without keys (for example on GitHub Pages) the app runs fully with the offline reasoner, and voice uses the browser's built-in speech (best in Chrome or Edge; spoken Uzbek needs the OpenAI voice because browsers rarely ship an Uzbek voice).

**Tests:** `npm test` checks the serverless functions with a mocked API (provider choice, voice requests, cost caps, origin check, rate limit), and the flammability model calibration, the physical trends it must reproduce, ranking integrity, citations and retrieval, and that the Russian and Uzbek translations are complete and answer every suggested question.

## The flammability model (Fire Risk Explorer)

Kept deliberately simple so judges and engineers can audit it:

1. Flow at the flame = vector sum of ventilation and buoyant flow, with buoyant flow ≈ 30 cm/s × (g/g₀)^⅓.
2. The limiting O₂ concentration is U-shaped in that flow, as measured for solids in microgravity: oxygen starvation and quenching at very low flow (SSCE), a minimum a few points below the 1 g limit at low-speed flow (BASS), blow-off at high flow.
3. Lower pressure raises the limit slightly (+3 × ln(101.3 / P)).
4. Calibrated so that at 1 g and 1 atm the limit equals the material's Limiting Oxygen Index.

It reproduces the key flight trends: thin fuels self-extinguish in quiescent microgravity, burn with ventilation, Nomex is safe in ISS air but flammable at 34 % O₂ / 8.2 psia, and PTFE stays non-flammable. It is a screening and teaching tool, not a certification method (NASA-STD-6001 remains the standard). Partial-gravity results are always flagged as extrapolations because PSI has no lunar or Mars combustion data yet.

## Data

All records are curated from public NASA sources and link back to them: the [PSI Data Repository](https://psi.nasa.gov/physci/repo/search?q=combustion), [NASA Glenn Combustion Science](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/), NASA investigation fact sheets, and [A Researcher's Guide to ISS Combustion Science](https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/). Values marked ≈ are curator estimates where the source gives no explicit range. Data lives in `data/investigations.js` and `data/insights.js`, so adding an investigation means adding one object. Translations live in `data/l10n-ru.js` and `data/l10n-uz.js` (any field left out falls back to English), and interface strings in `i18n.js`.

## Project layout

```
index.html, styles.css   UI shell and design tokens (light and dark)
app.js                   views, charts (hand-built SVG), drawer, chat UI
i18n.js                  interface strings in EN / RU / UZ and the language switch
model.js                 flammability model, mission ranker, BM25 retrieval
ai.js                    AI client (Claude or OpenAI) + offline reasoner + emergency commands
voice.js                 speech in/out: OpenAI via api/voice, or the browser's Web Speech API; wake word
api/ask.js               serverless Q&A endpoint: Claude, or OpenAI as a low-cost option
api/voice.js             serverless speech-to-text and text-to-speech (OpenAI)
data/                    curated investigations, atmospheres, materials, insights, RU / UZ translations
docs/                    submission text and demo video script
tests/                   model checks
```

## License

MIT. NASA data is public domain; see the References panel in the app for every source.
