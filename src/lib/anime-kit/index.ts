/**
 * The anime art kit.
 *
 * Story files import from here and nowhere else:
 *
 *   import { ridge, character, sakura, vignette } from '../lib/anime-kit';
 *
 * Backdrops are re-exported under their location names, effects under their effect
 * names. Anything a story needs that the kit cannot express is a signal to extend
 * the kit — not to inline bespoke SVG into the story file, which is how a library
 * of stories stops looking like one library.
 */

export { FRAME, HORIZON, rng, seedFrom, times, group, round } from './svg';
export {
  PALETTES,
  palette,
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
