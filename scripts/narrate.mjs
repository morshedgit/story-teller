#!/usr/bin/env node
/**
 * Narration generator.
 *
 *   npm run narrate <slug>          generate missing / changed beats
 *   npm run narrate <slug> --force  regenerate everything
 *   npm run narrate --all
 *
 * Renders **one MP3 per narration beat** into `public/audio/<slug>/` and writes a
 * `manifest.json` of real measured durations, which the build reads to lay out the
 * timeline.
 *
 * Per-beat granularity is the important choice. Beat boundaries become exact by
 * construction, so no timing offsets are ever maintained by hand and the animation
 * cannot drift from the voice. It also means editing one line of narration re-bills
 * one beat instead of the whole story.
 *
 * Providers, in the order they are chosen:
 *   ELEVENLABS_API_KEY   hosted; the most expressive narrator voices
 *   OPENAI_API_KEY       hosted; cheaper per character
 *   (none)               `local` — runs on this machine, needs nothing
 *
 * **`local` is the default**, so narration works with no key, no account and no
 * network. Set a key only to prefer a hosted voice. Note that hosted providers are
 * unreachable from sandboxes behind an allowlist proxy, where `local` is the only
 * option that works — see the driver below.
 */

import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { parseFile } from 'music-metadata';
import { build as esbuild } from 'esbuild';
import { Mp3Encoder } from '@breezystack/lamejs';

const ROOT = resolve(import.meta.dirname, '..');
const STORY_DIR = join(ROOT, 'src', 'stories');
const AUDIO_DIR = join(ROOT, 'public', 'audio');

// --- WAV -> MP3 -------------------------------------------------------------

/**
 * Read a 16-bit PCM mono WAV into samples.
 *
 * Chunks are walked rather than assuming the canonical 44-byte header, because
 * encoders freely insert `LIST`/`fact` chunks before `data`.
 */
function decodeWav(buffer) {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('not a RIFF/WAVE file');
  }
  let offset = 12;
  let sampleRate = 0;
  let channels = 1;
  let samples = null;

  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === 'fmt ') {
      const format = buffer.readUInt16LE(body);
      const bits = buffer.readUInt16LE(body + 14);
      if (format !== 1 || bits !== 16) throw new Error(`expected 16-bit PCM, got format ${format} / ${bits}-bit`);
      channels = buffer.readUInt16LE(body + 2);
      sampleRate = buffer.readUInt32LE(body + 4);
    } else if (id === 'data') {
      const end = Math.min(body + size, buffer.length);
      samples = new Int16Array((end - body) >> 1);
      for (let i = 0; i < samples.length; i += 1) samples[i] = buffer.readInt16LE(body + i * 2);
    }
    offset = body + size + (size % 2); // chunks are word-aligned
  }

  if (!sampleRate || !samples) throw new Error('WAV is missing a fmt or data chunk');
  return { sampleRate, channels, samples };
}

/**
 * Encode mono PCM to MP3 in pure JavaScript.
 *
 * MP3 rather than the WAV that comes out of the synthesiser, so that everything
 * downstream — the `.mp3` filenames, the content-hash cache, the stale-file pruning,
 * `music-metadata`, the manifest — is untouched by which provider produced the audio.
 * It is also ~10x smaller, which matters because this audio is committed.
 *
 * Pure JS because there is no `ffmpeg` here and no way to install one in the
 * environments this has to run in.
 */
function encodeMp3(samples, sampleRate, kbps = 96) {
  const encoder = new Mp3Encoder(1, sampleRate, kbps);
  const chunks = [];
  const BLOCK = 1152; // one MP3 frame
  for (let i = 0; i < samples.length; i += BLOCK) {
    const block = encoder.encodeBuffer(samples.subarray(i, i + BLOCK));
    if (block.length) chunks.push(Buffer.from(block));
  }
  const tail = encoder.flush();
  if (tail.length) chunks.push(Buffer.from(tail));
  return Buffer.concat(chunks);
}

// --- TTS drivers ------------------------------------------------------------

/**
 * A driver takes text plus the story's voice hints and returns MP3 bytes.
 * Adding a provider means adding one entry here and nothing else.
 *
 * A driver may also offer `speakBatch(...)`, returning a `Map` of key -> MP3 bytes
 * for every beat at once. Providers that pay a fixed start-up cost per invocation
 * use it; the rest are called one beat at a time.
 */
