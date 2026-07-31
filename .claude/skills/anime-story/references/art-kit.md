# Art kit catalogue

Everything importable from `src/lib/anime-kit`. Frame is `1600 x 900` viewBox units.

- [Palettes](#palettes)
- [Backdrops and ground lines](#backdrops-and-ground-lines)
- [Characters](#characters)
- [Props](#props)
- [Effects](#effects)
- [Ambient classes](#ambient-classes)

---

## Palettes

Pick one per scene. It drives the backdrop's sky, depth silhouettes and the
full-frame colour wash that binds flat characters into the painted background.

| Name | Feel | Use for |
|---|---|---|
| `dawn` | Rose and peach, cool shadows | Beginnings, endings, quiet hope |
| `day` | Bright cyan, white clouds | Ordinary life, energy, open air |
| `dusk` | Orange into violet | The default dramatic exterior. Longing, farewells |
| `night` | Deep indigo, stars, moon | Waiting, solitude, arrivals |
| `storm` | Desaturated slate | Grief, conflict, weather |
| `memory` | Washed sepia and cream | Flashbacks. Pair with `transition: 'iris'` |

Pass the palette's `ink` and `rim` to every character in that scene so they sit in
the light — see the ground-line table for the values.

```ts
import { palette } from '../lib/anime-kit';
const p = palette('dusk');   // p.ink, p.rim, p.accent, p.glow …
```

---

## Backdrops and ground lines

Every builder takes `{ palette, seed?, disc?, discY?, clouds?, horizon? }` and
returns a complete background in one call.

- `seed` — any string. Fixes star/cloud/window placement. **Reuse the same seed for
  the same location across scenes** so a place looks like itself.
- `disc` — x position of the sun/moon, or `false` for none. `discY` its height.
- `clouds` — count, default 4.

**The ground line is where a character's `y` should be.** This is not in the type
system and getting it wrong is the most common defect in a new story.

| Builder | Scene | Character `y` | Notes |
|---|---|---|---|
| `ridge({ palette })` | Layered mountains | **760–800** | The workhorse exterior |
| `field({ palette })` | Grass hills, footpath | **780–800** | Open, calm |
| `forest({ palette })` | Dense treeline | **800–830** | Dark; use a light rim |
| `city({ palette })` | Skyline, lit windows | **790–810** | Windows flicker on their own |
| `ocean({ palette })` | Sea from a cliff | **730–780**, only `x < 500` | Cliff is bottom-left only |
| `platform({ palette })` | Railway platform | **786** | Deck at y=750. Posts at x≈128, 408, 688, 968, 1248 |
| `room({ palette })` | Tatami interior | **790–830** | Window at x 880–1440 |
| `shrine({ palette })` | Steps under torii | **860–880** | Climbing shots |
| `voidField({ palette })` | Flat radial field | anywhere | Title cards, blackouts, abstract beats |

For `platform`, hang a lantern at `x: 976, y: 470` to sit on the third post.

---

## Characters

```ts
character({
  hair:       'short' | 'long' | 'ponytail' | 'bob' | 'spiky' | 'messy' | 'bun',
  hairColor:  'black' | 'brown' | 'auburn' | 'ash' | 'white' | 'navy' | 'sakura' | 'moss',
  eyeColor:   '#5b6fb8',        // any hex
  outfit:     'uniform' | 'coat' | 'hoodie' | 'yukata' | 'apron' | 'dress',
  cloth:      'indigo' | 'cream' | 'crimson' | 'moss' | 'slate' | 'plum' | 'ochre' | 'teal',
  cloth2:     // optional second garment colour (trousers, trim)
  pose:       'stand' | 'walk' | 'reach' | 'point' | 'slump' | 'sit' | 'back',
  expression: 'neutral' | 'smile' | 'sad' | 'surprised' | 'determined' | 'closed' | 'worried',
  ink:        '#241c36',        // pass the scene palette's `ink`
  rim:        '#ffd9a0',        // pass the scene palette's `rim`
  scale:      1,                // 442 units tall at 1
  shadow:     true,             // ground shadow ellipse
})
```

**Origin is the feet, centred.** `x, y` on the layer is where they stand.

### Sizing

| `scale` | Reads as |
|---|---|
| 0.55–0.75 | Wide shot, figure small in the landscape |
| 0.9–1.05 | Medium shot — the default |
| 1.3–1.8 | Close, chest-up if you also raise `y` past the frame |

### Pose notes

- `reach` raises the near arm — use it for hanging or taking something.
- `point` extends the near arm sideways.
- `back` draws no face; use it for anonymity or looking away.
- `sit` and `slump` lower the hips; keep `y` at the ground line anyway.
- `walk` puts the legs mid-stride. Pair with a `move` cue or it looks frozen.

### Casting pattern

Define each character once at the top of the story file:

```ts
const yuki = (o: Parameters<typeof character>[0] = {}) =>
  character({ hair: 'long', hairColor: 'black', outfit: 'uniform', cloth: 'indigo', ...o });

// then per scene:
yuki({ pose: 'walk', expression: 'sad', ink: '#0d1128', rim: '#bcd2ff' })
```

Use `flip: true` on the **layer** to face the other way.

---

## Props

All origin bottom-centre, like characters.

| Call | Notes |
|---|---|
| `props.lantern(color?, ink?)` | Glow pulses on its own. Hangs from `y` |
| `props.bicycle(frame?, ink?)` | |
| `props.signpost(ink?, board?)` | |
| `props.bird(ink?)` | Wings flap automatically. Use 2–3 at small scale |
| `props.letter(paper?, ink?)` | Folded paper |
| `props.trainCar(body?, glass?, ink?)` | ~720 wide at scale 1. Windows flicker |

---

## Effects

Drawn above the layers, via the scene's `fx: []` array. All take
`{ seed?, count?, color?, opacity? }`.

| Call | Use for |
|---|---|
| `sakura()` | Petals. Beauty, spring, passing time |
| `rain({ angle })` | Pair with `storm` |
| `snow()` | Winter, stillness |
| `speedLines({ cx, cy })` | Impact, speed, revelation. Use sparingly |
| `screenTone()` | Manga halftone over the frame |
| `sparkle()` | Wonder, magic, first sight |
| `lightRays({ angle })` | God rays. **Keep `count` at 3–5** — more merges into an opaque sheet that buries the scene |
| `fireflies()` | Warm nights |
| `mist({ y })` | Ground fog. Cheap depth |
| `vignette({ opacity })` | Darkened edges. Safe on almost any dramatic scene |
| `letterbox({ height })` | Cinematic bars for a held shot |

Order matters — they paint in array order. `vignette()` normally goes last.

---

## Ambient classes

Set on a layer via `ambient: 'k-breathe'`. These loop forever and pause with the
player; they are not on the story timeline.

| Class | Motion |
|---|---|
| `k-breathe` | Gentle rise and fall. **Put this on every character** |
| `k-sway` / `k-sway-slow` | Rotation. Hanging things, grass |
| `k-drift` | Slow horizontal drift. Clouds, mist |
| `k-pulse` | Scale and opacity throb. Lights |
| `k-twinkle` | Opacity flicker. Stars |

Blinking is built into the character rig — do not add it.

---

## Extending the kit

If a story needs something absent here, add it to the kit rather than inlining SVG
into the story:

- a location → `src/lib/anime-kit/backdrops.ts`, and record its ground line here
- a prop → the `props` object in `characters.ts`
- an effect → `fx.ts`
- a pose → the `POSES` table in `characters.ts` (joint positions, not paths)

Then re-export it from `index.ts`, run `npm run shoot kit`, and look at
`shots/kit/kit.png` before using it in a story.
