/**
 * Build-time timeline resolution.
 *
 * Turns an authored `Story` (relative, human-friendly, audio-agnostic) into a
 * `ResolvedStory` with absolute seconds for every beat and every cue. The runtime
 * player consumes only the resolved form, so it contains no authoring concepts and
 * never has to guess a duration.
 *
 * Durations come from the generated audio manifest when it exists, and from
 * `estimateBeatDuration()` when it does not. Everything downstream is identical
 * either way — that is what lets the site play correctly before any voice has been
 * generated, and stay correct afterwards.
 */

import {
  EASINGS,
  beatKey,
  estimateBeatDuration,
  type Cue,
  type CueAction,
  type Duration,
  type Story,
  type Transition,
} from './story';

export interface ManifestEntry {
  file: string;
  duration: number;
  hash: string;
}

export interface AudioManifest {
  slug: string;
  generatedAt: string;
  provider: string;
  voiceId: string;
  beats: Record<string, ManifestEntry>;
}

export interface ResolvedCue {
  target: string;
  action: CueAction;
  /** Absolute seconds from the start of the story. */
  start: number;
  dur: number;
  ease: string;
  params: Record<string, number | string | boolean>;
}

export interface ResolvedBeat {
  index: number;
  text: string;
  start: number;
  /** Narration length plus any authored hold. */
  dur: number;
  narrationDur: number;
  /** Public URL of the beat's audio, or null when none has been generated. */
  audio: string | null;
}

export interface ResolvedScene {
  id: string;
  index: number;
  palette: string;
  transition: Transition;
  start: number;
  dur: number;
  beats: ResolvedBeat[];
  cues: ResolvedCue[];
}

export interface ResolvedStory {
  slug: string;
  title: string;
  logline: string;
  credit: string | null;
  duration: number;
  hasAudio: boolean;
  scenes: ResolvedScene[];
}

/** Fallback cue lengths, in seconds, or a symbolic span. */
const DEFAULT_DURATION: Record<CueAction, Duration> = {
  enter: 0.9,
  exit: 0.9,
  move: 'beat',
  scale: 'beat',
  fade: 0.6,
  shake: 0.5,
  flash: 0.35,
  turn: 0.6,
  bob: 'beat',
  show: 0.001,
  hide: 0.001,
};

const DEFAULT_EASE: Record<CueAction, keyof typeof EASINGS> = {
  enter: 'snap',
  exit: 'in',
  move: 'soft',
  scale: 'soft',
  fade: 'inOut',
  shake: 'out',
  flash: 'out',
  turn: 'inOut',
  bob: 'inOut',
  show: 'linear',
  hide: 'linear',
};

/** Everything on a cue that is not timing metadata becomes an animation parameter. */
const TIMING_KEYS = new Set(['target', 'do', 'at', 'dur', 'ease']);

function cueParams(cue: Cue): Record<string, number | string | boolean> {
  const params: Record<string, number | string | boolean> = {};
  for (const [key, value] of Object.entries(cue)) {
    if (TIMING_KEYS.has(key)) continue;
    if (value === undefined) continue;
    params[key] = value as number | string | boolean;
  }
  return params;
}

function resolveDuration(
  spec: Duration,
  offsetInBeat: number,
  beatDur: number,
  offsetInScene: number,
  sceneDur: number,
): number {
  if (spec === 'beat') return Math.max(0.05, beatDur - offsetInBeat);
  if (spec === 'scene') return Math.max(0.05, sceneDur - offsetInScene);
  return Math.max(0.001, spec);
}

/**
 * Validate that every cue points at something that exists.
 *
 * This runs during `astro build`, so a typo'd layer id fails the build with a
 * pointed message instead of silently animating nothing in the browser.
 */
function assertTargetsExist(story: Story): void {
  for (const scene of story.scenes) {
    const ids = new Set<string>(['camera', ...(scene.layers ?? []).map((l) => l.id)]);
    scene.beats.forEach((beat, beatIndex) => {
      for (const cue of beat.cues ?? []) {
        if (!ids.has(cue.target)) {
          const known = [...ids].join(', ');
          throw new Error(
            `[${story.slug}] scene "${scene.id}" beat ${beatIndex}: cue targets "${cue.target}", ` +
              `which is not a layer in this scene. Known targets: ${known}`,
          );
        }
      }
    });
  }

  const sceneIds = new Set<string>();
  for (const scene of story.scenes) {
    if (sceneIds.has(scene.id)) {
      throw new Error(`[${story.slug}] duplicate scene id "${scene.id}"`);
    }
    sceneIds.add(scene.id);

    const layerIds = new Set<string>();
    for (const layer of scene.layers ?? []) {
      if (layerIds.has(layer.id)) {
        throw new Error(`[${story.slug}] scene "${scene.id}" has duplicate layer id "${layer.id}"`);
      }
      layerIds.add(layer.id);
    }
  }
}

export function resolveStory(story: Story, manifest: AudioManifest | null): ResolvedStory {
  assertTargetsExist(story);

  const scenes: ResolvedScene[] = [];
  let cursor = 0;
  let hasAudio = false;

  story.scenes.forEach((scene, sceneIndex) => {
    const sceneStart = cursor;

    // Pass 1: lay out beats, so cue spans can reference real beat and scene lengths.
    const beats: ResolvedBeat[] = [];
    let beatCursor = sceneStart;
    scene.beats.forEach((beat, beatIndex) => {
      const entry = manifest?.beats[beatKey(scene.id, beatIndex)];
      const narrationDur = entry?.duration ?? estimateBeatDuration(beat.text);
      if (entry) hasAudio = true;
      const dur = narrationDur + (beat.hold ?? 0);
      beats.push({
        index: beatIndex,
        text: beat.text,
        start: beatCursor,
        dur,
        narrationDur,
        audio: entry ? `/audio/${story.slug}/${entry.file}` : null,
      });
      beatCursor += dur;
    });

    const sceneDur = beatCursor - sceneStart;

    // Pass 2: place cues on the absolute timeline.
    const cues: ResolvedCue[] = [];
    scene.beats.forEach((beat, beatIndex) => {
      const resolvedBeat = beats[beatIndex]!;
      for (const cue of beat.cues ?? []) {
        const at = cue.at ?? 0;
        const start = resolvedBeat.start + at;
        const dur = resolveDuration(
          cue.dur ?? DEFAULT_DURATION[cue.do],
          at,
          resolvedBeat.dur,
          start - sceneStart,
          sceneDur,
        );
        cues.push({
          target: cue.target,
          action: cue.do,
          start,
          dur,
          ease: EASINGS[cue.ease ?? DEFAULT_EASE[cue.do]],
          params: cueParams(cue),
        });
      }
    });

    // Stable ordering keeps the player's "apply everything up to time t" seek logic
    // deterministic when two cues on the same target start at the same instant.
    cues.sort((a, b) => a.start - b.start);

    scenes.push({
      id: scene.id,
      index: sceneIndex,
      palette: scene.palette,
      transition: scene.transition ?? 'fade',
      start: sceneStart,
      dur: sceneDur,
      beats,
      cues,
    });

    cursor = beatCursor;
  });

  return {
    slug: story.slug,
    title: story.title,
    logline: story.logline,
    credit: story.credit ?? null,
    duration: cursor,
    hasAudio,
    scenes,
  };
}

/** `312.4` -> `"5:12"`. */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
