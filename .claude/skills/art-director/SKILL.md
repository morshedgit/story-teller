---
name: art-director
description: Master generative SVG illustration, custom character rigs, creature design, atmospheric backdrops, vehicles, props, and cel-shaded lighting systems for Story Teller. Use whenever the user asks to draw, design, illustrate, style, or generate visual art, characters, animals, locations, spaceships, or objects in SVG code from scratch.
---

# Art Director: Generative SVG Illustration Masterclass

In Story Teller, art is **pure generative vector code**. There are no pre-baked image assets or static shape templates to select from. You author clean, expressive, studio-grade SVG markup directly for each story.

The engine provides the canvas ($1600 \times 900$), coordinate system, and timeline. **You provide the drawing.**

---

## 1. Universal Coordinate & Rigging Standard

All visual elements in Story Teller operate on a unified geometry standard:

```
                  Canvas: 1600 x 900 (ViewBox units)
(0, 0) ────────────────────────────────────────── (1600, 0)
  │                                                  │
  │                  HORIZON ≈ 620                   │
  │  - - - - - - - - - - - - - - - - - - - - - - - - │
  │                                                  │
  │              CANONICAL GROUND ≈ 780–810          │
  │  ══════════════════════════════════════════════  │
  │  (Character/Prop Origin (0, 0) sits at Ground)   │
(0, 900) ──────────────────────────────────────── (1600, 900)
```

### The Origin Rule (Feet/Base at $(0, 0)$)
* **Characters, Animals, Props, and Vehicles must place their origin $(0, 0)$ at their base/feet, centered horizontally.**
* A layer positioned at `x: 800, y: 790` stands firmly on a floor at $y = 790$.
* Scaling (`scale: 1.2`) expands the entity *upward and outward from the floor* without sinking into the ground.

---

## 2. Generative Character & Anatomy Blueprint

An anime figure at `scale: 1` is $\approx 440$ units tall (5.5 heads). Negative $y$ goes upward.

```
Landmarks (Origin = Feet Centre at y = 0):
  Crown:     y = -442
  Chin:      y = -362
  Head:      Center at y = -402
  Neck:      y = -352
  Shoulders: y = -336 (width ±30)
  Hips:      y = -205 (width ±18)
  Knees:     y = -110
  Feet:      y = 0
```

### 1. Expressive Eye Rig (The Life of the Character)
Anime eyes require depth and specular catchlights to avoid a flat/lifeless look:
```ts
function renderEye(cx: number, color = '#4a6fb5', ink = '#241c36', isClosed = false): string {
  if (isClosed) {
    return `<path d="M -10 0 q 10 8 20 0" stroke="${ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
  }
  return `
    <g transform="translate(${cx} -400)">
      <g class="k-blink">
        <!-- 1. White sclera -->
        <ellipse cx="0" cy="0" rx="9" ry="11.5" fill="#ffffff"/>
        <!-- 2. Iris base color -->
        <ellipse cx="0" cy="1" rx="7.4" ry="10" fill="${color}"/>
        <!-- 3. Upper eyelid cast shadow -->
        <path d="M -7.4 1 A 7.4 10 0 0 1 7.4 1 Z" fill="${ink}" opacity="0.35"/>
        <!-- 4. Deep pupil -->
        <ellipse cx="0" cy="2.2" rx="3.8" ry="6" fill="${ink}"/>
        <!-- 5. Dual Specular Catchlights (Primary & Secondary) -->
        <circle cx="-3" cy="-4" r="3.2" fill="#ffffff"/>
        <circle cx="3.2" cy="4.2" r="1.8" fill="#ffffff" opacity="0.9"/>
        <!-- 6. Lash line & eyelid crease -->
        <path d="M -10 -9 q 10 -6.5 20 0" stroke="${ink}" stroke-width="3.8" fill="none" stroke-linecap="round"/>
        <path d="M -7.5 -13.5 q 7.5 -3.5 15 0" stroke="${ink}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.6"/>
      </g>
    </g>`;
}
```

### 2. Head, Hair & Cel-Shading
* **Forehead Shadow:** Add a subtle cast shadow path (`opacity: 0.12` of ink) below the bangs.
* **Cheek Blush:** Translucent ellipses (`rx="10" ry="6" fill="#ff859d" opacity="0.45"`) on the cheekbones.
* **Hair Highlight Ring ("Angel Ring"):** An arced highlight band (`fill="${rim}" opacity="0.35"`) across the crown that curves with the skull.
* **Neck Drop Shadow:** Shadow under the chin onto the neck (`fill="${SKIN.shade}"`).

---

## 3. Generative Creature & Animal Blueprint

Draw quadrupeds, birds, and fantasy beings with flexible joint kinematics and ambient breathing:

```
Quadruped Anatomy (Origin = Paws at y = 0):
  Back/Torso:  Ellipse at y ≈ -50 (width: 56, height: 40)
  Chest/Neck:  y ≈ -65
  Head/Ears:   Circle at y ≈ -75 (radius: 19) + triangular ear wedges
  Tail:        Path at rear attached to <g class="k-sway">
  Legs:        4 rounded rects at y = -34..0
