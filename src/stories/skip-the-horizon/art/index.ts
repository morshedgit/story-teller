/**
 * This story's art. It belongs to this story and to nothing else.
 *
 * It arrived as a copy of the house style in `src/lib/art-stencil/`, and it is now
 * yours: repaint a palette, redraw a prop, delete a pose. No other story can see any
 * of it, and no other story's changes can reach you.
 *
 * **Prune this before you ship.** It arrives carrying six palettes, eleven locations,
 * eleven effects, nine props and a rig with seven hair styles — far more than any one
 * short uses. Delete everything this story does not stage. An unused builder is not a
 * spare part, it is a thing the next reader has to rule out. For reference,
 * `src/stories/last-ticket/` cut its copy from 1,698 lines to 708.
 *
 * If you need something that is not here, copy it in from `src/lib/art-stencil/` —
 * do not import it. `scripts/check-isolation.mjs` fails the build on any import of
 * the stencil or of another story's directory.
 *
 * What *is* shared lives in `src/lib/svg.ts`: frame size, seeded RNG, small markup
 * helpers. None of it has a colour or a shape, so none of it can make two stories
 * look alike against your wishes.
 */

export { FRAME, HORIZON, rng, seedFrom, times, group, round } from '../../../lib/svg';
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
  oceanFrozen,
  skyFracture,
  cosmicRift,
  oceanPatched,
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
