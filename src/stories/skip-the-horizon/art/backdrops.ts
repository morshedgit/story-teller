/**
 * Backdrops.
 *
 * Each exported builder returns a complete background: sky, atmosphere, depth
 * silhouettes and ground, in one call. Story files never compose these by hand —
 * they write `backdrop: dusk_ridge()` and move on.
 *
 * Depth comes from three silhouette bands (far / mid / near) getting darker and
 * more detailed as they approach the camera. That is the cheapest convincing
 * anime background trick there is, and it costs almost no markup.
 */

import type { Palette } from './palette';
import { FRAME, HORIZON, group, ridgePath, ridgePoints, rng, round, seedFrom, times, uid } from '../../../lib/svg';

export interface SkyOptions {
  /** Seed for star/cloud placement. Same seed, same sky. */
  seed?: string;
  /** Horizontal position of the sun/moon disc, or `false` for none. */
  disc?: number | false;
  /** Height of the disc above the frame top edge. */
  discY?: number;
  /** Number of puffy clouds. */
  clouds?: number;
  /** Override the horizon line. */
  horizon?: number;
}

function celestial(p: Palette, x: number, y: number, isMoon: boolean): string {
  const g = uid('glow');
  const r = isMoon ? 46 : 62;
  return `
    <defs>
      <radialGradient id="${g}">
        <stop offset="0%" stop-color="${p.glow}" stop-opacity="0.9"/>
        <stop offset="35%" stop-color="${p.glowSoft}" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="${p.glowSoft}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="${x}" cy="${y}" r="${r * 4.2}" fill="url(#${g})"/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="${p.glow}"/>
    ${
      isMoon
        ? `<circle cx="${x + 18}" cy="${y - 12}" r="${r * 0.86}" fill="${p.sky[0]}" opacity="0.55"/>`
        : ''
    }`;
}

function stars(p: Palette, seed: number, horizon: number): string {
  if (!p.hasStars) return '';
  const random = rng(seed);
  const body = times(90, () => {
    const x = round(random() * FRAME.w);
    const y = round(random() * (horizon - 120));
    const r = round(0.9 + random() * 1.9);
    const delay = round(random() * 6);
    return `<circle class="k-twinkle" cx="${x}" cy="${y}" r="${r}" fill="${p.glow}" style="--d:${delay}s" opacity="${round(
      0.35 + random() * 0.55,
    )}"/>`;
  });
  return group({ 'data-part': 'stars' }, body);
}

/** Puffy stacked-ellipse cloud, the classic flat anime shape. */
function cloud(p: Palette, x: number, y: number, scale: number, opacity: number, drift: number): string {
  const puffs = [
    [0, 0, 62, 40],
    [-58, 12, 46, 30],
    [58, 10, 50, 32],
    [-24, -22, 44, 30],
    [30, -20, 40, 28],
  ] as const;
  const body = puffs.map(([dx, dy, rx, ry]) => `<ellipse cx="${dx}" cy="${dy}" rx="${rx}" ry="${ry}"/>`).join('');
  return `<g class="k-drift" transform="translate(${round(x)} ${round(y)}) scale(${round(scale)})" style="--d:${round(
    drift,
  )}s" fill="${p.glow}" opacity="${opacity}">${body}</g>`;
}

function clouds(p: Palette, seed: number, count: number, horizon: number): string {
  if (count <= 0) return '';
  const random = rng(seed + 7);
  const body = times(count, () => {
    const x = round(random() * FRAME.w);
    const y = round(90 + random() * (horizon - 260));
    const scale = round(0.55 + random() * 0.9);
    const opacity = round((0.28 + random() * 0.4) * 100) / 100;
    return cloud(p, x, y, scale, opacity, -random() * 40);
  });
  return group({ 'data-part': 'clouds' }, body);
}

