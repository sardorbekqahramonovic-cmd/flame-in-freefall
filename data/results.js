/* New test results published after VULKAN's curated record: FM2, FLARE, new NASA White Sands tests.
 * The team checks each entry against its NASA source before adding it here. VULKAN then checks its model
 * against the result, scores the frozen FM2 predictions, and adds it to Ask VULKAN's knowledge base.
 * Visitors can also add results in their own browser (Fire Risk Explorer, "New test results") and export them.
 *
 * Entry format:
 *   { id: "fm2-nomex-25", exp: "FM2", mat: "nomex",          // material id from the Fire Risk Explorer
 *     kind: "burns" | "noburn" | "limit",                    // flame survived / no flame / measured limiting O2
 *     o2: 25, p: 56.5, g: 0.166, vent: 0,                     // % O2, kPa, g, forced flow in cm/s
 *     src: "https://ntrs.nasa.gov/citations/…", date: "2027-05-01", note: "" }
 * The list is empty until NASA publishes FM2 or FLARE results. */
window.VULKAN_RESULTS = [];
