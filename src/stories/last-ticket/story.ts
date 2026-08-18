/**
 * "The Last Ticket" — ~30 seconds, seven shots, seven beats.
 *
 * Same words as the first cut, re-staged. The first version held two framings across
 * the whole piece, which read as a slideshow with a voice over it; this one gives
 * every beat its own shot and puts both reactions where they can actually be seen.
 *
 * A `scene` here is a *shot*, not a location. Six of the seven are the same kitchen —
 * what changes is where the camera is standing.
 *
 * All art comes from `./art`, which belongs to this story alone.
 */

import { defineStory, type Cue } from '../../lib/story';
import { PALETTES, character, kitchen, props, screenTone, vignette } from './art';

/** Ground line for `kitchen()`. Feet go here. */
const FLOOR = 790;
/** Where the base of anything standing on the pass belongs. */
const PASS = 640;
/** Head height above the ground line, for a character at scale 1. */
const HEAD = 402;

const P = PALETTES;

/**
 * Frame a shot tight on a world point.
 *
 * The camera scales about the centre of the frame and its translate is applied
 * *after* that scale, in screen units — so centring on a point means moving by its
 * offset from centre multiplied by the zoom. Both cues snap, because a shot has to
 * open already framed; the drift, if any, is a separate cue afterwards.
 *
 * Keep the point at least `800/zoom` from the left and right edges and `450/zoom`
 * from the top and bottom, or the zoom window runs off the backdrop and shows blank
 * frame behind it.
 */
const closeOn = (x: number, y: number, zoom: number): Cue[] => [
  { target: 'camera', do: 'scale', to: zoom, at: 0, dur: 0.001 },
  { target: 'camera', do: 'move', dx: -(x - 800) * zoom, dy: -(y - 450) * zoom, at: 0, dur: 0.001 },
];

// Cast once, reuse everywhere — this is what keeps her recognisable between shots.
// Only `pose` and `expression` change shot to shot.
const mika = (o: Parameters<typeof character>[0] = {}) =>
  character({ hairColor: 'black', cloth: 'slate', eyeColor: '#5b6f8f', ...o });

/** Her mark. She holds it through the whole first movement so the cuts read as one place. */
const MARK = 940;

