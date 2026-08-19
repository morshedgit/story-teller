#!/usr/bin/env node
/**
 * Sound-effect synthesis — prototype.
 *
 *   node scripts/sfx-lab.mjs [outDir]
 *
 * Recorded foley cannot be obtained here: freesound, pixabay, archive.org and
 * opengameart are all outside this environment's network allowlist, and so is
 * huggingface, which rules out the CPU-capable text-to-sound models too. What is
 * reachable is npm — the same wall that pushed narration onto a local voice.
 *
 * So effects are *synthesised*, the same way narration is generated rather than
 * downloaded. The building blocks are the physical ones: a struck object rings at a
 * few inharmonic frequencies that decay at different rates, and breaking scatters
 * that ring into many smaller, briefer copies of itself.
 *
 * Everything is written offline to MP3 through the encoder `narrate.mjs` already
 * uses, so a finished effect is a committed file exactly like a narration beat, and
 * the runtime never synthesises anything.
 *
 * The random number generator is seeded, so regenerating an effect is byte-identical
 * and the content hashing that keeps narration stable would work here unchanged.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Mp3Encoder } from '@breezystack/lamejs';

const RATE = 44100;

/** Deterministic PRNG (mulberry32) — committed audio must not change per run. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const samples = (sec) => Math.max(1, Math.round(sec * RATE));
const canvas = (sec) => new Float32Array(samples(sec));

/**
 * One resonant mode of a struck object: a sinusoid decaying exponentially.
 *
 * Real ceramic rings at several frequencies at once, and they are *inharmonic* —
 * not multiples of one pitch. That inharmonicity is most of what separates "a plate"
 * from "a bell", so the callers below pick ratios deliberately off the harmonic
 * series.
 */
function mode(buf, atSec, freq, amp, tauSec, phase = 0) {
  const start = samples(atSec);
  const decay = Math.exp(-1 / (tauSec * RATE));
  let envelope = amp;
  for (let i = start; i < buf.length; i += 1) {
    if (envelope < 1e-5) break;
    buf[i] += envelope * Math.sin((2 * Math.PI * freq * (i - start)) / RATE + phase);
    envelope *= decay;
  }
}

/**
 * A burst of noise under an exponential envelope, high-passed.
 *
 * This is the non-pitched part of an impact — the scrape and air of the event. The
 * one-pole high-pass keeps it from muddying the low end where the room tone lives.
 */
function burst(buf, atSec, amp, tauSec, cutoffHz, rand) {
  const start = samples(atSec);
  const decay = Math.exp(-1 / (tauSec * RATE));
  const a = 1 / (1 + (2 * Math.PI * cutoffHz) / RATE);
  let envelope = amp;
  let lastIn = 0;
  let lastOut = 0;
  for (let i = start; i < buf.length; i += 1) {
    if (envelope < 1e-5) break;
    const white = rand() * 2 - 1;
    lastOut = a * (lastOut + white - lastIn);
    lastIn = white;
    buf[i] += envelope * lastOut;
    envelope *= decay;
  }
}

/** Scale to a target peak and convert to the Int16 the encoder wants. */
function toPcm(buf, peak = 0.86) {
  let max = 0;
  for (const v of buf) max = Math.max(max, Math.abs(v));
  const gain = max > 0 ? peak / max : 1;
  const out = new Int16Array(buf.length);
  for (let i = 0; i < buf.length; i += 1) {
    // Soft clip rather than hard: a synthesised transient can overshoot hard enough
    // to buzz, and tanh bends the peak instead of squaring it off.
    out[i] = Math.round(Math.tanh(buf[i] * gain) * 32767);
  }
  return out;
}

function encodeMp3(pcm, kbps = 128) {
  const encoder = new Mp3Encoder(1, RATE, kbps);
  const chunks = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const block = encoder.encodeBuffer(pcm.subarray(i, i + 1152));
    if (block.length) chunks.push(Buffer.from(block));
  }
  const tail = encoder.flush();
  if (tail.length) chunks.push(Buffer.from(tail));
  return Buffer.concat(chunks);
}

// --- the effects -------------------------------------------------------------

/**
 * A ceramic plate hitting a hard floor.
 *
 * Three stages, which is roughly what happens physically:
 *   1. the strike — a broadband crack plus a dull thud from the floor itself
 *   2. the body of the plate ringing briefly before it comes apart
 *   3. shards, scattering: dozens of tiny copies of the same ring, higher and
 *      shorter, thinning out over about half a second
 *
 * Stage 3 is what makes it read as *breaking* rather than as *dropping*. Without it
 * the same strike sounds like a book landing.
 */
