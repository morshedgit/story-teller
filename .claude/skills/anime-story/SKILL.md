---
name: anime-story
description: Turn a story into a narrated anime short — a committable directory in src/stories/ holding one typed storyboard plus the art that story owns, rendering as animated SVG scenes with timed captions and voice narration. Defaults to ~30 seconds. Use this skill whenever the user supplies a story, tale, script, fable, memory, or scene description and wants it animated, narrated, storyboarded, turned into a video/short/film, or "made into anime" — and also when they just paste prose into this repo without saying what to do with it, since that is almost always a request to animate it. Also use it when editing, re-pacing, re-casting or re-shooting an existing story in src/stories/.
---

# Anime Story

Turn prose into `src/stories/<slug>/` — a directory holding one typed storyboard and
the art that story owns, which the shared player renders as a narrated anime short.

**You are the storyboard artist, not the engine author.** The timeline engine and the
player already exist and are tested. Your job is casting, staging, pacing and cueing.
If you find yourself touching `src/scripts/` or `src/lib/timing.ts`, stop — you have
gone off the rails.

## A story owns its art

There is no shared art library to import. `src/lib/art-stencil/` is the house style, and
you **copy from it** — a story that imports it fails `npm run check`.

That means you may change anything in your story's `art/` freely: repaint a palette,
redraw a prop, delete a pose. No other story can see it, and no other story's changes
can reach you. The cost is that a stencil improvement will not reach stories already
made. That trade is deliberate — shared art meant a fix for one story could silently
break another, which is exactly what happened once and why this exists.

## Stage-Gated Production Workflow

Borrowing from professional production pipelines, execute storyboards in four structured phases rather than attempting everything in one pass:

### Phase 1: Script, Tone & Beat Budgeting
1. **Read and budget the prose.** **Default to ~30 seconds** (~95–105 narration words = ~6–7 beats). Consult `references/pacing.md`.
2. **Break into atomic beats.** A beat is one or two sentences (~18 words, ~5s). Break where the listener's mental image changes.
3. **Plan the movement arc.** Two movements for 30s: Movement 1 establishes situation & cost; Movement 2 turns it and lands on an emotional release.

### Phase 2: Shot Planning & Cinematography Grammar
1. **Break beats into shots.** A `scene` is a **shot** (one framing held 3–5s). Thirty seconds requires **6–7 shots**. Shots can never outnumber beats.
2. **Apply cinematography grammar.** Read `references/cinematography.md`. Plan alternating focal lengths:
   $$\text{Wide (establish)} \longrightarrow \text{Medium (action/prop)} \longrightarrow \text{Close-Up (decision/emotion)} \longrightarrow \text{Wide (release)}$$
3. **Plan camera moves & reactions.** Every shot gets a deliberate camera move (slow creep-in, lateral drift, or still hold). Every dramatic revelation gets a character `swap` reaction.

### Phase 3: Art Stamping, Rigging & Assembly
1. **Scaffold and prune.** `cp -r .claude/skills/anime-story/assets/story-scaffold src/stories/<slug>`, then **prune `art/`** to only what this story stages.
2. **Cast characters once.** Define helper functions (e.g. `const hero = (o) => character({ ... })`) at the top of `story.ts` to guarantee visual continuity.
3. **Stage each shot.** Place character origins on exact ground lines (`references/art-kit.md`). Use the `closeOn(x, y, zoom)` camera math.
4. **Sequence cues.** Ensure cue `at` + `dur` stay inside beat durations.

### Phase 4: Audio Synthesis & Automated QA
1. **Prepare Audio Environment:** Ensure local TTS requirements are installed (`npm run setup:tts` or `pip install -r requirements.txt`) or set an API key (`OPENAI_API_KEY` / `ELEVENLABS_API_KEY`).
2. **Synthesise narration:** `npm run narrate <slug>` to generate per-beat MP3s and `public/audio/<slug>/manifest.json`. Verify that audio files are produced.
3. **Run automated audit:** `npm run audit <slug>` to check ground lines, camera safety bounds, cue timings, and audio/ambient asset integrity.
4. **Typecheck & isolate:** `npm run check` — types, cue targets, and story isolation.
5. **Visual QA:** `npm run shoot <slug>` writes PNGs to `shots/<slug>/`. Inspect every still for staging, framing, and reactions.
6. **Report:** Return scene count, measured runtime, audio status (Voiced vs Estimated), and design decisions.

## What you are writing

```
src/stories/quiet-morning/
  story.ts        the storyboard
  art/            this story's palettes, backdrops, characters, props, effects
```

