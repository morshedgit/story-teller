---
name: shot-animator
description: Choreograph advanced multi-layer animations, custom easing curves, synchronized character entrances/exits, ambient loop layering, and complex camera movements in src/stories/<slug>/story.ts. Use whenever the user asks for complex animation choreography, advanced cues, custom easing, multi-character blocking, or physics-like motion timing.
---

# Shot Animator

Choreograph high-fidelity, multi-layer animations, custom easing curves, and camera motion in Story Teller.

The Story Teller engine compiles all cues on an element into unified Web Animations tracks operating on typed CSS custom properties (`--cue-x`, `--cue-y`, `--cue-s`, `--cue-r`). Because every animation is a paused function of time $t$, you can choreograph intricate, overlapping motions that never drift from the audio.

---

## 1. Easing Curve Mastery (`EASINGS`)

Choosing the right easing curve is the difference between robotic slides and organic anime motion:

| Ease | Curve Definition | Best Used For |
|---|---|---|
| `'snap'` | `cubic-bezier(0.16, 1, 0.3, 1)` | Sudden character turns, whip pans, pop-in reveals, crash zooms. |
| `'soft'` | `cubic-bezier(0.33, 0, 0.15, 1)` | Camera drift, slow ambient push-ins, gentle character moves. |
| `'anticipate'` | `cubic-bezier(0.68, -0.4, 0.27, 1.4)` | Jumps, sudden flinches, physical wind-up before a sprint. |
| `'inOut'` | `cubic-bezier(0.4, 0, 0.2, 1)` | Balanced mechanical transitions, smooth elevator/platform moves. |
| `'linear'` | `linear` | Endless ambient drift, continuous rain/mist travel. |

---

## 2. Multi-Character Choreography & Staggered Timing

When multiple characters or props move in the same beat, **stagger their arrival times by 100–250ms**:

```ts
beats: [
  {
    text: 'The crew arrived in silence.',
    cues: [
      // Character 1 enters from left
      { target: 'hero', do: 'enter', from: 'left', distance: 300, at: 0.2, dur: 0.8, ease: 'snap' },
      // Character 2 enters from right 200ms later
      { target: 'rival', do: 'enter', from: 'right', distance: 300, at: 0.45, dur: 0.8, ease: 'snap' },
      // Camera adjusts to frame both characters
      { target: 'camera', do: 'scale', to: 1.15, at: 0.5, dur: 1.2, ease: 'soft' },
    ],
  },
]
```

---

## 3. The 3-Phase Reaction Animation

To make a shock or impact feel tactile:

```ts
cues: [
  // Phase 1: Sudden flinch & expression swap
  { target: 'hero', do: 'swap', to: 'flinch', at: 2.2, dur: 0.001 },
  // Phase 2: Anticipatory recoil (small backward step)
  { target: 'hero', do: 'move', dx: -40, at: 2.2, dur: 0.15, ease: 'anticipate' },
  // Phase 3: Screen tremor and settling
  { target: 'camera', do: 'shake', strength: 9, at: 2.22, dur: 0.5, ease: 'out' },
  { target: 'hero', do: 'swap', to: 'determined', at: 3.0, dur: 0.4 },
]
```

---

## 4. Layering Ambient Movement with Cues

Every character should combine an ambient looping class with discrete cues:

```ts
layers: [
  {
    id: 'hero',
    svg: hero({ pose: 'stand' }),
    // Ambient breathing & swaying loops infinitely in CSS
    ambient: 'k-breathe k-sway',
    x: 780,
    y: 790,
  }
]
```

* `k-breathe`: Subtle vertical chest rise and fall.
* `k-sway`: Gentle lateral pendulum motion (great for skirts, robes, hair).
* `k-flicker`: Random candle or window light flicker.

---

## 5. Animation Rules of Thumb

1. **Never overlap simultaneous moves on the same property:** Two `move` cues firing at the exact same instant create ambiguous interpolation. Sequence them (`at: 0.0` then `at: 1.2`).
2. **Always start hidden layers at `opacity: 0`:** If a layer will `enter` or `fade` in, its layer definition must set `opacity: 0`.
3. **Always resolve sustained motions with `'beat'` or `'scene'`:** Hardcoded durations (`dur: 6`) will desync when real TTS narration is generated. Use `dur: 'beat'` or `dur: 'scene'`.