/** Sky gradient, celestial body, stars, clouds and the horizon haze band. */
export function sky(p: Palette, opts: SkyOptions = {}): string {
  const seed = seedFrom(opts.seed ?? p.name);
  const horizon = opts.horizon ?? HORIZON;
  const gradient = uid('sky');
  const hazeId = uid('haze');
  const disc = opts.disc === false ? '' : celestial(p, opts.disc ?? 1180, opts.discY ?? 210, p.hasStars);

  return `
    <defs>
      <linearGradient id="${gradient}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${p.sky[0]}"/>
        <stop offset="58%" stop-color="${p.sky[1]}"/>
        <stop offset="100%" stop-color="${p.sky[2]}"/>
      </linearGradient>
      <linearGradient id="${hazeId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${p.haze}" stop-opacity="0"/>
        <stop offset="100%" stop-color="${p.haze}" stop-opacity="0.75"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${FRAME.w}" height="${horizon + 40}" fill="url(#${gradient})"/>
    ${stars(p, seed, horizon)}
    ${disc}
    ${clouds(p, seed, opts.clouds ?? 4, horizon)}
    <rect x="0" y="${horizon - 220}" width="${FRAME.w}" height="260" fill="url(#${hazeId})"/>`;
}

function ground(p: Palette, horizon: number, color = p.ground): string {
  return `<rect x="0" y="${horizon}" width="${FRAME.w}" height="${FRAME.h - horizon}" fill="${color}"/>`;
}

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

export interface BackdropOptions extends SkyOptions {
  /**
   * The palette object itself, not a name.
   *
   * Builders take the object so a story passes the same `P.dusk` it puts on the
   * scene — one import, no name-to-object lookup table, and no global registry of
   * palette names for a story to have to be a member of.
   */
  palette: Palette;
}

function resolve(opts: BackdropOptions): [Palette, number, number] {
  const p = opts.palette;
  return [p, opts.horizon ?? HORIZON, seedFrom(opts.seed ?? `${p.name}-bg`)];
}

/** Layered mountain ridges receding into haze. The workhorse exterior. */
export function ridge(opts: BackdropOptions): string {
  const [p, horizon, seed] = resolve(opts);
  const far = rng(seed);
  const mid = rng(seed + 11);
  const near = rng(seed + 23);

  return `${sky(p, opts)}
    <path d="${ridgePath(ridgePoints(far, { count: 7, baseline: horizon - 30, amplitude: 190 }), horizon + 20)}" fill="${p.far}" opacity="0.75"/>
    <path d="${ridgePath(ridgePoints(mid, { count: 9, baseline: horizon + 10, amplitude: 130 }), horizon + 40)}" fill="${p.mid}" opacity="0.9"/>
    ${ground(p, horizon + 30)}
    <path d="${ridgePath(ridgePoints(near, { count: 6, baseline: horizon + 60, amplitude: 70 }), FRAME.h)}" fill="${p.near}"/>`;
}

/** Open grass hills with a footpath running to the horizon. */
export function field(opts: BackdropOptions): string {
  const [p, horizon, seed] = resolve(opts);
  const far = rng(seed);
  const random = rng(seed + 31);

  const grass = times(60, () => {
    const x = round(random() * FRAME.w);
    const y = round(horizon + 40 + random() * (FRAME.h - horizon - 60));
    const h = round(10 + random() * 22);
    return `<path class="k-sway-slow" style="--d:${round(random() * 4)}s" d="M ${x} ${y} q 4 ${-h / 2} 1 ${-h}" stroke="${p.groundShade}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>`;
  });

  return `${sky(p, opts)}
    <path d="${ridgePath(ridgePoints(far, { count: 6, baseline: horizon - 10, amplitude: 120 }), horizon + 20)}" fill="${p.far}" opacity="0.7"/>
    ${ground(p, horizon)}
    <path d="M 0 ${FRAME.h} Q 620 ${horizon + 150} 760 ${horizon} L 900 ${horizon} Q 820 ${horizon + 170} 1600 ${FRAME.h} Z" fill="${p.groundShade}" opacity="0.55"/>
    ${group({ 'data-part': 'grass' }, grass)}`;
}