```ts
// src/stories/quiet-morning/story.ts
import { defineStory } from '../../lib/story';
import { PALETTES, character, props, ridge, sakura, vignette } from './art';

const P = PALETTES;

// Cast once, reuse everywhere — this is what keeps a character recognisable.
const hero = (o: Parameters<typeof character>[0] = {}) =>
  character({ hair: 'ponytail', hairColor: 'auburn', outfit: 'uniform', cloth: 'indigo', ...o });

export default defineStory({
  slug: 'quiet-morning',          // must match the directory name
  title: 'A Quiet Morning',
  logline: 'One sentence for the gallery card.',
  scenes: [
    {
      id: 'opening',              // stable; used in audio filenames
      palette: P.dawn,            // the palette OBJECT, from this story's own art
      transition: 'fade',
      backdrop: ridge({ palette: P.dawn, seed: 'opening' }),
      layers: [
        {
          id: 'hero',             // targetable by cues
          svg: hero({ pose: 'stand', expression: 'smile', ink: P.dawn.ink, rim: P.dawn.rim }),
          x: 700, y: 780,         // x,y = where the FEET stand
          scale: 1,
          ambient: 'k-breathe',
        },
      ],
      fx: [sakura(), vignette()],
      beats: [
        {
          text: 'The sun came up over the ridge, the way it always did.',
          cues: [{ target: 'camera', do: 'scale', to: 1.15, dur: 'scene', ease: 'soft' }],
        },
        { text: 'She had not slept, and she did not mind.' },
        { text: 'There was somewhere she needed to be.', hold: 0.8 },
      ],
    },
  ],
});
```

Start from `assets/story-scaffold/`.

## Rules that matter

**Character origin is the feet, centred.** `x, y` places where they stand, not a
bounding box. Each backdrop has its own ground line — `references/art-kit.md` lists
them. Getting this wrong is the single most common defect, and it is invisible in
the type system.

**Never inline bespoke SVG into `story.ts`.** Art belongs in the story's own `art/`
directory — `characters.ts` for props, `fx.ts` for effects, `backdrops.ts` for
locations. A storyboard containing hand-written path data is a bug: it mixes staging
with drawing, and the drawing cannot be reused between that story's own scenes.

**Extend your own art, never import someone else's.** If the story needs something the
scaffold lacks, copy the builder in from `src/lib/art-stencil/` and then change it.
Importing the stencil, or another story's `art/`, fails `npm run check` —
`scripts/check-isolation.mjs` enforces it.

**Prune what you copied.** The scaffold arrives with the full house style. Delete every
palette, location, prop, effect and pose the story does not stage. If an option can only
ever take one value, remove the option rather than leaving a knob that does nothing.

**Cast characters once as a helper.** Re-specifying `hair`/`outfit`/`cloth` per
scene guarantees they drift.

**Use `dur: 'beat'` and `dur: 'scene'` for anything sustained.** These resolve against
the *real* narration length at build time. A cue written with a hardcoded `dur: 8`
desyncs the moment real TTS audio replaces the estimate; `dur: 'beat'` never does.

**Cut. A shot is not a location.** The most common failure of this skill is one
framing held for fifteen seconds while the narrator talks over it — technically
animated, actually a slideshow. Change framing every **3–5 seconds**: restage the
same backdrop with the character at a different `scale` and `y`, and cut to it.
`references/art-kit.md` has the ranges. Use `transition: 'cut'` when two shots are
the same moment from a different distance, and `'fade'` only when time passes
between them.

**Every shot needs a camera move, and it must not always be the same one.** A slow
`scale` to 1.12–1.22 over `dur: 'scene'` is the resting default, not the answer to
every shot — it is what makes six shots feel like one. Push in hard and fast on a
reveal, drift the camera across a wide with `move`, hold dead still for one beat so
the next move lands. Always scale *up*, never below 1: scaling below 1 exposes the
frame edges.

**Show the reaction.** When something happens to a character, the character answers
it — that is the difference between an event and a glitch. Give the layer a
`variants` entry built from the same cast helper with the expression changed, `swap`
to it on the beat, and swap back a beat later. A camera shake with nobody reacting
to it reads as the page breaking.

Reactions need room to be seen. A change of expression is a few pixels at wide
framing, so put the reaction shot **close** — that is most of what cutting is for.

**Effects are staging, not decoration.** `screenTone` and `vignette` are the house
baseline and say nothing about a particular moment. Pick per shot: `speedLines` on a
push-in, `letterbox` on a held beat, `rain`/`mist`/`lightRays` to make a place feel
like weather. A story staging only the two defaults looks like every other story.

**Pair ambient motion with every character.** `ambient: 'k-breathe'` at minimum.
Blinking is automatic.

