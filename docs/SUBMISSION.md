# VULKAN: Space Apps 2026 project page text (English)

Paste each section into the field with the same name on the Project Submission page. Fields are in the order the form shows them. Before you press **Submit for Judging**:

1. Open both links in a private browser window to confirm they open with no login.
2. Check the team name (Rescuers) and the member names on slide 1 of the deck and on the video's end card.
3. Upload 2–3 screenshots from `docs/images/` (PNG, each under 10 MB) as the project images.

---

## Project Name

VULKAN: Fire-Safety Insights from NASA Microgravity Combustion Data

## High-Level Project Summary

VULKAN is an AI-powered fire-safety assistant that turns decades of NASA microgravity combustion experiments into ranked, cited answers for Moon and Mars missions. We curated 19 NASA investigations, from Shuttle-era flame balls to the spacecraft-scale Saffire fires, into one searchable atlas. Users pick a mission (ISS, lunar habitat, rover, Mars habitat, spacesuit), and VULKAN then does four things:

- ranks the evidence for that atmosphere and gravity
- maps where flight data is missing
- estimates whether a material can burn, using a transparent physics-informed model
- answers questions by text or voice in English, Russian or Uzbek, citing NASA sources and NASA technical reports it searches live

This matters because Artemis habitats will run at higher oxygen and lower pressure than any vehicle flown so far. Most flight fire data was taken in sea-level air, and no combustion data yet exists at lunar or Martian gravity.

## Link to Project Demo

https://flame-in-freefall-eight.vercel.app/docs/VULKAN-demo.pdf

