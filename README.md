# VULKAN: fire-safety insights from NASA microgravity combustion data

*Vulkan* means "volcano" in Uzbek and Russian. You wake the voice assistant with "Hey VULKAN", an everyday word that speakers of both languages say naturally; the recogniser also accepts the Uzbek literary form "vulqon" and the English spelling "Vulcan".

**NASA Space Apps Challenge 2026 · Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data**

**Live app:** https://flame-in-freefall-eight.vercel.app · **Demo deck (7 slides):** [VULKAN-demo.pdf](docs/VULKAN-demo.pdf) · **30-second video:** [VULKAN-30s.mp4](docs/VULKAN-30s.mp4)

VULKAN turns decades of NASA microgravity combustion experiments into ranked, explained fire-safety insights for Moon and Mars missions. Pick a mission (ISS, lunar habitat, pressurized rover, Mars habitat, Mars transit, spacesuit) and every view re-ranks and re-interprets the evidence for that atmosphere and gravity level.

## Team Rescuers

| Member | Role |
|---|---|
| Xurramov Shoxjaxon Zokirovich | Team mentor |
| Tursunov Sardorbek Qahramon o‘g‘li | Frontend developer |
| Roziqov Shohijahon Rashid o‘g‘li | Backend developer |
| Boboqulov Ozodbek Rustam o‘g‘li | Pitch presenter |
| Xamidov Boburjon Murodjon o‘g‘li | UI/UX designer |
| Ismatov Behruz Fahriddin o‘g‘li | AI / ML engineer |

## What it does

