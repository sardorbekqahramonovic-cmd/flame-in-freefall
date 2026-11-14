# Space Apps 2026 project submission text (English)

Copy each section into the matching field of the Project Submission page. Replace the bracketed links before submitting.

---

## Project name

SARDOR: Safety Assistant for Risk and Data from Orbital Research (*sardor* is Uzbek for "leader" or "commander")

## High-level project summary

SARDOR is an interactive, AI-powered fire-safety atlas that turns decades of NASA microgravity combustion experiments into ranked, explained insights for Moon and Mars missions. We curated 19 investigations, from Shuttle-era SSCE and SOFBALL to BASS, FLEX, ACME, SAME and the spacecraft-scale Saffire fires, into one searchable dataset with test conditions, diagnostics and findings. Users choose a mission (ISS, lunar habitat, pressurized rover, Mars habitat, spacesuit) and SARDOR ranks the evidence for that atmosphere and gravity, maps where data is missing, estimates material flammability with a transparent physics-informed model, and answers questions with cited sources. It matters because Artemis habitats will run at higher oxygen and lower pressure than any vehicle flown so far, and most flight fire data was taken in sea-level air.

## Links

- Live demo: [GitHub Pages or Vercel URL]
- Code repository: https://github.com/sardorbekqahramonovic-cmd/flame-in-freefall
- Demo video: [YouTube link, 30 seconds]

## Project details

**What it does.** SARDOR has seven views. The Overview ranks ten fire-safety insights by mission impact, each with a recommended engineering action and citations. The Investigation Atlas summarizes every investigation's objectives, fuels and sample sizes, oxygen, pressure and flow ranges, diluents, sensors and findings, with search, filters and side-by-side comparison. The Flammability Map plots each investigation's tested oxygen–pressure envelope against real spacecraft atmospheres, showing that most data sits at 21% O2 and 1 atm while exploration atmospheres (30–34% O2 at 8.2–10.2 psia) are covered only by Saffire IV–VI and SoFIE. The Fire Risk Explorer estimates whether a material can sustain a flame for any oxygen level, pressure, gravity and ventilation, and shows the flight data behind the estimate. The Mission Ranker scores investigations with weights the team can adjust and explains each score. Ask SARDOR answers natural-language questions from the curated evidence with citations, confidence levels and research-gap warnings. Gaps & Earth lists the open questions, the planned investigations that will answer them (FM2, FLARE), and NASA fire-safety spinoffs. The whole interface and the curated content are available in English, Russian and Uzbek, and Ask SARDOR answers in the language the user picks, so engineers and students who do not read English can use the NASA record too. A voice assistant lets a user ask by speaking and hear the answer: voice mode gives a short answer with the key action first, a hands-free mode listens for "Hey SARDOR", and the commands "fire" and "smoke" return cited immediate actions instantly, even offline.

**How it works.** The app is a static web app (HTML, CSS, JavaScript, hand-built SVG charts), so it loads fast and runs offline. The "super intelligence" layer has three parts. (1) A retrieval engine indexes 139 evidence passages built from the curated data. (2) Claude (Anthropic), or a low-cost OpenAI model, answers questions only from the retrieved passages and must cite each claim; API keys stay in serverless functions. Voice uses OpenAI speech recognition and text-to-speech when a key is set, and the browser's Web Speech API otherwise. (3) An offline reasoner answers from the same evidence when no AI service is available, and calls the flammability model and the ranker when a question mentions a material, atmosphere or mission. The flammability model uses the U-shaped dependence of limiting oxygen on flow speed measured for solids in microgravity, buoyant flow scaling with gravity to the one-third power, and a mild pressure correction, calibrated so that at 1 g it equals each material's Limiting Oxygen Index. Automated tests check that it reproduces the flight trends: thin fuels go out in still microgravity air, burn with ventilation, and Nomex, safe in ISS air, becomes flammable at 34% O2 and 8.2 psia.

