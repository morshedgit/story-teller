/**
 * "The Last Ticket" — this story's art, and nobody else's.
 *
 * Stamped from `src/lib/art-stencil/` and then cut down to what these two scenes
 * actually put on screen: two palettes, one location, one character, two props, two
 * effects. Everything here can be repainted or rewritten freely — no other story can
 * see it, and `scripts/check-isolation.mjs` makes sure no other story reaches in.
 *
 * The reverse also holds: improving the stencil will not improve this story. If the
 * house style gains something worth having here, copy it in.
 */

export { PALETTES, SKIN, HAIR_COLORS, CLOTH_COLORS, type Palette, type HairColor, type ClothColor } from './palette';
export { kitchen, type BackdropOptions } from './backdrops';
export {
  character,
  props,
  type CharacterOptions,
  type PoseName,
  type Expression,
} from './characters';
export { screenTone, vignette, type FxOptions } from './fx';
