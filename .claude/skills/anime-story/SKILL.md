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

## Workflow

1. **Read the prose.** Identify the beats that carry the story, the cast, and the
   emotional shape. If the user gave a bare premise instead of finished prose, write
   the narration yourself — see `references/pacing.md` for voice.
2. **Budget it.** **Default to ~30 seconds** unless the user names a length: ~65–75
   narration words = ~5 beats = 2 scenes. Do the arithmetic before writing anything,
   and remember punctuation costs time too. `references/pacing.md` has the table and
   the short-form structure.
3. **Break into scenes.** One location or one emotional beat per scene — 2 beats each
   at 30 seconds, 3 at longer lengths.
4. **Make the story's art.** `cp -r .claude/skills/anime-story/assets/story-scaffold
   src/stories/<slug>`, then **prune `art/` to what this story actually uses.** Delete
   the palettes, locations, props and effects you are not staging. An unused builder is
   not a spare part, it is noise — `last-ticket` cut 1,698 copied lines to 708.
5. **Cast the characters.** Define each person once as a helper function at the top
   of `story.ts` so they look like themselves in every scene. Only `pose` and
   `expression` change shot to shot.
6. **Stage each scene.** Pick a backdrop + palette, place layers on the ground line,
   add FX. Consult `references/art-kit.md` for the catalogue and ground lines.
7. **Write the cues.** Every scene gets at least one camera move. See
   `references/storyboard-schema.md` for every field.
8. **Check it**: `npm run check` — types, cue targets, *and* story isolation. A typo'd
   layer id or an import reaching outside your story fails loudly.
9. **Look at it**: `npm run shoot <slug>` writes one PNG per scene to `shots/<slug>/`.
   **Actually read those images.** This step is not optional and not a formality —
   it is the only thing that catches a character standing in mid-air, buried under an
   effect, or cropped out of frame. Iterate until every scene reads.
10. **Narrate**: `npm run narrate <slug>`. This needs no key and no network — see
    "Narration" below. Do it *before* judging the runtime, because the estimate it
    replaces can be off by a second or two per beat.
11. **Measure the runtime and re-check the cues.** `window.__story.duration` is the
    resolved length. Real audio moves every beat boundary, so a cue with an explicit
    `at:` may now fire outside its beat — `at` counts from the beat's start, and the
    beat's true length is in `public/audio/<slug>/manifest.json`. Re-run
    `npm run shoot <slug>` after narrating.
12. **Report** what you made: scene count, measured runtime, what you pruned, and
    anything you had to invent.

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

**Every scene needs a camera move.** A static frame for 20 seconds reads as a
broken page. A slow `scale` to 1.12–1.22 over `dur: 'scene'` is the default. Always
scale *up*, never below 1 — scaling below 1 exposes the frame edges.

**Pair ambient motion with every character.** `ambient: 'k-breathe'` at minimum.
Blinking is automatic.

**One positional cue per layer at a time.** Cues on the same layer accumulate in
scene order (a `move dx: 100` then another `move dx: 100` ends 200 right), but two
overlapping moves on one layer will fight.

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

- **`references/art-kit.md`** — the stencil catalogue: every backdrop, palette,
  character option, prop and effect available to copy, plus the ground line for each
  backdrop. Read this while staging and while deciding what to prune.
- **`references/storyboard-schema.md`** — every field of `Story`/`Scene`/`Layer`/
  `Beat`/`Cue`, all 11 cue actions with their parameters, and a worked scene. Read
  this while cueing.
- **`references/pacing.md`** — the runtime budget, how to cut prose into beats, and
  the narration voice. Read this before writing any text.

## Checking your work

```bash
npm run check              # types + cue targets + story isolation
npm run shoot <slug>       # one PNG per scene -> shots/<slug>/
npm run dev                # play it: space, arrows, n/p for scenes
npm run standalone <slug> --with-audio   # one self-contained .html
```

`npm run shoot` needs no configuration; it uses the repo's pinned Chromium. Never
run `playwright install`.

`npm run shoot` captures each scene **55% of the way through**, so a layer that a cue
reveals on the final beat will not appear in the still. Check the payoff separately —
`window.__player.previewScene(index, 0.97)` in the browser — or you will ship a scene
whose most important element you never looked at.

**Stills are not a substitute for watching it.** They cannot show pacing, and pacing
is most of whether a story works. When the person you are building for cannot reach
`npm run dev` — no public hostname, no deploy yet — `npm run standalone <slug>` folds
the built page's CSS and JS into a single file they can open anywhere. Pass
`--with-audio` to fold the narration in too; without it the export of a narrated story
fails rather than writing a file that plays silently. Add `--embed` to strip the
document skeleton for hosts that supply their own.

The reference story `src/stories/last-ticket/` is a worked 30-second example: two
scenes, seven beats, and an `art/` folder pruned to exactly what it uses.
