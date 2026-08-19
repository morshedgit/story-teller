---
name: art-director
description: Design, draw, and craft new SVG art assets, custom lighting palettes, backdrops, character rigs, and props in src/lib/art-stencil/ or a story's local art/ directory. Use whenever the user asks to draw a new location, create a custom color palette, design new character outfits/hair/poses, craft SVG props, or establish a visual art style.
---

# Art Director

Design and construct SVG visual assets, palettes, backdrops, character outfits, and props for Story Teller.

In Story Teller, all art is **declarative SVG code**. There are no raster PNGs or bitmap textures — every line, gradient, shadow, and rim-light is expressed as vector markup in `1600 x 900` coordinates.

---

## 1. Palette Design (`palette.ts`)

A palette is a unified lighting system for a scene. It binds characters into the backdrop with consistent ink, rim light, and full-frame tint wash.

```ts
export interface Palette {
  name: string;
  sky: [string, string];        // Sky gradient [top, bottom]
  tint: string;                 // Full-frame wash color
  tintOpacity: number;          // Typically 0.08–0.22
  ink: string;                  // Character line color (matches deep shadows)
  rim: string;                  // Character rim light highlight
  ground: string;               // Base terrain/floor tone
  structures: string;           // Buildings/furniture tone
}
```

### Palette Crafting Rules
1. **Never use pure black (`#000000`) for ink:** Use deep slate (`#1e2430`), rich violet (`#251b2e`), or dark forest ink (`#172621`).
2. **Rim Light Contrast:** The `rim` color must reflect the primary light source (e.g. golden peach `#ffd2a8` for dusk, pale cyan `#b8e2f2` for night).
3. **Tint Opacity Balance:**
   * Interior/Day: `0.06–0.12` (subtle wash)
   * Dramatic exterior / Dusk / Storm: `0.14–0.22` (strong cohesive mood)
   * Memory / Dream: `0.25–0.35` (washed/vintage look)

---

## 2. Backdrop Construction (`backdrops.ts`)

Every backdrop builder function accepts `{ palette, seed?, disc?, clouds? }` and returns an SVG markup string within a `<g data-backdrop>` container:

```ts
export function cafe({ palette: p, seed = 'default' }: BackdropOptions = {}): string {
  const rng = seededRng(seed);
  return `
    <!-- Sky / Window view -->
    <rect width="1600" height="900" fill="${p.sky[1]}"/>
    
    <!-- Room Walls & Ceiling -->
    <polygon points="0,0 1600,0 1600,650 0,650" fill="${p.structures}" opacity="0.35"/>
    
    <!-- Floor & Ground Line (Y = 800) -->
    <rect y="800" width="1600" height="100" fill="${p.ground}"/>
    <line x1="0" y1="800" x2="1600" y2="800" stroke="${p.ink}" stroke-width="2"/>
  `;
}
```

### Essential Backdrop Rules
* **Explicit Ground Line:** Every backdrop must establish a canonical ground line (e.g. $y = 780–810$) where character feet stand. Document this in comments.
* **Seeded Determinism:** Use `seededRng(seed)` for star fields, brick patterns, window lights, or tree placement so rendering is 100% stable across frames.
* **Depth Layering:** Structure backdrops into Far Background $\rightarrow$ Midground Structure $\rightarrow$ Foreground Floor.

---

## 3. Character Rigging & Outfits (`characters.ts`)

Characters are modular SVG rigs assembled from head, hair, eyes, outfit, limbs, and shading:

```ts
export function character({
  pose = 'stand',
  expression = 'neutral',
  hair = 'short',
  hairColor = '#2b2a33',
  outfit = 'jacket',
  cloth = '#3e4a59',
  ink = '#1e2430',
  rim = '#ffd2a8',
}: CharacterOptions = {}): string {
  // Origin (0, 0) is the FEET, centered horizontally.
  // Head sits at y = -402 for a scale 1 character.
  return `
    <g class="character-rig" data-pose="${pose}">
      ${renderLegs(pose, cloth, ink)}
      ${renderTorso(pose, outfit, cloth, ink, rim)}
      ${renderHead(expression, hair, hairColor, ink, rim)}
      ${renderArms(pose, outfit, cloth, ink)}
    </g>
  `;
}
```

### Character Rigging Principles
* **Origin at Feet:** $(0, 0)$ is always the character's feet, centered. A character placed at `x: 800, y: 790` stands firmly on the floor at $y=790$.
* **Head Anchor Height:** Standard head center sits at $y = -402$ relative to feet.
* **Variant Consistency:** Expression variants (`sad`, `surprised`, `determined`, `smile`) only swap the mouth/eyebrow geometry while keeping the skull, eyes, and hair identical.

---

## 4. Props & Furniture (`props.ts`)

Props must be self-contained SVG strings with origin at their base:
* **Tableware:** Stockpot, coffee cup, bento box, ramen bowl, paper ticket.
* **Furniture:** Dining table, workstation desk, bench, platform lantern.
* **Order of Staging:** Furniture where characters sit (e.g. tables) must be rendered as separate layers *in front* of the seated character layer.
