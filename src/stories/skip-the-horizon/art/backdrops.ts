/**
 * High-Fidelity Backdrops for "Skip the Horizon".
 *
 * Richly layered SVG scenes with cinematic depth, atmospheric gradients,
 * multi-tier ocean swells, dramatic cloud banks, and cosmic machinery.
 */

import type { Palette } from './palette';
import { FRAME, HORIZON, group, rng, round, seedFrom, times, uid } from '../../../lib/svg';

export interface BackdropOptions {
  palette: Palette;
  seed?: string;
  disc?: number | false;
  discY?: number;
  horizon?: number;
}

function resolve(opts: BackdropOptions): [Palette, number, number] {
  const p = opts.palette;
  const horizon = opts.horizon ?? HORIZON;
  const seed = seedFrom(opts.seed ?? 'ocean-default');
  return [p, horizon, seed];
}

function celestial(p: Palette, x: number, y: number, isMoon: boolean): string {
  const g = uid('glow');
  const r = isMoon ? 48 : 72;
  return `
    <defs>
      <radialGradient id="${g}">
        <stop offset="0%" stop-color="${p.glow}" stop-opacity="1"/>
        <stop offset="25%" stop-color="${p.glowSoft}" stop-opacity="0.6"/>
        <stop offset="60%" stop-color="${p.glowSoft}" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="${p.glowSoft}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="${x}" cy="${y}" r="${r * 4.5}" fill="url(#${g})"/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="${p.glow}"/>
    ${
      isMoon
        ? `<circle cx="${x + 20}" cy="${y - 14}" r="${r * 0.85}" fill="${p.sky[0]}" opacity="0.65"/>`
        : ''
    }`;
}

function sky(p: Palette, opts: BackdropOptions): string {
  const [, horizon, seed] = resolve(opts);
  const skyGrad = uid('sky');
  const hazeGrad = uid('haze');
  const discX = opts.disc === false ? 1180 : (opts.disc ?? 1180);
  const discY = opts.discY ?? round(horizon - 160);
  const isNight = p.hasStars;

  return `
    <defs>
      <linearGradient id="${skyGrad}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${p.sky[0]}"/>
        <stop offset="55%" stop-color="${p.sky[1]}"/>
        <stop offset="100%" stop-color="${p.sky[2]}"/>
      </linearGradient>
      <linearGradient id="${hazeGrad}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${p.haze}" stop-opacity="0"/>
        <stop offset="100%" stop-color="${p.haze}" stop-opacity="0.65"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${FRAME.w}" height="${FRAME.h}" fill="url(#${skyGrad})"/>
    ${opts.disc !== false ? celestial(p, discX, discY, isNight) : ''}
    <rect x="0" y="${round(horizon - 220)}" width="${FRAME.w}" height="220" fill="url(#${hazeGrad})"/>`;
}

function clouds(p: Palette, seed: number, horizon: number): string {
  const random = rng(seed);
  const cloudBank = times(7, (i) => {
    const cx = round(80 + i * 240 + random() * 120);
    const cy = round(horizon - 180 - random() * 140);
    const rx = round(140 + random() * 120);
    const ry = round(45 + random() * 35);
    return `
      <g opacity="0.55">
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${p.far}"/>
        <ellipse cx="${cx + 25}" cy="${cy - 18}" rx="${round(rx * 0.65)}" ry="${round(ry * 0.75)}" fill="${p.glowSoft}" opacity="0.4"/>
        <ellipse cx="${cx - 30}" cy="${cy + 10}" rx="${round(rx * 0.75)}" ry="${round(ry * 0.6)}" fill="${p.mid}"/>
      </g>`;
  });
  return group({ 'data-part': 'clouds' }, cloudBank);
}

