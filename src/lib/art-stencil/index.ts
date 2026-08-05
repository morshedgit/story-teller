/**
 * The art stencil — the house style, as a thing to be **copied from**.
 *
 * **No story imports this.** `scripts/check-isolation.mjs` fails the build if one
 * does. A story owns its art: creating a story copies the pieces it needs into
 * `src/stories/<slug>/art/`, and from that moment the story is free to repaint,
 * redraw or delete any of it without any possibility of disturbing another story.
 *
 * That freedom is the whole point, and it is bought with duplication: a genuine bug
 * fixed here does not reach stories already stamped from it. At this scale that is
 * the right trade — shared art means editing one story can silently break another,
 * which is exactly how a dining-table fix once broke an unrelated scene.
 *
 * What *is* shared lives in `src/lib/svg.ts`: frame size, seeded RNG, small markup
 * helpers. None of it has a colour or a shape. `src/pages/kit-preview.astro` renders
 * this stencil so the house style can be eyeballed on its own.
 */

export { FRAME, HORIZON, rng, seedFrom, times, group, round } from '../svg';
export {
  PALETTES,
  palette,
  type PaletteName,
  SKIN,
  HAIR_COLORS,
  CLOTH_COLORS,
  type Palette,
  type HairColor,
  type ClothColor,
} from './palette';

export {
  sky,
  ridge,
  field,
  forest,
  city,
  ocean,
  platform,
  room,
  kitchen,
  diningRoom,
  shrine,
  voidField,
  type BackdropOptions,
  type DiningRoomOptions,
  type SkyOptions,
} from './backdrops';

export {
  character,
  props,
  type CharacterOptions,
  type HairStyle,
  type Outfit,
  type PoseName,
  type Expression,
} from './characters';

export {
  sakura,
  rain,
  snow,
  speedLines,
  screenTone,
  sparkle,
  lightRays,
  fireflies,
  mist,
  vignette,
  letterbox,
  type FxOptions,
} from './fx';
