/**
 * This story's character rig.
 *
 * `character()` returns a figure drawn with **the origin at the feet, centred**.
 * So a layer at `x: 800, y: 790` stands centre-frame with their feet on the
 * kitchen floor — position a character by where they stand, never by juggling a
 * bounding box.
 *
 * The figure is ~442 units tall at scale 1, about 5.5 heads: stylised enough to
 * read as anime, tall enough not to look chibi.
 *
 * Limbs are generated from joint positions rather than hand-drawn per pose, so a
 * new pose is a table entry, not a new pile of path data.
 *
 * There is one person in this story, so the rig draws one hair style (bun) and one
 * outfit (chef's apron) rather than carrying the stencil's seven and six behind
 * options that would only ever take one value. Adding a second character means
 * copying the branch you want back out of `src/lib/art-stencil/characters.ts` — not
 * importing it, which `scripts/check-isolation.mjs` refuses.
 */

import { CLOTH_COLORS, HAIR_COLORS, SKIN, type ClothColor, type HairColor } from './palette';
import { round, times } from '../../../lib/svg';

export type PoseName = 'stand' | 'reach' | 'slump';
export type Expression = 'neutral' | 'sad' | 'surprised' | 'determined';

export interface CharacterOptions {
  hairColor?: HairColor;
  eyeColor?: string;
  cloth?: ClothColor;
  /** Secondary garment colour (skirt, trousers, trim). Defaults to a darker `cloth`. */
  cloth2?: ClothColor;
  pose?: PoseName;
  expression?: Expression;
  /** Outline colour. Pass the scene palette's `ink` so characters sit in the scene. */
  ink?: string;
  /** Rim-light colour along the lit edge. Pass the scene palette's `rim`. */
  rim?: string;
  /** Overall height multiplier. 1 = 442 units. */
  scale?: number;
  /** Adds the standing shadow ellipse. Off for characters not on solid ground. */
  shadow?: boolean;
}

// --- Skeleton landmarks (origin = feet centre, up is negative) ---------------
const CROWN = -442;
const CHIN = -362;
const HEAD_C = -402;
const NECK = -352;
const SHOULDER_Y = -336;
const SHOULDER_X = 30;
const HIP_Y = -205;
const HIP_X = 18;

type Pt = [number, number];

interface Pose {
  /** Far-side arm: elbow then hand. Drawn behind the torso. */
  armFar: [Pt, Pt];
  /** Near-side arm: elbow then hand. Drawn in front of the torso. */
  armNear: [Pt, Pt];
  legFar: [Pt, Pt];
  legNear: [Pt, Pt];
  /** Head rotation in degrees. */
  tilt: number;
  /** Torso lean in degrees, pivoting at the hips. */
  lean: number;
  /** Vertical offset for the whole upper body (sitting drops the hips). */
  drop: number;
}

const POSES: Record<PoseName, Pose> = {
  stand: {
    armFar: [[-44, -262], [-48, -198]],
    armNear: [[44, -262], [48, -198]],
    legFar: [[-20, -110], [-22, -4]],
    legNear: [[20, -110], [22, -4]],
    tilt: 0,
    lean: 0,
    drop: 0,
  },
  reach: {
    armFar: [[-46, -262], [-50, -200]],
    armNear: [[54, -320], [62, -404]],
    legFar: [[-22, -110], [-26, -4]],
    legNear: [[22, -110], [26, -4]],
    tilt: -8,
    lean: -2,
    drop: 0,
  },
  slump: {
    armFar: [[-40, -256], [-36, -196]],
    armNear: [[40, -256], [36, -196]],
    legFar: [[-22, -108], [-24, -4]],
    legNear: [[20, -108], [22, -4]],
    tilt: 12,
    lean: 8,
    drop: 14,
  },
};