```

### Quadruped SVG Construction Pattern
```ts
export function renderCreature({ color = '#d48b52', ink = '#241c36', eyeColor = '#ffb300' } = {}): string {
  return `
    <g data-part="creature" stroke-linejoin="round">
      <!-- Ground Shadow -->
      <ellipse cx="0" cy="2" rx="48" ry="9" fill="${ink}" opacity="0.22"/>
      <!-- Tail with ambient sway -->
      <g class="k-sway" style="--sway:14px;--t:3.5s" transform="translate(-24 -46)">
        <path d="M 0 0 C -18 -8 -26 -28 -14 -42 C -8 -48 -2 -42 -6 -32 C -10 -22 -4 -10 0 0" fill="${color}" stroke="${ink}" stroke-width="2.8"/>
      </g>
      <!-- Four Paws -->
      <rect x="-24" y="-34" width="8" height="34" rx="4" fill="${color}" stroke="${ink}" stroke-width="2.5"/>
      <rect x="-12" y="-34" width="8" height="34" rx="4" fill="${color}" stroke="${ink}" stroke-width="2.5"/>
      <rect x="10" y="-34" width="8" height="34" rx="4" fill="${color}" stroke="${ink}" stroke-width="2.5"/>
      <rect x="22" y="-34" width="8" height="34" rx="4" fill="${color}" stroke="${ink}" stroke-width="2.5"/>
      <!-- Breathing Torso & Head -->
      <g class="k-breathe" style="--t:4s">
        <ellipse cx="0" cy="-52" rx="28" ry="21" fill="${color}" stroke="${ink}" stroke-width="2.8"/>
        <!-- Head -->
        <g transform="translate(28 -72)">
          <circle cx="0" cy="0" r="19" fill="${color}" stroke="${ink}" stroke-width="2.8"/>
          <polygon points="-14,-14 -12,-34 -1,-16" fill="${color}" stroke="${ink}" stroke-width="2.4"/>
          <polygon points="1,-16 12,-34 14,-14" fill="${color}" stroke="${ink}" stroke-width="2.4"/>
          <circle cx="6" cy="-4" r="3.6" fill="${eyeColor}" stroke="${ink}" stroke-width="1.2"/>
          <circle cx="5" cy="-5.2" r="1.2" fill="#ffffff"/>
        </g>
      </g>
    </g>`;
}
```

---

## 4. Generative Scenic Environments & Backdrops

Every backdrop must establish **Atmospheric Depth (3-Plane Architecture)**:

```
[ PLANE 1: FAR ]    Sky Gradient + Sun/Moon + Stars/Clouds + Distant Mountain/Skyline
[ PLANE 2: MID ]    Midground silhouettes (treeline, buildings, hills) with atmospheric haze
[ PLANE 3: NEAR ]   Ground Floor (y = 780–810) + Framing elements (posts, windows, desks)
```

### Architectural & Room Perspective
For interiors (rooms, cafes, bridges, cockpits):
1. **Vanishing Point:** Anchor vanishing lines towards a central or slightly off-center focal point.
2. **Window / Viewport:** Create a prominent portal (`<rect rx="8">` or `<polygon>`) filled with a sky/cosmos linear gradient.
3. **Floor Plane:** Clean horizontal rect from $y = 800$ to $y = 900$, with horizontal floorboard lines spaced progressively wider as they approach the camera.

### Procedural Natural Terrain
* Use `ridgePoints(rng, { count, baseline, amplitude })` and `ridgePath(pts, floorY)` from `src/lib/svg.ts` to generate rolling organic ridgelines that never repeat.
* Stack 3 ridgelines (Far $\rightarrow$ Mid $\rightarrow$ Near), shifting the fill color from soft atmospheric haze to deep, saturated ground tones.

---

## 5. Generative Vehicles, Machines & Sci-Fi Objects

Vehicles and props follow industrial design geometry:

```ts
// Starfighter / Cruiser Construction
export function renderSpaceship({ hull = '#2a3b5c', glow = '#00e5ff', ink = '#151d2a' } = {}): string {
  return `
    <g data-part="spaceship">
      <!-- Pulsing Plasma Thruster -->
      <ellipse class="k-pulse" style="--t:1.5s" cx="0" cy="18" rx="24" ry="42" fill="${glow}" opacity="0.85"/>
      <ellipse class="k-pulse" style="--t:1s" cx="0" cy="10" rx="12" ry="22" fill="#ffffff"/>
      <!-- Aerodynamic Hull -->
      <path d="M 0 -220 L 64 -60 L 110 30 L 48 20 L 0 35 L -48 20 L -110 30 L -64 -60 Z" fill="${hull}" stroke="${ink}" stroke-width="4"/>
      <!-- Glowing Cockpit Canopy -->
      <ellipse cx="0" cy="-90" rx="18" ry="46" fill="${glow}" opacity="0.8" stroke="${ink}" stroke-width="3"/>
      <!-- Panel Seams -->
      <line x1="0" y1="-220" x2="0" y2="35" stroke="${ink}" stroke-width="3" opacity="0.5"/>
    </g>`;
}
```

---

## 6. The 4-Tone Lighting & Palette Model

To keep visual art unified across all scenes in a story:

| Tone | Role | Implementation |
|---|---|---|
| **`sky`** | Atmosphere & Global Light | 3-stop linear gradient (`top`, `mid`, `horizon`) |
| **`ink`** | Line Work & Deep Shadows | Rich colored black (`#1e2430` slate, `#251b2e` plum, `#172621` forest). **Never `#000000`**. |
| **`rim`** | Key-Light Specular Rim | Bright edge highlight along character silhouettes (`#ffd2a8` peach, `#b8e2f2` cyan). |
| **`tint`** | Full-Frame Atmospheric Wash | Overlay rect covering entire canvas with `tintOpacity: 0.08–0.22`. |

---

## 7. Directing Checklist for Bespoke Art

When generating art for a story:
1. **Is $(0, 0)$ at the base?** Ensure all characters, creatures, and props stand on $y = 0$.
2. **Are gradients unique?** Use `uid('gradient-name')` so document-level SVG IDs never collide between scenes.
3. **Is cel-shading layered?** Verify that cast shadows (neck, forehead, clothes) use 30% darker base tones or low-opacity ink overlays.
4. **Does the scene breathe?** Add subtle ambient CSS classes (`k-breathe`, `k-sway`, `k-drift`, `k-flicker`) so the vector world feels alive before cues start.
