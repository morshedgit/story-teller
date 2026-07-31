/**
 * Cue compiler.
 *
 * Turns each `ResolvedCue` into a paused Web Animations API `Animation`. Nothing
 * here ever calls `play()` — the player owns the clock and writes `currentTime`
 * on every frame.
 *
 * That is the key decision in the whole engine. If cues were played normally they
 * would drift from the narration audio, and seeking backwards would be impossible.
 * Because each animation is paused and positioned explicitly, the visual state at
 * time *t* is a pure function of *t*: scrubbing, pausing and jumping between scenes
 * all fall out for free, and the picture can never desync from the voice.
 *
 * Cues write to `--cue-x/y/s/r` rather than to `transform` directly. Those are
 * registered as typed custom properties in `anime.css` (`@property`), without which
 * the browser would step between keyframes instead of interpolating them. The layer
 * composes all four into one transform in CSS, so position, scale and rotation cues
 * can overlap on the same layer without overwriting each other.
 */

import type { ResolvedCue } from '../lib/timing';

export interface CompiledCue {
  animation: Animation;
  start: number;
  end: number;
}

type Params = Record<string, number | string | boolean>;

const num = (params: Params, key: string, fallback: number): number =>
  typeof params[key] === 'number' ? (params[key] as number) : fallback;

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
}

function keyframesFor(cue: ResolvedCue, state: TargetState): Keyframe[] | null {
  const p = cue.params;

  switch (cue.action) {
    case 'enter': {
      const [dx, dy] = offset(String(p.from ?? 'left'), num(p, 'distance', 240));
      const from = { x: state.x + dx, y: state.y + dy };
      const to = { x: state.x, y: state.y };
      state.opacity = 1;
      return [
        { offset: 0, '--cue-x': `${from.x}px`, '--cue-y': `${from.y}px`, opacity: 0 },
        { offset: 1, '--cue-x': `${to.x}px`, '--cue-y': `${to.y}px`, opacity: 1 },
      ] as unknown as Keyframe[];
    }
    case 'exit': {
      const [dx, dy] = offset(String(p.to ?? 'right'), num(p, 'distance', 240));
      const from = { x: state.x, y: state.y };
      state.x += dx;
      state.y += dy;
      state.opacity = 0;
      return [
        { offset: 0, '--cue-x': `${from.x}px`, '--cue-y': `${from.y}px`, opacity: 1 },
        { offset: 1, '--cue-x': `${state.x}px`, '--cue-y': `${state.y}px`, opacity: 0 },
      ] as unknown as Keyframe[];
    }
    case 'move': {
      const from = { x: state.x, y: state.y };
      state.x += num(p, 'dx', 0);
      state.y += num(p, 'dy', 0);
      return [
        { offset: 0, '--cue-x': `${from.x}px`, '--cue-y': `${from.y}px` },
        { offset: 1, '--cue-x': `${state.x}px`, '--cue-y': `${state.y}px` },
      ] as unknown as Keyframe[];
    }
    case 'scale': {
      const from = state.scale;
      state.scale = num(p, 'to', 1.2);
      return [
        { offset: 0, '--cue-s': `${from}` },
        { offset: 1, '--cue-s': `${state.scale}` },
      ] as unknown as Keyframe[];
    }
    case 'turn': {
      const from = state.rotation;
      state.rotation += num(p, 'deg', 0);
      return [
        { offset: 0, '--cue-r': `${from}deg` },
        { offset: 1, '--cue-r': `${state.rotation}deg` },
      ] as unknown as Keyframe[];
    }
    case 'fade': {
      const from = state.opacity;
      state.opacity = num(p, 'to', 1);
      return [
        { offset: 0, opacity: from },
        { offset: 1, opacity: state.opacity },
      ];
    }
    case 'show':
      state.opacity = 1;
      return [
        { offset: 0, opacity: 1 },
        { offset: 1, opacity: 1 },
      ];
    case 'hide':
      state.opacity = 0;
      return [
        { offset: 0, opacity: 0 },
        { offset: 1, opacity: 0 },
      ];
    case 'bob': {
      const amount = num(p, 'amount', 10);
      return [
        { offset: 0, '--cue-y': `${state.y}px` },
        { offset: 0.25, '--cue-y': `${state.y - amount}px` },
        { offset: 0.5, '--cue-y': `${state.y}px` },
        { offset: 0.75, '--cue-y': `${state.y + amount}px` },
        { offset: 1, '--cue-y': `${state.y}px` },
      ] as unknown as Keyframe[];
    }
    case 'shake': {
      const s = num(p, 'strength', 14);
      const steps: Keyframe[] = [];
      for (let i = 0; i <= 10; i += 1) {
        const decay = 1 - i / 10;
        steps.push({
          offset: i / 10,
          '--cue-x': `${state.x + (i % 2 ? s : -s) * decay}px`,
          '--cue-y': `${state.y + (i % 3 ? -s : s) * 0.5 * decay}px`,
        } as unknown as Keyframe);
      }
      return steps;
    }
    case 'flash':
      return [
        { offset: 0, opacity: 0 },
        { offset: 0.12, opacity: 1 },
        { offset: 1, opacity: 0 },
      ];
    default:
      return null;
  }
}

function initialState(element: HTMLElement): TargetState {
  const opacity = Number.parseFloat(element.style.opacity || '1');
  return { x: 0, y: 0, scale: 1, rotation: 0, opacity: Number.isFinite(opacity) ? opacity : 1 };
}

/**
 * Compile every cue in a scene against its rendered DOM.
 *
 * Targets resolve to `[data-layer="<id>"]`, plus two reserved ones: `camera` (the
 * scene's transform group) and the full-frame flash overlay, which `flash` drives
 * whatever it was written against.
 */
export function compileScene(scope: HTMLElement, cues: ResolvedCue[]): CompiledCue[] {
  const compiled: CompiledCue[] = [];
  const states = new Map<string, TargetState>();

  for (const cue of cues) {
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

    const keyframes = keyframesFor(cue, state);
    if (!keyframes) continue;

    if (cue.action === 'flash' && typeof cue.params.color === 'string') {
      element.style.setProperty('--flash-color', cue.params.color);
    }

    const animation = element.animate(keyframes, {
      duration: Math.max(1, cue.dur * 1000),
      easing: cue.ease,
      // Both directions: `backwards` positions the element correctly before the cue
      // starts, `forwards` holds the end state after it finishes. Without `both`,
      // seeking past a cue would snap the element back to its authored position.
      fill: 'both',
    });
    animation.pause();

    compiled.push({ animation, start: cue.start, end: cue.start + cue.dur });
  }

  return compiled;
}

/** Position every compiled cue for an absolute story time. */
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

/** Collapse every cue to its end state — used for reduced motion and still capture. */
export function settleCues(cues: CompiledCue[], time: number): void {
  for (const cue of cues) {
    const animation = cue.animation;
    if (animation.playState === 'finished') animation.pause();
    animation.currentTime = time >= cue.start ? (cue.end - cue.start) * 1000 : 0;
  }
}

/** Drop every cue's animation, releasing the elements it holds. */
export function disposeCues(cues: CompiledCue[]): void {
  for (const cue of cues) cue.animation.cancel();
}