/** Dense treeline with light filtering through. Good for quiet or tense interiors of nature. */
export function forest(opts: BackdropOptions): string {
  const [p, horizon, seed] = resolve(opts);
  const random = rng(seed);

  // Trunks need real mass, or a night forest reads as a picket fence.
  const trunks = times(13, (i) => {
    const x = round(-50 + (i * FRAME.w) / 11 + random() * 50);
    const w = round(38 + random() * 62);
    const top = round(40 + random() * 150);
    const shade = i % 3 === 0 ? p.near : p.mid;
    return `<rect x="${x}" y="${top}" width="${w}" height="${FRAME.h - top}" fill="${shade}"/>`;
  });

  const canopy = ridgePath(ridgePoints(rng(seed + 5), { count: 16, baseline: 190, amplitude: 150 }), 0);

  return `${sky(p, { ...opts, clouds: 0 })}
    ${ground(p, horizon + 40)}
    ${group({ 'data-part': 'trunks', opacity: '0.95' }, trunks)}
    <path d="${canopy}" fill="${p.near}"/>
    <path d="M 0 ${FRAME.h} L 0 ${FRAME.h - 90} Q 400 ${FRAME.h - 150} 800 ${FRAME.h - 80} Q 1200 ${FRAME.h - 20} 1600 ${FRAME.h - 110} L 1600 ${FRAME.h} Z" fill="${p.groundShade}"/>`;
}

/** City skyline with lit windows. Windows flicker on a seeded schedule. */
export function city(opts: BackdropOptions): string {
  const [p, horizon, seed] = resolve(opts);
  const random = rng(seed);

  let x = -60;
  let buildings = '';
  let windows = '';
  while (x < FRAME.w + 60) {
    const w = round(70 + random() * 130);
    const h = round(120 + random() * 330);
    const top = horizon - h;
    buildings += `<rect x="${round(x)}" y="${round(top)}" width="${w}" height="${round(h + 60)}" fill="${p.near}"/>`;

    const cols = Math.max(1, Math.floor(w / 26));
    const rows = Math.max(1, Math.floor(h / 34));
    for (let c = 0; c < cols; c += 1) {
      for (let r = 0; r < rows; r += 1) {
        if (random() > 0.42) continue;
        const wx = round(x + 10 + c * 26);
        const wy = round(top + 16 + r * 34);
        windows += `<rect class="k-flicker" style="--d:${round(random() * 9)}s" x="${wx}" y="${wy}" width="11" height="15" fill="${p.glowSoft}" opacity="${round(0.4 + random() * 0.5)}"/>`;
      }
    }
    x += w + 6;
  }

  return `${sky(p, opts)}
    <path d="${ridgePath(ridgePoints(rng(seed + 3), { count: 6, baseline: horizon - 120, amplitude: 130 }), horizon)}" fill="${p.far}" opacity="0.6"/>
    ${ground(p, horizon + 40, p.groundShade)}
    ${group({ 'data-part': 'buildings' }, buildings)}
    ${group({ 'data-part': 'windows' }, windows)}`;
}

/** Sea horizon seen from a cliff edge, with a moving light band on the water. */
export function ocean(opts: BackdropOptions): string {
  const [p, horizon, seed] = resolve(opts);
  const random = rng(seed);
  const discX = opts.disc === false ? 1180 : (opts.disc ?? 1180);

  const glints = times(26, () => {
    const y = round(horizon + 12 + random() * 180);
    const spread = round(40 + (y - horizon) * 1.9);
    const w = round(20 + random() * 90);
    const cx = round(discX - spread / 2 + random() * spread);
    return `<rect class="k-shimmer" style="--d:${round(random() * 5)}s" x="${cx}" y="${y}" width="${w}" height="4" rx="2" fill="${p.glow}" opacity="${round(0.25 + random() * 0.5)}"/>`;
  });

  const waves = times(9, (i) => {
    const y = round(horizon + 24 + i * 26);
    return `<path class="k-shimmer" style="--d:${round(i * 0.7)}s" d="M -40 ${y} q 90 -9 180 0 t 180 0 t 180 0 t 180 0 t 180 0 t 180 0 t 180 0 t 180 0 t 180 0" stroke="${p.rim}" stroke-width="3" fill="none" opacity="0.2"/>`;
  });

  return `${sky(p, opts)}
    ${ground(p, horizon, p.mid)}
    <rect x="0" y="${horizon}" width="${FRAME.w}" height="${FRAME.h - horizon}" fill="${p.near}" opacity="0.35"/>
    ${group({ 'data-part': 'glints' }, glints)}
    ${group({ 'data-part': 'waves' }, waves)}
    <path d="M 0 ${FRAME.h} L 0 ${FRAME.h - 120} Q 260 ${FRAME.h - 190} 520 ${FRAME.h - 96} L 520 ${FRAME.h} Z" fill="${p.near}"/>`;
}

