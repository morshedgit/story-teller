/**
 * Palettes.
 *
 * Every scene picks one palette and every art builder reads its colours from it.
 * That single constraint is what keeps twenty independently authored stories
 * looking like they came from the same studio.
 *
 * Anime backgrounds get gradients and atmosphere; characters stay flat with one
 * shadow tone. Keep that split — flat characters against a soft sky is the whole
 * look.
 */

import type { PaletteName } from '../story';

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
  day: {
    name: 'day',
    sky: ['#4f9ee8', '#95cdf2', '#dcf0fb'],
    glow: '#ffffff',
    glowSoft: '#fff8d8',
    haze: '#e8f6ff',
    far: '#a9cfe0',
    mid: '#6fa8ad',
    near: '#4a7f78',
    ground: '#7cb36a',
    groundShade: '#5b8f52',
    wall: '#e6e1d6',
    wallShade: '#cdc6b8',
    floor: '#a49d93',
    floorShade: '#8b857c',
    ink: '#33384f',
    rim: '#ffffff',
    accent: '#ff7a6b',
    tint: '#bfe6ff',
    tintOpacity: 0.06,
    paper: '#f4fbff',
    hasStars: false,
  },
  dusk: {
    name: 'dusk',
    sky: ['#2d2a63', '#8b4a7d', '#f0a05a'],
    glow: '#ffe9b0',
    glowSoft: '#ffb15e',
    haze: '#ffb877',
    far: '#7a5f8a',
    mid: '#4e3d64',
    near: '#2e2442',
    ground: '#3a2c4d',
    groundShade: '#251c33',
    wall: '#b39189',
    wallShade: '#96736f',
    floor: '#6f5a5e',
    floorShade: '#5a464b',
    ink: '#241c36',
    rim: '#ffd9a0',
    accent: '#ff8f5e',
    tint: '#ff9c5c',
    tintOpacity: 0.16,
    paper: '#fff1dd',
    hasStars: false,
  },
  night: {
    name: 'night',
    sky: ['#0b1030', '#1a2456', '#3d4a83'],
    glow: '#eaf2ff',
    glowSoft: '#9fb8ff',
    haze: '#5468a8',
    far: '#39457a',
    mid: '#232c55',
    near: '#141a36',
    ground: '#1b2242',
    groundShade: '#0e1228',
    wall: '#3b4362',
    wallShade: '#2c3350',
    floor: '#282e46',
    floorShade: '#1c2136',
    ink: '#0d1128',
    rim: '#bcd2ff',
    accent: '#7fe6d8',
    tint: '#5f7bd6',
    tintOpacity: 0.18,
    paper: '#e8eeff',
    hasStars: true,
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
  memory: {
    name: 'memory',
    sky: ['#d9c3a0', '#ecd9bb', '#f7ecd8'],
    glow: '#fffdf5',
    glowSoft: '#f6e3bd',
    haze: '#f3e4c9',
    far: '#c3ae90',
    mid: '#a3907a',
    near: '#7d6d5c',
    ground: '#b3a186',
    groundShade: '#93816b',
    wall: '#ded1ba',
    wallShade: '#c4b498',
    floor: '#a89881',
    floorShade: '#8f7f6a',
    ink: '#544632',
    rim: '#fffaf0',
    accent: '#c98f6a',
    tint: '#d8bd90',
    tintOpacity: 0.22,
    paper: '#fffaf0',
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
