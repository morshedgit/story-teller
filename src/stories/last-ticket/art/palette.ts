/**
 * This story's palettes.
 *
 * Two, because this story is two scenes: `storm` for the night that goes wrong and
 * `dawn` for the turn. The other four the stencil offers were dropped — an unused
 * palette is just a colour nobody looks at.
 *
 * Every builder in this folder reads its colours from here, which is what keeps the
 * two scenes looking like the same film. Backgrounds get gradients and atmosphere;
 * characters stay flat with one shadow tone. Keep that split — flat characters
 * against a soft ground is the whole look.
 *
 * Names are local to this story. The engine only reads `name`, `tint` and
 * `tintOpacity` (see `ScenePalette` in `src/lib/story.ts`), which this satisfies
 * structurally. Rename these, repaint them, invent new ones: nothing else is
 * affected, and no other story can see them.
 */
export type PaletteName = 'dawn' | 'storm';

export interface Palette {
  name: PaletteName;
  /** Sky gradient, top to horizon. */
  sky: [string, string, string];
  /** Sun / moon disc and its bloom. */
  glow: string;
  glowSoft: string;
  /** Atmospheric haze sitting on the horizon. */
  haze: string;
  /** Depth silhouettes, far to near. Lightest to darkest. */
  far: string;
  mid: string;
  near: string;
  ground: string;
  groundShade: string;
  /**
   * Interior surfaces.
   *
   * Exteriors reuse `ground` for the earth, which is grass-green in `day` — fine
   * for a field, absurd for a kitchen floor. Interior backdrops read these instead,
   * so a room can be lit by the same palette without inheriting landscape colours.
   */
  wall: string;
  wallShade: string;
  floor: string;
  floorShade: string;
  /** Character outline. Never pure black — anime ink is a deep tinted brown/plum. */
  ink: string;
  /** Rim light along the lit edge of characters. */
  rim: string;
  accent: string;
  /** Full-frame colour wash that binds characters into the background. */
  tint: string;
  tintOpacity: number;
  /** Caption / UI text tone for this palette. */
  paper: string;
  hasStars: boolean;
}

export const PALETTES: Record<PaletteName, Palette> = {
  dawn: {
    name: 'dawn',
    sky: ['#3f4a86', '#c988a4', '#f7c9a0'],
    glow: '#fff0d4',
    glowSoft: '#ffd39b',
    haze: '#ffd9b0',
    far: '#8a7fa8',
    mid: '#5d5580',
    near: '#3a3459',
    ground: '#4a4468',
    groundShade: '#332f4d',
    wall: '#c8b0ae',
    wallShade: '#ab9296',
    floor: '#8c7d84',
    floorShade: '#75676f',
    ink: '#2b2340',
    rim: '#ffe2b8',
    accent: '#ff9e7d',
    tint: '#ffb98a',
    tintOpacity: 0.12,
    paper: '#fff4e6',
    hasStars: false,
  },
  storm: {
    name: 'storm',
    sky: ['#2b3038', '#454d5a', '#6d7683'],
    glow: '#c9d3de',
    glowSoft: '#9aa6b4',
    haze: '#8b95a3',
    far: '#5e6874',
    mid: '#414954',
    near: '#2a303a',
    ground: '#333a44',
    groundShade: '#22272f',
    wall: '#6b7179',
    wallShade: '#565d66',
    floor: '#4a505a',
    floorShade: '#3a404a',
    ink: '#1b1f26',
    rim: '#dfe7f0',
    accent: '#7fb2e8',
    tint: '#7d8b9c',
    tintOpacity: 0.2,
    paper: '#eef2f7',
    hasStars: false,
  },
};

export function palette(name: PaletteName): Palette {
  return PALETTES[name];
}

/** Shared flat character tones. Characters do not change colour between palettes —
 *  the scene tint does the work of unifying them with the background. */
export const SKIN = {
  base: '#ffdcc0',
  shade: '#f0b899',
  blush: '#ff9d9d',
} as const;

export const HAIR_COLORS = {
  black: { base: '#3a3550', shade: '#2a2640' },
  brown: { base: '#7b4f3a', shade: '#5e3a2a' },
  auburn: { base: '#a8523c', shade: '#833d2c' },
  ash: { base: '#9aa3b8', shade: '#7a8296' },
  white: { base: '#e8e6f0', shade: '#c6c3d6' },
  navy: { base: '#3d4c7a', shade: '#2c3860' },
  sakura: { base: '#eaa3bd', shade: '#cf7f9d' },
  moss: { base: '#5f7a5a', shade: '#48603f' },
} as const;

export type HairColor = keyof typeof HAIR_COLORS;

export const CLOTH_COLORS = {
  indigo: { base: '#3f4a7a', shade: '#2e3760' },
  cream: { base: '#f2e6d0', shade: '#d8c6ab' },
  crimson: { base: '#a83f4a', shade: '#832f39' },
  moss: { base: '#5c7350', shade: '#44583b' },
  slate: { base: '#4a5460', shade: '#363e48' },
  plum: { base: '#6a4470', shade: '#513356' },
  ochre: { base: '#c08a3e', shade: '#9a6c2c' },
  teal: { base: '#356b6b', shade: '#265252' },
} as const;

export type ClothColor = keyof typeof CLOTH_COLORS;
