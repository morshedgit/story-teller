/**
 * This story's foreground effects.
 *
 * Two. The stencil offers eleven, but petals, rain, snow, fireflies and god rays
 * have no business in a closed kitchen, and an effect nobody uses is just markup
 * waiting to be mistaken for an option.
 *
 * These draw *above* the characters and are ambient — they loop on CSS keyframes
 * rather than on the story timeline, because atmosphere does not need to be
 * beat-accurate. Anything that must land on a specific narration beat (an impact
 * flash, a cut-in) belongs in a cue, not here.
 */

import { FRAME, seedFrom } from '../../../lib/svg';

export interface FxOptions {
  seed?: string;
  color?: string;
  opacity?: number;
}

/** Halftone dot screen — manga shading over the whole frame. */
export function screenTone(opts: FxOptions = {}): string {
  const color = opts.color ?? '#2b2340';
  const id = `tone-${seedFrom(opts.seed ?? 'tone').toString(36)}`;
  return `<g data-fx="screen-tone">
    <defs>
      <pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="4" r="2.6" fill="${color}"/>
      </pattern>
    </defs>
    <rect x="0" y="0" width="${FRAME.w}" height="${FRAME.h}" fill="url(#${id})" opacity="${opts.opacity ?? 0.14}"/>
  </g>`;
}

/** Darkened frame edges. Focuses the eye; use on almost any dramatic scene. */
export function vignette(opts: FxOptions = {}): string {
  const id = `vig-${seedFrom(opts.seed ?? 'vignette').toString(36)}`;
  return `<g data-fx="vignette">
    <defs>
      <radialGradient id="${id}" cx="0.5" cy="0.5" r="0.72">
        <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="${opts.opacity ?? 0.42}"/>
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="${FRAME.w}" height="${FRAME.h}" fill="url(#${id})"/>
  </g>`;
}
