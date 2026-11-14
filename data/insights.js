/* Ranked fire-safety insights synthesised from the curated investigations.
 * rank = safety impact for Moon/Mars missions (curator judgement, explained in `why`).
 * cites = investigation ids that support the insight. */
window.EMBER = window.EMBER || {};

window.EMBER.INSIGHTS = [
  {
    rank: 1,
    title: "Earth flammability tests are not always conservative in microgravity",
    text: "In low-speed ventilation flow, some materials burn at lower oxygen concentrations than they do in normal gravity. Microgravity flammability limits can be lower than 1-g limits, so the assumed safety margin of 1-g screening may not hold for most spacecraft environments.",
    action: "Add a microgravity correction to NASA-STD-6001 Test 1 results, or qualify critical materials with ventilated microgravity data (SoFIE-SMuRF, FLARE).",
    cites: ["BASS", "SSCE", "SoFIE", "FLARE"],
    tags: ["prevention", "materials"],
    why: "Affects every material choice on every vehicle.",
  },
  {
    rank: 2,
    title: "Exploration atmospheres turn 'non-flammable' fabrics into fuel",
    text: "Moon-base and rover atmospheres are planned at 30–34% O2 and 8.2–10.2 psia, a 40%+ increase in oxygen concentration over Earth air. Materials such as Nomex that do not burn in ISS air are predicted to spread flame at these levels, especially near the lowest-limit flow speeds.",
    action: "Re-screen soft goods and crew clothing at 34% O2 / 56.5 kPa; prefer high-LOI materials (PTFE, Kapton) near ignition sources.",
    cites: ["SAFFIRE-IV-VI", "SoFIE", "BASS"],
    tags: ["prevention", "habitat"],
    why: "Directly sets the material list for Artemis habitats and rovers.",
  },
  {
    rank: 3,
    title: "Inert-gas extinguishers need more agent in space",
    text: "FLEX found the flammability limit is lower in reduced gravity, so terrestrial inert-gas suppressant standards do not give the same margin of safety. Required CO2 or helium concentrations must come from microgravity data.",
    action: "Size CO2 extinguishers and cabin-inerting with FLEX extinction data plus margin; avoid He where it is less effective.",
    cites: ["FLEX", "FLEX-2"],
    tags: ["suppression"],
    why: "An undersized extinguisher fails when the crew needs it most.",
  },
  {
    rank: 4,
    title: "A weak nitrogen jet can make a fire stronger",
    text: "In BASS, nitrogen applied to a flame sometimes strengthened it, because the jet entrained surrounding oxygen into the flame zone.",
    action: "Design extinguisher nozzles and procedures to flood the fire zone, not to blow on it. Shut off ventilation first.",
    cites: ["BASS", "SSCE"],
    tags: ["suppression", "procedures"],
    why: "Counter-intuitive behaviour that crews would not expect from Earth experience.",
  },
  {
    rank: 5,
    title: "Spacecraft smoke is smaller than ISS detectors see best",
    text: "SAME measured mean smoke particle diameters of 100–200 nm from overheated spacecraft materials, while ISS forward-scattering detectors are most sensitive above 1 µm. Ionization-type detection performed well on this smoke.",
    action: "Specify next-generation detectors with sub-micron sensitivity and aim them at pre-fire overheating, not visible soot.",
    cites: ["SAME", "DAFT"],
    tags: ["detection"],
    why: "Early detection is the cheapest fire response.",
  },
  {
    rank: 6,
    title: "A fire can look out and keep burning",
    text: "FLEX discovered that heptane droplets keep reacting as cool flames (roughly 500–800 K, almost no visible light) after the hot flame goes out. CFI and CFI-G (up to 85% O2) mapped where this regime exists.",
    action: "Confirm extinguishment with gas sensors (CO, aldehydes, temperature), not only cameras or flame detectors.",
    cites: ["FLEX", "CFI", "CFI-G"],
    tags: ["detection", "suppression"],
    why: "Hidden re-ignition is a real risk with fuels, lubricants and oxygen-rich suits.",
  },
  {
    rank: 7,
    title: "Ventilation is both a fuel line and an extinguisher",
    text: "Without buoyancy, flow brings oxygen to the flame. Quiescent microgravity often extinguishes flames (SSCE), while low-speed flow of about 5–20 cm/s can produce the most flammable condition (BASS). Large Saffire fires grew differently at higher flow.",
    action: "Make 'ventilation off' the first automatic response to a fire alarm, as on ISS.",
    cites: ["SSCE", "BASS", "SAFFIRE-I-III"],
    tags: ["procedures", "prevention"],
    why: "Free, immediate and effective if done early.",
  },
  {
    rank: 8,
    title: "Realistic fires are big; scale changes the hazard",
    text: "Saffire burned a 0.4 m × 1 m sheet, much larger than the index-card-sized samples tested before. Scale changes fire growth, heat release, and how fast cabin O2, CO2 and pressure change.",
    action: "Use Saffire data to size detection response times and cabin pressure relief.",
    cites: ["SAFFIRE-I-III", "SAFFIRE-IV-VI"],
    tags: ["prevention", "detection"],
    why: "Small-sample data underestimates cabin-level consequences.",
  },
  {
    rank: 9,
    title: "Microgravity flames make far more soot",
    text: "ACME CLD Flame found sooty microgravity flames hold about 5–8 times (up to nearly 10 times) more soot than normal-gravity flames. More soot means more radiant heat, more toxic smoke and harder cleanup.",
    action: "Plan smoke-removal and filter capacity for higher soot yields than Earth fires.",
    cites: ["ACME", "SPICE"],
    tags: ["detection", "cleanup"],
    why: "Smoke, not flame, is often what injures crews.",
  },
  {
    rank: 10,
    title: "Partial gravity is the biggest unknown",
    text: "PSI has no lunar- or Mars-gravity combustion data. Buoyant flow at 0.17 g is estimated near the flow speed where solid materials are most flammable, so the Moon could be a worst case. FM2, LUCI and FLARE are planned to measure it; ACME E-FIELD mimics it with electric fields.",
    action: "Prioritise FM2/FLARE results before finalising lunar habitat material rules; until then, bound designs with both 0 g and 1 g data.",
    cites: ["FM2", "FLARE", "ACME"],
    tags: ["gap", "habitat"],
    why: "Artemis surface habitats will operate in exactly this regime.",
  },
];

