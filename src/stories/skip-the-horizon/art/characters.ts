/**
 * Character rig.
 *
 * `character()` returns a figure drawn with **the origin at the feet, centred**.
 * So a layer at `x: 800, y: 700` stands centre-frame with their feet on a ground
 * line at y=700 — position a character by where they stand, never by juggling a
 * bounding box.
 *
 * The figure is ~442 units tall at scale 1, about 5.5 heads: stylised enough to
 * read as anime, tall enough not to look chibi.
 *
 * Limbs are generated from joint positions rather than hand-drawn per pose, so a
 * new pose is a table entry, not a new pile of path data.
 */

import { CLOTH_COLORS, HAIR_COLORS, SKIN, type ClothColor, type HairColor } from './palette';
import { round, times } from '../../../lib/svg';

export type HairStyle = 'short' | 'long' | 'ponytail' | 'bob' | 'spiky' | 'messy' | 'bun';
export type Outfit = 'uniform' | 'coat' | 'hoodie' | 'yukata' | 'apron' | 'dress';
export type PoseName = 'stand' | 'walk' | 'reach' | 'point' | 'slump' | 'sit' | 'back';
export type Expression = 'neutral' | 'smile' | 'sad' | 'surprised' | 'determined' | 'closed' | 'worried';

export interface CharacterOptions {
  hair?: HairStyle;
  hairColor?: HairColor;
  eyeColor?: string;
  outfit?: Outfit;
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
  walk: {
    armFar: [[-52, -268], [-44, -204]],
    armNear: [[40, -266], [58, -216]],
    legFar: [[-44, -116], [-70, -4]],
    legNear: [[28, -114], [50, -4]],
    tilt: -2,
    lean: 3,
    drop: 6,
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
  point: {
    armFar: [[-44, -262], [-48, -198]],
    armNear: [[58, -300], [96, -286]],
    legFar: [[-24, -110], [-30, -4]],
    legNear: [[22, -110], [26, -4]],
    tilt: 3,
    lean: 4,
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
  sit: {
    armFar: [[-46, -152], [-50, -100]],
    armNear: [[46, -152], [50, -100]],
    // Knees stay near the midline. Mirrored legs reaching far to both sides read as
    // the splits rather than as someone sitting down.
    legFar: [[-34, -128], [-64, -10]],
    legNear: [[30, -124], [60, -10]],
    tilt: 4,
    lean: 6,
    // Positive drops the hips toward the ground — a seated figure is short.
    drop: 128,
  },
  back: {
    armFar: [[-44, -262], [-48, -198]],
    armNear: [[44, -262], [48, -198]],
    legFar: [[-20, -110], [-22, -4]],
    legNear: [[20, -110], [22, -4]],
    tilt: 0,
    lean: 0,
    drop: 0,
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

function hairBack(style: HairStyle, base: string, shade: string): string {
  const skull = `<path d="${BACK_BASE}" fill="${shade}"/>`;

  switch (style) {
    case 'long':
      // Tapering mass ending in soft points, so it reads as hair rather than a slab.
      // Kept narrow and stopped above the hips — a full-width curtain to the waist
      // swallows the torso and the character loses their silhouette entirely.
      return (
        `<path d="M -32 ${CROWN + 30}
           C -44 ${HEAD_C + 40} -46 ${HIP_Y - 110} -38 ${HIP_Y - 40}
           L -18 ${HIP_Y - 26} L 0 ${HIP_Y - 44} L 18 ${HIP_Y - 26} L 38 ${HIP_Y - 40}
           C 46 ${HIP_Y - 110} 44 ${HEAD_C + 40} 32 ${CROWN + 30} Z" fill="${shade}"/>` +
        `<path d="M -16 ${HEAD_C + 24} C -24 ${HIP_Y - 100} -22 ${HIP_Y - 66} -17 ${HIP_Y - 52}
           L 0 ${HIP_Y - 62} L 17 ${HIP_Y - 52} C 22 ${HIP_Y - 66} 24 ${HIP_Y - 100} 16 ${HEAD_C + 24} Z"
           fill="${base}" opacity="0.4"/>` +
        skull
      );
    case 'ponytail':
      return (
        skull +
        `<path d="M 20 ${CROWN + 22}
           C 62 ${CROWN + 30} 80 ${HEAD_C + 40} 76 ${HIP_Y - 80}
           C 73 ${HIP_Y - 30} 62 ${HIP_Y + 4} 48 ${HIP_Y + 22}
           L 30 ${HIP_Y + 6}
           C 46 ${HIP_Y - 24} 55 ${HIP_Y - 60} 54 ${HEAD_C + 30}
           C 52 ${CROWN + 54} 38 ${CROWN + 34} 16 ${CROWN + 32} Z" fill="${shade}"/>` +
        `<path d="M 38 ${CROWN + 40} C 60 ${HEAD_C + 20} 62 ${HIP_Y - 60} 52 ${HIP_Y - 22}
           L 47 ${HIP_Y - 26} C 56 ${HIP_Y - 60} 52 ${HEAD_C + 24} 34 ${CROWN + 44} Z"
           fill="${base}" opacity="0.28"/>`
      );
    case 'bun':
      return (
        `<circle cx="0" cy="${CROWN - 20}" r="27" fill="${shade}"/>
         <circle cx="-6" cy="${CROWN - 25}" r="18" fill="${base}" opacity="0.55"/>` + skull
      );
    case 'bob':
      return (
        `<path d="M -40 ${HEAD_C - 10} C -46 ${CHIN - 10} -44 ${CHIN + 30} -38 ${CHIN + 44}
           L 38 ${CHIN + 44} C 44 ${CHIN + 30} 46 ${CHIN - 10} 40 ${HEAD_C - 10} Z" fill="${shade}"/>` +
        skull
      );
    default:
      return skull;
  }
}

function hairFront(style: HairStyle, base: string, shade: string): string {
  /** Skull cap: covers the top of the head down to just above the brows. */
  const cap = `<path d="M -34 ${HEAD_C - 4}
    C -34 ${CROWN - 4} -17 ${CROWN - 10} 0 ${CROWN - 10}
    C 17 ${CROWN - 10} 34 ${CROWN - 4} 34 ${HEAD_C - 4}
    C 22 ${HEAD_C - 22} -22 ${HEAD_C - 22} -34 ${HEAD_C - 4} Z" fill="${base}"/>`;

  /** Narrow lock hanging beside the face — frames the cheek and adds depth. */
  const sideLock = (dir: 1 | -1, bottom: number) =>
    `<path d="M ${34 * dir} ${HEAD_C - 12}
       C ${42 * dir} ${HEAD_C + 14} ${41 * dir} ${bottom - 18} ${36 * dir} ${bottom}
       L ${25 * dir} ${bottom - 6}
       C ${29 * dir} ${bottom - 24} ${30 * dir} ${HEAD_C + 10} ${24 * dir} ${HEAD_C - 14} Z"
       fill="${base}"/>`;

  switch (style) {
    case 'spiky':
      return (
        cap +
        `<path d="M -34 ${HEAD_C - 6}
           L -26 ${CROWN + 12} L -18 ${HEAD_C - 10} L -8 ${CROWN + 6} L -2 ${HEAD_C - 12}
           L 8 ${CROWN + 10} L 16 ${HEAD_C - 8} L 26 ${CROWN + 16} L 34 ${HEAD_C - 6}
           C 22 ${HEAD_C - 20} -22 ${HEAD_C - 20} -34 ${HEAD_C - 6} Z" fill="${base}"/>` +
        `<path d="M -26 ${CROWN + 12} L -18 ${HEAD_C - 10} L -14 ${HEAD_C - 18} L -22 ${CROWN + 14} Z"
           fill="${shade}" opacity="0.55"/>`
      );
    case 'messy':
      // Uneven pointed clumps at varying lengths. Smooth arcs here read as a helmet;
      // the irregularity is the whole style.
      return (
        cap +
        `<path d="M -34 ${HEAD_C - 6}
           L -29 ${CROWN + 20} L -21 ${HEAD_C - 2} L -17 ${CROWN + 8} L -7 ${HEAD_C - 14}
           L -1 ${CROWN + 4} L 7 ${HEAD_C - 4} L 15 ${CROWN + 14} L 23 ${HEAD_C - 12}
           L 29 ${CROWN + 22} L 34 ${HEAD_C - 6}
           C 22 ${HEAD_C - 22} -22 ${HEAD_C - 22} -34 ${HEAD_C - 6} Z" fill="${base}"/>` +
        `<path d="M -21 ${HEAD_C - 2} L -17 ${CROWN + 8} L -13 ${CROWN + 12} L -16 ${HEAD_C - 6} Z"
           fill="${shade}" opacity="0.5"/>` +
        `<path d="M 23 ${HEAD_C - 12} L 29 ${CROWN + 22} L 33 ${CROWN + 26} L 28 ${HEAD_C - 14} Z"
           fill="${shade}" opacity="0.5"/>`
      );
    case 'ponytail':
      return (
        cap +
        `<path d="M -34 ${HEAD_C - 6}
           C -28 ${CROWN + 8} -4 ${CROWN + 2} 12 ${CROWN + 14}
           C 24 ${CROWN + 24} 31 ${HEAD_C - 20} 34 ${HEAD_C - 6}
           C 22 ${HEAD_C - 22} -22 ${HEAD_C - 22} -34 ${HEAD_C - 6} Z" fill="${base}"/>` +
        sideLock(-1, CHIN - 4)
      );
    case 'bob':
      return (
        cap +
        `<path d="M -34 ${HEAD_C - 6}
           C -26 ${CROWN + 6} 26 ${CROWN + 6} 34 ${HEAD_C - 6}
           C 22 ${HEAD_C - 22} -22 ${HEAD_C - 22} -34 ${HEAD_C - 6} Z" fill="${base}"/>` +
        sideLock(-1, CHIN + 26) +
        sideLock(1, CHIN + 26)
      );
    case 'long':
      return (
        cap +
        `<path d="M -34 ${HEAD_C - 6}
           C -30 ${CROWN + 8} -8 ${CROWN + 2} 4 ${CROWN + 12}
           C 20 ${CROWN + 22} 30 ${HEAD_C - 18} 34 ${HEAD_C - 6}
           C 22 ${HEAD_C - 22} -22 ${HEAD_C - 22} -34 ${HEAD_C - 6} Z" fill="${base}"/>` +
        sideLock(-1, CHIN + 40) +
        sideLock(1, CHIN + 40)
      );
    case 'bun':
      return (
        cap +
        `<path d="M -32 ${HEAD_C - 8}
           C -24 ${CROWN + 8} 24 ${CROWN + 8} 32 ${HEAD_C - 8}
           C 20 ${HEAD_C - 22} -20 ${HEAD_C - 22} -32 ${HEAD_C - 8} Z" fill="${base}"/>` +
        sideLock(-1, CHIN - 10)
      );
    default:
      return (
        cap +
        `<path d="M -34 ${HEAD_C - 6}
           C -28 ${CROWN + 10} -10 ${CROWN + 4} 2 ${CROWN + 14}
           C 16 ${CROWN + 24} 28 ${HEAD_C - 18} 34 ${HEAD_C - 8}
           C 22 ${HEAD_C - 22} -22 ${HEAD_C - 22} -34 ${HEAD_C - 6} Z" fill="${base}"/>` +
        `<path d="M 2 ${CROWN + 14} C 16 ${CROWN + 24} 28 ${HEAD_C - 18} 34 ${HEAD_C - 8}
           C 26 ${HEAD_C - 16} 14 ${CROWN + 26} 0 ${CROWN + 20} Z" fill="${shade}" opacity="0.5"/>`
      );
  }
}

// --- Face -------------------------------------------------------------------

function eye(cx: number, color: string, ink: string, expression: Expression): string {
  const closed = expression === 'closed';
  const inner = closed
    ? `<path d="M -9 0 q 9 7 18 0" stroke="${ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="0" cy="0" rx="8.6" ry="10.6" fill="#ffffff"/>
       <ellipse cx="0" cy="1" rx="7" ry="9.2" fill="${color}"/>
       <ellipse cx="0" cy="2" rx="3.6" ry="5.6" fill="${ink}"/>
       <circle cx="-2.8" cy="-4.2" r="3" fill="#ffffff"/>
       <circle cx="2.6" cy="4.6" r="1.6" fill="#ffffff" opacity="0.85"/>
       <path d="M -9.4 -8.2 q 9.4 -6.4 18.8 0" stroke="${ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;

  // Nested groups: the outer one places the eye, the inner one is free for the
  // CSS blink to scale without fighting the placement transform.
  return `<g transform="translate(${cx} ${HEAD_C + 2})"><g class="${closed ? '' : 'k-blink'}">${inner}</g></g>`;
}

function brows(ink: string, expression: Expression): string {
  const y = CHIN - 56;
  const map: Record<Expression, [string, string]> = {
    neutral: [`M -25 ${y} q 9 -5 18 -1`, `M 25 ${y} q -9 -5 -18 -1`],
    smile: [`M -25 ${y - 2} q 9 -6 18 -2`, `M 25 ${y - 2} q -9 -6 -18 -2`],
    sad: [`M -25 ${y - 4} q 9 3 18 6`, `M 25 ${y - 4} q -9 3 -18 6`],
    worried: [`M -25 ${y - 3} q 9 2 18 5`, `M 25 ${y - 3} q -9 2 -18 5`],
    surprised: [`M -26 ${y - 7} q 9 -6 18 -2`, `M 26 ${y - 7} q -9 -6 -18 -2`],
    determined: [`M -26 ${y - 1} q 10 4 19 8`, `M 26 ${y - 1} q -10 4 -19 8`],
    closed: [`M -25 ${y} q 9 -5 18 -1`, `M 25 ${y} q -9 -5 -18 -1`],
  };
  const [l, r] = map[expression];
  return `<path d="${l}" stroke="${ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
          <path d="${r}" stroke="${ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
}

function mouth(ink: string, expression: Expression): string {
  const y = CHIN - 14;
  switch (expression) {
    case 'smile':
      return `<path d="M -9 ${y - 2} q 9 8 18 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'sad':
      return `<path d="M -8 ${y + 2} q 8 -7 16 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'worried':
      return `<path d="M -8 ${y} q 4 -4 8 0 q 4 4 8 0" stroke="${ink}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
    case 'surprised':
      return `<ellipse cx="0" cy="${y}" rx="6" ry="8" fill="${ink}"/>`;
    case 'determined':
      return `<path d="M -10 ${y} l 20 0" stroke="${ink}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
    default:
      return `<path d="M -6 ${y} q 6 4 12 0" stroke="${ink}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
  }
}

function head(ink: string, rim: string, eyeColor: string, expression: Expression, isBack: boolean): string {
  // Widest at the cheekbones, tapering to a soft point at the chin. The lower
  // control points must sit *above* the chin (more negative y) or the jaw bulges
  // outward and the face reads as a box.
  const shape = `M -32 ${HEAD_C - 2}
                 C -32 ${CROWN + 4} -17 ${CROWN - 2} 0 ${CROWN - 2}
                 C 17 ${CROWN - 2} 32 ${CROWN + 4} 32 ${HEAD_C - 2}
                 C 32 ${CHIN - 20} 23 ${CHIN - 6} 0 ${CHIN}
                 C -23 ${CHIN - 6} -32 ${CHIN - 20} -32 ${HEAD_C - 2} Z`;

  const face = isBack
    ? ''
    : `${eye(-17, eyeColor, ink, expression)}${eye(17, eyeColor, ink, expression)}
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

function torso(outfit: Outfit, base: string, shade: string, ink: string, rim: string): string {
  const shell = `M ${-SHOULDER_X - 6} ${SHOULDER_Y} q ${SHOULDER_X + 6} -14 ${SHOULDER_X * 2 + 12} 0
                 L ${HIP_X + 8} ${HIP_Y} q ${-HIP_X - 8} 10 ${-HIP_X * 2 - 16} 0 Z`;

  // Each outfit draws its own neckline in `detail`; a shared V stroke on top of that
  // just doubles the lapel. Only the collarless garments get one.
  const collar =
    outfit === 'dress' || outfit === 'apron'
      ? `<path d="M -13 ${NECK + 2} l 13 22 l 13 -22" stroke="${ink}" stroke-width="3" fill="none" stroke-linejoin="round"/>`
      : '';
  const rimLight = `<path d="M ${SHOULDER_X - 2} ${SHOULDER_Y - 4} q 10 4 8 18 l -6 ${HIP_Y - SHOULDER_Y - 14} l -8 0 Z" fill="${rim}" opacity="0.16"/>`;

  const lower: Record<Outfit, string> = {
    uniform: `<path d="M ${-HIP_X - 12} ${HIP_Y - 6} l ${HIP_X * 2 + 24} 0 l 16 62 l -${HIP_X * 2 + 56} 0 Z" fill="${shade}"/>`,
    dress: `<path d="M ${-HIP_X - 10} ${HIP_Y - 10} l ${HIP_X * 2 + 20} 0 l 34 108 l -${HIP_X * 2 + 88} 0 Z" fill="${shade}"/>`,
    coat: `<path d="M ${-HIP_X - 14} ${HIP_Y + 4} l ${HIP_X * 2 + 28} 0 l 10 118 l -${HIP_X * 2 + 48} 0 Z" fill="${base}"/>
           <line x1="0" y1="${HIP_Y + 4}" x2="0" y2="${HIP_Y + 120}" stroke="${shade}" stroke-width="3"/>`,
    hoodie: `<path d="M ${-HIP_X - 10} ${HIP_Y - 14} l ${HIP_X * 2 + 20} 0 l 4 28 l -${HIP_X * 2 + 28} 0 Z" fill="${shade}"/>`,
    yukata: `<path d="M ${-HIP_X - 12} ${HIP_Y - 4} l ${HIP_X * 2 + 24} 0 l 18 128 l -${HIP_X * 2 + 60} 0 Z" fill="${base}"/>`,
    apron: `<path d="M ${-HIP_X - 12} ${HIP_Y - 6} l ${HIP_X * 2 + 24} 0 l 14 74 l -${HIP_X * 2 + 52} 0 Z" fill="${shade}"/>`,
  };

  const detail: Record<Outfit, string> = {
    uniform: `<path d="M -14 ${NECK + 6} l 14 30 l 14 -30 l 10 8 l -24 44 l -24 -44 Z" fill="${shade}"/>
              <path d="M -6 ${NECK + 34} l 12 0 l 8 22 l -28 0 Z" fill="#c8434f"/>`,
    dress: `<path d="M ${-HIP_X - 10} ${HIP_Y - 14} l ${HIP_X * 2 + 20} 0 l 0 8 l -${HIP_X * 2 + 20} 0 Z" fill="${ink}" opacity="0.5"/>`,
    coat: `<path d="M 0 ${SHOULDER_Y + 6} l 0 ${HIP_Y - SHOULDER_Y - 6}" stroke="${shade}" stroke-width="3"/>
           <path d="M -28 ${SHOULDER_Y + 2} l 28 34 l 28 -34 l 8 10 l -36 42 l -36 -42 Z" fill="${shade}" opacity="0.8"/>`,
    hoodie: `<path d="M -26 ${SHOULDER_Y + 2} q 26 26 52 0 q 4 20 -26 26 q -30 -6 -26 -26 Z" fill="${shade}"/>
             <path d="M -12 ${HIP_Y + 26} l 24 0" stroke="${shade}" stroke-width="4" stroke-linecap="round"/>`,
    yukata: `<path d="M -18 ${NECK + 4} l 18 44 l 18 -44 l 10 8 l -28 56 l -28 -56 Z" fill="${shade}"/>
             <rect x="${-HIP_X - 15}" y="${HIP_Y - 14}" width="${HIP_X * 2 + 30}" height="24" fill="${ink}"/>
             <rect x="${-HIP_X - 15}" y="${HIP_Y - 4}" width="${HIP_X * 2 + 30}" height="4" fill="${shade}" opacity="0.6"/>`,
    apron: `<path d="M -20 ${SHOULDER_Y + 20} l 40 0 l 6 ${HIP_Y - SHOULDER_Y - 20} l -52 0 Z" fill="#f4efe4" opacity="0.9"/>`,
  };

  return `${lower[outfit]}
          <path d="${shell}" fill="${base}"/>
          ${detail[outfit]}
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
    hair = 'short',
    hairColor = 'black',
    eyeColor = '#4a6fb5',
    outfit = 'uniform',
    cloth = 'indigo',
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
  const isBack = pose === 'back';

  const shoulderFar: Pt = [-SHOULDER_X, SHOULDER_Y];
  const shoulderNear: Pt = [SHOULDER_X, SHOULDER_Y];
  const hipFar: Pt = [-HIP_X, HIP_Y + p.drop];
  const hipNear: Pt = [HIP_X, HIP_Y + p.drop];

  const sleeveEnd = outfit === 'hoodie' || outfit === 'coat' || outfit === 'yukata' ? 1 : 0;
  const legUpper = outfit === 'uniform' || outfit === 'dress' || outfit === 'yukata' ? SKIN.base : clothTone2.base;
  const legLower = outfit === 'coat' || outfit === 'hoodie' ? clothTone2.shade : SKIN.base;

  const shadowEl = shadow
    ? `<ellipse cx="0" cy="4" rx="${round(62 * (pose === 'sit' ? 1.5 : 1))}" ry="11" fill="${ink}" opacity="0.22"/>`
    : '';

  // Upper body is grouped so `lean` and `drop` move torso, arms and head together.
  const upper = `
    <g transform="translate(0 ${p.drop}) rotate(${p.lean} 0 ${HIP_Y})">
      ${arm(shoulderFar, p.armFar, clothTone.shade, sleeveEnd)}
      ${limb([0, SHOULDER_Y + 6], [0, CHIN + 2], 10, 9, SKIN.shade)}
      ${torso(outfit, clothTone.base, clothTone.shade, ink, rim)}
      ${arm(shoulderNear, p.armNear, clothTone.base, sleeveEnd)}
      <g transform="rotate(${p.tilt} 0 ${NECK})">
        ${hairBack(hair, hairTone.base, hairTone.shade)}
        ${head(ink, rim, eyeColor, expression, isBack)}
        ${hairFront(hair, hairTone.base, hairTone.shade)}
      </g>
    </g>`;

  return `<g data-part="figure" transform="scale(${round(scale)})" stroke-linejoin="round">
    ${shadowEl}
    ${leg(hipFar, p.legFar, legUpper, legLower, ink)}
    ${leg(hipNear, p.legNear, legUpper, legLower, ink)}
    ${upper}
  </g>`;
}

/** Small non-human props that keep showing up in stories. */
export const props = {
  lantern(color = '#ffb15e', ink = '#2b2340'): string {
    return `<g data-part="lantern">
      <line x1="0" y1="-90" x2="0" y2="-58" stroke="${ink}" stroke-width="3"/>
      <ellipse cx="0" cy="-30" rx="26" ry="30" fill="${color}"/>
      <ellipse cx="0" cy="-30" rx="26" ry="30" fill="none" stroke="${ink}" stroke-width="3"/>
      <line x1="-24" y1="-40" x2="24" y2="-40" stroke="${ink}" stroke-width="2" opacity="0.5"/>
      <line x1="-25" y1="-24" x2="25" y2="-24" stroke="${ink}" stroke-width="2" opacity="0.5"/>
      <circle cx="0" cy="-30" r="46" fill="${color}" opacity="0.22" class="k-pulse"/>
    </g>`;
  },

  bicycle(frame = '#4a5460', ink = '#2b2340'): string {
    return `<g data-part="bicycle" fill="none" stroke="${ink}" stroke-width="5">
      <circle cx="-58" cy="-38" r="38"/>
      <circle cx="58" cy="-38" r="38"/>
      <path d="M -58 -38 L -14 -96 L 34 -96 L 58 -38 M -14 -96 L 10 -38 L 58 -38" stroke="${frame}"/>
      <path d="M -22 -104 l 22 0 M 30 -104 l 16 -6" stroke-linecap="round"/>
    </g>`;
  },

  signpost(ink = '#2b2340', board = '#c08a3e'): string {
    return `<g data-part="signpost">
      <rect x="-5" y="-140" width="10" height="140" fill="${ink}"/>
      <rect x="-52" y="-140" width="104" height="34" rx="4" fill="${board}"/>
      <rect x="-52" y="-140" width="104" height="34" rx="4" fill="none" stroke="${ink}" stroke-width="3"/>
      <line x1="-38" y1="-128" x2="26" y2="-128" stroke="${ink}" stroke-width="3" opacity="0.6"/>
      <line x1="-38" y1="-118" x2="12" y2="-118" stroke="${ink}" stroke-width="3" opacity="0.6"/>
    </g>`;
  },

  bird(ink = '#2b2340'): string {
    return `<path class="k-flap" data-part="bird" d="M -16 0 q 8 -10 16 0 q 8 -10 16 0" stroke="${ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  },

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

  /**
   * A round dining table with a candle, at the same scale as the rig (top ~200
   * above the floor, a little under half a standing character).
   *
   * Origin bottom-centre at the floor. Place it as a layer *after* the character
   * you want seated at it, and clear that slot in the backdrop with
   * `diningRoom({ clearTable: n })`. A table drawn behind someone reads as them
   * standing in front of furniture, which is the whole reason this exists.
   */
  diningTable(top = '#b39189', leg = '#96736f', ink = '#241c36'): string {
    return `<g data-part="dining-table">
      <ellipse cx="0" cy="-4" rx="168" ry="28" fill="${ink}" opacity="0.2"/>
      <rect x="-18" y="-198" width="36" height="198" rx="10" fill="${leg}"/>
      <ellipse cx="0" cy="-14" rx="74" ry="17" fill="${leg}"/>
      <ellipse cx="0" cy="-190" rx="156" ry="32" fill="${ink}" opacity="0.34"/>
      <ellipse cx="0" cy="-198" rx="156" ry="32" fill="${top}"/>
      <ellipse cx="0" cy="-198" rx="156" ry="32" fill="none" stroke="${ink}" stroke-width="3" opacity="0.4"/>
      <rect x="-87" y="-252" width="18" height="46" rx="5" fill="#f6efdd"/>
      <ellipse class="k-pulse" style="--t:5s" cx="-78" cy="-268" rx="11" ry="17" fill="#ffcf7a" opacity="0.95"/>
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

  /** Folded paper. Origin at the bottom-centre, like a character. */
  letter(paper = '#f6efdd', ink = '#2b2340'): string {
    return `<g data-part="letter">
      <rect x="-46" y="-64" width="92" height="64" rx="3" fill="${paper}"/>
      <path d="M -46 -64 L 0 -28 L 46 -64" fill="none" stroke="${ink}" stroke-width="3" opacity="0.45"/>
      <rect x="-46" y="-64" width="92" height="64" rx="3" fill="none" stroke="${ink}" stroke-width="3"/>
    </g>`;
  },

  /**
   * A single railway carriage seen side-on. Origin at track level, centre.
   * Windows use the flicker class so the carriage reads as lit and occupied.
   */
  trainCar(body = '#3f4a7a', glass = '#ffe9b0', ink = '#1b1f26'): string {
    const windows = times(6, (i) => {
      const x = -300 + i * 104;
      return `<rect class="k-flicker" style="--d:-${i * 2.3}s;--t:17s" x="${x}" y="-198" width="72" height="62" rx="6" fill="${glass}" opacity="0.9"/>`;
    });
    return `<g data-part="train-car">
      <rect x="-360" y="-236" width="720" height="196" rx="26" fill="${body}"/>
      <rect x="-360" y="-236" width="720" height="196" rx="26" fill="none" stroke="${ink}" stroke-width="5"/>
      ${windows}
      <rect x="-360" y="-64" width="720" height="26" fill="${ink}" opacity="0.85"/>
      <circle cx="-224" cy="-26" r="26" fill="${ink}"/>
      <circle cx="224" cy="-26" r="26" fill="${ink}"/>
      <rect x="-372" y="-150" width="14" height="40" rx="4" fill="${glass}" opacity="0.75"/>
    </g>`;
  },

  /** A smooth black skipping stone. */
  pebble(color = '#272336', ink = '#12101c'): string {
    return `<g data-part="pebble">
      <ellipse cx="0" cy="-6" rx="22" ry="12" fill="${color}"/>
      <ellipse cx="0" cy="-6" rx="22" ry="12" fill="none" stroke="${ink}" stroke-width="2.5"/>
      <ellipse cx="-4" cy="-8" rx="10" ry="4" fill="#ffffff" opacity="0.25"/>
    </g>`;
  },

  /** Glowing cosmic gold token. */
  goldCoin(glow = '#facc15', shine = '#fef08a', ink = '#713f12'): string {
    return `<g data-part="gold-coin">
      <circle cx="0" cy="0" r="42" fill="${glow}" class="k-pulse"/>
      <circle cx="0" cy="0" r="34" fill="${shine}"/>
      <circle cx="0" cy="0" r="34" fill="none" stroke="${ink}" stroke-width="3.5"/>
      <circle cx="0" cy="0" r="24" fill="none" stroke="${ink}" stroke-width="1.8" stroke-dasharray="4 3"/>
      <!-- Star glyph in center -->
      <path d="M 0 -16 L 4 -4 L 16 0 L 4 4 L 0 16 L -4 4 L -16 0 L -4 -4 Z" fill="${ink}"/>
      <circle cx="-10" cy="-10" r="4" fill="#ffffff" opacity="0.75"/>
    </g>`;
  },

  /** Giant articulated brass celestial hand. */
  cosmicHand(brass = '#d97706', dark = '#78350f', glow = '#fef08a', ink = '#451a03'): string {
    return `<g data-part="cosmic-hand">
      <!-- Palm / Arm segment -->
      <path d="M -90 -160 L 90 -160 L 70 20 L -70 20 Z" fill="${brass}" stroke="${ink}" stroke-width="6"/>
      <rect x="-80" y="-120" width="160" height="24" rx="8" fill="${dark}"/>
      <!-- Fingers grasping downward -->
      <!-- Thumb -->
      <path d="M -70 0 Q -110 30 -90 70 Q -70 90 -50 60 L -40 20 Z" fill="${brass}" stroke="${ink}" stroke-width="5"/>
      <!-- Index -->
      <path d="M -35 20 L -30 110 Q -20 130 -5 110 L -5 20 Z" fill="${brass}" stroke="${ink}" stroke-width="5"/>
      <!-- Middle -->
      <path d="M 0 20 L 5 125 Q 18 145 30 125 L 30 20 Z" fill="${brass}" stroke="${ink}" stroke-width="5"/>
      <!-- Ring/Pinky -->
      <path d="M 35 20 L 45 95 Q 60 110 70 90 L 65 20 Z" fill="${brass}" stroke="${ink}" stroke-width="5"/>
      <!-- Joint rivets -->
      <circle cx="-20" cy="65" r="7" fill="${glow}" stroke="${ink}" stroke-width="2"/>
      <circle cx="16" cy="72" r="7" fill="${glow}" stroke="${ink}" stroke-width="2"/>
      <circle cx="52" cy="58" r="7" fill="${glow}" stroke="${ink}" stroke-width="2"/>
      <circle cx="-65" cy="35" r="7" fill="${glow}" stroke="${ink}" stroke-width="2"/>
    </g>`;
  },
};

