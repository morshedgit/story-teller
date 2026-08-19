# Story Teller Architectural Principles & Agent Guidelines

## 🏛️ Core Architectural Principle: Generic Engine + Expressive Skills

Story Teller is an animated SVG anime short engine powered by Web Animations API, neural text-to-speech, and synchronized cinematography.

The architecture is strictly divided into two distinct halves:

```
┌─────────────────────────────────────────────────────────────┐
│                    GENERIC ENGINE CORE                      │
│  src/lib/         - Story definitions, timing math, SVG utils│
│  src/components/  - Runtime player, canvas, subtitles, audio│
│  scripts/         - Audit QA, TTS synthesis, shot visual QA │
│  src/lib/art-stencil/ - Uncoupled house style starter stencil│
└──────────────────────────────┬──────────────────────────────┘
                               │
               (Guided by Studio Skills on-demand)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 ISOLATED STORIES (<slug>)                   │
│  src/stories/<slug>/story.ts - Storyboard script & cues     │
│  src/stories/<slug>/art/     - Story-owned stamped artwork  │
│  public/audio/<slug>/        - Synthesized beat MP3 audio   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚫 The Non-Negotiable Rules

### 1. Zero Hardcoding in the Generic Engine
* The engine (`src/lib/`, `src/components/`, `scripts/`, `src/pages/`) is **100% generic and story-agnostic**.
* **NEVER** introduce story-specific characters, plot data, hardcoded scene logic, or story-specific assets into the engine, shared scripts, or root files.
* Deleting any story in `src/stories/<slug>` must leave the core repository completely functional and clean.

### 2. A Story Owns Its Art (Strict Isolation)
* Stories must **never import from `src/lib/art-stencil/`** or from other story folders.
* Always scaffold art into `src/stories/<slug>/art/` using the stencil as a starter template, then customize palettes, characters, props, and backdrops strictly inside the story's own folder.
* `npm run check` runs `scripts/check-isolation.mjs` which strictly fails the build if any story violates isolation.

### 3. Skills Drive Autonomous Production
* Use the specialized studio skills in `.claude/skills/` to orchestrate production:
  * `anime-story`: End-to-end 4-phase stage-gated production workflow.
  * `art-director`: Palette color grading, high-contrast silhouettes, and visual tone.
  * `storyboard-scripter`: Pacing, beat budgeting (~18 words/beat), and movement arcs.
  * `shot-animator`: Camera choreography, Web Animations easing curves, and multi-layer staging.
  * `sound-director`: Narration calibration, ambient soundscapes, and ducking.
  * `story-doctor`: Diagnostics, cue fixing, and cinematography QA.

### 4. Audio Pipeline & Quality Gates
* Local neural TTS uses `sherpa-onnx` (`npm run setup:tts`).
* Always verify audio generation with `npm run audit <slug>`.
* Audit ensures camera safety bounds ($zoom \ge 1.0$), ground line anchoring, cue timing integrity, and audio asset presence.