**Benefits and impact.** Researchers and students can find, compare and understand results in minutes instead of reading dozens of reports. Engineers get a mission-specific shortlist and concrete actions: correct 1-g material tests for microgravity, re-screen fabrics for exploration atmospheres, size inert-gas extinguishers from FLEX data, specify sub-micron smoke detection (SAME), and confirm extinguishment with gas sensors because cool flames burn invisibly (FLEX, CFI). Mission planners see exactly where evidence is thin, especially partial gravity, which PSI does not yet cover.

**Creativity.** SARDOR treats the mission atmosphere as a first-class input. Changing the mission re-ranks the atlas, moves the target on the map, resets the risk model and changes the AI's context. The map makes the evidence gap visible at a glance, and every AI answer reports how well the flight data covers the question.

**Validity.** Every record links to its NASA source. Estimated values are marked. The model is transparent, documented, tested against known trends, and labelled as a screening tool rather than a certification method. Partial-gravity results are always flagged as extrapolations.

**Tools.** HTML, CSS, JavaScript (no framework; built-in English, Russian and Uzbek interface), SVG, Web Speech API, Node.js serverless functions on Vercel, Anthropic Claude API, OpenAI API (gpt-4o-mini, gpt-4o-mini-transcribe, gpt-4o-mini-tts), GitHub Pages.

## NASA data

- PSI Data Repository, Combustion Science: https://psi.nasa.gov/physci/repo/search?q=combustion
- NASA Technical Reports Server (NTRS), public search API, queried live for every AI answer: https://ntrs.nasa.gov
- NASA Glenn Combustion Science (investigation pages, SoFIE, FM2, FLARE): https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/
- A Researcher's Guide to International Space Station Combustion Science: https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/
- NASA investigation fact sheets: BASS, FLEX, Saffire, SAME, DAFT, SPICE, SLICE, ACME (nasa.gov)
- NASA Safety & Mission Assurance: Apollo 1 and Apollo 13 lessons learned
- NASA History: 25 Years Ago, Fire Aboard Space Station Mir
- NASA Spinoff: Fireman's Air Tanks, Fire Detector, New Technology for the Fire Attire
- NASA ScienceCasts: The Power of Studying Combustion on the ISS

## Space agency partner data

Partner contributions are referenced through NASA sources: JAXA's FLEX-2J droplet-array experiment, Italy's CNR Istituto Motori FLEX-ICE-GA, and the JAXA-led FLARE collaboration with ESA, CNES and DLR.

## References

- Meyer et al. (2018), Evaluation of spacecraft smoke detector performance in the low-gravity environment, Fire Safety Journal, doi:10.1016/j.firesaf.2018.04.004
- Limiting Oxygen Index values: typical ASTM D2863 literature values for each material.
- Fonts: Archivo, IBM Plex Sans, IBM Plex Mono (Google Fonts, SIL Open Font License).
- Anthropic Claude API and the @anthropic-ai/sdk package (MIT).
- OpenAI API: gpt-4o-mini (questions and NTRS search keywords), gpt-4.1 (Uzbek answers), gpt-4o-mini-transcribe (speech recognition), gpt-4o-mini-tts (speech).
- Web Speech API (browser speech recognition and synthesis).
- All other code is original work by the team.

## Use of artificial intelligence

We used Anthropic's Claude as a coding and research assistant to help curate the dataset from the NASA sources above, write code and draft documentation. The team reviewed the content and is responsible for it. In the running app, Claude or an OpenAI model answers user questions from the curated NASA evidence and from NASA technical report abstracts found live in NTRS, and cites its sources; anything not supported by those sources is marked "general knowledge, not NASA data", and OpenAI models turn speech into text and read answers aloud. The emergency command checklists were written by the team from the cited NASA evidence and are labelled as training guidance, not official NASA procedure. No AI-generated images, video or audio are presented as NASA material, and no NASA logos are used.