/** Country railway platform: canopy posts, rails, and a fence line. */
export function platform(opts: BackdropOptions): string {
  const [p, horizon, seed] = resolve(opts);
  const random = rng(seed);

  // Canopy posts must reach the platform surface, not stop at the horizon, or they
  // hang in mid-air above the deck.
  const deckY = FRAME.h - 150;
  const posts = times(6, (i) => {
    const x = 120 + i * 280;
    return `<rect x="${x}" y="${horizon - 244}" width="16" height="${deckY - horizon + 244}" fill="${p.ink}" opacity="0.85"/>`;
  });

  const sleepers = times(22, (i) => {
    const y = round(horizon + 60 + i * 12 + i * i * 0.9);
    if (y > FRAME.h) return '';
    const inset = round(i * 3);
    return `<rect x="${180 + inset}" y="${y}" width="${1240 - inset * 2}" height="6" fill="${p.groundShade}" opacity="0.7"/>`;
  });

  const trees = times(9, () => {
    const x = round(random() * FRAME.w);
    const h = round(70 + random() * 90);
    return `<ellipse cx="${x}" cy="${horizon - h}" rx="${round(40 + random() * 30)}" ry="${round(h * 0.6)}" fill="${p.far}" opacity="0.75"/>`;
  });

  return `${sky(p, opts)}
    ${group({ 'data-part': 'trees' }, trees)}
    ${ground(p, horizon, p.mid)}
    ${group({ 'data-part': 'sleepers' }, sleepers)}
    <rect x="0" y="${horizon + 40}" width="${FRAME.w}" height="14" fill="${p.rim}" opacity="0.3"/>
    <rect x="0" y="${horizon - 270}" width="${FRAME.w}" height="26" fill="${p.ink}" opacity="0.9"/>
    <rect x="0" y="${deckY}" width="${FRAME.w}" height="150" fill="${p.near}"/>
    <rect x="0" y="${deckY}" width="${FRAME.w}" height="8" fill="${p.rim}" opacity="0.35"/>
    ${group({ 'data-part': 'posts' }, posts)}`;
}

/** Tatami room with a window. The only interior; keeps indoor scenes consistent. */
export function room(opts: BackdropOptions): string {
  const [p] = resolve(opts);
  const light = uid('win');
  const floorY = 640;

  const mats = times(5, (i) => {
    const y = floorY + i * 52;
    return `<rect x="0" y="${y}" width="${FRAME.w}" height="50" fill="${i % 2 ? p.ground : p.groundShade}" opacity="0.7"/>`;
  });

  return `
    <defs>
      <linearGradient id="${light}" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0%" stop-color="${p.glow}" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="${p.glow}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${FRAME.w}" height="${FRAME.h}" fill="${p.mid}"/>
    <rect x="0" y="0" width="${FRAME.w}" height="${floorY}" fill="${p.far}"/>
    ${group({ 'data-part': 'mats' }, mats)}
    <rect x="880" y="120" width="560" height="420" fill="${p.sky[2]}"/>
    <rect x="880" y="120" width="560" height="420" fill="none" stroke="${p.ink}" stroke-width="14"/>
    <line x1="1160" y1="120" x2="1160" y2="540" stroke="${p.ink}" stroke-width="10"/>
    <line x1="880" y1="330" x2="1440" y2="330" stroke="${p.ink}" stroke-width="10"/>
    <path d="M 880 540 L 1440 540 L 1180 ${floorY + 210} L 500 ${floorY + 210} Z" fill="url(#${light})"/>
    <rect x="0" y="${floorY - 14}" width="${FRAME.w}" height="14" fill="${p.ink}" opacity="0.5"/>`;
}

