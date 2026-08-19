/**
 * Storyboard types.
 *
 * A story is one committable directory: `src/stories/<slug>/`, holding `story.ts`
 * and the story's own `art/`. `story.ts` holds narration, art (as SVG markup from
 * that story's art builders) and animation cues. It holds no timing in
 * milliseconds-since-page-load and no DOM code — the build resolves it into an
 * absolute timeline (see `src/lib/timing.ts`) and the runtime player replays that
 * timeline.
 *
 * Nothing here imports art. These types describe the *shape* a story must present
 * to the engine; the story supplies the values from art it owns.
 */

/**
 * The only part of a palette the engine touches.
 *
 * Palettes live in each story's own `art/palette.ts` and are far richer than this —
 * sky gradients, ink, rim light, floor tones. None of that concerns the engine, so
 * none of it is named here. A story's `Palette` satisfies this structurally, which
 * is what lets two stories hold completely different palettes with no shared union
 * to register in and no import from any art module.
 */
export interface ScenePalette {
  /** Free-form; surfaces as a `data-palette` attribute for styling hooks. */
  name: string;
  /** Full-frame colour wash that binds flat characters into the background. */
  tint: string;
  tintOpacity: number;
}

/** Named easing curves. Keep this list short so stories stay visually coherent. */
export type Ease = 'linear' | 'in' | 'out' | 'inOut' | 'soft' | 'snap' | 'anticipate';

export const EASINGS: Record<Ease, string> = {
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  soft: 'cubic-bezier(0.33, 0, 0.15, 1)',
  snap: 'cubic-bezier(0.16, 1, 0.3, 1)',
  anticipate: 'cubic-bezier(0.68, -0.4, 0.27, 1.4)',
};

export type Direction = 'left' | 'right' | 'top' | 'bottom';

/**
 * How long a cue runs.
 *
 * `'beat'` and `'scene'` are resolved at build time against the *actual* narration
 * length. This matters: when real TTS audio replaces the estimated timing, a cue
 * written as `dur: 'beat'` still spans exactly its beat instead of desyncing.
 */
export type Duration = number | 'beat' | 'scene';

/** Reserved cue target for the scene camera. Any other target is a layer id. */
export const CAMERA = 'camera';

interface CueBase {
  /** Layer id, or `'camera'`. Must exist in the scene. */
  target: string;
  /** Seconds after the beat starts. Default 0. */
  at?: number;
  /** Default `'beat'` for sustained actions, or a sensible short default per action. */
  dur?: Duration;
  ease?: Ease;
}

export type Cue =
  /** Slide + fade in from offscreen. */
  | (CueBase & { do: 'enter'; from?: Direction; distance?: number })
  /** Slide + fade out offscreen. */
  | (CueBase & { do: 'exit'; to?: Direction; distance?: number })
  /** Translate by a delta, in viewBox units. */
  | (CueBase & { do: 'move'; dx?: number; dy?: number })
  /** Scale to a factor, relative to the layer's authored scale. */
  | (CueBase & { do: 'scale'; to: number })
  /** Animate opacity to a value. */
  | (CueBase & { do: 'fade'; to: number })
  /** Camera-shake / impact tremor. */
  | (CueBase & { do: 'shake'; strength?: number })
  /** Full-frame white flash. Target is ignored but kept for uniformity. */
  | (CueBase & { do: 'flash'; color?: string })
  /** Rotate by degrees. */
  | (CueBase & { do: 'turn'; deg: number })
  /** Sustained vertical bob — a subtle "alive" motion for a held shot. */
  | (CueBase & { do: 'bob'; amount?: number })
  /** Reveal a layer that starts hidden, with no movement. */
  | (CueBase & { do: 'show' })
  /** Hide a layer, with no movement. */
  | (CueBase & { do: 'hide' })
  /**
   * Change *what a layer is drawing* — the only cue that alters the picture rather
   * than transforming it. `to` names one of the layer's `variants`, or `'base'` for
   * its original `svg`.
   *
   * The engine attaches no meaning to the name. `'surprised'`, `'shattered'` and
   * `'lit'` are all just keys the story chose, so a reacting face and a breaking
   * plate are the same operation with different art behind them.
   */
  | (CueBase & { do: 'swap'; to: string });

export type CueAction = Cue['do'];

/**
 * Reserved `swap` target naming a layer's original `svg`.
 *
 * Reserved rather than implicit so that returning to the starting drawing reads the
 * same as any other swap. A layer may not name a variant this.
 */
export const BASE_VARIANT = 'base';

