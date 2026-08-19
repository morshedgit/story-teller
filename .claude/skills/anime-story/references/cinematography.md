# Cinematography and Visual Directing

A reference guide for staging, framing, camera motion, and cutting in Story Teller.

- [Shot Taxonomy](#shot-taxonomy)
- [Camera Math & Safe Framing](#camera-math--safe-framing)
- [Camera Motion Vocabulary](#camera-motion-vocabulary)
- [Cutting & Visual Rhythm](#cutting--visual-rhythm)
- [Staging & Blocking Rules](#staging--blocking-rules)
- [Reaction Timing](#reaction-timing)

---

## Shot Taxonomy

A story that holds one framing across thirty seconds is a slideshow. Cinematic storytelling cuts between distinct focal lengths to control audience attention and emotion.

```
       [ EWS / WS ]          [ MEDIUM SHOT ]           [ CLOSE-UP ]          [ INSERT / CUTAWAY ]
  Establishing / World     Action / Interaction     Emotion / Decision      Detail / Key Object
       (zoom 1.0-1.2)         (zoom 1.4-1.7)          (zoom 2.0-2.5)           (zoom 1.8-2.4)
```

| Shot Type | Camera Zoom | Character $y$ / Scale | Purpose & Usage |
|---|---|---|---|
| **Extreme Wide (EWS)** | `1.0` | Ground line, `scale: 0.7–0.9` | Establishes scale, geography, loneliness, weather, or solitude. |
| **Wide Shot (WS)** | `1.05–1.2` | Ground line, `scale: 1.0` | Establishes the full room and character's place in it. Good for opening and ending. |
| **Medium Shot (MS)** | `1.4–1.7` | `FLOOR`, character reaching or interacting | Captures physical gestures, props, two-character dialogue, or turning points. |
| **Close-Up (CU)** | `2.0–2.5` | Framed tight on head (`FLOOR - HEAD`) | Captures emotional shifts, realizations, flinches, tears, or decisions. |
| **Insert / Cutaway** | `1.8–2.4` | Framed tight on a prop (`PASS - 60`) | Punctuate significance: a printed ticket, boiling pot, dropped plate, glowing lantern. |

---

## Camera Math & Safe Framing

All shots render on a **$1600 \times 900$** canvas. The camera scales about the centre (`800, 450`) and translates *after* that scale in screen units.

### The `closeOn` Helper

Define this helper at the top of your `story.ts`:

```ts
/**
 * Frame a shot tight on a world point (x, y) with a given zoom.
 * Snaps instantly (dur: 0.001) so the shot opens already framed.
 */
const closeOn = (x: number, y: number, zoom: number): Cue[] => [
  { target: 'camera', do: 'scale', to: zoom, at: 0, dur: 0.001 },
  { target: 'camera', do: 'move', dx: -(x - 800) * zoom, dy: -(y - 450) * zoom, at: 0, dur: 0.001 },
];
```

### Viewport Safety Bounds

When zooming in on point $(x, y)$, the camera must not pan so far that the edge of the $1600 \times 900$ backdrop enters the frame.

Keep target points strictly inside these bounds:

$$\frac{800}{\text{zoom}} \le x \le 1600 - \frac{800}{\text{zoom}}$$

$$\frac{450}{\text{zoom}} \le y \le 900 - \frac{450}{\text{zoom}}$$

*Example:* At $\text{zoom} = 2.0$, $x$ must stay between $400$ and $1200$, and $y$ between $225$ and $675$. Centering on $x = 200$ at $\text{zoom} = 2.0$ exposes empty space on the left.

---

## Camera Motion Vocabulary

Every shot should feature deliberate camera movement (or a purposeful still hold). Never use the exact same move for every shot.

```ts
// 1. Dramatic Creep-in (The baseline tension builder)
{ target: 'camera', do: 'scale', to: 1.14, dur: 'scene', ease: 'soft' }

// 2. Wide Lateral Drift (Contemplative / establishing)
{ target: 'camera', do: 'move', dx: -60, dur: 'scene', ease: 'linear' }

// 3. Impact Tremor / Shockwave (Paired with a plot event)
{ target: 'camera', do: 'shake', strength: 8, at: 3.2, dur: 0.5, ease: 'out' }

// 4. Punch-in / Snap Zoom (Sudden realization or surprise)
{ target: 'camera', do: 'scale', to: 1.35, at: 1.8, dur: 0.25, ease: 'anticipate' }

// 5. Still Hold (Letting a quiet or heavy beat breathe)
// Omit camera cues or set a short 0.001 framing cue
```

---

## Cutting & Visual Rhythm

### Rule 1: Never Jump-Cut the Same Framing
Cutting between two wide shots or two close-ups of the same face with no change in angle or framing looks like a dropped frame. Always change focal length or subject between shots:
$$\text{Wide} \longrightarrow \text{Medium Insert} \longrightarrow \text{Close-Up} \longrightarrow \text{Wide Release}$$

### Rule 2: Cut on Beat Boundaries
In Story Teller, cuts occur at scene boundaries, which align with narration beats. To cut faster, write shorter beats ($\approx 10–14$ words).

### Rule 3: Visual Tension and Release
* **Tension:** Consecutive tight shots (Close-Up on face $\rightarrow$ Insert on hands $\rightarrow$ Close-Up on eyes).
* **Release:** Cutting wide after a sequence of tight shots gives visual relief and grounds the conclusion.

### Rule 4: Match Transitions to Dramatic Meaning
* **`transition: 'cut'`**: The default between shots in the same scene/time. Instant and crisp.
* **`transition: 'fade'`**: Time has passed or location has changed.
* **`transition: 'flash'`**: High-energy impact, explosion, memory shock.
* **`transition: 'iris'`**: Entering or exiting a dream, memory, or vintage vignette.
* **`transition: 'wipe'`**: Moving laterally to a parallel event happening simultaneously.

---

## Staging & Blocking Rules

1. **Ground Lines Are Sacred:** Always position character feet ($y$) exactly on the backdrop ground line (`references/art-kit.md`). Never guess coordinates.
2. **Look Room / Lead Room:** If a character is facing right (`flip: false`), place them on the left side of the frame ($x \approx 600–750$) so they look into open space.
3. **Head Height Reference:** For standard scale 1 characters, the head sits at roughly $\text{FLOOR} - 402$. Close-ups on faces should target $(x_{\text{mark}}, \text{FLOOR} - 402)$.

---

## Reaction Timing

A camera shake or plot revelation without a character reaction reads as an engine glitch. 

### The 3-Step Reaction Sequence

1. **Pre-Cue State:** Character starts in `neutral` or `sad` baseline.
2. **Hit:** On the exact operative word in narration (e.g. "plate", "crash", "door"), fire the `swap` cue:
   ```ts
   // Narration: "Mika dropped a plate at nine." (word "plate" is at ~3.3s)
   { target: 'mika', do: 'swap', to: 'flinch', at: 3.3 }
   { target: 'camera', do: 'shake', strength: 7, at: 3.35, dur: 0.6 }
   ```
3. **Settle:** Swap back to base or an altered state (`determined`) after 0.5–1.0s:
   ```ts
   { target: 'mika', do: 'swap', to: 'base', at: 4.1, dur: 0.3 }
   ```
