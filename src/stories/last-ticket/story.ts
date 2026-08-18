/**
 * "The Last Ticket" — ~30 seconds, two scenes, seven beats.
 *
 * A short piece, deliberately: at this length the whole thing can be re-cut in one
 * pass, which is what we want while the look is still being judged. The 5-minute
 * shape is where this goes once the art is settled.
 *
 * All art comes from `./art`, which belongs to this story alone.
 */

import { defineStory } from '../../lib/story';
import { PALETTES, character, kitchen, props, screenTone, vignette } from './art';

/** Ground line for `kitchen()`. Feet go here. */
const FLOOR = 790;
/** Where the base of anything standing on the pass belongs. */
const PASS = 640;

const P = PALETTES;

// Cast once, reuse everywhere — this is what keeps her recognisable between scenes.
// Only `pose` and `expression` change shot to shot.
const mika = (o: Parameters<typeof character>[0] = {}) =>
  character({ hairColor: 'black', cloth: 'slate', eyeColor: '#5b6f8f', ...o });

export default defineStory({
  slug: 'last-ticket',
  title: 'The Last Ticket',
  logline: 'The worst night of her year, and then one more order.',
  scenes: [
    {
      id: 'service',
      palette: P.storm,
      transition: 'fade',
      backdrop: kitchen({ palette: P.storm, seed: 'service' }),
      layers: [
        {
          id: 'pot',
          svg: props.stockpot('#46505c', P.storm.ink),
          x: 250,
          y: PASS,
          scale: 0.95,
        },
        {
          // Slumped, not working: the whole scene is told looking back at a night
          // that is already over, and this is the shot the second beat lands on.
          id: 'mika',
          svg: mika({ pose: 'slump', expression: 'sad', ink: P.storm.ink, rim: P.storm.rim }),
          variants: {
            // Same casting, one field changed — which is the point of casting her as
            // a helper. She wears this for about a second as the plate goes down.
            flinch: mika({
              pose: 'slump',
              expression: 'surprised',
              ink: P.storm.ink,
              rim: P.storm.rim,
            }),
          },
          x: 940,
          y: FLOOR,
          ambient: 'k-breathe',
        },
      ],
      fx: [screenTone({ opacity: 0.1 }), vignette()],
      beats: [
        {
          text: 'The fish came in wrong, the bread went black, and Mika dropped a plate at nine.',
          cues: [
            { target: 'camera', do: 'scale', to: 1.14, dur: 'scene', ease: 'soft' },
            // The tremor lands on the word "plate". `at` is measured from the start
            // of the beat, so it must stay inside the beat's real narration length —
            // check it against the manifest after any edit to this line.
            { target: 'camera', do: 'shake', strength: 9, at: 3.4, dur: 0.7 },
            // She reacts a fraction before the tremor, the way a flinch precedes the
            // noise reaching you.
            { target: 'mika', do: 'swap', to: 'flinch', at: 3.35 },
          ],
        },
        {
          text: 'By the time the last table left, she had stopped counting what it cost her.',
          cues: [
            { target: 'mika', do: 'swap', to: 'base', at: 0.2, dur: 0.4 },
            { target: 'mika', do: 'move', dy: 8, dur: 'beat', ease: 'soft' },
          ],
        },
        {
          text: 'She turned off the burners one by one, and did not turn on the lights.',
          hold: 0.5,
        },
      ],
    },
    {
      id: 'ticket',
      palette: P.dawn,
      transition: 'fade',
      backdrop: kitchen({ palette: P.dawn, seed: 'after-close' }),
      layers: [
        {
          // Same mark she ended the last scene on, so the cut reads as time passing
          // rather than as her teleporting across the kitchen.
          id: 'mika',
          svg: mika({ pose: 'stand', expression: 'surprised', ink: P.dawn.ink, rim: P.dawn.rim }),
          x: 940,
          y: FLOOR,
          ambient: 'k-breathe',
        },
        {
          // Fades in on the last beat, on the mark the stockpot held in scene one:
          // same spot, the other end of the night.
          id: 'plate',
          svg: props.dish('#f4efe4', '#f6d97a', P.dawn.ink),
          x: 250,
          y: PASS,
          scale: 0.95,
          opacity: 0,
        },
      ],
      fx: [vignette({ opacity: 0.3 })],
      beats: [
        {
          text: 'Ten minutes after the door was locked, the printer woke with one more ticket.',
          cues: [{ target: 'camera', do: 'scale', to: 1.16, dur: 'scene', ease: 'soft' }],
        },
        {
          // No cue: the hesitation is carried by the line and the held frame.
          text: 'She almost left it in the tray. Her hand went to it out of habit.',
        },
        {
          text: 'Her mother’s order. She had driven four hours and had not called ahead.',
          // She drifts toward the range as she reads it — the decision, before the line.
          cues: [{ target: 'mika', do: 'move', dx: -150, dur: 'beat', ease: 'soft' }],
        },
        {
          text: 'Mika read it twice. Then she started the rice.',
          cues: [{ target: 'plate', do: 'fade', to: 1, dur: 'beat', ease: 'soft' }],
          hold: 1.2,
        },
      ],
    },
  ],
});
