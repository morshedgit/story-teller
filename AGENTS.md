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

### 3. Generative, Unconstrained Vector Art
* Art in Story Teller is **generative declarative SVG code**, never locked to pre-coded shape templates.
* Every story owns its art in `src/stories/<slug>/art/` or inline in `story.ts`.
* The AI skills teach the 4-tone lighting model (base, 30% shade, key-light rim, specular catchlights), eye depth anatomy with dual catchlights, hair shine rings, and 3-plane atmospheric perspective.

### 4. Creative Director Skills Suite Drive Autonomous Production
* Use the specialized studio skills in `.claude/skills/` to orchestrate production:
  * **Genre Directors:**
    * `anime-story`: End-to-end 4-phase stage-gated anime short production.
    * `tech-explainer`: 20–40s visual animated explainers for architectures and algorithms.
    * `motion-comic`: Manga & noir shorts with 2.39:1 letterboxing, crash zooms, and speed lines.
    * `social-reels`: 9:16 vertical shorts for TikTok/Reels with 1.5s visual hooks.
  * **Studio Specialists:**
    * `art-director`: Generative SVG drawing, lighting palettes, and cel-shading principles.
    * `storyboard-scripter`: Pacing, 3.5 WPM word budgeting, and atomic beat breaks.
    * `shot-animator`: Multi-layer animation timing, easing curves, and camera physics.
    * `sound-director`: Ambient soundscapes, voice tuning, and dynamic voice ducking.
    * `story-doctor`: Diagnostics, cue fixing, and cinematography QA.

### 5. Audio Pipeline & Quality Gates
* Multi-track audio engine supports `ambientAudio` with dynamic volume ducking to ~22% while voiceover speaks.
* Local neural TTS uses `sherpa-onnx` (`npm run setup:tts`).
* Always verify audio generation and cinematography with `npm run audit <slug>` and `npm run check`.
* Audit ensures camera safety bounds ($[800/Z, 1600 - 800/Z]$), ground line anchoring, cue timing integrity, and audio asset presence.