/** Cinematic ocean shore with multi-layered swells, foam lines, and wet sand reflections. */
export function ocean(opts: BackdropOptions): string {
  const [p, horizon, seed] = resolve(opts);
  const random = rng(seed);
  const discX = opts.disc === false ? 1180 : (opts.disc ?? 1180);
  const sunBeam = uid('sunbeam');
  const sandGrad = uid('sand');

  // Sun / Moon reflection beam down the water
  const beamMarkup = opts.disc !== false ? `
    <defs>
      <linearGradient id="${sunBeam}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${p.glow}" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="${p.glowSoft}" stop-opacity="0.05"/>
      </linearGradient>
    </defs>
    <polygon points="${discX - 30},${horizon} ${discX + 30},${horizon} ${discX + 220},${FRAME.h} ${discX - 220},${FRAME.h}" fill="url(#${sunBeam})"/>` : '';

  // Shimmering specular glints on water
  const glints = times(36, () => {
    const y = round(horizon + 10 + random() * 220);
    const spread = round(50 + (y - horizon) * 2.2);
    const w = round(25 + random() * 110);
    const cx = round(discX - spread / 2 + random() * spread);
    return `<rect class="k-shimmer" style="--d:${round(random() * 5)}s" x="${cx}" y="${y}" width="${w}" height="4" rx="2" fill="${p.glow}" opacity="${round(0.35 + random() * 0.55)}"/>`;
  });

  // Layered curving wave crests with foam lines
  const waves = times(11, (i) => {
    const y = round(horizon + 18 + i * 24 + i * i * 0.8);
    const offset = (i % 2) * 60;
    return `
      <path class="k-shimmer" style="--d:${round(i * 0.6)}s" 
        d="M -60 ${y} Q ${180 + offset} ${y - 12} ${420 + offset} ${y} T ${900 + offset} ${y} T ${1380 + offset} ${y} T 1700 ${y}" 
        stroke="${p.rim}" stroke-width="${round(2.5 + i * 0.4)}" fill="none" opacity="${round(0.3 + i * 0.05)}"/>
      <path d="M -60 ${y + 4} Q ${180 + offset} ${y - 8} ${420 + offset} ${y + 4} T ${900 + offset} ${y + 4} T 1700 ${y + 4}" 
        stroke="${p.glowSoft}" stroke-width="1.5" fill="none" opacity="0.25"/>`;
  });

  // Distant headlands / coastal cliffs
  const headlands = `
    <path d="M 0 ${horizon} Q 220 ${horizon - 45} 440 ${horizon} L 440 ${horizon + 30} L 0 ${horizon + 30} Z" fill="${p.far}" opacity="0.8"/>
    <path d="M 1240 ${horizon} Q 1460 ${horizon - 35} 1600 ${horizon - 8} L 1600 ${horizon + 40} L 1240 ${horizon + 40} Z" fill="${p.far}" opacity="0.65"/>`;

  // Wet reflective shoreline sand
  const shore = `
    <defs>
      <linearGradient id="${sandGrad}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${p.mid}" stop-opacity="0.7"/>
        <stop offset="60%" stop-color="${p.ground}" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="${p.groundShade}"/>
      </linearGradient>
    </defs>
    <!-- Dark shoreline curve -->
    <path d="M 0 ${FRAME.h} L 0 ${FRAME.h - 160} Q 320 ${FRAME.h - 230} 780 ${FRAME.h - 130} T ${FRAME.w} ${FRAME.h - 90} L ${FRAME.w} ${FRAME.h} Z" fill="url(#${sandGrad})"/>
    <!-- Wet foam tide line -->
    <path d="M 0 ${FRAME.h - 160} Q 320 ${FRAME.h - 230} 780 ${FRAME.h - 130} T ${FRAME.w} ${FRAME.h - 90}" stroke="${p.rim}" stroke-width="6" fill="none" opacity="0.65"/>
    <path d="M 0 ${FRAME.h - 156} Q 320 ${FRAME.h - 226} 780 ${FRAME.h - 126} T ${FRAME.w} ${FRAME.h - 86}" stroke="${p.glow}" stroke-width="2" fill="none" opacity="0.8"/>`;

  return `
    ${sky(p, opts)}
    ${clouds(p, seed, horizon)}
    ${headlands}
    <rect x="0" y="${horizon}" width="${FRAME.w}" height="${FRAME.h - horizon}" fill="${p.near}" opacity="0.85"/>
    ${beamMarkup}
    ${group({ 'data-part': 'waves' }, waves)}
    ${group({ 'data-part': 'glints' }, glints)}
    ${shore}`;
}