function plateShatter() {
  const rand = rng(0x51a7e);
  const buf = canvas(1.1);

  // 1. strike
  burst(buf, 0, 0.9, 0.006, 1800, rand);
  mode(buf, 0, 96, 0.5, 0.05); // the floor taking the hit
  mode(buf, 0, 168, 0.28, 0.035);

  // 2. the plate's own ring — inharmonic ratios, high and glassy
  for (const [freq, amp, tau] of [
    [2740, 0.4, 0.09],
    [3910, 0.32, 0.07],
    [5230, 0.24, 0.05],
    [6980, 0.16, 0.035],
  ]) {
    mode(buf, 0.001, freq, amp, tau, rand() * Math.PI * 2);
  }

  // 3. shards. Density and loudness both thin out, so the tail feels like it is
  //    settling rather than being switched off.
  const SHARDS = 34;
  for (let i = 0; i < SHARDS; i += 1) {
    const progress = i / SHARDS;
    // Cluster early: most of the glass lands in the first 150ms.
    const at = 0.012 + Math.pow(rand(), 1.7) * 0.62;
    const level = (1 - progress) * 0.5 * (0.35 + rand() * 0.65);
    const freq = 3200 + rand() * 6200;
    mode(buf, at, freq, level, 0.004 + rand() * 0.02, rand() * Math.PI * 2);
    burst(buf, at, level * 0.7, 0.0025 + rand() * 0.006, 4200, rand);
  }

  return buf;
}

/**
 * A thermal ticket printer waking up.
 *
 * A relay click, then the stepper motor: a buzz whose pitch *is* the step rate, so
 * it is built as one mode retriggered rapidly rather than as a tone.
 */
function printerWake() {
  const rand = rng(0x9c31);
  const buf = canvas(1.35);

  burst(buf, 0, 0.55, 0.004, 2200, rand); // relay
  mode(buf, 0, 420, 0.25, 0.02);

  const STEPS = 78;
  for (let i = 0; i < STEPS; i += 1) {
    const at = 0.12 + i * 0.0135;
    // Slight jitter, or 78 identical ticks read as a synthesiser rather than a motor.
    const wobble = (rand() - 0.5) * 0.0018;
    const level = 0.2 * (0.7 + rand() * 0.3);
    burst(buf, at + wobble, level, 0.0018, 2600, rand);
    mode(buf, at + wobble, 1450 + rand() * 260, level * 0.55, 0.0035);
  }

  burst(buf, 1.19, 0.3, 0.01, 900, rand); // the paper tearing free
  return buf;
}

/**
 * Kitchen room tone — an extractor hood and the room around it.
 *
 * Loopable: the last 250ms crossfades into the first, so a player can repeat it
 * under a scene without a seam.
 */
function roomTone() {
  const rand = rng(0x2f80);
  const seconds = 4;
  const buf = canvas(seconds);
  const a = 1 / (1 + (2 * Math.PI * 320) / RATE);
  let lastOut = 0;

  for (let i = 0; i < buf.length; i += 1) {
    const t = i / RATE;
    const white = rand() * 2 - 1;
    // Low-passed noise is the air; the two hums are the motor and its harmonic.
    lastOut = lastOut + (1 - a) * (white - lastOut);
    buf[i] =
      lastOut * 0.5 +
      Math.sin(2 * Math.PI * 52 * t) * 0.1 +
      Math.sin(2 * Math.PI * 104 * t) * 0.045 * (1 + 0.2 * Math.sin(2 * Math.PI * 0.3 * t));
  }

  const fade = samples(0.25);
  for (let i = 0; i < fade; i += 1) {
    const k = i / fade;
    const tail = buf.length - fade + i;
    buf[i] = buf[i] * k + buf[tail] * (1 - k);
  }
  return buf.subarray(0, buf.length - fade);
}

// --- run ---------------------------------------------------------------------

const outDir = resolve(process.argv[2] ?? join(import.meta.dirname, '..', 'sfx-preview'));
mkdirSync(outDir, { recursive: true });

/**
 * Print the loudness envelope as text.
 *
 * Whoever runs this cannot necessarily listen to the result — and a synthesised
 * effect that is silent, clipped, or decays the wrong way produces a perfectly
 * plausible-looking file. The shape of the envelope is the check: an impact should
 * be front-loaded and fall away, a room tone should be flat.
 */
function envelope(buf, columns = 40) {
  const step = Math.floor(buf.length / columns);
  const bars = ' ▁▂▃▄▅▆▇█';
  let peak = 0;
  let out = '';
  for (let c = 0; c < columns; c += 1) {
    let sum = 0;
    for (let i = c * step; i < (c + 1) * step && i < buf.length; i += 1) {
      sum += buf[i] * buf[i];
      peak = Math.max(peak, Math.abs(buf[i]));
    }
    const rms = Math.sqrt(sum / step);
    out += bars[Math.min(8, Math.round(Math.sqrt(rms / 0.35) * 8))];
  }
  return { plot: out, peak };
}

for (const [name, make] of [
  ['plate-shatter', plateShatter],
  ['printer-wake', printerWake],
  ['room-tone', roomTone],
]) {
  const buf = make();
  const file = join(outDir, `${name}.mp3`);
  writeFileSync(file, encodeMp3(toPcm(buf)));
  const { plot, peak } = envelope(buf);
  console.log(
    `${name.padEnd(14)} ${(buf.length / RATE).toFixed(2)}s  peak ${peak.toFixed(2)}  |${plot}|`,
  );
}