/** Tapered limb between two points, with rounded joints. */
function limb(a: Pt, b: Pt, w1: number, w2: number, fill: string): string {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * w1;
  const ny = (dx / len) * w1;
  const mx = (-dy / len) * w2;
  const my = (dx / len) * w2;
  const d =
    `M ${round(a[0] + nx)} ${round(a[1] + ny)} ` +
    `L ${round(b[0] + mx)} ${round(b[1] + my)} ` +
    `L ${round(b[0] - mx)} ${round(b[1] - my)} ` +
    `L ${round(a[0] - nx)} ${round(a[1] - ny)} Z`;
  return `<path d="${d}" fill="${fill}"/><circle cx="${round(b[0])}" cy="${round(b[1])}" r="${w2}" fill="${fill}"/>`;
}

/** Shoulder -> elbow -> hand, plus a skin-toned hand. */
function arm(from: Pt, joints: [Pt, Pt], sleeve: string, sleeveEnd: number): string {
  const [elbow, hand] = joints;
  const forearmIsSkin = sleeveEnd < 1;
  return (
    limb(from, elbow, 11, 9, sleeve) +
    limb(elbow, hand, 9, 7, forearmIsSkin ? SKIN.base : sleeve) +
    `<circle cx="${round(hand[0])}" cy="${round(hand[1])}" r="8" fill="${SKIN.base}"/>`
  );
}

function leg(from: Pt, joints: [Pt, Pt], upper: string, lower: string, ink: string): string {
  const [knee, foot] = joints;
  return (
    limb(from, knee, 14, 11, upper) +
    limb(knee, foot, 11, 8, lower) +
    `<ellipse cx="${round(foot[0])}" cy="${round(foot[1] + 2)}" rx="15" ry="7" fill="${ink}"/>`
  );
}

// --- Hair -------------------------------------------------------------------

/**
 * Hair sits in two layers: a mass *behind* the head (volume, long lengths, tails)
 * and a fringe *in front* (the silhouette that actually identifies the character).
 *
 * The fringe must clear the eyes. Eyes are centred at y = HEAD_C + 2 with a radius
 * of ~11, so their top edge is near -409; a fringe that reaches much past -404
 * turns the face into a helmet.
 */

/** Skull volume behind the head — every style gets it, so hair never looks painted on. */
const BACK_BASE = `M -37 ${HEAD_C - 2}
  C -37 ${CROWN - 6} -19 ${CROWN - 12} 0 ${CROWN - 12}
  C 19 ${CROWN - 12} 37 ${CROWN - 6} 37 ${HEAD_C - 2}
  C 37 ${CHIN - 18} 30 ${CHIN - 6} 24 ${CHIN - 2}
  L -24 ${CHIN - 2}
  C -30 ${CHIN - 6} -37 ${CHIN - 18} -37 ${HEAD_C - 2} Z`;

function hairBack(base: string, shade: string): string {
  const skull = `<path d="${BACK_BASE}" fill="${shade}"/>`;
  return (
    `<circle cx="0" cy="${CROWN - 20}" r="27" fill="${shade}"/>
     <circle cx="-6" cy="${CROWN - 25}" r="18" fill="${base}" opacity="0.55"/>` + skull
  );
}

function hairFront(base: string, shade: string): string {
  /** Skull cap: covers the top of the head down to just above the brows. */
  const cap = `<path d="M -34 ${HEAD_C - 4}
    C -34 ${CROWN - 4} -17 ${CROWN - 10} 0 ${CROWN - 10}
    C 17 ${CROWN - 10} 34 ${CROWN - 4} 34 ${HEAD_C - 4}
    C 22 ${HEAD_C - 22} -22 ${HEAD_C - 22} -34 ${HEAD_C - 4} Z" fill="${base}"/>`;

  /** Narrow lock hanging beside the face — frames the cheek and adds depth. */
  const sideLock = `<path d="M -34 ${HEAD_C - 12}
       C -42 ${HEAD_C + 14} -41 ${CHIN - 28} -36 ${CHIN - 10}
       L -25 ${CHIN - 16}
       C -29 ${CHIN - 34} -30 ${HEAD_C + 10} -24 ${HEAD_C - 14} Z"
       fill="${base}"/>`;

  return (
    cap +
    `<path d="M -32 ${HEAD_C - 8}
       C -24 ${CROWN + 8} 24 ${CROWN + 8} 32 ${HEAD_C - 8}
       C 20 ${HEAD_C - 22} -20 ${HEAD_C - 22} -32 ${HEAD_C - 8} Z" fill="${base}"/>` +
    sideLock +
    `<path d="M 0 ${CROWN - 8} C 16 ${CROWN - 2} 28 ${HEAD_C - 18} 32 ${HEAD_C - 8}
       C 24 ${HEAD_C - 16} 12 ${CROWN + 4} 0 ${CROWN - 2} Z" fill="${shade}" opacity="0.45"/>`
  );
}