/** Shrine steps under torii gates — the archetypal "climb toward something" shot. */
export function shrine(opts: BackdropOptions): string {
  const [p, horizon, seed] = resolve(opts);
  const random = rng(seed);

  // Each step insets by 26 a side, so past i=14 the width goes negative and the
  // browser rejects the rect. Stop drawing once the tread has closed to a point.
  const steps = times(16, (i) => {
    const inset = round(i * 26);
    const width = 760 - inset * 2;
    if (width <= 24) return '';
    const y = round(FRAME.h - i * 26);
    return `<rect x="${420 + inset}" y="${y}" width="${width}" height="18" fill="${i % 2 ? p.ground : p.groundShade}"/>`;
  });

  const torii = times(3, (i) => {
    const scale = 1 - i * 0.26;
    const cx = FRAME.w / 2;
    const y = FRAME.h - 120 - i * 190;
    const w = 300 * scale;
    const h = 260 * scale;
    return `<g transform="translate(${cx} ${y}) scale(${round(scale)})" fill="${p.accent}" opacity="${round(1 - i * 0.18)}">
      <rect x="${-w / 2}" y="${-h}" width="26" height="${h}"/>
      <rect x="${w / 2 - 26}" y="${-h}" width="26" height="${h}"/>
      <rect x="${-w / 2 - 34}" y="${-h - 30}" width="${w + 68}" height="24" rx="8"/>
      <rect x="${-w / 2 - 12}" y="${-h + 34}" width="${w + 24}" height="18"/>
    </g>`;
  });

  const trees = times(11, () => {
    const x = round(random() * FRAME.w);
    const h = round(160 + random() * 220);
    return `<ellipse cx="${x}" cy="${FRAME.h - h}" rx="${round(80 + random() * 60)}" ry="${round(h * 0.55)}" fill="${p.near}" opacity="0.9"/>`;
  });

  return `${sky(p, opts)}
    ${ground(p, horizon, p.mid)}
    ${group({ 'data-part': 'trees' }, trees)}
    ${group({ 'data-part': 'steps' }, steps)}
    ${group({ 'data-part': 'torii' }, torii)}`;
}

/**
 * Restaurant kitchen: tiled wall, a steel pass running the width, extraction hood
 * and range on the left, shelved pots on the right.
 *
 * Surfaces come from the palette's interior tones, not from `ground`/`far` — those
 * are landscape colours and would paint this room grass-green in `day`.
 *
 * The pass sits behind the ground line, so a character stands in front of it rather
 * than being sliced in half by it.
 */