(7-slide deck, English. The same file is in the repository: https://github.com/sardorbekqahramonovic-cmd/flame-in-freefall/blob/main/docs/VULKAN-demo.pdf)

## Link to Final Project

https://flame-in-freefall-eight.vercel.app

(Source code: https://github.com/sardorbekqahramonovic-cmd/flame-in-freefall)

## Detailed Project Description

**What it does.** VULKAN has seven views:

- **Overview** ranks ten fire-safety insights by mission impact. Each insight has a recommended engineering action and its citations.
- **Investigation Atlas** summarizes every investigation: objectives, fuels and sample sizes, oxygen, pressure and flow ranges, diluents, sensors and findings. It has search, filters and side-by-side comparison.
- **Flammability Map** plots each investigation's tested oxygen–pressure range against real spacecraft atmospheres. It shows that most data sits at 21% O₂ and 1 atm. Exploration atmospheres (30–34% O₂ at 8.2–10.2 psia) are covered only by Saffire IV–VI and SoFIE.
- **Fire Risk Explorer** estimates whether a material can sustain a flame at any oxygen level, pressure, gravity and ventilation speed, and shows the flight data behind the estimate.
- **Mission Ranker** scores investigations with weights the team can adjust and explains each score.
- **Ask VULKAN** answers plain-language questions with citations, a confidence level and research-gap warnings.
- **Gaps & Earth** lists the open questions, the planned investigations that will answer them (FM2, FLARE), and NASA fire-safety spinoffs.

**Languages and voice.** The interface, the curated content and the answers are available in English, Russian and Uzbek. Engineers and students who do not read English can use the NASA record too.

A voice assistant lets users ask by speaking and hear the answer. Voice answers are short and give the key action first. A hands-free mode listens for "Hey VULKAN". The commands "fire" and "smoke" return cited immediate actions instantly, even offline. These are labelled as training guidance, not official procedure.

**How it works.** VULKAN is a static web app (HTML, CSS, JavaScript and hand-built SVG charts). It loads fast and runs offline. The intelligence layer has four parts:

1. **Curated record.** A retrieval engine indexes 139 evidence passages built from the curated NASA data.
2. **Live NASA reports.** For each question, an AI model writes two English keyword searches, and VULKAN queries the NASA Technical Reports Server (NTRS) public API. The matching report abstracts are added as extra evidence, cited by their NTRS record number. NTRS holds 1,077 records on microgravity combustion, 871 on spacecraft fire and 682 on flammability.
3. **Answer model.** Claude (Anthropic) or an OpenAI model answers from these passages only, and must cite each claim. When the NASA evidence does not cover a question, VULKAN says what data is missing. Any background it adds is labelled "general knowledge, not NASA data". API keys stay in serverless functions, with rate limits and cost caps.
4. **Offline reasoner.** When no AI service is available, an offline reasoner answers from the same evidence.

Whenever a question mentions a material, atmosphere or mission, VULKAN also runs the flammability model and the ranker. The flammability model rests on three pieces of physics:

- the U-shaped dependence of limiting oxygen on flow speed, measured for solids in microgravity
- buoyant flow that scales with gravity to the one-third power
- a mild pressure correction

It is calibrated so that at 1 g and 1 atm it equals each material's Limiting Oxygen Index. Automated tests check that it reproduces the flight results:

- thin fuels go out in still microgravity air
- they burn again when ventilation is added
- some materials burn at lower oxygen in slow microgravity flow than in normal gravity
- Nomex, safe in ISS air, becomes flammable at 34% O₂ and 8.2 psia

**Benefits.**

- **Researchers and students** can find, compare and understand results in minutes instead of reading dozens of reports.
- **Engineers** get a mission-specific shortlist and concrete actions:
  - correct 1 g material tests for microgravity
  - re-screen fabrics for exploration atmospheres
  - size inert-gas extinguishers from FLEX data
  - specify sub-micron smoke detection (SAME)
  - confirm extinguishment with gas sensors, because cool flames burn invisibly (FLEX, CFI)
- **Mission planners** see exactly where evidence is thin, especially at partial gravity.

On Earth, the same questions apply to oxygen-enriched rooms, submarines and aircraft cargo bays.

**Goals.**

- Make NASA's combustion record usable by people who are not combustion specialists, in their own language.
- Be honest about uncertainty. Every record links to its NASA source, and estimated values are marked. Partial-gravity results are always flagged as extrapolations.
- The model is a screening and teaching tool, not a certification method (NASA-STD-6001 remains the standard).

Next, we want to add the FM2 and FLARE results as they are published, native Uzbek neural voices, and more material data.

**Tools.**

- HTML, CSS and JavaScript, with no framework and no build step
- SVG charts and the Web Speech API
- Node.js serverless functions on Vercel
- the NASA NTRS public API
- the Anthropic Claude API
- the OpenAI API: gpt-4o-mini for answers and search keywords, gpt-4.1 for Uzbek answers, gpt-4o-mini-transcribe for speech recognition and gpt-4o-mini-tts for speech
- GitHub for code hosting

## NASA Data

We curated 19 combustion investigations, 10 insights, 12 historic events and 139 evidence passages from the NASA sources below. Each record in the app links back to its source.

- **PSI Data Repository, Combustion Science.** The primary source for investigation conditions, fuels, diagnostics and findings: https://psi.nasa.gov/physci/repo/search?q=combustion
- **NASA Technical Reports Server (NTRS).** Its public search API is queried live for every AI answer, and the abstracts it returns are cited by record number: https://ntrs.nasa.gov
- **NASA Glenn Combustion Science.** Investigation pages, including SoFIE, FM2 and FLARE: https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/
- **A Researcher's Guide to International Space Station Combustion Science:** https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/
- **NASA investigation fact sheets:** BASS, FLEX, Saffire, SAME, DAFT, SPICE, SLICE and ACME (nasa.gov)
- **NASA Safety & Mission Assurance:** Apollo 1 and Apollo 13 lessons learned
- **NASA History:** "25 Years Ago: Fire Aboard Space Station Mir"
- **NASA Spinoff:** "Fireman's Air Tanks", "Fire Detector" and "New Technology for the Fire Attire"
- **NASA ScienceCasts:** "The Power of Studying Combustion on the ISS"

How we used them:

- The investigation records drive the atlas, the oxygen–pressure map and the mission ranker.
- Flight results (BASS, SSCE, Saffire IV–VI) calibrate and test the flammability model.
- PSI's lack of partial-gravity data defines the research gaps that the app flags.
- NTRS abstracts widen the evidence for questions the curated record does not cover.

## Space Agency Partner & Other Data

**Space agency partner data.** These contributions are referenced through NASA sources:

- JAXA: the FLEX-2J droplet-array experiment
- Italy's CNR Istituto Motori: FLEX-ICE-GA
- the JAXA-led FLARE collaboration with ESA, CNES and DLR

**Other data, references and tools:**

- Meyer et al. (2018), "Evaluation of spacecraft smoke detector performance in the low-gravity environment", *Fire Safety Journal*, doi:10.1016/j.firesaf.2018.04.004
- Limiting Oxygen Index values: typical ASTM D2863 literature values for each material
- Fonts: Archivo, IBM Plex Sans and IBM Plex Mono (Google Fonts, SIL Open Font License)
- Anthropic Claude API and the @anthropic-ai/sdk package (MIT license)
- OpenAI API (models listed under Tools)
- Web Speech API (built into the browser)
- Vercel (hosting) and GitHub (code)

All other code, text and images are original work by the team. The images in the deck are screenshots of the app. No copyrighted images are used.

## Use of Artificial Intelligence

Yes, we used AI, in five ways:

1. **Building the project (code, data, text).** We used Anthropic's Claude as a coding and research assistant. It helped us curate the dataset from the NASA sources above, write code, and draft documentation and this text. The team reviewed everything and is responsible for it. This is disclosed in the README ("Use of AI"), in the site footer, and in an `ai-disclosure` meta tag in `index.html`. Commits made with AI help carry a `Co-Authored-By: Claude` trailer.
2. **Answers in the running app.** Claude or an OpenAI model (gpt-4o-mini; gpt-4.1 for Uzbek) answers user questions. It uses only the curated NASA evidence and NASA report abstracts found live in NTRS, and it cites its sources. Anything not supported by those sources is labelled "general knowledge, not NASA data". The "fire" and "smoke" checklists were written by the team from the cited NASA evidence, not generated by AI.
3. **AI-generated audio.** Spoken answers use AI-generated speech from OpenAI gpt-4o-mini-tts, or the browser's own voice. The interface says so next to the voice controls. Every audio response from our server carries an `x-ai-generated` metadata header naming the model. Speech recognition uses OpenAI gpt-4o-mini-transcribe or the browser.
4. **Demo deck.** The slides were laid out with AI help, and their footer says so. Every image in the deck is a screenshot of the app.
5. **Demo video.** The 30-second video's narration is AI-generated speech (OpenAI gpt-4o-mini-tts, produced through VULKAN's own voice endpoint). This is stated in the video description and in the MP4 file's metadata. The video was edited with AI help from screen captures of the app and contains no AI-generated imagery.

We used no AI-generated images or video. No NASA logos, flags, mission identifiers or other branding appear in the app, the deck or any generated content.
