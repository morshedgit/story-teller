/**
 * The story player.
 *
 * One clock drives everything. `time` is absolute seconds from the start of the
 * story, and every frame the player derives the current scene, the current beat and
 * the position of every cue from that single number. Nothing accumulates state that
 * could drift.
 *
 * Where the clock comes from depends on whether narration audio exists:
 *
 *  - **With audio** the playing `<audio>` element *is* the clock. Story time is
 *    `beat.start + audio.currentTime`, so the picture is pinned to the voice and
 *    cannot slide out of sync no matter how badly a frame is delayed.
 *  - **Without audio** the clock advances on `requestAnimationFrame` deltas against
 *    the estimated beat length.
 *
 * Both paths run the exact same rendering code, which is why a story is watchable
 * before any voice has been generated and stays correct once it has.
 */

import { compileScene, disposeCues, seekCues, settleCues, type CompiledCue } from './animate';
import type { ResolvedScene, ResolvedStory } from '../lib/timing';

interface Elements {
  root: HTMLElement;
  stage: HTMLElement;
  audio: HTMLAudioElement;
  ambientAudio: HTMLAudioElement | null;
  caption: HTMLElement;
  playButton: HTMLButtonElement;
  scrub: HTMLInputElement;
  elapsed: HTMLElement;
  total: HTMLElement;
  sceneLabel: HTMLElement;
  muteButton: HTMLButtonElement;
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

function formatClock(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export class StoryPlayer {
  private readonly story: ResolvedStory;
  private readonly el: Elements;
  private readonly sceneNodes: HTMLElement[];
  private readonly reducedMotion: boolean;

  private time = 0;
  private playing = false;
  private rafId = 0;
  private lastFrame = 0;

  private activeScene = -1;
  private activeBeat = -1;
  private compiled: CompiledCue[] = [];
  /** Audio element for the *next* beat, warmed up so beat changes do not gap. */
  private prefetch: HTMLAudioElement | null = null;

  constructor(story: ResolvedStory, el: Elements) {
    this.story = story;
    this.el = el;
    this.sceneNodes = Array.from(el.stage.querySelectorAll<HTMLElement>('[data-scene]'));
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    el.total.textContent = formatClock(story.duration);
    el.scrub.max = String(Math.ceil(story.duration));

    this.bind();
    this.activateScene(0);
    this.render(0);
  }

  // --- transport ------------------------------------------------------------

  play(): void {
    if (this.playing) return;
    this.playing = true;
    this.lastFrame = performance.now();
    this.el.root.dataset.paused = 'false';
    this.el.playButton.setAttribute('aria-label', 'Pause');
    this.el.playButton.dataset.state = 'playing';
    this.startBeatAudio(this.beatIndexAt(this.time), true);
    this.syncAmbientAudio(this.sceneIndexAt(this.time), true);
    this.rafId = requestAnimationFrame(this.frame);
  }

  pause(): void {
    if (!this.playing) return;
    this.playing = false;
    this.el.root.dataset.paused = 'true';
    this.el.playButton.setAttribute('aria-label', 'Play');
    this.el.playButton.dataset.state = 'paused';
    this.el.audio.pause();
    this.el.ambientAudio?.pause();
    cancelAnimationFrame(this.rafId);
  }

  toggle(): void {
    if (this.playing) this.pause();
    else this.play();
  }

  /** Jump to an absolute story time and re-sync audio to it. */
  seek(time: number): void {
    this.time = clamp(time, 0, this.story.duration);
    const beat = this.beatIndexAt(this.time);
    this.startBeatAudio(beat, this.playing);
    this.syncAmbientAudio(this.sceneIndexAt(this.time), this.playing);
    this.render(this.time);
  }

  jumpScene(delta: number): void {
    const current = this.sceneIndexAt(this.time);
    const target = clamp(current + delta, 0, this.story.scenes.length - 1);
    this.seek(this.story.scenes[target]!.start + 0.001);
  }

  restart(): void {
    this.seek(0);
    this.play();
  }

  // --- clock ----------------------------------------------------------------

  private readonly frame = (now: number): void => {
    if (!this.playing) return;

    const beat = this.currentBeat();
    const audio = this.el.audio;
    const audioIsClock = beat?.audio && !audio.paused && audio.readyState >= 2 && Number.isFinite(audio.duration);

    if (audioIsClock && beat) {
      this.time = beat.start + audio.currentTime;
    } else {
      this.time += (now - this.lastFrame) / 1000;
    }
    this.lastFrame = now;

    // Dynamic ambient audio ducking: duck volume when voiceover is actively speaking
    const ambient = this.el.ambientAudio;
    if (ambient && !ambient.paused && !ambient.muted) {
      const isSpeaking = audioIsClock && !audio.paused && !audio.ended;
      const targetVol = isSpeaking ? 0.22 : 0.72;
      ambient.volume += (targetVol - ambient.volume) * 0.1;
    }

    if (this.time >= this.story.duration) {
      this.time = this.story.duration;
      this.render(this.time);
      this.pause();
      this.el.playButton.dataset.state = 'ended';
      this.el.playButton.setAttribute('aria-label', 'Replay');
      return;
    }

    this.render(this.time);
    this.rafId = requestAnimationFrame(this.frame);
  };

  // --- rendering ------------------------------------------------------------

  private render(time: number): void {
    const sceneIndex = this.sceneIndexAt(time);
    if (sceneIndex !== this.activeScene) this.activateScene(sceneIndex);

    if (this.reducedMotion) settleCues(this.compiled, time);
    else seekCues(this.compiled, time);

    const beatIndex = this.beatIndexAt(time);
    if (beatIndex !== this.activeBeat) {
      this.activeBeat = beatIndex;
      const beat = this.beatAt(beatIndex);
      this.el.caption.textContent = beat?.text ?? '';
      if (this.playing) this.startBeatAudio(beatIndex, true);
    }

    this.el.elapsed.textContent = formatClock(time);
    this.el.scrub.value = String(Math.round(time));
    this.el.scrub.setAttribute('aria-valuetext', `${formatClock(time)} of ${formatClock(this.story.duration)}`);
    const scene = this.story.scenes[sceneIndex]!;
    this.el.sceneLabel.textContent = `Scene ${sceneIndex + 1} / ${this.story.scenes.length}`;
    this.el.root.style.setProperty('--progress', `${(time / this.story.duration) * 100}%`);
    this.el.stage.dataset.palette = scene.palette;
  }

  private activateScene(index: number): void {
    disposeCues(this.compiled);
    this.compiled = [];

    // Visibility is driven by `data-active` + CSS, not the `hidden` property:
    // `hidden` is an HTMLElement IDL attribute and these scene groups are SVG,
    // so assigning it would silently set an expando and show every scene at once.
    this.sceneNodes.forEach((node, i) => {
      node.dataset.active = String(i === index);
    });

    this.activeScene = index;
    const node = this.sceneNodes[index];
    const scene = this.story.scenes[index];
    if (!node || !scene) return;

    // Compile only the scene on screen. Compiling all fifteen scenes up front would
    // create thousands of animations, most of them for elements nobody is looking at.
    this.compiled = compileScene(node, scene);
    node.dataset.transition = scene.transition;
    this.syncAmbientAudio(index, this.playing);
  }

  // --- audio ----------------------------------------------------------------

  private syncAmbientAudio(sceneIndex: number, shouldPlay: boolean): void {
    const ambient = this.el.ambientAudio;
    if (!ambient) return;

    const scene = this.story.scenes[sceneIndex];
    const src = scene?.ambientAudio ?? this.story.ambientAudio ?? null;

    if (!src) {
      ambient.pause();
      ambient.removeAttribute('src');
      return;
    }

    const url = new URL(src, location.href).href;
    if (ambient.src !== url) {
      ambient.src = src;
      ambient.load();
    }

    if (shouldPlay && !ambient.muted) {
      void ambient.play().catch(() => undefined);
    }
  }

  private startBeatAudio(beatIndex: number, shouldPlay: boolean): void {
    const beat = this.beatAt(beatIndex);
    const audio = this.el.audio;

    if (!beat?.audio) {
      audio.pause();
      audio.removeAttribute('src');
      return;
    }

    const url = new URL(beat.audio, location.href).href;
    const offsetIntoBeat = clamp(this.time - beat.start, 0, Math.max(0, beat.narrationDur));

    if (audio.src !== url) {
      audio.src = beat.audio;
      audio.load();
    }

    const applyOffset = (): void => {
      if (Math.abs(audio.currentTime - offsetIntoBeat) > 0.12) audio.currentTime = offsetIntoBeat;
    };
    if (audio.readyState >= 1) applyOffset();
    else audio.addEventListener('loadedmetadata', applyOffset, { once: true });

    if (shouldPlay) {
      // Autoplay can be refused before a user gesture; falling back to the rAF clock
      // keeps the story playing silently rather than freezing on the first frame.
      void audio.play().catch(() => undefined);
    }

    const next = this.beatAt(beatIndex + 1);
    if (next?.audio) {
      if (!this.prefetch) this.prefetch = new Audio();
      if (this.prefetch.src !== new URL(next.audio, location.href).href) {
        this.prefetch.preload = 'auto';
        this.prefetch.src = next.audio;
      }
    }
  }

  // --- lookups --------------------------------------------------------------

  private sceneIndexAt(time: number): number {
    const scenes = this.story.scenes;
    for (let i = scenes.length - 1; i >= 0; i -= 1) {
      if (time >= scenes[i]!.start) return i;
    }
    return 0;
  }

  private beatIndexAt(time: number): number {
    let index = 0;
    for (const scene of this.story.scenes) {
      for (const beat of scene.beats) {
        if (time < beat.start + beat.dur) return index;
        index += 1;
      }
    }
    return Math.max(0, index - 1);
  }

  private beatAt(index: number): ResolvedStory['scenes'][number]['beats'][number] | null {
    let i = 0;
    for (const scene of this.story.scenes) {
      for (const beat of scene.beats) {
        if (i === index) return beat;
        i += 1;
      }
    }
    return null;
  }

  private currentBeat(): ResolvedStory['scenes'][number]['beats'][number] | null {
    return this.beatAt(this.activeBeat);
  }

  // --- visual QA hooks ------------------------------------------------------

  /**
   * Park the story mid-scene without playing. Used by `scripts/shoot.mjs` to grab a
   * representative still of every scene — `fraction` picks how far into the scene to
   * land, so entrance cues have resolved but exits have not started.
   */
  previewScene(index: number, fraction = 0.55): void {
    const scene: ResolvedScene | undefined = this.story.scenes[index];
    if (!scene) return;
    this.pause();
    this.time = scene.start + scene.dur * fraction;
    this.render(this.time);
    // Stills should show settled cues rather than a mid-transition smear.
    settleCues(this.compiled, this.time);
  }

  // --- wiring ---------------------------------------------------------------

  private bind(): void {
    const { playButton, scrub, muteButton, audio, root } = this.el;

    playButton.addEventListener('click', () => {
      if (this.time >= this.story.duration) this.restart();
      else this.toggle();
    });

    scrub.addEventListener('input', () => {
      const wasPlaying = this.playing;
      this.pause();
      this.seek(Number(scrub.value));
      if (wasPlaying) this.play();
    });

    muteButton.addEventListener('click', () => {
      audio.muted = !audio.muted;
      if (this.el.ambientAudio) this.el.ambientAudio.muted = audio.muted;
      muteButton.dataset.state = audio.muted ? 'muted' : 'on';
      muteButton.setAttribute('aria-label', audio.muted ? 'Unmute narration' : 'Mute narration');
    });

    root.querySelector('[data-action="prev"]')?.addEventListener('click', () => this.jumpScene(-1));
    root.querySelector('[data-action="next"]')?.addEventListener('click', () => this.jumpScene(1));
    root.querySelector('[data-action="restart"]')?.addEventListener('click', () => this.restart());

    // A beat can end before the hold does, so ending audio must not advance the
    // story on its own — the clock keeps counting and crosses the boundary itself.
    audio.addEventListener('ended', () => {
      this.lastFrame = performance.now();
    });

    root.addEventListener('keydown', (event) => {
      const key = (event as KeyboardEvent).key;
      if (key === ' ' || key === 'k') {
        event.preventDefault();
        this.toggle();
      } else if (key === 'ArrowRight') {
        event.preventDefault();
        this.seek(this.time + 5);
      } else if (key === 'ArrowLeft') {
        event.preventDefault();
        this.seek(this.time - 5);
      } else if (key === 'n') {
        this.jumpScene(1);
      } else if (key === 'p') {
        this.jumpScene(-1);
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pause();
    });
  }
}

declare global {
  interface Window {
    __story?: ResolvedStory;
    __player?: StoryPlayer;
  }
}

export function mountPlayer(story: ResolvedStory): StoryPlayer | null {
  const root = document.querySelector<HTMLElement>('[data-player]');
  if (!root) return null;

  const pick = <T extends HTMLElement>(selector: string): T => root.querySelector<T>(selector)!;

  const player = new StoryPlayer(story, {
    root,
    stage: pick('[data-stage]'),
    audio: pick<HTMLAudioElement>('[data-audio]'),
    ambientAudio: root.querySelector<HTMLAudioElement>('[data-ambient]'),
    caption: pick('[data-caption]'),
    playButton: pick<HTMLButtonElement>('[data-action="play"]'),
    scrub: pick<HTMLInputElement>('[data-scrub]'),
    elapsed: pick('[data-elapsed]'),
    total: pick('[data-total]'),
    sceneLabel: pick('[data-scene-label]'),
    muteButton: pick<HTMLButtonElement>('[data-action="mute"]'),
  });

  window.__story = story;
  window.__player = player;

  // `?still=1` is the screenshot mode used by scripts/shoot.mjs.
  if (!new URLSearchParams(location.search).has('still')) {
    root.dataset.paused = 'true';
  }

  return player;
}