// --- Face -------------------------------------------------------------------

function eye(cx: number, color: string, ink: string): string {
  const inner = `<ellipse cx="0" cy="0" rx="8.6" ry="10.6" fill="#ffffff"/>
       <ellipse cx="0" cy="1" rx="7" ry="9.2" fill="${color}"/>
       <ellipse cx="0" cy="2" rx="3.6" ry="5.6" fill="${ink}"/>
       <circle cx="-2.8" cy="-4.2" r="3" fill="#ffffff"/>
       <circle cx="2.6" cy="4.6" r="1.6" fill="#ffffff" opacity="0.85"/>
       <path d="M -9.4 -8.2 q 9.4 -6.4 18.8 0" stroke="${ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;

  // Nested groups: the outer one places the eye, the inner one is free for the
  // CSS blink to scale without fighting the placement transform.
  return `<g transform="translate(${cx} ${HEAD_C + 2})"><g class="k-blink">${inner}</g></g>`;
}

function brows(ink: string, expression: Expression): string {
  const y = CHIN - 56;
  const map: Record<Expression, [string, string]> = {
    neutral: [`M -25 ${y} q 9 -5 18 -1`, `M 25 ${y} q -9 -5 -18 -1`],
    sad: [`M -25 ${y - 4} q 9 3 18 6`, `M 25 ${y - 4} q -9 3 -18 6`],
    surprised: [`M -26 ${y - 7} q 9 -6 18 -2`, `M 26 ${y - 7} q -9 -6 -18 -2`],
    determined: [`M -26 ${y - 1} q 10 4 19 8`, `M 26 ${y - 1} q -10 4 -19 8`],
  };
  const [l, r] = map[expression];
  return `<path d="${l}" stroke="${ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
          <path d="${r}" stroke="${ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
}

