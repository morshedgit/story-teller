#!/usr/bin/env python3
"""
Local text-to-speech, for `scripts/narrate.mjs`.

Synthesises narration entirely on this machine with sherpa-onnx and a neural voice
model. No API key, no account, no per-character cost, and nothing leaves the box.

That last part is not only a privacy nicety: hosted TTS is unreachable from some
sandboxes (an allowlist proxy answers 403 to CONNECT for `api.elevenlabs.io` and
friends), so a local model is the only narration that works everywhere.

Talks to Node over stdin/stdout, one process per run rather than per beat, because
loading a model costs a second or two and a story has dozens of beats:

    stdin   {"model": "...", "outDir": "...", "speed": 1.0,
             "beats": [{"key": "scene.0", "text": "..."}]}
    stdout  {"sampleRate": 24000, "beats": [{"key": "scene.0", "file": "..."}]}

Progress goes to stderr so stdout stays parseable.

Models are downloaded on first use into `.tts-models/` (gitignored) from the
sherpa-onnx releases, and reused forever after.
"""

import json
import struct
import sys
import tarfile
import urllib.request
import wave
from pathlib import Path

MODEL_RELEASE = 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models'
ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / '.tts-models'

# Voices auditioned for this project. Any other sherpa-onnx TTS model works too —
# drop it in `.tts-models/` and pass its directory name.
#
# Kokoro is the default for a reason beyond taste: its **durations are stable**. The
# same beat text re-synthesises to the same length every run (measured: within 0.1 ms
# across separate processes), so the resolved timeline and every `at:` cue stay put
# when a story is re-narrated. The Piper/VITS voices use a stochastic duration
# predictor and swing a couple of percent per run, which nudges the whole timeline.
#
# Neither is bit-exact across processes — the waveform differs inaudibly — but only
# the durations feed the build, so that is the property worth having.
KNOWN_MODELS = (
    'kokoro-en-v0_19',
    'vits-piper-en_GB-jenny_dioco-medium',
    'vits-piper-en_US-lessac-medium',
)


def log(message):
    print(message, file=sys.stderr, flush=True)


def ensure_model(name):
    """Return the model directory, downloading and extracting it if absent."""
    target = MODELS_DIR / name
    if target.is_dir():
        return target

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    archive = MODELS_DIR / f'{name}.tar.bz2'
    url = f'{MODEL_RELEASE}/{name}.tar.bz2'
    log(f'  downloading voice model {name} (one time)…')
    try:
        urllib.request.urlretrieve(url, archive)
        with tarfile.open(archive, 'r:bz2') as tar:
            tar.extractall(MODELS_DIR)
    finally:
        archive.unlink(missing_ok=True)

    if not target.is_dir():
        raise RuntimeError(f'{name} did not extract to {target}')
    return target


def build_tts(model_dir):
    """
    Configure sherpa-onnx for whichever model family is in `model_dir`.

    The two families are told apart by their files rather than by name, so a model
    dropped in by hand works without being registered anywhere: Kokoro ships a
    `voices.bin` of speaker embeddings, VITS/Piper ships a single `.onnx`.

    Pace is not set here. `generate(speed=...)` overrides any `length_scale` given to
    the config, so setting both is at best redundant and at worst silently ignored;
    the speed is passed per utterance instead.
    """
    import sherpa_onnx

    tokens = str(model_dir / 'tokens.txt')
    data_dir = str(model_dir / 'espeak-ng-data')

    if (model_dir / 'voices.bin').exists():
        model = sherpa_onnx.OfflineTtsModelConfig(
            kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                model=str(model_dir / 'model.onnx'),
                voices=str(model_dir / 'voices.bin'),
                tokens=tokens,
                data_dir=data_dir,
            ),
            num_threads=2,
        )
    else:
        onnx = next(
            (p for p in sorted(model_dir.glob('*.onnx')) if not p.name.endswith('.json')),
            None,
        )
        if onnx is None:
            raise RuntimeError(f'no .onnx model found in {model_dir}')
        model = sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                model=str(onnx),
                tokens=tokens,
                data_dir=data_dir,
            ),
            num_threads=2,
        )

    # `max_num_sentences=1` keeps sentence pacing inside a beat the same however the
    # beat is batched, so a beat's audio depends only on that beat's text.
    config = sherpa_onnx.OfflineTtsConfig(model=model, max_num_sentences=1)
    if not config.validate():
        raise RuntimeError(f'sherpa-onnx rejected the config for {model_dir.name}')
    return sherpa_onnx.OfflineTts(config)


def write_wav(path, samples, sample_rate):
    """16-bit PCM mono. Node reads this back and encodes it to MP3."""
    clipped = [max(-1.0, min(1.0, float(s))) for s in samples]
    frames = struct.pack(f'<{len(clipped)}h', *(int(s * 32767) for s in clipped))
    with wave.open(str(path), 'wb') as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(sample_rate)
        out.writeframes(frames)


def main():
    request = json.load(sys.stdin)
    beats = request['beats']
    out_dir = Path(request['outDir'])
    out_dir.mkdir(parents=True, exist_ok=True)

    model_dir = ensure_model(request.get('model', KNOWN_MODELS[0]))
    tts = build_tts(model_dir)
    speaker = int(request.get('speakerId', 0))
    speed = float(request.get('speed', 1.0))

    results = []
    sample_rate = 0
    for beat in beats:
        audio = tts.generate(beat['text'], sid=speaker, speed=speed)
        if not len(audio.samples):
            raise RuntimeError(f'no audio produced for beat {beat["key"]}')
        path = out_dir / f'{beat["key"]}.wav'
        write_wav(path, audio.samples, audio.sample_rate)
        sample_rate = audio.sample_rate
        results.append({'key': beat['key'], 'file': str(path)})
        log(f'    synthesised {beat["key"]}')

    json.dump({'sampleRate': sample_rate, 'beats': results}, sys.stdout)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:  # surfaced by Node as the driver's failure message
        log(f'tts_local.py: {error}')
        sys.exit(1)
