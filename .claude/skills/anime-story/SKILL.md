---
name: anime-story
description: Turn a story into a narrated ~5-minute anime short — a single committable storyboard file in src/stories/ that renders as animated SVG scenes with timed captions and voice narration. Use this skill whenever the user supplies a story, tale, script, fable, memory, or scene description and wants it animated, narrated, storyboarded, turned into a video/short/film, or "made into anime" — and also when they just paste prose into this repo without saying what to do with it, since that is almost always a request to animate it. Also use it when editing, re-pacing, re-casting or re-shooting an existing story in src/stories/.
---

# Anime Story

Turn prose into `src/stories/<slug>.story.ts` — one typed file that the shared
player renders as a narrated anime short.

**You are the storyboard artist, not the engine author.** The art kit, the timeline
engine and the player already exist and are tested. Your job is casting, staging,
pacing and cueing. If you find yourself writing raw `<path>` data or touching
`src/scripts/`, stop — you have gone off the rails.

## Workflow

1. **Read the prose.** Identify the beats that carry the story, the cast, and the
   emotional shape. If the user gave a bare premise instead of finished prose, write
   the narration yourself — see `references/pacing.md` for voice.
2. **Budget it.** ~5 minutes = ~750–800 narration words = ~42 beats = 12–15 scenes.
   Do the arithmetic before writing anything. `references/pacing.md` has the table.
3. **Break into scenes.** One location or one emotional beat per scene, 3 beats each.
4. **Cast the characters.** Define each person once as a helper function at the top
   of the file so they look like themselves in every scene. Only `pose` and
   `expression` change shot to shot. See the demo story for the pattern.
5. **Stage each scene.** Pick a backdrop + palette, place layers on the ground line,
   add FX. Consult `references/art-kit.md` for the catalogue and ground lines.
6. **Write the cues.** Every scene gets at least one camera move. See
   `references/storyboard-schema.md` for every field.
7. **Typecheck**: `npm run check`. Cue targets are validated at build time, so a
   typo'd layer id fails loudly rather than silently animating nothing.
8. **Look at it**: `npm run shoot <slug>` writes one PNG per scene to `shots/<slug>/`.
   **Actually read those images.** This step is not optional and not a formality —
   it is the only thing that catches a character standing in mid-air, buried under an
   effect, or cropped out of frame. Iterate until every scene reads.
9. **Narrate** (optional): `npm run narrate <slug>` if a TTS key is set. Without one
   the story still plays with estimated timing — see "Narration" below.
10. **Report** what you made: scene count, runtime, and anything you had to invent.

## The file you are writing

```ts
import { defineStory } from '../lib/story';
import { character, props, ridge, sakura, vignette } from '../lib/anime-kit';

// Cast once, reuse everywhere — this is what keeps a character recognisable.
const hero = (o: Parameters<typeof character>[0] = {}) =>
  character({ hair: 'ponytail', hairColor: 'auburn', outfit: 'uniform', cloth: 'indigo', ...o });

export default defineStory({
  slug: 'quiet-morning',          // must match the filename before `.story.ts`
  title: 'A Quiet Morning',
  logline: 'One sentence for the gallery card.',
  scenes: [
    {
      id: 'opening',              // stable; used in audio filenames
      palette: 'dawn',
      transition: 'fade',
      backdrop: ridge({ palette: 'dawn', seed: 'opening' }),
      layers: [
        {
          id: 'hero',             // targetable by cues
          svg: hero({ pose: 'stand', expression: 'smile', ink: '#2b2340', rim: '#ffe2b8' }),
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

Start from `assets/story-template.story.ts`.

## Rules that matter

**Character origin is the feet, centred.** `x, y` places where they stand, not a
bounding box. Each backdrop has its own ground line — `references/art-kit.md` lists
them. Getting this wrong is the single most common defect, and it is invisible in
the type system.

**Never inline bespoke SVG into a story file.** Everything comes from
`src/lib/anime-kit`. If a story needs something the kit lacks, add it to the kit —
`characters.ts` for props, `fx.ts` for effects, `backdrops.ts` for locations — and
then use it. A story file containing hand-written path data is a bug: it will not
match the other stories and nothing else can reuse it.

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
are ever maintained by hand. `npm run narrate <slug>` needs `ELEVENLABS_API_KEY`
(preferred) or `OPENAI_API_KEY`; it content-hashes each beat, so re-running after a
one-line edit regenerates one file, not forty.

**With no key set, everything still works.** Durations fall back to a reading-speed
estimate and the story plays with captions. Do not treat a missing key as a blocker,
do not stub audio files, and do not change the story file to work around it — say
plainly in your report that narration is pending a key.

## Reference files

Read these as needed — do not try to hold them in your head:

- **`references/art-kit.md`** — every backdrop, palette, character option, prop and
  effect, plus the ground line for each backdrop. Read this while staging.
- **`references/storyboard-schema.md`** — every field of `Story`/`Scene`/`Layer`/
  `Beat`/`Cue`, all 11 cue actions with their parameters, and a worked scene. Read
  this while cueing.
- **`references/pacing.md`** — the runtime budget, how to cut prose into beats, and
  the narration voice. Read this before writing any text.

## Checking your work

```bash
npm run check              # types + every cue target resolves
npm run shoot <slug>       # one PNG per scene -> shots/<slug>/
npm run dev                # play it: space, arrows, n/p for scenes
npm run standalone <slug>  # one self-contained .html -> dist-standalone/
```

`npm run shoot` needs no configuration; it uses the repo's pinned Chromium. Never
run `playwright install`.

**Stills are not a substitute for watching it.** They cannot show pacing, and pacing
is most of whether a story works. When the person you are building for cannot reach
`npm run dev` — no public hostname, no deploy yet — `npm run standalone <slug>` folds
the built page's CSS and JS into a single file they can open anywhere. Add `--embed`
to strip the document skeleton for hosts that supply their own.

The reference story `src/stories/the-third-post-from-the-end.story.ts` exercises the
whole kit across 14 scenes — read it when you need a worked example of anything.