export default defineStory({
  slug: 'last-ticket',
  title: 'The Last Ticket',
  logline: 'The worst night of her year, and then one more order.',
  scenes: [
    // --- first movement: the night that already happened ---------------------
    {
      // Open tight on her face, so the plate landing has somewhere to register.
      // The room is withheld until the next shot, which is what makes it read as
      // empty when it arrives.
      id: 'nine',
      palette: P.storm,
      transition: 'fade',
      backdrop: kitchen({ palette: P.storm, seed: 'service' }),
      layers: [
        {
          id: 'mika',
          svg: mika({ pose: 'slump', expression: 'sad', ink: P.storm.ink, rim: P.storm.rim }),
          variants: {
            flinch: mika({
              pose: 'slump',
              expression: 'surprised',
              ink: P.storm.ink,
              rim: P.storm.rim,
            }),
          },
          x: MARK,
          y: FLOOR,
          ambient: 'k-breathe',
        },
      ],
      fx: [screenTone({ opacity: 0.1 })],
      beats: [
        {
          text: 'The fish came in wrong, the bread went black, and Mika dropped a plate at nine.',
          cues: [
            ...closeOn(MARK, FLOOR - HEAD, 2.4),
            // The tremor lands on the word "plate". `at` counts from the beat's start
            // and this beat runs 4.34s, so both of these must stay inside that.
            { target: 'mika', do: 'swap', to: 'flinch', at: 3.3 },
            { target: 'camera', do: 'shake', strength: 7, at: 3.35, dur: 0.6 },
            { target: 'mika', do: 'swap', to: 'base', at: 3.95, dur: 0.3 },
          ],
        },
      ],
    },
    {
      // Cut wide on the same moment. Nothing has moved; we are just further away,
      // and the distance is the point.
      id: 'empty',
      palette: P.storm,
      transition: 'cut',
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
          id: 'mika',
          svg: mika({ pose: 'slump', expression: 'sad', ink: P.storm.ink, rim: P.storm.rim }),
          x: MARK,
          y: FLOOR,
          ambient: 'k-breathe',
        },
      ],
      fx: [screenTone({ opacity: 0.1 }), vignette()],
      beats: [
        {
          text: 'By the time the last table left, she had stopped counting what it cost her.',
          cues: [{ target: 'camera', do: 'scale', to: 1.08, dur: 'scene', ease: 'soft' }],
        },
      ],
    },
    {
      // She is off this frame entirely — the shot is the burners going out. Held
      // still on purpose: three moving shots in a row and none of them land.
      id: 'burners',
      palette: P.storm,
      transition: 'cut',
      backdrop: kitchen({ palette: P.storm, seed: 'service' }),
      layers: [
        {
          id: 'pot',
          svg: props.stockpot('#46505c', P.storm.ink),
          x: 250,
          y: PASS,
          scale: 0.95,
        },
      ],
      fx: [vignette({ opacity: 0.42 })],
      beats: [
        {
          text: 'She turned off the burners one by one, and did not turn on the lights.',
          // 380 rather than the pot's own 250: at this zoom, centring on the pot
          // would run the frame off the left edge of the backdrop.
          cues: closeOn(380, PASS - 60, 2.2),
          hold: 0.5,
        },
      ],
    },

    // --- second movement: the ticket -----------------------------------------
    {
      // The only `fade` in the piece, and the only palette change. Time passes here
      // and nowhere else, so the one soft transition marks it.
      id: 'printer',
      palette: P.dawn,
      transition: 'fade',
      backdrop: kitchen({ palette: P.dawn, seed: 'after-close' }),
      layers: [
        {
          id: 'mika',
          svg: mika({ pose: 'stand', expression: 'surprised', ink: P.dawn.ink, rim: P.dawn.rim }),
          x: MARK,
          y: FLOOR,
          ambient: 'k-breathe',
        },
      ],
      fx: [vignette({ opacity: 0.3 })],
      beats: [
        {
          text: 'Ten minutes after the door was locked, the printer woke with one more ticket.',
          cues: [{ target: 'camera', do: 'scale', to: 1.12, dur: 'scene', ease: 'soft' }],
        },
      ],
    },
    {
      // Dead still, and looser than the shot on either side of it. Two tight shots
      // of the same face back to back is a jump cut, not an edit — the reaching arm
      // is what this line is about, so the frame drops to take it in.
      id: 'hand',
      palette: P.dawn,
      transition: 'cut',
      backdrop: kitchen({ palette: P.dawn, seed: 'after-close' }),
      layers: [
        {
          id: 'mika',
          svg: mika({ pose: 'reach', expression: 'neutral', ink: P.dawn.ink, rim: P.dawn.rim }),
          x: MARK,
          y: FLOOR,
          ambient: 'k-breathe',
        },
      ],
      fx: [vignette({ opacity: 0.3 })],
      beats: [
        {
          text: 'She almost left it in the tray. Her hand went to it out of habit.',
          cues: closeOn(MARK, 480, 1.7),
        },
      ],
    },
    {
      // The turn, and the reason the piece is cut this way at all: the decision is a
      // change of expression, and a change of expression is invisible at any width.
      id: 'mother',
      palette: P.dawn,
      transition: 'cut',
      backdrop: kitchen({ palette: P.dawn, seed: 'after-close' }),
      layers: [
        {
          id: 'mika',
          svg: mika({ pose: 'stand', expression: 'sad', ink: P.dawn.ink, rim: P.dawn.rim }),
          variants: {
            decided: mika({
              pose: 'stand',
              expression: 'determined',
              ink: P.dawn.ink,
              rim: P.dawn.rim,
            }),
          },
          x: MARK,
          y: FLOOR,
          ambient: 'k-breathe',
        },
      ],
      fx: [vignette({ opacity: 0.28 })],
      beats: [
        {
          text: 'Her mother’s order. She had driven four hours and had not called ahead.',
          cues: [
            ...closeOn(MARK, FLOOR - HEAD, 2.4),
            // Lands on "four hours" — she decides before the line finishes, which is
            // what makes the last beat a consequence rather than an announcement.
            { target: 'mika', do: 'swap', to: 'decided', at: 2.7, dur: 0.45 },
          ],
        },
      ],
    },
    {
      // Back to the full room for the ending. After four tight shots the width is
      // the release, and the dish needs somewhere to appear.
      id: 'rice',
      palette: P.dawn,
      transition: 'cut',
      backdrop: kitchen({ palette: P.dawn, seed: 'after-close' }),
      layers: [
        {
          // Fades in on the mark the stockpot held in the first movement: same spot,
          // the other end of the night.
          id: 'plate',
          svg: props.dish('#f4efe4', '#f6d97a', P.dawn.ink),
          x: 250,
          y: PASS,
          scale: 0.95,
          opacity: 0,
        },
        {
          id: 'mika',
          svg: mika({ pose: 'reach', expression: 'determined', ink: P.dawn.ink, rim: P.dawn.rim }),
          x: MARK,
          y: FLOOR,
          ambient: 'k-breathe',
        },
      ],
      fx: [vignette({ opacity: 0.3 })],
      beats: [
        {
          text: 'Mika read it twice. Then she started the rice.',
          cues: [
            { target: 'camera', do: 'scale', to: 1.1, dur: 'scene', ease: 'soft' },
            { target: 'plate', do: 'fade', to: 1, dur: 'beat', ease: 'soft' },
          ],
          hold: 1.2,
        },
      ],
    },
  ],
});
