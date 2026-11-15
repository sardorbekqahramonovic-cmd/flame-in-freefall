# Demo and pitch script

Two versions: the 30-second video the judges see first, and a 2-minute live demo for the local pitch. Every number below is what the live app shows today (model v2, anchored to NASA test data). Before a live demo, open the site once with the network on so it also works offline, set the mission to **Lunar surface habitat**, and use the dark theme.

## 30-second video (as published)

| Time | Screen | Narration (English captions burned in) |
|---|---|---|
| 0:00–0:04 | The yellow 1 g flame next to the blue microgravity flame. | "In space, fire behaves differently, and Moon bases will be oxygen-rich." |
| 0:04–0:09 | Title card with the team. | "Meet VULKAN, our answer to NASA's Flame in Freefall challenge." |
| 0:09–0:15 | Investigation Atlas, then the ranked insights. | "It turns 19 NASA fire experiments, and live NASA reports, into cited safety answers." |
| 0:15–0:21 | Fire Risk Explorer: oxygen slider from 21% to 34% for Nomex; the verdict turns to "Highly flammable". Then the language switch. | "Test a material for your mission, or ask by voice, in English, Russian or Uzbek." |
| 0:21–0:25 | Ask VULKAN answer with citation chips, then the Flammability Map. | "Every claim links to NASA data, and gaps are flagged." |
| 0:25–0:30 | End card with the team and the link. | "Safer crews on the Moon, Mars and Earth." |

## 2-minute live demo (local pitch)

1. **Problem (0:00–0:15).** Overview. Point at the one-line evidence gap: "Of the 7 solid-material fire investigations NASA has flown, 6 tested ISS air, only 2 tested the oxygen-rich air planned for Moon bases, and none tested Moon or Mars gravity. Artemis crews will live in air that has barely been tested."
2. **The record (0:15–0:35).** Investigation Atlas: search "Nomex", open BASS, show conditions, findings and the three implication boxes. "Nineteen investigations, each linked to its NASA source. Here is one finding that matters: some materials burn at lower oxygen in microgravity than on Earth."
3. **Fire Risk Explorer (0:35–1:05).** Pick **Kapton polyimide film** (wire insulation).
   - Click **ISS / Orion cabin**: "Near the limit."
   - Click **Lunar surface habitat**: "Flammable", estimated limit 27.3% against 30% cabin oxygen.
   - Say: "The usual shortcut, the oxygen index, says Kapton needs 37% oxygen, so it would look safe here. NASA's own upward-burning test says 26%. VULKAN uses NASA's number."
   - Point at the shaded band: "Every estimate carries its likely range, and the warning says Moon values are extrapolations."
4. **Proof (1:05–1:30).** Scroll to **How accurate is this model?** "We checked our model against 12 NASA measurements. Our first version made 8 unsafe calls. The current one has none: 10 correct, 2 on the cautious side, and every row links to its NASA report." Then the FM2 table: "And here is a prediction NASA will test. FM2, the first fire experiment on the Moon, burns fabric at 37, 33, 29 and 25% oxygen. We froze our calls on November 14: Nomex burns at the first three, and 25% is too close to call. Our limit, 24.8%, sits inside NASA's expected 24 to 26%."
5. **Ask VULKAN (1:30–1:50).** Tap the microphone and ask "How accurate is VULKAN's fire model?" (or press the suggestion). The answer cites the model check; click the chip to jump back to the table. Then type "fire": the immediate actions appear at once, even offline. Optional: switch to **UZ** and ask "Oyda 34% kislorod va 8,2 psi'da Nomex yonadimi?"
6. **Close (1:50–2:00).** Press **Save report (PDF)** on the Fire Risk Explorer: "Engineers can take a two-page report into a design review. VULKAN installs like an app and works with no network, in three languages."

## Questions judges may ask

- **"Nomex shows Flammable even in ISS air. Is that right?"** That is one of the two cautious calls in the check table. BASS's narrow Nomex strips did not keep burning at 21.5%, and VULKAN says "flammable" there. We keep that bias on purpose: NASA itself recommends derating normal-gravity limits for microgravity, and a screening tool should err toward caution.
- **"Why not machine learning?"** There are only a few dozen NASA limit measurements. A model that small data can support has to be simple and auditable, so every constant comes from a NASA measurement and every check is shown.
- **"Where is the AI?"** Ask VULKAN: retrieval over 153 curated evidence passages plus live NASA Technical Reports Server search, answered by Claude or an OpenAI model that must cite every claim, with an offline reasoner when there is no network.
- **"What happens when FM2 reports?"** The predictions are frozen in the public repository. If Nomex burns at 25% or goes out at 29%, the partial-gravity term is wrong and we correct it in public.

## Recording tips

- Use the browser at 110% zoom so the text reads on a phone.
- Hide the bookmarks bar and use a clean browser profile.
- Keep the cursor still while you talk; move it only to point.