**Chain cues freely; just don't overlap them on one property.** Cues on a layer
accumulate in order — a `move dx: 100` then another `move dx: 100` ends 200 to the
right — and you can stack as many as a shot needs. The engine merges everything
touching one property into a single track, so a busy layer is safe. What is still
ambiguous is two cues writing the *same* property over overlapping spans: two
simultaneous `move`s on one layer have no sensible answer. Sequence them.

## Narration

One MP3 is generated per beat, so beat boundaries are exact and no timing offsets
are ever maintained by hand. Beats are content-hashed, so re-running after a one-line
edit regenerates one file, not forty.

**`npm run narrate <slug>` needs no key, no account and no network.** It synthesises
locally with sherpa-onnx, downloading a voice model on first use. Narration is a
normal step of building a story, not an optional extra to defer — run it. Setting
`ELEVENLABS_API_KEY` or `OPENAI_API_KEY` switches to that hosted provider, but those
are unreachable from sandboxes behind an allowlist proxy, so do not reach for one
when local synthesis fails; read the actual error instead.

**Never stub or hand-edit audio files, and never change a story to work around a
narration problem.** If synthesis genuinely cannot run, say so plainly in your report
and leave the story on estimated timing — it still plays, with captions.

## Reference files

Read these as needed — do not try to hold them in your head:

- **`references/cinematography.md`** — shot taxonomy (wide/medium/close/insert), camera math & viewport safety, cutting rules, and reaction timing. Read this while framing and cueing.
- **`references/art-kit.md`** — the stencil catalogue: every backdrop, palette, character option, prop and effect available to copy, plus the ground line for each backdrop. Read this while staging and while deciding what to prune.
- **`references/storyboard-schema.md`** — every field of `Story`/`Scene`/`Layer`/`Beat`/`Cue`, all 11 cue actions with their parameters, and a worked scene. Read this while cueing.
- **`references/pacing.md`** — the runtime budget, how to cut prose into beats, and the narration voice. Read this before writing any text.

## Pre-Flight Verification Checklist

Before shipping any story, verify:
1. **Ground Line Placement:** Are all character feet positioned on the exact ground line for their backdrop?
2. **Camera Safety:** At high zooms, are target coordinates inside the $[800/\text{zoom}, 1600 - 800/\text{zoom}]$ safety window to prevent blank canvas edges?
3. **Shot Alternation:** Do consecutive shots change framing distance (avoiding jump cuts)?
4. **Reaction Coverage:** Does every plot revelation have a corresponding `swap` reaction cue?
5. **Cue Bounds:** Do all cue timestamps (`at` + `dur`) stay within their beat duration?
6. **Art Pruning:** Have all unused stencil exports been removed from `art/`?

## Checking your work

```bash
npm run audit <slug>       # automated storyboard & cinematography validation
npm run check              # types + cue targets + story isolation
npm run shoot <slug>       # one PNG per shot -> shots/<slug>/
npm run shoot <slug> --at=3.6,4.2        # exact story seconds, for reactions
npm run dev                # play it: space, arrows, n/p for scenes
npm run standalone <slug> --with-audio   # one self-contained .html
```

`npm run shoot` needs no configuration; it uses the repo's pinned Chromium. Never
run `playwright install`.

`npm run shoot` captures each shot **55% of the way through**, so a layer that a cue
reveals on the final beat will not appear in the still. Check the payoff separately —
`window.__player.previewScene(index, 0.97)` in the browser — or you will ship a shot
whose most important element you never looked at.

**Reactions are invisible to the per-shot stills.** A `swap` that lasts a second
happens entirely between two of them. Capture it by name: `npm run shoot <slug>
--at=3.6,4.2` writes the exact story seconds you ask for. Every reaction you author
needs one of these, or you have not actually checked it.

**Stills are not a substitute for watching it.** They cannot show pacing, and pacing
is most of whether a story works. When the person you are building for cannot reach
`npm run dev` — no public hostname, no deploy yet — `npm run standalone <slug>` folds
the built page's CSS and JS into a single file they can open anywhere. Pass
`--with-audio` to fold the narration in too; without it the export of a narrated story
fails rather than writing a file that plays silently. Add `--embed` to strip the
document skeleton for hosts that supply their own.

The reference story `src/stories/last-ticket/` is a worked 30-second example: seven
beats, seven shots, one location, two reactions. Read it for the `closeOn` helper —
framing a shot means moving the *camera*, since zooming a character without zooming
the backdrop leaves them oversized against normal-sized scenery — and for how the
same kitchen carries a close, a wide, an insert on a prop and a medium without ever
becoming a second location.