/* Short physics primer used by the AI assistant */
window.EMBER.PRIMER = [
  { title: "Why flames are spherical and blue in microgravity", text: "On Earth, hot gas rises and pulls in fresh air, which makes a candle flame tall and yellow with soot. In microgravity there is no buoyancy, so oxygen reaches the flame only by slow diffusion or by ventilation. A candle flame becomes a dim, roughly spherical blue flame." },
  { title: "Opposed and concurrent flame spread", text: "Opposed flow blows against the direction of flame spread; concurrent flow blows with it. In spacecraft both happen, because ventilation, not buoyancy, sets the flow direction. Concurrent spread is usually faster and is the condition Saffire tested at large scale." },
  { title: "Flammability limits and the U-shaped boundary", text: "For thin solids in microgravity, the minimum oxygen needed to burn depends on flow speed. At very low flow the flame starves of oxygen (quenching); at high flow it blows off. In between, at a few to tens of cm/s, the limit is lowest and materials are most flammable." },
  { title: "Oxygen concentration versus partial pressure", text: "Flammability depends more strongly on oxygen concentration (%) than on total pressure. Lowering cabin pressure while raising O2 percentage, as planned for exploration atmospheres, raises fire risk even if oxygen partial pressure stays near sea level." },
  { title: "Spacecraft fire safety layers", text: "NASA's approach has three layers: prevention (control ignition sources and select materials by flammability), detection (smoke and gas sensors), and suppression (CO2 or water-mist extinguishers, ventilation shutdown, crew procedures)." },
  { title: "Scope: what this dashboard does not cover", text: "Rocket engine and propellant fires are out of scope. Flow speeds in engines are so high that combustion there is effectively independent of gravity." },
];