/** The Time-Stop Glitch: Ocean with colossal waves frozen into sculpted crystalline glass in mid-air. */
export function oceanFrozen(opts: BackdropOptions): string {
  const [p, horizon, seed] = resolve(opts);
  const random = rng(seed);

  // Floating suspended glass water droplets
  const droplets = times(48, () => {
    const x = round(60 + random() * 1480);
    const y = round(horizon - 100 + random() * 320);
    const r = round(2.5 + random() * 5.5);
    return `
      <g class="k-pulse" style="--d:${round(random() * 4)}s">
        <circle cx="${x}" cy="${y}" r="${r * 2.2}" fill="${p.glow}" opacity="0.25"/>
        <circle cx="${x}" cy="${y}" r="${r}" fill="${p.glow}" stroke="${p.rim}" stroke-width="1"/>
        <circle cx="${x - 1}" cy="${y - 1}" r="${round(r * 0.4)}" fill="#ffffff" opacity="0.9"/>
      </g>`;
  });

  // Massive frozen wave curl facets
  const frozenWaveCurl = `
    <!-- Giant suspended curling wave wall -->
    <path d="M 0 ${horizon + 140} Q 400 ${horizon - 180} 850 ${horizon + 40} Q 1150 ${horizon + 180} 1600 ${horizon + 20} L 1600 ${FRAME.h} L 0 ${FRAME.h} Z" fill="${p.near}" opacity="0.9"/>
    <!-- Crystalline facet ridges -->
    <path d="M 120 ${horizon + 110} L 380 ${horizon - 120} L 540 ${horizon - 70} L 720 ${horizon - 140} L 850 ${horizon + 40}" stroke="${p.rim}" stroke-width="5" fill="none" opacity="0.9"/>
    <path d="M 380 ${horizon - 120} L 320 ${horizon + 60} L 580 ${horizon + 40} L 540 ${horizon - 70}" stroke="${p.glow}" stroke-width="2.5" fill="none" opacity="0.75"/>
    <path d="M 540 ${horizon - 70} L 680 ${horizon + 90} L 850 ${horizon + 40}" stroke="${p.glow}" stroke-width="2.5" fill="none" opacity="0.75"/>
    <!-- Glowing cyan wave crest needles -->
    <path d="M 320 ${horizon - 140} L 380 ${horizon - 120} L 450 ${horizon - 160} L 540 ${horizon - 70} L 620 ${horizon - 120} L 720 ${horizon - 140} L 800 ${horizon - 80}" stroke="#ffffff" stroke-width="3" fill="none"/>
    <!-- Sub-surface refraction lines -->
    <line x1="200" y1="${horizon + 80}" x2="450" y2="${horizon}" stroke="${p.accent}" stroke-width="2" opacity="0.5"/>
    <line x1="450" y1="${horizon}" x2="700" y2="${horizon + 70}" stroke="${p.accent}" stroke-width="2" opacity="0.5"/>`;

  // Chromatic scanlines
  const scanlines = times(6, (i) => {
    const y = round(horizon - 120 + i * 65);
    return `<line x1="0" y1="${y}" x2="${FRAME.w}" y2="${y}" stroke="${p.glow}" stroke-width="1.5" stroke-dasharray="16 8 32 12" opacity="0.3"/>`;
  });

  return `
    ${sky(p, opts)}
    <rect x="0" y="${horizon}" width="${FRAME.w}" height="${FRAME.h - horizon}" fill="${p.near}" opacity="0.9"/>
    ${frozenWaveCurl}
    ${group({ 'data-part': 'scanlines' }, scanlines)}
    ${group({ 'data-part': 'droplets' }, droplets)}
    <!-- Frozen beach shore -->
    <path d="M 0 ${FRAME.h} L 0 ${FRAME.h - 150} Q 350 ${FRAME.h - 210} 800 ${FRAME.h - 120} T ${FRAME.w} ${FRAME.h - 80} L ${FRAME.w} ${FRAME.h} Z" fill="${p.groundShade}"/>
    <path d="M 0 ${FRAME.h - 150} Q 350 ${FRAME.h - 210} 800 ${FRAME.h - 120} T ${FRAME.w} ${FRAME.h - 80}" stroke="${p.rim}" stroke-width="5" fill="none"/>`;
}