/** A drawable element placed in the scene. */
export interface Layer {
  /** Stable id, targetable by cues. Unique within its scene. */
  id: string;
  /** SVG markup, normally from one of this story's own art builders. */
  svg: string;
  /**
   * Alternate drawings for this layer, keyed by names this story invents — an
   * expression, a damage state, a lit sign. All are rendered into the scene and
   * held at zero opacity until a `swap` cue brings one forward, so switching costs
   * nothing at runtime and stays seekable in both directions.
   *
   * Keep these to genuine changes of state. A variant that differs only by position
   * or size is a `move` or `scale` cue instead.
   */
  variants?: Record<string, string>;
  /** Position of the layer origin in viewBox units (1600x900). Default 0,0. */
  x?: number;
  y?: number;
  scale?: number;
  /** Mirror horizontally — flips a character to face the other way. */
  flip?: boolean;
  /** Starting opacity. Set 0 for a layer that a cue will `enter`/`show`. */
  opacity?: number;
  /** Ambient loop classes from `src/styles/anime.css`, e.g. `'k-breathe k-sway'`. */
  ambient?: string;
  /** Paint order. Higher draws in front. Default = array index. */
  z?: number;
}

/**
 * One or two sentences of narration — the atomic unit of both caption and audio.
 * One MP3 is generated per beat, so beat boundaries are exact by construction and
 * no manual timing offsets are ever maintained by hand.
 */
export interface Beat {
  /** Narration line. Also the on-screen caption. */
  text: string;
  /** Animations fired relative to this beat's start. */
  cues?: Cue[];
  /** Extra silent seconds after the narration ends — room to breathe. Default 0. */
  hold?: number;
}

export type Transition = 'cut' | 'fade' | 'wipe' | 'iris' | 'flash';

export interface Scene {
  /** Stable id, unique within the story. Used in audio filenames. */
  id: string;
  /** This story's own palette object, from `./art/palette.ts`. */
  palette: ScenePalette;
  /** Backdrop SVG markup, from this story's `art/backdrops.ts`. */
  backdrop: string;
  layers?: Layer[];
  /** Foreground effect SVG markup, from this story's `art/fx.ts`. Drawn above layers. */
  fx?: string[];
  beats: Beat[];
  /** How this scene arrives from the previous one. Default `'fade'`. */
  transition?: Transition;
  /** Optional scene-specific ambient audio loop (e.g. '/audio/ambient/rain.mp3'). */
  ambientAudio?: string;
}

export interface Story {
  slug: string;
  title: string;
  logline: string;
  credit?: string;
  /** Optional story-wide ambient sound bed / background loop. */
  ambientAudio?: string;
  /** Voice hints consumed by `scripts/narrate.mjs`. */
  voice?: {
    /** Provider voice id. Falls back to the driver's default. */
    id?: string;
    /** 0..1 — higher is more consistent, lower is more expressive. */
    stability?: number;
    /** Playback rate hint for providers that support it. */
    speed?: number;
  };
  scenes: Scene[];
}

/** Identity helper: gives full type inference and errors inside story files. */
export function defineStory(story: Story): Story {
  return story;
}

/**
 * Words per second for a narrator reading at an unhurried, storybook pace.
 *
 * Calibrated against generated audio rather than guessed: fitted to the measured
 * per-beat durations of the default local voice at the `local` driver's default 0.9
 * speed. The original 2.6 was a third too slow, which made every story authored to a
 * word budget come out markedly shorter than intended once it had a real voice.
 *
 * This is the words-only rate; the punctuation charges below are on top, and the
 * combined figure works out at roughly 3.5 words per second — which is the number in
 * the skill's pacing budget.
 */
export const WORDS_PER_SECOND = 4.1;

/**
 * Estimate how long a narration line takes to read aloud.
 *
 * Used only when no generated audio exists for the beat. Punctuation adds pause
 * time, because a narrator breathes at commas and stops at full stops.
 */
export function estimateBeatDuration(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const sentenceStops = (text.match(/[.!?]/g) ?? []).length;
  const softPauses = (text.match(/[,;:—]/g) ?? []).length;
  const seconds = words / WORDS_PER_SECOND + sentenceStops * 0.35 + softPauses * 0.18;
  return Math.max(1.2, Math.round(seconds * 100) / 100);
}

/** Stable key for a beat's audio file: `<sceneId>.<beatIndex>`. */
export function beatKey(sceneId: string, beatIndex: number): string {
  return `${sceneId}.${beatIndex}`;
}
