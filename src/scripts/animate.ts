/**
 * Cue compiler.
 *
 * Turns a scene's `ResolvedCue`s into paused Web Animations API `Animation`s.
 * Nothing here ever calls `play()` — the player owns the clock and writes
 * `currentTime` on every frame.
 *
 * That is the key decision in the whole engine. If cues were played normally they
 * would drift from the narration audio, and seeking backwards would be impossible.
 * Because each animation is paused and positioned explicitly, the visual state at
 * time *t* is a pure function of *t*: scrubbing, pausing and jumping between scenes
 * all fall out for free, and the picture can never desync from the voice.
 *
 * ## One animation per property, not per cue
 *
 * Cues are *not* compiled one-to-one into animations. Every cue that touches the
 * same property of the same element is merged into a single animation spanning the
 * whole scene, with the cues laid out along it as keyframes.
 *
 * This is not an optimisation. Two paused animations with `fill: 'both'` on one
 * property fight, and the later one wins at *every* time — including times before it
 * starts, where its backwards fill overwrites whatever the earlier cue was doing. A
 * layer with two `move`s, or a `fade` either side of an `enter`, would render its
 * first cue as a frozen end-state. Merging removes the second writer entirely, so
 * the conflict cannot arise rather than being carefully avoided.
 *
 * Cues write to `--cue-x/y/s/r` rather than to `transform` directly. Those are
 * registered as typed custom properties in `anime.css` (`@property`), without which
 * the browser would step between keyframes instead of interpolating them. The layer
 * composes all four into one transform in CSS, so position, scale and rotation cues
 * can overlap on the same layer without overwriting each other.
 */

import { BASE_VARIANT } from '../lib/story';
import type { ResolvedCue, ResolvedScene } from '../lib/timing';

export interface CompiledCue {
  animation: Animation;
  start: number;
  end: number;
  /**
   * Absolute times at which this track reaches a resting value. Reduced motion snaps
   * forward to the next one rather than easing through it.
   */
  stops: number[];
}

type Params = Record<string, number | string | boolean>;
type Value = string | number;

const num = (params: Params, key: string, fallback: number): number =>
  typeof params[key] === 'number' ? (params[key] as number) : fallback;

/** A value this cue imposes at `frac` of the way through its own span. */
interface Point {
  frac: number;
  value: Value;
}

/** One cue's effect on one property of one element. */
interface Write {
  element: Element;
  prop: string;
  points: Point[];
}

const X = '--cue-x';
const Y = '--cue-y';
const S = '--cue-s';
const R = '--cue-r';
const OPACITY = 'opacity';

const px = (n: number): string => `${n}px`;

function offset(direction: string, distance: number): [number, number] {
  switch (direction) {
    case 'left':
      return [-distance, 0];
    case 'right':
      return [distance, 0];
    case 'top':
      return [0, -distance];
    case 'bottom':
      return [0, distance];
    default:
      return [-distance, 0];
  }
}

/** Running per-target state, so consecutive cues continue from where the last ended. */
interface TargetState {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  /** Which drawing is currently forward. Tracked so a `swap` knows what to fade out. */
  variant: string;
}

function initialState(element: HTMLElement): TargetState {
  const opacity = Number.parseFloat(element.style.opacity || '1');
  return {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: Number.isFinite(opacity) ? opacity : 1,
    variant: BASE_VARIANT,
  };
}

/** Where a property sits before any cue touches it. */
function restingValue(element: Element, prop: string): Value {
  switch (prop) {
    case X:
    case Y:
      return px(0);
    case S:
      return '1';
    case R:
      return '0deg';
    default: {
      const opacity = Number.parseFloat((element as HTMLElement).style.opacity || '1');
      return Number.isFinite(opacity) ? opacity : 1;
    }
  }
}

/**
 * What one cue does, as per-property control points.
 *
 * `state` is threaded through and mutated, so a cue starts wherever the previous one
 * on that layer left off — two `move dx: 100` cues end 200 to the right.
 */
