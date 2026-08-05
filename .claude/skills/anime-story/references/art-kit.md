# Art stencil catalogue

Everything the house style in `src/lib/art-stencil/` offers. Frame is `1600 x 900`
viewBox units.

**You copy from this, you do not import it.** The scaffold hands you the whole set in
`src/stories/<slug>/art/`; this page is the menu for deciding what to keep and what to
delete. Anything you need later can be copied in from the stencil the same way —
importing it fails `npm run check`.

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

These names are **local to your story** — the engine only ever reads `name`, `tint`
and `tintOpacity`. Rename them, repaint them, delete the four you do not use, invent
your own. Nothing outside your story's `art/palette.ts` knows they exist.

Builders and scenes take the palette **object**, not its name, so there is one import
and no lookup table:

```ts
import { PALETTES } from './art';
const P = PALETTES;

// in a scene:
palette: P.dusk,
backdrop: ridge({ palette: P.dusk, seed: 'opening' }),
```

Pass the palette's `ink` and `rim` to every character in that scene so they sit in
the light: `hero({ ink: P.dusk.ink, rim: P.dusk.rim })`.

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
| `kitchen({ palette })` | Restaurant kitchen | **790** | Pass at y=600, floor at y=700. Burners at x≈150–432 |
| `diningRoom({ palette, clearTable? })` | Front of house | **812** | Window at x 580–1020. Tables at x=250, 810, 1370 |
| `shrine({ palette })` | Steps under torii | **860–880** | Climbing shots |
| `voidField({ palette })` | Flat radial field | anywhere | Title cards, blackouts, abstract beats |

For `platform`, hang a lantern at `x: 976, y: 470` to sit on the third post.

For `kitchen`, stand a stockpot at `y: 646` so it sits **on** a burner rather than
on the floor.

**To seat someone at a table**, clear that table's slot and stage your own in front
of them — `diningRoom({ clearTable: 1 })` drops the table under the window, then:

```ts
layers: [
  { id: 'guest', svg: guest({ pose: 'sit' }), x: 806, y: 762 },
  { id: 'table', svg: props.diningTable(), x: 806, y: 812, scale: 0.92 },
]
```

Order matters. Backdrops draw behind every layer, so a character placed at a
backdrop table is drawn *over* it and reads as standing in front of furniture. The
table has to be a layer, and it has to come after them.

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
| `props.stockpot(body?, ink?)` | Steams on its own. In `kitchen`, place at `y: 646` |
| `props.dish(plate?, food?, ink?)` | A finished plate. Fade it in on the beat it lands |
| `props.diningTable(top?, leg?, ink?)` | Top ~200 above `y`, candle off-centre at x−78. See the seating note above |

Props are drawn at the same scale as characters — the rig is 442 units tall, so a
table top at ~200 is a little under half a standing figure. If a prop looks like
doll furniture next to a character, it is the prop that is wrong, not the scale.

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

## Pruning what you copied

Do this before staging, not after. Delete from your story's `art/` every palette,
location, prop, effect and pose the story does not put on screen, and drop the
matching entries from `index.ts`. TypeScript will point at anything you cut too
deeply, so this is safe to be aggressive about.

Two things make it more than tidying. A short film's art folder becomes small enough
to read in one sitting, which is where you notice that a prop is at the wrong scale.
And an option that can only take one value is worse than no option — if the story has
one character, delete the `hair` and `outfit` parameters rather than leaving knobs
that do nothing.

`src/stories/last-ticket/` is the worked example: 1,698 copied lines down to 708 — two
palettes, one location, two props, two effects, one hair style, one outfit.

## Extending your story's art

If the story needs something absent from your `art/`, **copy it in from
`src/lib/art-stencil/`** and then change it freely. Never import the stencil, and never
import another story's `art/` — `scripts/check-isolation.mjs` fails the build on both.

If it is absent from the stencil too, add it to your own `art/` rather than inlining
SVG into `story.ts`:

- a location → your `art/backdrops.ts`
- a prop → the `props` object in your `art/characters.ts`
- an effect → your `art/fx.ts`
- a pose → the `POSES` table in your `art/characters.ts` (joint positions, not paths)

Then re-export it from your `art/index.ts` and `npm run shoot <slug>` to look at it.

**If it is good enough to be the house style, put it in the stencil too** — a separate,
deliberate edit to `src/lib/art-stencil/`, checked with `npm run shoot kit`. That is
how the next story inherits it. It will not travel backwards into stories already made.
