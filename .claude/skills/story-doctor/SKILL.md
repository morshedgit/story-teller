---
name: story-doctor
description: Diagnose, critique, repair, and polish existing storyboards in src/stories/. Audits pacing curves, fixes jump-cuts and framing monotony, verifies ground-line alignments and camera safety bounds, synchronizes cue timestamps with real TTS audio durations, and injects missing character reaction cues. Use whenever the user asks to improve, fix, critique, re-time, debug, polish, or "story-doctor" an existing story, or when a story fails visual QA or feels flat.
---

# Story Doctor

Diagnose, critique, and repair existing storyboards in `src/stories/<slug>/story.ts`.

A story that typechecks can still be visually broken: characters floating in mid-air, five identical wide shots in a row (a "slideshow"), emotional revelations with no facial reaction, camera zooms that run off the canvas, or cues that fire long after their spoken word has passed.

**Your job is diagnostic and surgical.** You do not rewrite the story from scratch; you find what is making it flat or broken and fix it.

---

## The Diagnostic Workflow

Run these 5 diagnostic steps in order:

### 1. Automated Audit
Run the automated quality gate:
```bash
npm run audit <slug>
```
Note all errors, warnings, and suggestions. The audit checks:
* Camera safety boundaries ($[800/Z, 1600 - 800/Z]$)
* Ground-line alignments against known backdrop floors
* Cue timestamp overflows relative to beat durations
* Consecutive identical framings (jump-cut detection)
* Defined vs. swapped variant linkages

### 2. Pacing & Audio Sync Check
Check whether the story has real audio in `public/audio/<slug>/manifest.json`.
* If unvoiced, run `npm run narrate <slug>`.
* Compare authored cue `at:` timestamps with the actual measured beat durations in `manifest.json`. If a beat only lasts 2.8s but a cue has `at: 3.4`, that cue is firing in silence or overflowing into the next beat. Re-time it.

### 3. Visual Stills Inspection
Capture and inspect every scene still:
```bash
npm run shoot <slug>
```
Look for:
* **Floating or Buried Characters:** Are their feet resting squarely on the backdrop's ground line (`references/art-kit.md`)?
* **Crop-Outs:** Is a character's head or torso cut off by the top or sides of the frame?
* **Overwhelming Effects:** Is a `vignette`, `mist`, or `screenTone` effect so dense that the character is obscured?

### 4. Reaction Inspection
Reactions happen between static scene stills. Capture exact reaction moments:
```bash
npm run shoot <slug> --at=<timestamp1>,<timestamp2>
```
* Does the character flinch or change expression on the exact operative word?
* Is the reaction held for 0.4–0.8s and then settled cleanly?

### 5. Shot Variety & Camera Dynamics
Review the shot sequence in `story.ts`:
* Are two consecutive shots the same distance from the same character? If so, change one to a tight Close-Up or an Insert on a prop.
* Does every shot have a deliberate camera move (slow creep-in, lateral pan, or deliberate hold)?
* Do transitions match emotional meaning (`cut` for continuous action, `fade` for time passing, `flash` for impact)?

---

## Common Defects & Prescriptions

### Defect 1: The "Slideshow" (Static Framing)
* **Symptom:** Two scenes in a row use the kitchen backdrop with character at `scale: 1.0` and no camera zoom.
* **Prescription:** Restage the second shot as a tight Close-Up on the character's face:
  ```ts
  cues: closeOn(MARK, FLOOR - HEAD, 2.3)
  ```

### Defect 2: Desynced Reaction
* **Symptom:** The narrator says "Mika dropped a plate" at 3.2s, but the `flinch` swap cue is set to `at: 1.5` or `at: 4.8`.
* **Prescription:** Align the cue `at:` with the exact syllable in the audio manifest.

### Defect 3: Camera Zoom Run-Off
* **Symptom:** `closeOn(200, PASS, 2.2)` exposes a black gap on the left edge of the backdrop.
* **Prescription:** Clamp $x$ to the minimum safe boundary: $800 / 2.2 \approx 364$. Center on `(380, PASS)` instead.

### Defect 4: Floating Character
* **Symptom:** Character $y$ is set to $650$ on a backdrop with ground line at $790$.
* **Prescription:** Set $y: 790$ (the feet ground line). If a closer shot is needed, use camera zoom (`closeOn`) rather than shifting $y$.

---

## Verification & Polish

After making edits to `story.ts`:
```bash
npm run audit <slug>      # Must be 0 errors, 0 warnings
npm run check             # Must pass types and isolation
npm run shoot <slug>      # Verify stills visually
```
Always report what defects were identified and how they were resolved.