function writesFor(cue: ResolvedCue, element: Element, state: TargetState): Write[] {
  const p = cue.params;
  const on = (prop: string, points: Point[]): Write => ({ element, prop, points });
  const pair = (prop: string, from: number, to: number, format: (n: number) => Value): Write =>
    on(prop, [
      { frac: 0, value: format(from) },
      { frac: 1, value: format(to) },
    ]);

  switch (cue.action) {
    case 'enter': {
      const [dx, dy] = offset(String(p.from ?? 'left'), num(p, 'distance', 240));
      const writes = [
        pair(X, state.x + dx, state.x, px),
        pair(Y, state.y + dy, state.y, px),
        pair(OPACITY, 0, 1, (n) => n),
      ];
      state.opacity = 1;
      return writes;
    }
    case 'exit': {
      const [dx, dy] = offset(String(p.to ?? 'right'), num(p, 'distance', 240));
      const writes = [
        pair(X, state.x, state.x + dx, px),
        pair(Y, state.y, state.y + dy, px),
        pair(OPACITY, state.opacity, 0, (n) => n),
      ];
      state.x += dx;
      state.y += dy;
      state.opacity = 0;
      return writes;
    }
    case 'move': {
      const toX = state.x + num(p, 'dx', 0);
      const toY = state.y + num(p, 'dy', 0);
      const writes = [pair(X, state.x, toX, px), pair(Y, state.y, toY, px)];
      state.x = toX;
      state.y = toY;
      return writes;
    }
    case 'scale': {
      const to = num(p, 'to', 1.2);
      const write = pair(S, state.scale, to, String);
      state.scale = to;
      return [write];
    }
    case 'turn': {
      const to = state.rotation + num(p, 'deg', 0);
      const write = pair(R, state.rotation, to, (n) => `${n}deg`);
      state.rotation = to;
      return [write];
    }
    case 'fade': {
      const to = num(p, 'to', 1);
      const write = pair(OPACITY, state.opacity, to, (n) => n);
      state.opacity = to;
      return [write];
    }
    case 'show':
      state.opacity = 1;
      return [pair(OPACITY, 1, 1, (n) => n)];
    case 'hide':
      state.opacity = 0;
      return [pair(OPACITY, 0, 0, (n) => n)];
    case 'bob': {
      const a = num(p, 'amount', 10);
      return [
        on(Y, [
          { frac: 0, value: px(state.y) },
          { frac: 0.25, value: px(state.y - a) },
          { frac: 0.5, value: px(state.y) },
          { frac: 0.75, value: px(state.y + a) },
          { frac: 1, value: px(state.y) },
        ]),
      ];
    }
    case 'shake': {
      const s = num(p, 'strength', 14);
      const xs: Point[] = [];
      const ys: Point[] = [];
      for (let i = 0; i <= 10; i += 1) {
        const decay = 1 - i / 10;
        xs.push({ frac: i / 10, value: px(state.x + (i % 2 ? s : -s) * decay) });
        ys.push({ frac: i / 10, value: px(state.y + (i % 3 ? -s : s) * 0.5 * decay) });
      }
      return [on(X, xs), on(Y, ys)];
    }
    case 'flash':
      return [
        on(OPACITY, [
          { frac: 0, value: 0 },
          { frac: 0.12, value: 1 },
          { frac: 1, value: 0 },
        ]),
      ];
    // Handled by `swapWrites`: a swap drives two sibling elements, not one.
    case 'swap':
      return [];
    default:
      return [];
  }
}

/**
 * Crossfade one of a layer's drawings out and another in.
 *
 * The only cue that changes *what is drawn* rather than transforming it, and the only
 * one touching two elements. Both halves are ordinary opacity writes, so a swap is
 * merged into its elements' tracks like anything else and stays seekable in both
 * directions — scrub back past it and the previous drawing returns on its own.
 */
function swapWrites(layer: Element, cue: ResolvedCue, state: TargetState): Write[] {
  const to = typeof cue.params.to === 'string' ? cue.params.to : '';
  if (!to || to === state.variant) return [];

  const incoming = layer.querySelector(`[data-variant="${CSS.escape(to)}"]`);
  if (!incoming) return [];
  const outgoing = layer.querySelector(`[data-variant="${CSS.escape(state.variant)}"]`);
  state.variant = to;

  const writes: Write[] = [
    {
      element: incoming,
      prop: OPACITY,
      points: [
        { frac: 0, value: 0 },
        { frac: 1, value: 1 },
      ],
    },
  ];
  if (outgoing) {
    writes.push({
      element: outgoing,
      prop: OPACITY,
      points: [
        { frac: 0, value: 1 },
        { frac: 1, value: 0 },
      ],
    });
  }
  return writes;
}

/** A control point on a merged track, in absolute story seconds. */
interface Stop {
  t: number;
  value: Value;
  ease: string;
}

/**
 * Compile every cue in a scene against its rendered DOM.
 *
 * Targets resolve to `[data-layer="<id>"]`, plus two reserved ones: `camera` (the
 * scene's transform group) and the full-frame flash overlay, which `flash` drives
 * whatever it was written against.
 */