| View | What you get |
|---|---|
| **Overview** | The evidence gap in one line (of 7 solid-material flight investigations, 6 tested ISS air, 2 tested Moon-base air, 0 tested Moon or Mars gravity), then ten fire-safety insights ranked by mission impact, each with a recommended action and citations; the top investigations for your mission; a timeline from Apollo 1 to FM2. |
| **Investigation Atlas** | 19 curated investigations (BASS, BASS-II, BASS-M, Saffire I–VI, SoFIE, FLEX, FLEX-2, CFI, CFI-G, ACME, SPICE, SLICE, SAME, DAFT, SSCE, SOFBALL, FM2, FLARE) with objectives, fuels and sample sizes, O₂ / pressure / flow, diluents, diagnostics, findings and prevention / detection / suppression implications. Full-text search, filters, and side-by-side comparison of up to three. |
| **Flammability Map** | Every investigation's tested O₂–pressure envelope against real spacecraft atmospheres (ISS, Shuttle 10.2 psia, Moon base, 8.2 psia exploration atmosphere, spacesuit, Apollo 1). Shows at a glance that most data sits at 21 % O₂ / 1 atm, and how little covers exploration atmospheres. |
| **Fire Risk Explorer** | A transparent, physics-informed screening model: choose material, O₂, pressure, gravity and ventilation, and see whether a flame can spread, the margin to the limit, a limiting-O₂-vs-flow curve with Moon / Mars / Earth markers, and which flight data supports the estimate, with a likely range. Below it: “How accurate is this model?”, the model scored against 12 NASA measurements, and VULKAN's frozen predictions for NASA's FM2 Moon experiment. **Save report (PDF)** prints the current estimate as a two-page fire-risk report. **New test results** takes results NASA publishes later (FM2, FLARE, new White Sands tests): VULKAN checks its model against each one, scores the frozen FM2 predictions, and Ask VULKAN cites it. Reviewed results ship in `data/results.js`; anyone can add their own in the browser and export them as JSON. |
| **Mission Ranker** | Scores every investigation for the mission with adjustable weights (atmosphere match, hazard relevance, fire scale, data richness, recency) and explains each score. |
| **Ask VULKAN** | Natural-language Q&A. BM25 retrieval over 153 evidence passages (investigations, insights, history, physics, NASA material tests and the model check), then Claude answers only from those passages with citations. It can explain its own model too: ask “How accurate is VULKAN's fire model?” or “What does VULKAN predict for FM2?”. Offline, a local reasoner answers from the same evidence, runs the model and the ranker, and flags research gaps. |
| **Live NASA reports** | Every AI answer also searches the [NASA Technical Reports Server](https://ntrs.nasa.gov) (NTRS) public API for that question: a cheap model turns the question, in any of the three languages, into English keywords; the matching report abstracts join the evidence and are cited with links (`[NTRS-…]`). This reaches thousands of NASA reports on microgravity combustion, spacecraft fire, flammability, suppression and detection; the Ask view shows the live counts. When the NASA sources do not answer, the model may add general knowledge, always marked "general knowledge, not NASA data". |
| **Voice assistant** | A microphone button in Ask VULKAN: speak a question, get the answer on screen and read aloud. Voice mode gives a short answer with the key action first. Hands-free mode listens for “Hey VULKAN”. Saying or typing “fire” or “smoke” returns cited immediate actions instantly, with no AI call; “stop” silences the voice. Works in English, Russian and Uzbek. |
| **EN / RU / UZ** | The whole interface and the curated content (investigations, insights, gaps, history, atmospheres, materials) are available in English, Russian and Uzbek. The switch is in the top bar and is remembered per browser. Ask VULKAN retrieves evidence in the chosen language, parses questions written in any of the three, and Claude answers in that language. |
| **Gaps & Earth** | Ranked research gaps (partial gravity, exploration atmospheres, detection of cool flames…) linked to planned investigations, NASA spinoffs, and the full reference list. |

## Run it

It is a static site with no build step.

```bash
python3 -m http.server 8080   # then open http://localhost:8080
```

**Deploy with AI and voice (Vercel):** import the repo in Vercel, add one or both keys as environment variables, deploy. `api/ask.js` and `api/voice.js` become serverless functions and keys never reach the browser.

| Variable | What it enables |
|---|---|
| `ANTHROPIC_API_KEY` | Claude answers in Ask VULKAN (used first when set). |
| `OPENAI_API_KEY` | Voice: speech recognition (`gpt-4o-mini-transcribe`) and a natural voice (`gpt-4o-mini-tts`). Also answers questions with `gpt-4o-mini` when no Anthropic key is set. |
| `OPENAI_MODEL`, `OPENAI_STT_MODEL`, `OPENAI_TTS_MODEL`, `OPENAI_TTS_VOICE` | Optional overrides (defaults above, voice `cedar`). OpenAI lists the current audio models as deprecated with shutdown in early 2027; set `OPENAI_STT_MODEL=gpt-transcribe` when switching. |
| `ALLOWED_ORIGINS` | Optional extra sites (comma-separated hosts) allowed to call the API. |

Cost controls for a small prepaid balance: questions use a cheap model with a capped answer length, recordings are limited to about 15 seconds, spoken text to 500 characters, each IP to 20 requests a minute per instance, and other websites cannot call the API. Emergency commands and the “Hey VULKAN” wake word cost nothing (they run in the browser). Rough cost with OpenAI: about $0.001 per typed question and under $0.01 per spoken question with a spoken answer.

Without keys (for example on GitHub Pages) the app runs fully with the offline reasoner, and voice uses the browser's built-in speech (best in Chrome or Edge). For Uzbek, a natural Uzbek voice installed in the browser (Microsoft Edge ships them) is used first, otherwise the OpenAI voice. Uzbek answers are rewritten for speech before they are read (numbers, units, Roman numerals and acronyms become Uzbek words), because voices otherwise read digits in English.

**Tests:** `npm test` checks the serverless functions with a mocked API (provider choice, voice requests, cost caps, origin check, rate limit), and the flammability model calibration, the NASA validation checks (no unsafe misses), the frozen FM2 predictions, the physical trends it must reproduce, Ask VULKAN's answers about its own accuracy, FM2 predictions and material limits in all three languages, ranking integrity, citations and retrieval, and that the Russian and Uzbek translations are complete and answer every suggested question.

## The flammability model (Fire Risk Explorer)

Kept deliberately simple so judges and engineers can audit it. Version 2 takes every constant from a NASA measurement:

1. **Normal-gravity anchor:** NASA's upward-burning limit, the NASA-STD-6001 Test 1 Maximum Oxygen Concentration (MOC), at the pressure NASA measured it (NASA White Sands, [NTRS 20100015582](https://ntrs.nasa.gov/citations/20100015582), [NTRS 20110008636](https://ntrs.nasa.gov/citations/20110008636)). 7 of 11 materials have a NASA value; the rest fall back to the Limiting Oxygen Index and are flagged as unverified with a ±3-point band.
2. **Pressure:** NASA's measured linear rule, the limit rises 0.607 points per psi of lower pressure (range 0.251–0.975).
3. **Microgravity:** the lowest limit sits 2.4 points below the normal-gravity limit (BASS-II: a 1/4-in acrylic rod burned at 13.6 % O₂ in orbit against 16 % in 1 g, [NTRS 20160000593](https://ntrs.nasa.gov/citations/20160000593)).
4. **Flow:** quenching below about 5 cm/s for thin fabrics (BASS-II cotton-fiberglass quenched at 2.2–5 cm/s) and 1.5 cm/s for thick acrylic, blow-off above about 40 cm/s ([NTRS 20150008962](https://ntrs.nasa.gov/citations/20150008962)). Still air keeps a small flame-induced flow (SSCE: paper spread in still air only when oxygen-enriched).
5. **Gravity:** buoyant flow 30 cm/s × (g/g₀)^⅓ feeds the flame, and buoyant stretch adds the 2.4-point penalty back as √g. Partial gravity therefore comes out as nearly the most flammable condition, as NASA's lunar-gravity ground tests indicate ([Ferkul, LPSC 2026](https://ntrs.nasa.gov/citations/20260001966)).

**How accurate is it?** The app checks the model live against 12 NASA measurements (Fire Risk Explorer → "How accurate is this model?"):

| | Correct | Unsafe misses | Too cautious |
|---|---|---|---|
| v1, calibrated to the Limiting Oxygen Index | 3 | 8 | 1 |
| v2, anchored to NASA data | 10 | 0 | 2 |

An unsafe miss means the model called a material safe where NASA saw it burn or measured a lower limit. The LOI turned out to be a poor guide to NASA's upward test: Kapton film's LOI is 37 % but its NASA MOC is 26 % at 14.7 psia, so v1 wrongly called Kapton safe in Moon-base air. Nine of the twelve checks were used to set a constant (marked † in the app); three are independent. The two cautious misses are narrow BASS samples that burned less easily than the model allows.

**Pre-registered FM2 predictions.** NASA's FM2 will burn fabric upward in lunar gravity at 8.2 psia with 37, 33, 29 and 25 % O₂. VULKAN predicts Nomex burns at 37, 33 and 29 % and is too close to call at 25 % (lunar limit 24.8 %, range 22.6–27.0 %), inside NASA's own expected 24–26 % window for its test fabric. The predictions were frozen in this repository on 2026-11-14, before FM2 flies.

It is a screening and teaching tool, not a certification method (NASA-STD-6001 remains the standard). Partial-gravity results are always flagged as extrapolations because PSI has no lunar or Mars combustion data yet.

## Works offline

VULKAN is an installable web app. After the first visit, a service worker (`sw.js`) keeps the app files, so it opens and answers questions with no network: the curated record, the flammability model and the offline reasoner all run in the browser. Live AI answers and the NTRS search return when the network does.

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
docs/                    submission text, demo deck (VULKAN-demo.pdf), 30-second video (VULKAN-30s.mp4) and demo script
tests/                   model checks
```

## Use of AI

- **Code and data:** written by the team with help from Anthropic's Claude as a coding and research assistant, and reviewed by the team. Commits made with that help carry a `Co-Authored-By: Claude` trailer, and `index.html` has an `ai-disclosure` meta tag.
- **Answers:** Ask VULKAN answers are generated at runtime by Claude or an OpenAI model from cited NASA passages. Anything not backed by those passages is labelled "general knowledge, not NASA data".
- **Audio:** spoken answers use AI-generated speech (OpenAI text-to-speech) or the browser's own voice. The interface says so next to the voice controls, and `api/voice.js` returns an `x-ai-generated` header with each audio clip.
- **Deck:** the demo slides were laid out with AI help; their images are screenshots of the app.
- **Demo video:** the narration is AI-generated speech (OpenAI gpt-4o-mini-tts, made through VULKAN's own voice endpoint). The video was edited with AI help from screen captures of the app. This is stated here, in the MP4 metadata and in the video description wherever the video is posted.

No AI-generated images or video are used, and no NASA logos or branding appear anywhere.

## License

MIT. NASA data is public domain; see the References panel in the app for every source.