const DRIVERS = {
  elevenlabs: {
    label: 'ElevenLabs',
    envKey: 'ELEVENLABS_API_KEY',
    // "Rachel" — a stock voice present on every account. Override per story with
    // `voice: { id: '...' }`, or globally with ELEVENLABS_VOICE_ID.
    defaultVoice: process.env.ELEVENLABS_VOICE_ID ?? '21m00Tcm4TlvDq8ikWAM',
    async speak({ text, voiceId, apiKey, voice }) {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: { 'xi-api-key': apiKey, 'content-type': 'application/json' },
          body: JSON.stringify({
            text,
            model_id: process.env.ELEVENLABS_MODEL ?? 'eleven_multilingual_v2',
            voice_settings: {
              stability: voice.stability ?? 0.45,
              similarity_boost: 0.75,
              style: 0.3,
              use_speaker_boost: true,
            },
          }),
        },
      );
      if (!response.ok) throw new Error(`ElevenLabs ${response.status}: ${await response.text()}`);
      return Buffer.from(await response.arrayBuffer());
    },
  },

  openai: {
    label: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    defaultVoice: process.env.OPENAI_VOICE ?? 'sage',
    async speak({ text, voiceId, apiKey, voice }) {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OPENAI_TTS_MODEL ?? 'gpt-4o-mini-tts',
          voice: voiceId,
          input: text,
          response_format: 'mp3',
          speed: voice.speed ?? 1,
          instructions: 'Read as a warm, unhurried storybook narrator. Let the pauses breathe.',
        }),
      });
      if (!response.ok) throw new Error(`OpenAI ${response.status}: ${await response.text()}`);
      return Buffer.from(await response.arrayBuffer());
    },
  },

  /**
   * On-device synthesis via sherpa-onnx. No key, no account, no per-character cost,
   * no network once the voice model is cached — and no third party in the pipeline
   * for what ends up committed to this repo.
   *
   * This is the default, and it is the only driver that works from a sandbox whose
   * proxy allowlists outbound hosts: the hosted APIs above answer to `CONNECT`
   * denials there long before an API key would matter.
   *
   * `voiceId` is the model directory name, which lands in the beat hash — so
   * switching voices correctly regenerates the story rather than mixing two
   * narrators across beats. `scripts/tts_local.py` downloads it on first use.
   */
  local: {
    label: 'local (sherpa-onnx)',
    keyless: true,
    // Kokoro by default because its durations are stable run to run, so re-narrating
    // a story does not shift the timeline under the cues. The Piper voices have a
    // stochastic duration predictor — see scripts/tts_local.py.
    defaultVoice: process.env.TTS_LOCAL_MODEL ?? 'kokoro-en-v0_19',
    // These models read briskly out of the box — faster than the unhurried storybook
    // narrator this project wants. `WORDS_PER_SECOND` in src/lib/story.ts is
    // calibrated against this pace.
    defaultSpeed: 0.9,
    async speakBatch({ beats, voiceId, voice }) {
      const dir = await mkdtemp(join(tmpdir(), 'narrate-'));
      try {
        const request = {
          model: voiceId,
          outDir: dir,
          speed: voice.speed ?? 1,
          speakerId: voice.speakerId ?? 0,
          beats: beats.map(({ key, text }) => ({ key, text })),
        };
        const { beats: results } = await runPython(join(ROOT, 'scripts', 'tts_local.py'), request);
        const audio = new Map();
        for (const result of results) {
          const { sampleRate, samples } = decodeWav(await readFile(result.file));
          audio.set(result.key, encodeMp3(samples, sampleRate));
        }
        return audio;
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    },
  },
};

/** Run a helper script, sending it JSON on stdin and parsing JSON off stdout. */
function runPython(script, request) {
  return new Promise((fulfil, reject) => {
    // stderr is inherited so model downloads and per-beat progress stream through
    // live; a first run has to fetch a few hundred MB and silence reads as a hang.
    const child = spawn(process.env.PYTHON ?? 'python3', [script], {
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'inherit'],
    });
    let stdout = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.on('error', (error) => reject(new Error(`could not start python3: ${error.message}`)));
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(`${script} exited ${code} — see the output above`));
      try {
        fulfil(JSON.parse(stdout));
      } catch {
        reject(new Error(`${script} did not return JSON`));
      }
    });
    child.stdin.end(JSON.stringify(request));
  });
}

/**
 * Choose a provider: an explicit `TTS_PROVIDER`, else the first hosted one whose key
 * is set, else `local`.
 *
 * The fallback never fails, so there is no "narration pending a key" state — a story
 * gets a real voice by default and a key only upgrades it.
 */
function pickDriver() {
  const requested = process.env.TTS_PROVIDER;
  if (requested) {
    const driver = DRIVERS[requested];
    if (!driver) throw new Error(`Unknown TTS_PROVIDER "${requested}". Options: ${Object.keys(DRIVERS).join(', ')}`);
    const apiKey = process.env[driver.envKey];
    if (!driver.keyless && !apiKey) throw new Error(`TTS_PROVIDER=${requested} but ${driver.envKey} is not set.`);
    return { name: requested, driver, apiKey };
  }
  for (const [name, driver] of Object.entries(DRIVERS)) {
    if (driver.keyless) continue;
    const apiKey = process.env[driver.envKey];
    if (apiKey) return { name, driver, apiKey };
  }
  return { name: 'local', driver: DRIVERS.local, apiKey: undefined };
}

// --- story loading ----------------------------------------------------------

/**
 * Load a story's `story.ts` in plain Node.
 *
 * A story imports its own `art/` across several extensionless TypeScript modules,
 * which Node's ESM loader cannot resolve on its own, so esbuild bundles the graph
 * to a single in-memory module first. Nothing is written to disk.
 */
async function loadStory(file) {
  const result = await esbuild({
    entryPoints: [file],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    logLevel: 'silent',
  });
  const code = result.outputFiles[0].text;
  const module = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  return module.default;
}