/** Dimensional Glass Fracture: Close-up of the sky peeling and cracking with neon fissures & floating shards. */
export function skyFracture(opts: BackdropOptions): string {
  const [p, horizon] = resolve(opts);
  const glow = uid('frac-glow');
  const cx = 800;
  const cy = 420;

  // Shattered floating glass prism shards
  const shards = [
    { p: `${cx - 40},${cy - 60} ${cx + 10},${cy - 90} ${cx - 10},${cy - 40}`, op: 0.85, rot: 15 },
    { p: `${cx + 50},${cy - 30} ${cx + 110},${cy - 60} ${cx + 70},${cy + 10}`, op: 0.75, rot: -20 },
    { p: `${cx - 80},${cy + 20} ${cx - 120},${cy + 70} ${cx - 50},${cy + 50}`, op: 0.9, rot: 25 },
    { p: `${cx + 20},${cy + 60} ${cx + 80},${cy + 100} ${cx + 10},${cy + 90}`, op: 0.8, rot: -10 },
  ].map((s) => `<polygon class="k-drift" points="${s.p}" fill="${p.glow}" stroke="#ffffff" stroke-width="2" opacity="${s.op}"/>`).join('');

  // Volumetric light rays bursting from the breach
  const lightBeams = `
    <polygon points="${cx},${cy} 0,0 280,0" fill="${p.glow}" opacity="0.15" class="k-pulse"/>
    <polygon points="${cx},${cy} 1320,0 ${FRAME.w},0 ${FRAME.w},180" fill="${p.glow}" opacity="0.15" class="k-pulse"/>
    <polygon points="${cx},${cy} 0,720 0,${FRAME.h} 360,${FRAME.h}" fill="${p.accent}" opacity="0.12" class="k-pulse"/>
    <polygon points="${cx},${cy} ${FRAME.w},680 ${FRAME.w},${FRAME.h} 1280,${FRAME.h}" fill="${p.accent}" opacity="0.12" class="k-pulse"/>`;

  return `
    <defs>
      <radialGradient id="${glow}" cx="0.5" cy="0.45" r="0.65">
        <stop offset="0%" stop-color="${p.glow}" stop-opacity="0.95"/>
        <stop offset="35%" stop-color="${p.accent}" stop-opacity="0.45"/>
        <stop offset="70%" stop-color="${p.sky[1]}" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="${p.ink}" stop-opacity="0.95"/>
      </radialGradient>
    </defs>
    ${sky(p, opts)}
    <rect x="0" y="0" width="${FRAME.w}" height="${FRAME.h}" fill="url(#${glow})"/>
    ${lightBeams}

    <!-- Central Cosmic Void Tear -->
    <path d="M 740 310 L 870 330 L 930 430 L 890 530 L 770 510 L 710 410 Z" fill="${p.ink}" stroke="${p.glow}" stroke-width="4"/>
    <ellipse cx="${cx}" cy="${cy}" rx="65" ry="50" fill="${p.sky[0]}" opacity="0.9"/>
    
    <!-- Primary Neon Fracture Web -->
    <path d="M ${cx} ${cy} L 680 280 L 580 220 L 440 160 L 320 80" stroke="${p.glow}" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M ${cx} ${cy} L 950 310 L 1120 250 L 1290 190 L 1480 120" stroke="${p.glow}" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M ${cx} ${cy} L 920 560 L 1060 670 L 1220 780" stroke="${p.glow}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M ${cx} ${cy} L 690 550 L 560 660 L 410 770" stroke="${p.glow}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M ${cx} ${cy} L 820 180 L 850 40" stroke="${p.glow}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M ${cx} ${cy} L 780 660 L 800 850" stroke="${p.glow}" stroke-width="5" stroke-linecap="round" fill="none"/>

    <!-- Secondary Cyan/Magenta Micro-Fractures -->
    <path d="M 680 280 L 740 160 M 580 220 L 510 320 M 950 310 L 1040 180 M 1120 250 L 1220 340 M 920 560 L 840 680 M 690 550 L 720 670" stroke="${p.rim}" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.85"/>
    <path d="M 680 280 L 610 240 M 950 310 L 1020 380 M 560 660 L 480 610 M 1060 670 L 1150 630" stroke="${p.accent}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.9"/>
    
    ${shards}
    
    <!-- Horizon base -->
    <rect x="0" y="${horizon + 80}" width="${FRAME.w}" height="${FRAME.h - (horizon + 80)}" fill="${p.near}" opacity="0.6"/>
    <path d="M 0 ${FRAME.h} L 0 ${FRAME.h - 120} Q 400 ${FRAME.h - 180} 800 ${FRAME.h - 100} T ${FRAME.w} ${FRAME.h - 70} L ${FRAME.w} ${FRAME.h} Z" fill="${p.groundShade}"/>`;
}

