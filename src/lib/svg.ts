/**
 * Small SVG authoring helpers shared by every art builder.
 *
 * Two rules make the kit composable:
 *  - The frame is always `FRAME.w` x `FRAME.h` viewBox units. Builders never think
 *    in pixels, so art scales to any screen for free.
 *  - Randomness is always seeded. Star fields and window lights must land in the
 *    same place on every build, or a rebuild would silently change the art.
 */

export const FRAME = { w: 1600, h: 900 } as const;

/** Default horizon line. Backdrops may override, but staying near it keeps cuts calm. */
export const HORIZON = 620;

let uidCounter = 0;

/**
 * Unique id for gradients and clip paths.
 *
 * SVG ids are document-global and a story page renders every scene into one
 * document, so unscoped ids from two scenes would collide and one backdrop would
 * silently inherit the other's gradient.
 */
export function uid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}-${uidCounter.toString(36)}`;
}

/** Deterministic PRNG (mulberry32). Same seed, same art, every build. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Turn any string into a stable numeric seed. */
export function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const round = (n: number): number => Math.round(n * 10) / 10;

/**
 * Build a closed silhouette from a rolling ridge line.
 * Used for mountains, hills, treelines and cloud banks alike.
 */
export function ridgePath(
  points: Array<[number, number]>,
  baseY: number,
  smooth = true,
): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points as [[number, number], ...Array<[number, number]>];
  let d = `M ${round(first[0])} ${round(baseY)} L ${round(first[0])} ${round(first[1])}`;

  if (!smooth) {
    for (const [x, y] of rest) d += ` L ${round(x)} ${round(y)}`;
  } else {
    let prev = first;
    for (const point of rest) {
      const midX = (prev[0] + point[0]) / 2;
      d += ` Q ${round(prev[0])} ${round(prev[1])} ${round(midX)} ${round((prev[1] + point[1]) / 2)}`;
      prev = point;
    }
    d += ` L ${round(prev[0])} ${round(prev[1])}`;
  }

  const last = points[points.length - 1]!;
  d += ` L ${round(last[0])} ${round(baseY)} Z`;
  return d;
}

/** Sample a ridge line across the frame. `jitter` controls how jagged it reads. */
export function ridgePoints(
  random: () => number,
  opts: { count: number; baseline: number; amplitude: number; from?: number; to?: number },
): Array<[number, number]> {
  const from = opts.from ?? -80;
  const to = opts.to ?? FRAME.w + 80;
  const step = (to - from) / opts.count;
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= opts.count; i += 1) {
    points.push([from + i * step, opts.baseline - random() * opts.amplitude]);
  }
  return points;
}

/** Wrap markup in a group. Skips the wrapper entirely when there is nothing to add. */
export function group(attrs: Record<string, string | number | undefined>, ...children: string[]): string {
  const body = children.filter(Boolean).join('');
  const serialized = Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
  return `<g ${serialized}>${body}</g>`;
}

/** Repeat a builder n times, passing the index. */
export function times(n: number, build: (i: number) => string): string {
  let out = '';
  for (let i = 0; i < n; i += 1) out += build(i);
  return out;
}
