---
name: sound-director
description: Design, calibrate, and orchestrate audio, ambient soundscapes, voiceover narration, beat pauses, and volume ducking for storyboards in src/stories/. Use whenever the user asks to add sound effects, ambient audio, background music, voice tuning, audio ducking, pause pacing, or sound design to a story.
---

# Sound Director

Design and calibrate multi-track audio, ambient soundscapes, and narration delivery for Story Teller.

The sound layer in Story Teller consists of:
1. **Narration Voiceover:** Granular per-beat MP3 audio generated locally via `sherpa-onnx` or cloud providers (`scripts/narrate.mjs`).
2. **Ambient Soundscapes:** Background loops declared per story or per scene (`ambientAudio`).
3. **Dynamic Voice Ducking:** Automatic volume ducking ($\sim 22\%$) during narration speech, restoring to full atmospheric volume during holds and scene pauses.
4. **Pacing Pauses (`hold`):** Strategic silence after narration lines to give visual and musical moments room to land.

---

## Sound Design Principles

### 1. The Power of the Hold (`hold`)
A story without pauses feels rushed and robotic. Insert `hold: 0.6–1.5` at key moments:
* After a dramatic revelation: let the character's reaction settle.
* During an environmental cutaway: let the ambient sound (rain, waves, wind) take center stage.
* On the final beat: never cut to black immediately. Hold 1.2–2.0s for an emotional resolution.

```ts
{
  text: 'Mika read it twice. Then she started the rice.',
  cues: [
    { target: 'camera', do: 'scale', to: 1.1, dur: 'scene', ease: 'soft' },
    { target: 'plate', do: 'fade', to: 1, dur: 'beat', ease: 'soft' },
  ],
  hold: 1.4, // Room for the final scene to breathe
}
```

---

## Ambient Soundscape Curation

Declare `ambientAudio` at the story level or override per scene:

```ts
export default defineStory({
  slug: 'last-ticket',
  title: 'The Last Ticket',
  // Story-wide ambient sound bed
  ambientAudio: '/audio/ambient/kitchen-hum.mp3',
  scenes: [
    {
      id: 'rain-scene',
      // Scene-specific override
      ambientAudio: '/audio/ambient/heavy-rain.mp3',
      // ...
    }
  ]
});
```

### Ambient Loop Recommendations by Setting

| Setting | Recommended Sound Bed | Vibe |
|---|---|---|
| **Kitchen / Restaurant** | `kitchen-hum.mp3` (refrigerator drone, faint clatter) | Realistic, grounded, intimate |
| **Ridge / Countryside** | `wind-birds.mp3` (distant breeze, dawn chirps) | Serene, expansive, quiet |
| **City / Crossing** | `city-traffic.mp3` (muffled street hum, distant sirens) | Urban, modern, solitary |
| **Storm / Rain** | `thunder-rain.mp3` (steady rainfall, low rumble) | Melancholy, dramatic tension |
| **Shrine / Night** | `night-crickets.mp3` (gentle crickets, leaves rustling) | Reflective, mystical, nostalgic |

---

## Voice Calibration (`voice`)

Tune narrator pacing and stability per story:

```ts
voice: {
  id: 'kokoro-en-v0_19', // Default local model
  stability: 0.55,       // 0..1 (higher is steadier, lower more expressive)
  speed: 0.90,           // 0.85 = unhurried storybook, 1.0 = standard, 1.1 = tech explainer
}
```

* **Storybook / Drama:** `speed: 0.88–0.92`, `stability: 0.45–0.50` (expressive, breathable).
* **Technical Explainer:** `speed: 0.98–1.05`, `stability: 0.70–0.80` (clear, crisp, articulate).
* **Action / Motion Comic:** `speed: 0.95–1.00`, `stability: 0.40–0.50` (dynamic, tense).

---

## Quality Gate Checklist

1. **Environment Setup:** Ensure `sherpa-onnx` is installed (`npm run setup:tts`) or a provider API key is set.
2. **Narration Synthesis:** Run `npm run narrate <slug>` to generate beat MP3s and measure exact durations in `public/audio/<slug>/manifest.json`. Verify that audio files exist.
3. **Ambient Audio Presence:** Confirm any referenced `ambientAudio` paths physically exist in `public/audio/ambient/`.
4. **Timing Alignment:** Check that no cue `at + dur` overflows the measured beat duration.
5. **Pacing Check:** Run `npm run audit <slug>` to confirm word rates, scene durations, and audio asset validity.
6. **Standalone Portability:** Test `node scripts/standalone.mjs <slug> --with-audio` to verify that ambient loops and beat audio inline properly.