/** The Celestial Engine: Epic multi-tiered rotating brass clockwork cosmos with swirling nebula spirals and planetary rings. */
export function cosmicRift(opts: BackdropOptions): string {
  const [p, horizon] = resolve(opts);
  const cosmicGlow = uid('cosmic-glow');
  const nebulaGrad = uid('nebula');

  // Interlocking mechanical gears with realistic teeth & spokes
  const gearConfigs = [
    { cx: 800, cy: 260, r: 210, teeth: 18, fill: p.accent, stroke: p.glow, spokeCount: 6, op: 0.95 },
    { cx: 520, cy: 190, r: 140, teeth: 14, fill: p.near, stroke: p.rim, spokeCount: 4, op: 0.8 },
    { cx: 1100, cy: 230, r: 160, teeth: 16, fill: p.near, stroke: p.rim, spokeCount: 5, op: 0.8 },
    { cx: 800, cy: 60, r: 100, teeth: 12, fill: p.mid, stroke: p.accent, spokeCount: 4, op: 0.7 },
  ];

  const gearsMarkup = gearConfigs.map((g, idx) => {
    const toothAngle = (Math.PI * 2) / g.teeth;
    const teeth = times(g.teeth, (t) => {
      const a = t * toothAngle;
      const x1 = g.cx + Math.cos(a) * (g.r - 12);
      const y1 = g.cy + Math.sin(a) * (g.r - 12);
      const x2 = g.cx + Math.cos(a) * (g.r + 22);
      const y2 = g.cy + Math.sin(a) * (g.r + 22);
      return `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" stroke="${g.stroke}" stroke-width="16" stroke-linecap="square"/>`;
    });

    const spokeAngle = (Math.PI * 2) / g.spokeCount;
    const spokes = times(g.spokeCount, (s) => {
      const a = s * spokeAngle;
      const x2 = g.cx + Math.cos(a) * (g.r - 30);
      const y2 = g.cy + Math.sin(a) * (g.r - 30);
      return `<line x1="${g.cx}" y1="${g.cy}" x2="${round(x2)}" y2="${round(y2)}" stroke="${g.stroke}" stroke-width="8"/>`;
    });

    return `
      <g data-part="gear-${idx}" opacity="${g.op}">
        ${teeth}
        <circle cx="${g.cx}" cy="${g.cy}" r="${g.r}" fill="${g.fill}" stroke="${g.stroke}" stroke-width="7"/>
        <circle cx="${g.cx}" cy="${g.cy}" r="${round(g.r - 30)}" fill="${p.ink}" stroke="${g.stroke}" stroke-width="5"/>
        ${spokes}
        <circle cx="${g.cx}" cy="${g.cy}" r="${round(g.r * 0.35)}" fill="${g.fill}" stroke="${g.stroke}" stroke-width="5"/>
        <circle cx="${g.cx}" cy="${g.cy}" r="${round(g.r * 0.14)}" fill="${g.stroke}"/>
      </g>`;
  }).join('');

  // Cosmic Nebula spiral clouds
  const nebulaClouds = `
    <defs>
      <radialGradient id="${nebulaGrad}" cx="0.5" cy="0.4" r="0.6">
        <stop offset="0%" stop-color="${p.glowSoft}" stop-opacity="0.8"/>
        <stop offset="35%" stop-color="${p.accent}" stop-opacity="0.45"/>
        <stop offset="70%" stop-color="${p.sky[1]}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${p.ink}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="800" cy="260" rx="680" ry="290" fill="url(#${nebulaGrad})" class="k-pulse"/>
    <!-- Planetary rings -->
    <ellipse cx="800" cy="260" rx="580" ry="120" stroke="${p.rim}" stroke-width="4" stroke-dasharray="24 12 48 8" fill="none" opacity="0.45" transform="rotate(-8 800 260)"/>
    <ellipse cx="800" cy="260" rx="640" ry="140" stroke="${p.glow}" stroke-width="2" stroke-dasharray="16 16" fill="none" opacity="0.3" transform="rotate(-8 800 260)"/>`;

  return `
    <defs>
      <radialGradient id="${cosmicGlow}" cx="0.5" cy="0.3" r="0.8">
        <stop offset="0%" stop-color="${p.glowSoft}" stop-opacity="0.9"/>
        <stop offset="45%" stop-color="${p.sky[1]}" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="${p.ink}" stop-opacity="1"/>
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="${FRAME.w}" height="${FRAME.h}" fill="${p.ink}"/>
    <rect x="0" y="0" width="${FRAME.w}" height="${horizon + 60}" fill="url(#${cosmicGlow})"/>
    ${nebulaClouds}
    ${gearsMarkup}

    <!-- Frozen dark sea & shoreline below -->
    <rect x="0" y="${horizon}" width="${FRAME.w}" height="${FRAME.h - horizon}" fill="${p.near}" opacity="0.9"/>
    <path d="M 0 ${FRAME.h} L 0 ${FRAME.h - 150} Q 400 ${FRAME.h - 220} 800 ${FRAME.h - 130} T ${FRAME.w} ${FRAME.h - 80} L ${FRAME.w} ${FRAME.h} Z" fill="${p.groundShade}"/>
    <path d="M 0 ${FRAME.h - 150} Q 400 ${FRAME.h - 220} 800 ${FRAME.h - 130} T ${FRAME.w} ${FRAME.h - 80}" stroke="${p.rim}" stroke-width="4" fill="none" opacity="0.8"/>`;
}

