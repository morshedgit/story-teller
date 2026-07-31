/**
 * Foreground effects.
 *
 * These draw *above* the characters and are almost always ambient — they loop on
 * CSS keyframes rather than on the story timeline, because weather does not need
 * to be beat-accurate and driving 80 petals from JS would be wasteful.
 *
 * Anything that must land on a specific narration beat (an impact flash, a
 * cut-in) belongs in a cue, not here.
 */

import { FRAME, rng, round, seedFrom, times } from './svg';

export interface FxOptions {
  seed?: string;
  count?: number;
  color?: string;
  opacity?: number;
}

/** Drifting cherry blossom petals. The default "something is beautiful" effect. */
export function sakura(opts: FxOptions = {}): string {
  const random = rng(seedFrom(opts.seed ?? 'sakura'));
  const color = opts.color ?? '#f7c6d9';
  const body = times(opts.count ?? 26, () => {
    const x = round(random() * FRAME.w);
    const delay = round(random() * 12);
    const dur = round(9 + random() * 8);
    const scale = round(0.6 + random() * 0.9);
    const sway = round(40 + random() * 90);
    return `<g class="k-fall" style="--d:-${delay}s;--t:${dur}s;--sway:${sway}px" transform="translate(${x} -40)">
      <path d="M 0 0 q 7 -8 12 0 q -5 9 -12 0 Z" fill="${color}" opacity="${round(0.55 + random() * 0.4)}" transform="scale(${scale})"/>
    </g>`;
  });
  return `<g data-fx="sakura">${body}</g>`;
}

/** Slanted rain. Pair with the `storm` palette. */
export function rain(opts: FxOptions & { angle?: number } = {}): string {
  const random = rng(seedFrom(opts.seed ?? 'rain'));
  const color = opts.color ?? '#cfe0f2';
  const angle = opts.angle ?? 14;
  const body = times(opts.count ?? 90, () => {
    const x = round(random() * (FRAME.w + 300) - 150);
    const len = round(40 + random() * 70);
    const delay = round(random() * 1.2);
    const dur = round(0.5 + random() * 0.45);
    return `<line class="k-rain" style="--d:-${delay}s;--t:${dur}s" x1="${x}" y1="-120" x2="${round(x - len * 0.25)}" y2="${-120 + len}"
      stroke="${color}" stroke-width="${round(1.4 + random() * 1.8)}" opacity="${round(0.25 + random() * 0.45)}" stroke-linecap="round"/>`;
  });
  return `<g data-fx="rain" transform="rotate(${angle} ${FRAME.w / 2} ${FRAME.h / 2})">${body}</g>`;
}

export function snow(opts: FxOptions = {}): string {
  const random = rng(seedFrom(opts.seed ?? 'snow'));
  const color = opts.color ?? '#ffffff';
  const body = times(opts.count ?? 60, () => {
    const x = round(random() * FRAME.w);
    const r = round(1.6 + random() * 3.4);
    const delay = round(random() * 14);
    const dur = round(11 + random() * 10);
    return `<circle class="k-fall" style="--d:-${delay}s;--t:${dur}s;--sway:${round(30 + random() * 70)}px"
      cx="${x}" cy="-30" r="${r}" fill="${color}" opacity="${round(0.4 + random() * 0.5)}"/>`;
  });
  return `<g data-fx="snow">${body}</g>`;
}