export function kitchen(opts: BackdropOptions): string {
  const [p, , seed] = resolve(opts);
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

export interface DiningRoomOptions extends BackdropOptions {
  /**
   * Omit one of the three tables — 0 near left, 1 under the window, 2 far right.
   *
   * Backdrops draw behind every layer, so a character placed at a table is drawn
   * *over* it and reads as standing in front of the furniture. To seat someone,
   * clear their slot here and stage `props.diningTable()` as a layer after them.
   */
  clearTable?: 0 | 1 | 2;
}

/**
 * Small dining room: warm wall, a window onto the night, tables and chairs.
 * Use it for the other side of the kitchen door.
 */
export function diningRoom(opts: DiningRoomOptions): string {
  const [p, , seed] = resolve(opts);
  const random = rng(seed);
  const floorY = 620;
  const glow = uid('warm');
  const pane = uid('pane');

  // Tables recede: the far one is smaller and higher in frame.
  //
  // Heights are set against the character rig, which is 442 units tall. A dining
  // table is a little under half a standing person, so the top sits ~200 above its
  // own base. Anything much shorter reads as a footstool once someone stands next
  // to it — which is exactly how this room first shipped.
  const tables = times(3, (i) => {
    if (i === opts.clearTable) return '';
    const x = 250 + i * 560;
    const s = round(0.72 + i * 0.14);
    const y = floorY + 130 + i * 46;
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <ellipse cx="0" cy="4" rx="150" ry="24" fill="${p.floorShade}" opacity="0.55"/>
      <rect x="-186" y="-306" width="26" height="190" rx="9" fill="${p.floorShade}"/>
      <rect x="-186" y="-322" width="26" height="28" rx="9" fill="${p.wallShade}"/>
      <rect x="-214" y="-134" width="74" height="19" rx="8" fill="${p.floorShade}"/>
      <rect x="-202" y="-118" width="13" height="118" rx="6" fill="${p.floorShade}"/>
      <rect x="-158" y="-118" width="13" height="118" rx="6" fill="${p.floorShade}"/>
      <rect x="-16" y="-200" width="32" height="200" rx="9" fill="${p.floorShade}"/>
      <ellipse cx="0" cy="-12" rx="62" ry="15" fill="${p.floorShade}"/>
      <ellipse cx="0" cy="-193" rx="132" ry="27" fill="${p.ink}" opacity="0.32"/>
      <ellipse cx="0" cy="-200" rx="132" ry="27" fill="${p.wall}"/>
      <ellipse cx="0" cy="-200" rx="132" ry="27" fill="none" stroke="${p.ink}" stroke-width="3" opacity="0.4"/>
      <ellipse class="k-pulse" style="--d:-${round(random() * 4)}s;--t:5s" cx="0" cy="-228" rx="13" ry="19" fill="${p.glow}" opacity="0.95"/>
      <ellipse cx="0" cy="-208" rx="9" ry="4" fill="${p.accent}"/>
    </g>`;
  });

  return `
    <defs>
      <radialGradient id="${glow}" cx="0.5" cy="0.3" r="0.85">
        <stop offset="0%" stop-color="${p.glow}" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="${p.glow}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="${pane}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${p.sky[0]}"/>
        <stop offset="100%" stop-color="${p.sky[1]}"/>
      </linearGradient>
    </defs>

    <rect x="0" y="0" width="${FRAME.w}" height="${floorY}" fill="${p.wall}"/>
    <rect x="0" y="${floorY - 120}" width="${FRAME.w}" height="120" fill="${p.wallShade}"/>

    <rect x="580" y="96" width="440" height="300" rx="6" fill="url(#${pane})"/>
    ${group(
      { 'data-part': 'streetlights' },
      times(9, () => {
        const x = round(596 + random() * 408);
        const y = round(240 + random() * 140);
        return `<rect class="k-flicker" style="--d:-${round(random() * 8)}s;--t:15s" x="${x}" y="${y}" width="9" height="13" fill="${p.glowSoft}" opacity="${round(0.4 + random() * 0.5)}"/>`;
      }),
    )}
    <rect x="580" y="96" width="440" height="300" rx="6" fill="none" stroke="${p.ink}" stroke-width="16"/>
    <line x1="800" y1="96" x2="800" y2="396" stroke="${p.ink}" stroke-width="11"/>
    <line x1="580" y1="246" x2="1020" y2="246" stroke="${p.ink}" stroke-width="11"/>

    <rect x="0" y="0" width="${FRAME.w}" height="${FRAME.h}" fill="url(#${glow})"/>

    <rect x="0" y="${floorY}" width="${FRAME.w}" height="${FRAME.h - floorY}" fill="${p.floor}"/>
    ${group(
      { 'data-part': 'boards' },
      times(6, (i) => {
        const y = round(floorY + 30 + i * 46);
        return `<line x1="0" y1="${y}" x2="${FRAME.w}" y2="${y}" stroke="${p.floorShade}" stroke-width="3" opacity="0.5"/>`;
      }),
    )}
    ${group({ 'data-part': 'tables' }, tables)}`;
}

/** Flat colour field. For abstract beats, blackouts and title cards. */
export function voidField(opts: BackdropOptions): string {
  const [p] = resolve(opts);
  const g = uid('void');
  return `
    <defs>
      <radialGradient id="${g}">
        <stop offset="0%" stop-color="${p.sky[1]}"/>
        <stop offset="100%" stop-color="${p.ink}"/>
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="${FRAME.w}" height="${FRAME.h}" fill="url(#${g})"/>`;
}

/** Ocean with waves frozen mid-air as translucent sculpted ice. */
export function oceanFrozen(opts: BackdropOptions): string {
  const [p, horizon, seed] = resolve(opts);
  const random = rng(seed);

  const droplets = times(32, () => {
    const x = round(100 + random() * 1400);
    const y = round(horizon - 60 + random() * 240);
    const r = round(2 + random() * 4);
    return `<circle class="k-pulse" cx="${x}" cy="${y}" r="${r}" fill="${p.glow}" opacity="${round(0.4 + random() * 0.5)}"/>`;
  });

  const frozenWaves = times(7, (i) => {
    const y = round(horizon + 30 + i * 32);
    return `<path d="M -40 ${y} Q 140 ${y - 40} 320 ${y} T 680 ${y} T 1040 ${y} T 1400 ${y} T 1760 ${y}" stroke="${p.rim}" stroke-width="4" fill="none" opacity="0.6"/>`;
  });

  return `${sky(p, opts)}
    ${ground(p, horizon, p.mid)}
    <rect x="0" y="${horizon}" width="${FRAME.w}" height="${FRAME.h - horizon}" fill="${p.near}" opacity="0.45"/>
    ${group({ 'data-part': 'droplets' }, droplets)}
    ${group({ 'data-part': 'frozen-waves' }, frozenWaves)}
    <path d="M 0 ${FRAME.h} L 0 ${FRAME.h - 120} Q 260 ${FRAME.h - 190} 520 ${FRAME.h - 96} L 520 ${FRAME.h} Z" fill="${p.near}"/>`;
}

/** Close-up of the sky peeling and cracking with glowing cyan fractures. */
export function skyFracture(opts: BackdropOptions): string {
  const [p, horizon] = resolve(opts);
  const glow = uid('frac-glow');

  return `
    <defs>
      <radialGradient id="${glow}" cx="0.5" cy="0.45" r="0.6">
        <stop offset="0%" stop-color="${p.glow}" stop-opacity="0.8"/>
        <stop offset="40%" stop-color="${p.accent}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${p.sky[0]}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    ${sky(p, opts)}
    <rect x="0" y="0" width="${FRAME.w}" height="${FRAME.h}" fill="url(#${glow})"/>
    
    <!-- Deep void behind tear -->
    <path d="M 760 320 L 880 340 L 920 450 L 860 520 L 740 480 Z" fill="${p.ink}" stroke="${p.glow}" stroke-width="3"/>
    
    <!-- Spiderweb fractures -->
    <path d="M 800 420 L 720 310 L 640 280 M 800 420 L 940 330 L 1080 300 M 800 420 L 890 540 L 1020 620 M 800 420 L 710 530 L 580 590 M 720 310 L 760 180 M 940 330 L 1050 200 M 890 540 L 880 700" stroke="${p.glow}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M 800 420 L 780 220 M 800 420 L 850 640 M 720 310 L 610 360 M 940 330 L 1120 400" stroke="${p.rim}" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.7"/>
    
    ${ground(p, horizon, p.mid)}
    <path d="M 0 ${FRAME.h} L 0 ${FRAME.h - 120} Q 260 ${FRAME.h - 190} 520 ${FRAME.h - 96} L 520 ${FRAME.h} Z" fill="${p.near}"/>`;
}

/** The celestial clockwork engine behind the sky. */
export function cosmicRift(opts: BackdropOptions): string {
  const [p, horizon] = resolve(opts);
  const cosmicGlow = uid('cosmic-glow');

  const gears = [
    { cx: 800, cy: 300, r: 180, teeth: 16, fill: p.accent, stroke: p.glow, op: 0.85 },
    { cx: 580, cy: 220, r: 120, teeth: 12, fill: p.near, stroke: p.rim, op: 0.7 },
    { cx: 1040, cy: 260, r: 140, teeth: 14, fill: p.near, stroke: p.rim, op: 0.7 },
    { cx: 800, cy: 120, r: 90, teeth: 10, fill: p.mid, stroke: p.accent, op: 0.6 },
  ].map((g, idx) => {
    const toothAngle = (Math.PI * 2) / g.teeth;
    const teethMarkup = times(g.teeth, (t) => {
      const a = t * toothAngle;
      const x1 = g.cx + Math.cos(a) * (g.r - 10);
      const y1 = g.cy + Math.sin(a) * (g.r - 10);
      const x2 = g.cx + Math.cos(a) * (g.r + 18);
      const y2 = g.cy + Math.sin(a) * (g.r + 18);
      return `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" stroke="${g.stroke}" stroke-width="14" stroke-linecap="round"/>`;
    });

    return `
      <g data-part="gear-${idx}" opacity="${g.op}">
        ${teethMarkup}
        <circle cx="${g.cx}" cy="${g.cy}" r="${g.r}" fill="${g.fill}" stroke="${g.stroke}" stroke-width="6"/>
        <circle cx="${g.cx}" cy="${g.cy}" r="${round(g.r * 0.4)}" fill="${p.ink}" stroke="${g.stroke}" stroke-width="4"/>
        <circle cx="${g.cx}" cy="${g.cy}" r="${round(g.r * 0.15)}" fill="${g.stroke}"/>
      </g>`;
  }).join('');

  return `
    <defs>
      <radialGradient id="${cosmicGlow}" cx="0.5" cy="0.35" r="0.7">
        <stop offset="0%" stop-color="${p.glowSoft}" stop-opacity="0.9"/>
        <stop offset="40%" stop-color="${p.sky[1]}" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="${p.ink}" stop-opacity="1"/>
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="${FRAME.w}" height="${FRAME.h}" fill="${p.ink}"/>
    <rect x="0" y="0" width="${FRAME.w}" height="${horizon + 40}" fill="url(#${cosmicGlow})"/>
    
    <!-- Stars and nebula clouds -->
    <ellipse cx="800" cy="280" rx="550" ry="240" fill="${p.haze}" opacity="0.25" class="k-pulse"/>
    ${gears}
    
    <!-- Frozen sea below -->
    ${ground(p, horizon, p.mid)}
    <rect x="0" y="${horizon}" width="${FRAME.w}" height="${FRAME.h - horizon}" fill="${p.near}" opacity="0.5"/>
    <path d="M 0 ${FRAME.h} L 0 ${FRAME.h - 120} Q 260 ${FRAME.h - 190} 520 ${FRAME.h - 96} L 520 ${FRAME.h} Z" fill="${p.near}"/>`;
}

