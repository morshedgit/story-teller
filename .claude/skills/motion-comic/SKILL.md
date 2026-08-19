---
name: motion-comic
description: Create a dynamic, high-contrast motion comic, noir graphic novel, or manga short in src/stories/<slug>/ — utilizing cinematic letterboxing, high-contrast ink palettes, dramatic crash-zooms, speed lines, action shakes, and punchy character reactions. Use whenever the user asks for a motion comic, manga-style video, comic book short, noir mystery, action cut, or graphic novel animation.
---

# Motion Comic & Manga Storytelling

Turn prose into a high-impact **motion comic** or **manga-style animated short** in `src/stories/<slug>/`.

Motion comics prioritize **graphic contrast, dramatic framing, letterbox aspect ratios, speed lines, and explosive camera moves**.

---

## Directing Grammar for Motion Comics

### 1. Cinematic Letterboxing & Dramatic Effects
Manga and noir shorts benefit from heavy framing constraints. Stack effects to create depth:
```ts
fx: [
  letterbox({ height: 90 }), // 2.39:1 widescreen scope
  speedLines({ opacity: 0.75, direction: 'radial' }), // For action hits & crash-zooms
  vignette({ opacity: 0.45 }),
]
```

### 2. High-Contrast Ink Palettes
Use sharp, saturated, or monochromatic palettes:
* `P.storm` (dark ink, cold slate blues)
* `P.dusk` (deep violet shadows, glowing amber highlights)
* Custom ink palettes with high-opacity `tint` (`tintOpacity: 0.18–0.28`) to unify the comic panel.

### 3. Crash Zooms & Hard Cuts
Unlike gentle storybook creep-ins, motion comics use **anticipatory snap zooms**:
```ts
// Sudden dramatic punch-in on character's eyes
{ target: 'camera', do: 'scale', to: 2.4, at: 1.8, dur: 0.18, ease: 'snap' }

// Paired with an immediate camera tremor
{ target: 'camera', do: 'shake', strength: 12, at: 1.9, dur: 0.45, ease: 'out' }
```

### 4. Expression & Stance Flips
Characters in motion comics shift stance rapidly between panels:
```ts
variants: {
  strike: hero({ pose: 'reach', expression: 'determined' }),
  recoil: hero({ pose: 'slump', expression: 'surprised' }),
}
```

### 5. Transition Vocabulary
* **`transition: 'flash'`**: For gunshot impacts, lightning strikes, or shocking realizations.
* **`transition: 'cut'`**: The primary transition between action beats.
* **`transition: 'iris'`**: For memory flashbacks or focusing in on a single clue.

---

## Manga Pacing Table (~30s)

| Beat | Framing | Action / Cues | Transition |
|---|---|---|---|
| **1. The Hook** | Wide / Low Angle | Establish brooding setting; slow lateral drift | `fade` |
| **2. The Threat** | Medium | Character reaches or turns; ambient breath | `cut` |
| **3. The Climax** | Close-Up (Eyes) | Crash zoom (`snap`), `shake`, variant swap to `determined` | `cut` |
| **4. The Impact** | Insert on Prop | White `flash`, `shake strength: 14`, speedLines | `flash` |
| **5. The Aftermath** | Wide Release | Distant silhouette on ground line, silence | `cut` (Hold 1.2s) |

---

## Workflow

1. **Format the Script:** Write punchy, concise narration (70–90 words for 30s) that lets visual sound effects and music breathe.
2. **Scaffold & Build:** `cp -r .claude/skills/anime-story/assets/story-scaffold src/stories/<slug>`
3. **Audit & Check:**
   `npm run audit <slug>` $\rightarrow$ `npm run check` $\rightarrow$ `npm run narrate <slug>` $\rightarrow$ `npm run shoot <slug>`
