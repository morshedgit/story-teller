# Storyboard schema

Every field of the story file. Types live in `src/lib/story.ts`; timing resolution
in `src/lib/timing.ts`.

- [Story](#story)
- [Scene](#scene)
- [Layer](#layer)
- [Beat](#beat)
- [Cue](#cue)
- [Durations](#durations)
- [Worked scene](#worked-scene)

---

## Story

```ts
export default defineStory({
  slug: 'quiet-morning',     // REQUIRED. Must equal the filename before `.story.ts`
  title: 'A Quiet Morning',
  logline: 'One sentence, shown on the gallery card.',
  credit: 'Optional byline',
  voice: {                   // optional; consumed by scripts/narrate.mjs
    id: '...',               // provider voice id; omit for the driver default
    stability: 0.45,         // 0..1 — higher is steadier, lower more expressive
    speed: 0.96,
  },
  scenes: [ /* … */ ],
});
```

## Scene

```ts
{
  id: 'opening',             // REQUIRED, unique. Used in audio filenames
  palette: 'dusk',           // dawn | day | dusk | night | storm | memory
  transition: 'fade',        // cut | fade | wipe | iris | flash. Default 'fade'
  backdrop: ridge({ … }),    // SVG markup from an anime-kit builder
  layers: [ /* … */ ],       // optional
  fx: [ sakura(), vignette() ],  // optional, painted above layers in order
  beats: [ /* … */ ],        // REQUIRED
}
```

Transition guidance: `iris` for entering a memory, `flash` for impact or a hard
cut in time, `wipe` for moving to a different place at the same moment, `fade`
otherwise. `cut` is jarring by design — use it once, deliberately.

## Layer

```ts
{
  id: 'hero',                // REQUIRED, unique within the scene. Cue target
  svg: hero({ pose: 'stand' }),
  x: 700,                    // where the FEET are, in viewBox units
  y: 780,                    // see the ground-line table in art-kit.md
  scale: 1,
  flip: false,               // mirror horizontally
  opacity: 1,                // set 0 for a layer a cue will `enter` or `fade` in
  ambient: 'k-breathe',      // looping CSS classes
  z: 0,                      // paint order; higher is in front. Default array index
}
```

A layer that a cue will bring in **must start at `opacity: 0`**, or it is visible
before its entrance.

## Beat

One or two sentences — the atomic unit of caption *and* audio. One MP3 is generated
per beat, so beat boundaries are exact and never hand-timed.

```ts
{
  text: 'The sun came up over the ridge, the way it always did.',
  cues: [ /* … */ ],         // optional, timed from this beat's start
  hold: 0.8,                 // optional extra silent seconds after the narration
}
```

Use `hold` at the end of a scene to let an image land before the cut.

## Cue

```ts
{ target: 'hero', do: 'move', at: 0.5, dur: 'beat', ease: 'soft', dx: 120 }
```

Shared fields:

| Field | Meaning |
|---|---|
| `target` | A layer `id` in this scene, or the reserved `'camera'` |
| `do` | The action, below |
| `at` | Seconds after this beat starts. Default 0 |
| `dur` | `number` \| `'beat'` \| `'scene'`. Sensible default per action |
| `ease` | `linear` \| `in` \| `out` \| `inOut` \| `soft` \| `snap` \| `anticipate` |

### Actions

| `do` | Extra params | Effect |
|---|---|---|
| `enter` | `from` (`left`/`right`/`top`/`bottom`), `distance` (240) | Slide + fade in |
| `exit` | `to`, `distance` | Slide + fade out |
| `move` | `dx`, `dy` | Translate by a delta |
| `scale` | `to` (1.2) | Scale, pivoting at the feet |
| `fade` | `to` (1) | Animate opacity |
| `turn` | `deg` | Rotate |
| `bob` | `amount` (10) | Sustained vertical bob — a held shot that still breathes |
| `shake` | `strength` (14) | Decaying tremor. On `camera` for impacts |
| `flash` | `color` (`#ffffff`) | Full-frame flash. Target is ignored |
| `show` / `hide` | — | Instant visibility, no movement |

Cue targets are validated at build time — a typo fails `npm run check` with the
list of valid targets rather than silently animating nothing.

### Composition

Cues on the same layer **accumulate in scene order**: `move dx: 100` followed later
by another `move dx: 100` ends 200 to the right. Different channels (position,
scale, rotation, opacity) run independently, so a `move` and a `scale` can overlap
on one layer. Two overlapping `move`s on one layer will fight — do not.

## Durations

`dur` accepts a number of seconds, or:

- `'beat'` — until the end of the beat the cue is attached to
- `'scene'` — until the end of the scene

**Prefer the symbolic forms for anything sustained.** They are resolved at build
time against the *real* narration length. When generated audio replaces the
reading-speed estimate, a hardcoded `dur: 8` desyncs; `dur: 'beat'` does not.

## Worked scene

```ts
{
  id: 'arrival',
  palette: 'night',
  transition: 'flash',
  backdrop: platform({ palette: 'night', seed: 'station', disc: false }),
  layers: [
    // Starts off the right edge; a cue drives it across.
    { id: 'train', svg: props.trainCar('#2a3358', '#ffe9b0', '#0d1128'), x: 2600, y: 720, scale: 0.78 },
    { id: 'lantern', svg: props.lantern('#ffcf7a', '#0d1128'), x: 976, y: 470 },
    {
      id: 'yuki',
      svg: yuki({ pose: 'stand', expression: 'surprised', ink: '#0d1128', rim: '#bcd2ff' }),
      x: 1120, y: 786, scale: 0.95, flip: true, ambient: 'k-breathe',
    },
  ],
  fx: [speedLines({ cx: 900, cy: 500, opacity: 0.34 }), vignette({ opacity: 0.5 })],
  beats: [
    {
      text: 'The train came through the cutting far too fast, the way last things always do.',
      cues: [
        { target: 'train', do: 'move', dx: -1700, dur: 'beat', ease: 'linear' },
        { target: 'camera', do: 'scale', to: 1.14, dur: 'scene', ease: 'soft' },
      ],
    },
    {
      text: 'Then the brakes took hold, and the whole valley filled with white noise and steam.',
      cues: [
        // Continues from where the last move ended, because cues accumulate.
        { target: 'train', do: 'move', dx: -140, dur: 'beat', ease: 'out' },
        { target: 'camera', do: 'shake', strength: 16, dur: 1.2 },
        { target: 'camera', do: 'flash', color: '#ffffff', at: 0.1, dur: 0.6 },
      ],
    },
    { text: 'And it stopped. For the first time in a year, it stopped.', hold: 1.2 },
  ],
}
```

Note the shape: the camera push spans the whole scene, the train move is scoped to
its beat, the impact lands on beat 2, and beat 3 holds on stillness.