export function compileScene(scope: HTMLElement, scene: ResolvedScene): CompiledCue[] {
  const states = new Map<string, TargetState>();
  const tracks = new Map<Element, Map<string, Stop[]>>();

  const sceneStart = scene.start;
  const sceneSpan = Math.max(0.001, scene.dur);

  for (const cue of scene.cues) {
    const selector =
      cue.action === 'flash'
        ? '[data-flash]'
        : cue.target === 'camera'
          ? '[data-camera]'
          : `[data-layer="${CSS.escape(cue.target)}"]`;

    const element = scope.querySelector<HTMLElement>(selector);
    if (!element) continue;

    const key = cue.action === 'flash' ? '__flash' : cue.target;
    let state = states.get(key);
    if (!state) {
      state = initialState(element);
      states.set(key, state);
    }

    if (cue.action === 'flash' && typeof cue.params.color === 'string') {
      element.style.setProperty('--flash-color', cue.params.color);
    }

    const writes =
      cue.action === 'swap' ? swapWrites(element, cue, state) : writesFor(cue, element, state);

    for (const write of writes) {
      let byProp = tracks.get(write.element);
      if (!byProp) {
        byProp = new Map();
        tracks.set(write.element, byProp);
      }
      let stops = byProp.get(write.prop);
      if (!stops) {
        // Seed the track with where the property already sits, so the stretch of
        // scene before the first cue holds still instead of snapping.
        stops = [{ t: sceneStart, value: restingValue(write.element, write.prop), ease: 'linear' }];
        byProp.set(write.prop, stops);
      }

      // In WAAPI a keyframe's easing governs the segment that *starts* at it, so the
      // cue's curve belongs on its own points. The stop before the cue is the flat
      // hold leading up to it and must stay linear, or the wait would visibly drift.
      const previous = stops[stops.length - 1];
      if (previous) previous.ease = 'linear';

      for (const point of write.points) {
        stops.push({
          t: cue.start + point.frac * cue.dur,
          value: point.value,
          ease: cue.ease,
        });
      }
    }
  }

  const compiled: CompiledCue[] = [];

  for (const [element, byProp] of tracks) {
    for (const [prop, stops] of byProp) {
      stops.sort((a, b) => a.t - b.t);
      // Hold the final value to the end of the scene.
      const last = stops[stops.length - 1]!;
      if (last.t < sceneStart + sceneSpan) {
        stops.push({ t: sceneStart + sceneSpan, value: last.value, ease: 'linear' });
      }

      const keyframes = stops.map((stop) => ({
        offset: Math.min(Math.max((stop.t - sceneStart) / sceneSpan, 0), 1),
        [prop]: stop.value,
        easing: stop.ease,
      })) as unknown as Keyframe[];

      const animation = element.animate(keyframes, {
        duration: sceneSpan * 1000,
        // `both` positions the element correctly before the track's first keyframe
        // and holds the last one after it. With one animation per property there is
        // no second writer for it to argue with.
        fill: 'both',
      });
      animation.pause();

      compiled.push({
        animation,
        start: sceneStart,
        end: sceneStart + sceneSpan,
        stops: stops.map((stop) => stop.t),
      });
    }
  }

  return compiled;
}

/** Position every compiled track for an absolute story time. */
export function seekCues(cues: CompiledCue[], time: number): void {
  for (const cue of cues) {
    const span = cue.end - cue.start;
    const local = Math.min(Math.max(time - cue.start, 0), span);
    const animation = cue.animation;
    // A finished animation can reject currentTime writes unless re-paused first.
    if (animation.playState === 'finished') animation.pause();
    animation.currentTime = local * 1000;
  }
}

/**
 * Snap every track forward to its next resting value — used for reduced motion and
 * still capture. Anything mid-move is shown already arrived, so the picture is the
 * one the cue was heading for without the travel.
 */
export function settleCues(cues: CompiledCue[], time: number): void {
  for (const cue of cues) {
    const settled = cue.stops.find((t) => t >= time) ?? cue.end;
    const span = cue.end - cue.start;
    const local = Math.min(Math.max(settled - cue.start, 0), span);
    const animation = cue.animation;
    if (animation.playState === 'finished') animation.pause();
    animation.currentTime = local * 1000;
  }
}

/** Drop every track's animation, releasing the elements it holds. */
export function disposeCues(cues: CompiledCue[]): void {
  for (const cue of cues) cue.animation.cancel();
}