function mouth(ink: string, expression: Expression): string {
  const y = CHIN - 14;
  switch (expression) {
    case 'sad':
      return `<path d="M -8 ${y + 2} q 8 -7 16 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'surprised':
      return `<ellipse cx="0" cy="${y}" rx="6" ry="8" fill="${ink}"/>`;
    case 'determined':
      return `<path d="M -10 ${y} l 20 0" stroke="${ink}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
    default:
      return `<path d="M -6 ${y} q 6 4 12 0" stroke="${ink}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
  }
}

function head(ink: string, rim: string, eyeColor: string, expression: Expression): string {
  // Widest at the cheekbones, tapering to a soft point at the chin. The lower
  // control points must sit *above* the chin (more negative y) or the jaw bulges
  // outward and the face reads as a box.
  const shape = `M -32 ${HEAD_C - 2}
                 C -32 ${CROWN + 4} -17 ${CROWN - 2} 0 ${CROWN - 2}
                 C 17 ${CROWN - 2} 32 ${CROWN + 4} 32 ${HEAD_C - 2}
                 C 32 ${CHIN - 20} 23 ${CHIN - 6} 0 ${CHIN}
                 C -23 ${CHIN - 6} -32 ${CHIN - 20} -32 ${HEAD_C - 2} Z`;

  const face = `${eye(-17, eyeColor, ink)}${eye(17, eyeColor, ink)}
       ${brows(ink, expression)}
       ${mouth(ink, expression)}
       <path d="M 5 ${CHIN - 30} q 4 6 -2 8" stroke="${ink}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.7"/>
       <ellipse cx="-27" cy="${CHIN - 20}" rx="9" ry="5" fill="${SKIN.blush}" opacity="0.4"/>
       <ellipse cx="27" cy="${CHIN - 20}" rx="9" ry="5" fill="${SKIN.blush}" opacity="0.4"/>`;

  // Rim light down the lit cheek, clipped to the face shape.
  const rimLight = `<path d="M 14 ${CROWN + 2}
                      C 30 ${CROWN + 12} 32 ${HEAD_C} 32 ${HEAD_C - 2}
                      C 32 ${CHIN - 20} 23 ${CHIN - 6} 0 ${CHIN}
                      C 14 ${CHIN - 10} 22 ${CHIN - 26} 22 ${HEAD_C - 4}
                      C 22 ${HEAD_C - 18} 20 ${CROWN + 8} 14 ${CROWN + 2} Z"
                      fill="${rim}" opacity="0.2"/>`;

  return `<path d="${shape}" fill="${SKIN.base}"/>
          ${rimLight}
          ${face}`;
}

// --- Torso ------------------------------------------------------------------

/** Chef's whites: a dark base with the apron bib over it, and a skirt below. */
function torso(base: string, shade: string, ink: string, rim: string): string {
  const shell = `M ${-SHOULDER_X - 6} ${SHOULDER_Y} q ${SHOULDER_X + 6} -14 ${SHOULDER_X * 2 + 12} 0
                 L ${HIP_X + 8} ${HIP_Y} q ${-HIP_X - 8} 10 ${-HIP_X * 2 - 16} 0 Z`;

  const lower = `<path d="M ${-HIP_X - 12} ${HIP_Y - 6} l ${HIP_X * 2 + 24} 0 l 14 74 l -${HIP_X * 2 + 52} 0 Z" fill="${shade}"/>`;
  const bib = `<path d="M -20 ${SHOULDER_Y + 20} l 40 0 l 6 ${HIP_Y - SHOULDER_Y - 20} l -52 0 Z" fill="#f4efe4" opacity="0.9"/>`;
  const rimLight = `<path d="M ${SHOULDER_X - 2} ${SHOULDER_Y - 4} q 10 4 8 18 l -6 ${HIP_Y - SHOULDER_Y - 14} l -8 0 Z" fill="${rim}" opacity="0.16"/>`;
  // The apron bib has no neckline of its own, so it gets the shared V stroke.
  const collar = `<path d="M -13 ${NECK + 2} l 13 22 l 13 -22" stroke="${ink}" stroke-width="3" fill="none" stroke-linejoin="round"/>`;

  return `${lower}
          <path d="${shell}" fill="${base}"/>
          ${bib}
          ${rimLight}
          ${collar}`;
}

// ---------------------------------------------------------------------------

/**
 * Build a character. Returns SVG markup with the origin at the feet, centred.
 *
 * The rig is nested inside `[data-part="body"]`, so ambient classes on the layer
 * (`k-breathe`) animate the whole figure without disturbing scene positioning.
 */
export function character(opts: CharacterOptions = {}): string {
  const {
    hairColor = 'black',
    eyeColor = '#4a6fb5',
    cloth = 'slate',
    pose = 'stand',
    expression = 'neutral',
    ink = '#2b2340',
    rim = '#ffe2b8',
    scale = 1,
    shadow = true,
  } = opts;

  const hairTone = HAIR_COLORS[hairColor];
  const clothTone = CLOTH_COLORS[cloth];
  const clothTone2 = opts.cloth2 ? CLOTH_COLORS[opts.cloth2] : { base: clothTone.shade, shade: clothTone.shade };
  const p = POSES[pose];

  const shoulderFar: Pt = [-SHOULDER_X, SHOULDER_Y];
  const shoulderNear: Pt = [SHOULDER_X, SHOULDER_Y];
  const hipFar: Pt = [-HIP_X, HIP_Y + p.drop];
  const hipNear: Pt = [HIP_X, HIP_Y + p.drop];

  // The apron has short sleeves and a skirt: forearms are bare, legs are trousered
  // above the knee and bare below. In the stencil these were per-outfit lookups.
  const sleeveEnd = 0;
  const legUpper = clothTone2.base;
  const legLower = SKIN.base;

  const shadowEl = shadow
    ? `<ellipse cx="0" cy="4" rx="${round(62)}" ry="11" fill="${ink}" opacity="0.22"/>`
    : '';

  // Upper body is grouped so `lean` and `drop` move torso, arms and head together.
  const upper = `
    <g transform="translate(0 ${p.drop}) rotate(${p.lean} 0 ${HIP_Y})">
      ${arm(shoulderFar, p.armFar, clothTone.shade, sleeveEnd)}
      ${limb([0, SHOULDER_Y + 6], [0, CHIN + 2], 10, 9, SKIN.shade)}
      ${torso(clothTone.base, clothTone.shade, ink, rim)}
      ${arm(shoulderNear, p.armNear, clothTone.base, sleeveEnd)}
      <g transform="rotate(${p.tilt} 0 ${NECK})">
        ${hairBack(hairTone.base, hairTone.shade)}
        ${head(ink, rim, eyeColor, expression)}
        ${hairFront(hairTone.base, hairTone.shade)}
      </g>
    </g>`;

  return `<g data-part="figure" transform="scale(${round(scale)})" stroke-linejoin="round">
    ${shadowEl}
    ${leg(hipFar, p.legFar, legUpper, legLower, ink)}
    ${leg(hipNear, p.legNear, legUpper, legLower, ink)}
    ${upper}
  </g>`;
}

/**
 * This story's props.
 *
 * Two: the pot she works over, and the plate she sends out. The stencil's lantern,
 * bicycle, signpost, bird, letter, train carriage and dining table went — none of
 * them is in a kitchen.
 */
export const props = {
  /** Stockpot with rising steam. Origin bottom-centre. */
  stockpot(body = '#4a5460', ink = '#2b2340'): string {
    const steam = times(3, (i) => {
      const x = -26 + i * 26;
      return `<path class="k-drift" style="--d:-${i * 2.4}s;--t:5s" d="M ${x} -96 q 12 -26 0 -50 q -12 -24 0 -46"
        stroke="#ffffff" stroke-width="6" fill="none" stroke-linecap="round" opacity="${0.32 - i * 0.06}"/>`;
    });
    return `<g data-part="stockpot">
      ${steam}
      <path d="M -52 -92 L 52 -92 L 44 0 L -44 0 Z" fill="${body}"/>
      <rect x="-60" y="-104" width="120" height="16" rx="7" fill="${ink}"/>
      <rect x="-76" y="-84" width="20" height="10" rx="5" fill="${ink}"/>
      <rect x="56" y="-84" width="20" height="10" rx="5" fill="${ink}"/>
    </g>`;
  },

  /** A finished plate — the thing a chef carries. Origin bottom-centre. */
  dish(plate = '#f4efe4', food = '#f0c674', ink = '#2b2340'): string {
    return `<g data-part="dish">
      <ellipse cx="0" cy="-6" rx="66" ry="18" fill="${plate}"/>
      <ellipse cx="0" cy="-10" rx="66" ry="18" fill="${plate}"/>
      <ellipse cx="0" cy="-10" rx="66" ry="18" fill="none" stroke="${ink}" stroke-width="3"/>
      <ellipse cx="0" cy="-14" rx="38" ry="11" fill="${food}"/>
      <ellipse cx="-6" cy="-18" rx="16" ry="7" fill="#ffffff" opacity="0.5"/>
      <path class="k-drift" style="--t:4.5s" d="M 0 -34 q 10 -20 0 -38" stroke="#ffffff" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.35"/>
    </g>`;
  },
};
