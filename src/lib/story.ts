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
  | (CueBase & { do: 'hide' });

export type CueAction = Cue['do'];

/** A drawable element placed in the scene. */
export interface Layer {
  /** Stable id, targetable by cues. Unique within its scene. */
  id: string;
  /** SVG markup, normally from one of this story's own art builders. */
  svg: string;
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
}

export interface Story {
  slug: string;
  title: string;
  logline: string;
  credit?: string;
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

/** Words per second for a narrator reading at an unhurried, storybook pace. */
export const WORDS_PER_SECOND = 2.6;

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