/** A story is a directory holding `story.ts` and the art that story owns. */
async function storyFiles(slug) {
  const entries = await readdir(STORY_DIR, { withFileTypes: true });
  const slugs = entries
    .filter((entry) => entry.isDirectory() && existsSync(join(STORY_DIR, entry.name, 'story.ts')))
    .map((entry) => entry.name);
  if (!slug) return slugs.map((name) => join(STORY_DIR, name, 'story.ts'));
  if (!slugs.includes(slug)) {
    throw new Error(`No story directory for "${slug}". Found: ${slugs.join(', ') || '(none)'}`);
  }
  return [join(STORY_DIR, slug, 'story.ts')];
}

// --- generation -------------------------------------------------------------

const beatKey = (sceneId, index) => `${sceneId}.${index}`;

function hashBeat(text, provider, voiceId, voice) {
  return createHash('sha256')
    .update(
      [text.trim(), provider, voiceId, voice.stability ?? '', voice.speed ?? '', voice.speakerId ?? ''].join('\0'),
    )
    .digest('hex')
    .slice(0, 16);
}

async function narrate(file, { force }) {
  const story = await loadStory(file);
  const selected = pickDriver();

  const beats = [];
  for (const scene of story.scenes) {
    scene.beats.forEach((beat, index) => {
      beats.push({ key: beatKey(scene.id, index), text: beat.text });
    });
  }

  console.log(`\n${story.title} (${story.slug}) — ${beats.length} beats`);

  const { name: provider, driver, apiKey } = selected;

  // Resolve the driver's defaults into the voice settings *before* hashing, so the
  // beat hash reflects what will actually be synthesised. Leaving a default to be
  // applied inside the driver would let a change to it go unnoticed by the cache,
  // and every beat would keep its stale audio.
  const voice = { ...(story.voice ?? {}) };
  if (voice.speed === undefined && driver.defaultSpeed !== undefined) voice.speed = driver.defaultSpeed;
  const voiceId = voice.id ?? driver.defaultVoice;
  const outDir = join(AUDIO_DIR, story.slug);
  await mkdir(outDir, { recursive: true });

  const manifestPath = join(outDir, 'manifest.json');
  const previous = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, 'utf8')) : { beats: {} };

  const manifest = {
    slug: story.slug,
    generatedAt: new Date().toISOString(),
    provider,
    voiceId,
    beats: {},
  };

  // Work out what actually needs synthesising before synthesising any of it. Beats
  // whose text and voice settings are unchanged are skipped, so re-running after a
  // one-line edit costs one beat rather than forty — and a batching driver gets the
  // whole list up front instead of being started once per beat.
  const plan = beats.map((beat) => {
    const hash = hashBeat(beat.text, provider, voiceId, voice);
    const fileName = `${beat.key}.mp3`;
    const cached = previous.beats?.[beat.key];
    const reuse = !force && cached?.hash === hash && existsSync(join(outDir, fileName));
    return { ...beat, hash, fileName, cached, reuse };
  });

  const pending = plan.filter((item) => !item.reuse);
  const batch =
    pending.length && driver.speakBatch
      ? await driver.speakBatch({ beats: pending, voiceId, apiKey, voice })
      : null;

  let generated = 0;
  let reused = 0;

  for (const item of plan) {
    if (item.reuse) {
      manifest.beats[item.key] = item.cached;
      reused += 1;
      continue;
    }

    process.stdout.write(`  ${item.key} … `);
    const audio = batch?.get(item.key) ?? (await driver.speak({ text: item.text, voiceId, apiKey, voice }));
    const filePath = join(outDir, item.fileName);
    await writeFile(filePath, audio);
    const { format } = await parseFile(filePath);
    const duration = Math.round((format.duration ?? 0) * 1000) / 1000;
    if (!duration) throw new Error(`could not read a duration from ${item.fileName}`);

    manifest.beats[item.key] = { file: item.fileName, duration, hash: item.hash };
    generated += 1;
    console.log(`${duration.toFixed(2)}s`);
  }

  // Drop audio for beats that no longer exist, so trimmed scenes do not leave
  // orphaned megabytes in git forever.
  const live = new Set(Object.values(manifest.beats).map((entry) => entry.file));
  for (const name of await readdir(outDir)) {
    if (name.endsWith('.mp3') && !live.has(name)) {
      await unlink(join(outDir, name));
      console.log(`  removed stale ${name}`);
    }
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const total = Object.values(manifest.beats).reduce((sum, entry) => sum + entry.duration, 0);
  console.log(`  ${generated} generated, ${reused} reused — ${Math.round(total)}s of narration via ${driver.label}`);
  console.log('  run `npm run build` to pick up the new timings.');
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const all = args.includes('--all');
  const slug = args.find((arg) => !arg.startsWith('--'));

  if (!slug && !all) {
    console.error('usage: npm run narrate <slug> [--force]   |   npm run narrate --all');
    process.exit(1);
  }

  for (const file of await storyFiles(all ? undefined : slug)) {
    await narrate(file, { force });
  }
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