/** Radial speed lines. The shonen "this moment matters" punctuation. */
export function speedLines(opts: FxOptions & { cx?: number; cy?: number } = {}): string {
  const random = rng(seedFrom(opts.seed ?? 'speed'));
  const color = opts.color ?? '#ffffff';
  const cx = opts.cx ?? FRAME.w / 2;
  const cy = opts.cy ?? FRAME.h / 2;
  const body = times(opts.count ?? 54, (i) => {
    const angle = (i / (opts.count ?? 54)) * Math.PI * 2 + random() * 0.06;
    const inner = 260 + random() * 220;
    const outer = 1300;
    const w = round(2 + random() * 9);
    const x1 = round(cx + Math.cos(angle) * inner);
    const y1 = round(cy + Math.sin(angle) * inner);
    const x2 = round(cx + Math.cos(angle) * outer);
    const y2 = round(cy + Math.sin(angle) * outer);
    return `<line class="k-zip" style="--d:-${round(random() * 0.6)}s" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
      stroke="${color}" stroke-width="${w}" opacity="${round(0.3 + random() * 0.5)}" stroke-linecap="round"/>`;
  });
  return `<g data-fx="speed-lines" opacity="${opts.opacity ?? 0.7}">${body}</g>`;
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

/** Four-point star sparkles. Good for wonder, magic and first sight of something. */
export function sparkle(opts: FxOptions = {}): string {
  const random = rng(seedFrom(opts.seed ?? 'sparkle'));
  const color = opts.color ?? '#fff3c4';
  const body = times(opts.count ?? 22, () => {
    const x = round(random() * FRAME.w);
    const y = round(random() * FRAME.h * 0.8);
    const s = round(0.5 + random() * 1.3);
    const delay = round(random() * 5);
    return `<path class="k-pop" style="--d:-${delay}s" transform="translate(${x} ${y}) scale(${s})"
      d="M 0 -16 Q 3 -3 16 0 Q 3 3 0 16 Q -3 3 -16 0 Q -3 -3 0 -16 Z" fill="${color}"/>`;
  });
  return `<g data-fx="sparkle">${body}</g>`;
}

/**
 * God rays slanting through the frame.
 *
 * Each ray widens toward the bottom, so width and spacing have to be chosen
 * together: rays wider than their spacing overlap into one opaque sheet and bury
 * the scene underneath. Bottom width here is 1.4x the top and stays well under the
 * 250-unit stride.
 */
export function lightRays(opts: FxOptions & { angle?: number } = {}): string {
  const random = rng(seedFrom(opts.seed ?? 'rays'));
  const color = opts.color ?? '#fff2cc';
  const stride = 250;
  const body = times(opts.count ?? 5, (i) => {
    const x = round(-180 + i * stride + random() * 70);
    const w = round(18 + random() * 46);
    return `<path class="k-breathe-slow" style="--d:-${round(random() * 6)}s"
      d="M ${x} -100 l ${w} 0 l ${round(w * 1.6)} ${FRAME.h + 200} l ${round(-w * 1.4)} 0 Z"
      fill="${color}" opacity="${round(0.05 + random() * 0.07)}"/>`;
  });
  return `<g data-fx="light-rays" transform="rotate(${opts.angle ?? -14} ${FRAME.w / 2} 0)">${body}</g>`;
}

/** Fireflies / drifting embers. Warm night scenes. */
export function fireflies(opts: FxOptions = {}): string {
  const random = rng(seedFrom(opts.seed ?? 'fireflies'));
  const color = opts.color ?? '#ffe9a8';
  const body = times(opts.count ?? 26, () => {
    const x = round(random() * FRAME.w);
    const y = round(200 + random() * (FRAME.h - 260));
    const r = round(2.4 + random() * 3.4);
    return `<g class="k-hover" style="--d:-${round(random() * 9)}s;--t:${round(6 + random() * 7)}s" transform="translate(${x} ${y})">
      <circle r="${round(r * 3.4)}" fill="${color}" opacity="0.16"/>
      <circle class="k-pulse" style="--d:-${round(random() * 3)}s" r="${r}" fill="${color}"/>
    </g>`;
  });
  return `<g data-fx="fireflies">${body}</g>`;
}

/** Ground mist. Softens the base of a scene and adds depth cheaply. */
export function mist(opts: FxOptions & { y?: number } = {}): string {
  const random = rng(seedFrom(opts.seed ?? 'mist'));
  const color = opts.color ?? '#ffffff';
  const baseY = opts.y ?? 700;
  const body = times(opts.count ?? 6, (i) => {
    const y = round(baseY + i * 34 - random() * 40);
    const rx = round(320 + random() * 320);
    return `<ellipse class="k-drift" style="--d:-${round(random() * 30)}s" cx="${round(random() * FRAME.w)}" cy="${y}"
      rx="${rx}" ry="${round(26 + random() * 26)}" fill="${color}" opacity="${round(0.06 + random() * 0.1)}"/>`;
  });
  return `<g data-fx="mist">${body}</g>`;
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

/** Cinematic top/bottom bars. Signals a held, important shot. */
export function letterbox(opts: { height?: number } = {}): string {
  const h = opts.height ?? 70;
  return `<g data-fx="letterbox" fill="#0b0d16">
    <rect x="0" y="0" width="${FRAME.w}" height="${h}"/>
    <rect x="0" y="${FRAME.h - h}" width="${FRAME.w}" height="${h}"/>
  </g>`;
}