/** Ocean with a giant sky-blue tape patch over the sky breach. */
export function oceanPatched(opts: BackdropOptions): string {
  return `${ocean(opts)}
    <!-- Giant sky-blue duct tape patch -->
    <g data-part="duct-tape" transform="translate(800 420) rotate(-12)">
      <rect x="-160" y="-35" width="320" height="70" rx="4" fill="#38bdf8" opacity="0.88"/>
      <rect x="-160" y="-35" width="320" height="70" rx="4" fill="none" stroke="#bae6fd" stroke-width="3"/>
      <!-- Tape crinkles & cross-weave -->
      <line x1="-150" y1="-20" x2="150" y2="-20" stroke="#ffffff" stroke-width="1.5" opacity="0.5"/>
      <line x1="-150" y1="20" x2="150" y2="20" stroke="#ffffff" stroke-width="1.5" opacity="0.5"/>
      <line x1="-155" y1="-35" x2="-155" y2="35" stroke="#0284c7" stroke-width="4" stroke-dasharray="4 4"/>
      <line x1="155" y1="-35" x2="155" y2="35" stroke="#0284c7" stroke-width="4" stroke-dasharray="4 4"/>
      <!-- Tiny static glint -->
      <circle class="k-pulse" cx="0" cy="0" r="12" fill="#ffffff" opacity="0.6"/>
    </g>`;
}

