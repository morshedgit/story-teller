/**
 * This story's backdrops.
 *
 * One location, because this story has one: the kitchen, before and after closing.
 * The stencil's other ten — ridges, city, ocean, shrine, the dining room — went, and
 * with them the sky and cloud machinery that nothing indoors needs.
 *
 * Ground line is **y = 790**. Characters stand there.
 */

import type { Palette } from './palette';
import { FRAME, group, rng, round, seedFrom, times, uid } from '../../../lib/svg';

export interface BackdropOptions {
  /** Seed for the randomised dressing. Same seed, same kitchen, every build. */
  seed?: string;
  /**
   * The palette object itself, not a name.
   *
   * Builders take the object so a scene passes the same `P.storm` it is set in —
   * one import, no name-to-object lookup, and no global registry of palette names
   * for this story to have to be a member of.
   */
  palette: Palette;
}

/**
 * Restaurant kitchen: tiled wall, a steel pass running the width, extraction hood
 * and range on the left, shelved pots on the right.
 *
 * Surfaces come from the palette's interior tones, not from `ground`/`far` — those
 * are landscape colours and would paint this room grass-green.
 *
 * The pass sits behind the ground line, so a character stands in front of it rather
 * than being sliced in half by it. Pass at y=600, floor at y=700, burners at
 * x≈150–432.
 */
export function kitchen(opts: BackdropOptions): string {
  const p = opts.palette;
  const seed = seedFrom(opts.seed ?? `${p.name}-kitchen`);
  const random = rng(seed);
  const passY = 600;
  const floorY = 700;
  const tiles = uid('tiles');
  const wash = uid('wash');

  const pots = times(6, (i) => {
    const x = 1090 + i * 78;
    const h = round(30 + random() * 26);
    return `<g>
      <rect x="${x}" y="${round(324 - h)}" width="54" height="${h}" rx="5" fill="${p.floorShade}"/>
      <rect x="${x - 5}" y="${round(318 - h)}" width="64" height="9" rx="4" fill="${p.wallShade}"/>
    </g>`;
  });

  const burners = times(4, (i) => {
    const x = 150 + i * 94;
    return `<circle cx="${x}" cy="${passY + 34}" r="26" fill="${p.floorShade}"/>
            <circle cx="${x}" cy="${passY + 34}" r="15" fill="${p.ink}" opacity="0.55"/>`;
  });

  // Shade is a dark cone with a bright rim underneath — a plain bright ellipse just
  // reads as a floating blob against the wall.
  const pendants = times(3, (i) => {
    const x = 560 + i * 300;
    return `<g class="k-sway" style="--d:-${i * 1.9}s;--t:8s">
      <line x1="${x}" y1="0" x2="${x}" y2="104" stroke="${p.ink}" stroke-width="4"/>
      <path d="M ${x - 40} 150 L ${x - 16} 104 L ${x + 16} 104 L ${x + 40} 150 Z" fill="${p.ink}" opacity="0.9"/>
      <ellipse cx="${x}" cy="150" rx="40" ry="8" fill="${p.glow}" opacity="0.95"/>
      <ellipse class="k-pulse" style="--d:-${i * 1.3}s;--t:7s" cx="${x}" cy="176" rx="62" ry="34" fill="${p.glow}" opacity="0.07"/>
    </g>`;
  });

  return `
    <defs>
      <pattern id="${tiles}" width="76" height="76" patternUnits="userSpaceOnUse">
        <rect width="76" height="76" fill="${p.wallShade}"/>
        <rect x="2" y="2" width="72" height="72" rx="3" fill="${p.wall}"/>
      </pattern>
      <linearGradient id="${wash}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${p.glow}" stop-opacity="0.16"/>
        <stop offset="100%" stop-color="${p.glow}" stop-opacity="0"/>
      </linearGradient>
    </defs>

    <rect x="0" y="0" width="${FRAME.w}" height="${passY}" fill="url(#${tiles})"/>
    <rect x="0" y="0" width="${FRAME.w}" height="300" fill="url(#${wash})"/>

    ${group(
      { 'data-part': 'hood' },
      `<path d="M 40 130 L 480 130 L 420 280 L 100 280 Z" fill="${p.floorShade}"/>`,
      `<rect x="24" y="112" width="472" height="26" rx="8" fill="${p.wallShade}"/>`,
      `<rect x="100" y="272" width="320" height="12" fill="${p.ink}" opacity="0.5"/>`,
    )}

    ${group({ 'data-part': 'shelf' }, `<rect x="1060" y="324" width="520" height="12" rx="5" fill="${p.floorShade}"/>`, pots)}

    <rect x="0" y="${passY}" width="${FRAME.w}" height="${floorY - passY}" fill="${p.wallShade}"/>
    <rect x="0" y="${passY}" width="${FRAME.w}" height="14" fill="${p.rim}" opacity="0.5"/>
    ${group({ 'data-part': 'burners' }, burners)}
    <rect x="0" y="${floorY - 12}" width="${FRAME.w}" height="12" fill="${p.floorShade}"/>

    <rect x="0" y="${floorY}" width="${FRAME.w}" height="${FRAME.h - floorY}" fill="${p.floor}"/>
    ${group(
      { 'data-part': 'floor' },
      times(6, (i) => {
        const y = round(floorY + 36 + i * 34);
        return `<line x1="0" y1="${y}" x2="${FRAME.w}" y2="${y}" stroke="${p.floorShade}" stroke-width="3" opacity="0.45"/>`;
      }),
    )}
    ${group({ 'data-part': 'pendants' }, pendants)}`;
}