/** The Cosmic Patch: Ocean with a heavy woven sky-blue duct tape patch slapped across the horizon tear. */
export function oceanPatched(opts: BackdropOptions): string {
  const base = ocean(opts);

  return `
    ${base}
    <!-- Giant Heavy Duty Cosmic Duct Tape -->
    <g data-part="duct-tape" transform="translate(800 420) rotate(-14)">
      <!-- Drop shadow -->
      <rect x="-195" y="-45" width="390" height="90" rx="6" fill="#000000" opacity="0.45"/>
      <!-- Main tape body -->
      <rect x="-190" y="-40" width="380" height="80" rx="4" fill="#38bdf8" opacity="0.92"/>
      <rect x="-190" y="-40" width="380" height="80" rx="4" fill="none" stroke="#bae6fd" stroke-width="4"/>
      <!-- Woven fabric texture lines -->
      <line x1="-180" y1="-22" x2="180" y2="-22" stroke="#ffffff" stroke-width="2" opacity="0.6"/>
      <line x1="-180" y1="0" x2="180" y2="0" stroke="#ffffff" stroke-width="1.5" opacity="0.4"/>
      <line x1="-180" y1="22" x2="180" y2="22" stroke="#ffffff" stroke-width="2" opacity="0.6"/>
      <!-- Diagonal tension wrinkles -->
      <line x1="-140" y1="-40" x2="-100" y2="40" stroke="#0284c7" stroke-width="3" opacity="0.5"/>
      <line x1="80" y1="-40" x2="120" y2="40" stroke="#0284c7" stroke-width="3" opacity="0.5"/>
      <!-- Ripped jagged tape ends -->
      <path d="M -190 -40 L -182 -25 L -190 -10 L -180 10 L -190 25 L -184 40" stroke="#0284c7" stroke-width="5" fill="none"/>
      <path d="M 190 -40 L 182 -25 L 190 -10 L 180 10 L 190 25 L 184 40" stroke="#0284c7" stroke-width="5" fill="none"/>
      <!-- Glow rivets & energy sparks -->
      <circle cx="-160" cy="0" r="8" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
      <circle cx="160" cy="0" r="8" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
      <circle class="k-pulse" cx="0" cy="0" r="16" fill="#ffffff" opacity="0.75"/>
    </g>`;
}

export function voidField(opts: BackdropOptions): string {
  const [p] = resolve(opts);
  return `<rect x="0" y="0" width="${FRAME.w}" height="${FRAME.h}" fill="${p.ink}"/>`;
}
