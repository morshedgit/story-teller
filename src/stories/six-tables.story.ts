/**
 * "Six Tables" — an original short.
 *
 * A chef survives the worst service of her life and finds out, at the very end,
 * what the night was actually for.
 *
 * Shape: 14 scenes, 42 beats, ~5:00 at a storybook reading pace.
 */

import { defineStory } from '../lib/story';
import {
  character,
  city,
  diningRoom,
  fireflies,
  kitchen,
  letterbox,
  lightRays,
  mist,
  props,
  screenTone,
  sparkle,
  speedLines,
  vignette,
} from '../lib/anime-kit';

// --- casting ---------------------------------------------------------------

const rin = (o: Parameters<typeof character>[0] = {}) =>
  character({
    hair: 'bun',
    hairColor: 'black',
    eyeColor: '#6b5a3f',
    outfit: 'apron',
    cloth: 'cream',
    cloth2: 'slate',
    ...o,
  });

const nana = (o: Parameters<typeof character>[0] = {}) =>
  character({
    hair: 'bun',
    hairColor: 'white',
    eyeColor: '#6b5a3f',
    outfit: 'yukata',
    cloth: 'plum',
    scale: 0.88,
    ...o,
  });

/** Kitchen floor line — Rin stands in front of the pass, not behind it. */
const FLOOR = 790;
/** Dining room floor line. */
const DINING = 812;

export default defineStory({
  slug: 'six-tables',
  title: 'Six Tables',
  logline:
    'A chef loses the fish, the bread and a plate on the worst night of her year — and then, ten minutes after closing, one more ticket comes through.',
  credit: 'Written and animated for Story Teller',
  voice: { stability: 0.44, speed: 0.96 },

  scenes: [
    // 1 ---------------------------------------------------------------------
    {
      id: 'street',
      palette: 'dusk',
      transition: 'fade',
      backdrop: city({ palette: 'dusk', seed: 'nameless-street', disc: 240, clouds: 3 }),
      layers: [{ id: 'sign', svg: props.signpost('#241c36', '#ffb15e'), x: 1180, y: 780, scale: 1.3 }],
      fx: [mist({ y: 720 }), vignette()],
      beats: [
        {
          text: 'On a narrow street with no name worth printing, there was a restaurant with six tables.',
          cues: [{ target: 'camera', do: 'scale', to: 1.14, dur: 'scene', ease: 'soft' }],
        },
        { text: 'It had been open for one year, almost to the day, and it was still standing.' },
        {
          text: 'The chef was called Rin, and she had not taken a day off since the sign went up.',
          hold: 0.8,
        },
      ],
    },

    // 2 ---------------------------------------------------------------------
    {
      id: 'prep',
      palette: 'day',
      transition: 'fade',
      backdrop: kitchen({ palette: 'day', seed: 'line' }),
      layers: [
        { id: 'pot', svg: props.stockpot('#4a5460', '#33384f'), x: 320, y: 646, scale: 1.1 },
        {
          id: 'rin',
          svg: rin({ pose: 'stand', expression: 'neutral', ink: '#33384f', rim: '#ffffff' }),
          x: 820,
          y: FLOOR,
          scale: 1,
          ambient: 'k-breathe',
        },
      ],
      fx: [lightRays({ seed: 'line', count: 3, angle: -18 }), vignette({ opacity: 0.26 })],
      beats: [
        {
          text: 'Mornings were the good part. Nobody in the room but the knives and the light.',
          cues: [{ target: 'camera', do: 'scale', to: 1.16, dur: 'scene', ease: 'soft' }],
        },
        {
          text: 'She set out the boards, ground the pepper, and tasted the stock twice, the way she had been taught.',
        },
        {
          text: 'By four o’clock everything was ready. That was the last moment the day made any sense.',
          hold: 0.7,
        },
      ],
    },

    // 3 ---------------------------------------------------------------------
    {
      id: 'rush',
      palette: 'day',
      transition: 'wipe',
      backdrop: kitchen({ palette: 'day', seed: 'line' }),
      layers: [
        { id: 'pot', svg: props.stockpot('#4a5460', '#33384f'), x: 320, y: 646, scale: 1.1 },
        {
          id: 'rin',
          svg: rin({ pose: 'walk', expression: 'determined', ink: '#33384f', rim: '#ffffff' }),
          x: 700,
          y: FLOOR,
          scale: 1,
          ambient: 'k-breathe',
        },
        { id: 'dish', svg: props.dish('#f4efe4', '#f0c674', '#33384f'), x: 1180, y: 700, opacity: 0 },
      ],
      fx: [speedLines({ seed: 'rush', cx: 800, cy: 460, count: 34, opacity: 0.16 }), vignette({ opacity: 0.3 })],
      beats: [
        {
          text: 'The first ticket came in at six. The next four came in at three minutes past six.',
          cues: [{ target: 'dish', do: 'enter', from: 'right', distance: 180, at: 0.6, dur: 1 }],
        },
        {
          text: 'Somebody had written about the place online, and the whole city had decided to arrive at once.',
          cues: [{ target: 'rin', do: 'move', dx: 220, dur: 'beat', ease: 'inOut' }],
        },
        {
          text: 'Rin cooked with both hands and stopped looking at the clock.',
          hold: 0.5,
          cues: [{ target: 'camera', do: 'scale', to: 1.18, dur: 'scene', ease: 'soft' }],
        },
      ],
    },

    // 4 ---------------------------------------------------------------------
    {
      id: 'fish',
      palette: 'dusk',
      transition: 'fade',
      backdrop: kitchen({ palette: 'dusk', seed: 'line' }),
      layers: [
        {
          id: 'rin',
          svg: rin({ pose: 'slump', expression: 'worried', ink: '#241c36', rim: '#ffd9a0' }),
          x: 860,
          y: FLOOR,
          scale: 1.02,
          ambient: 'k-breathe',
        },
      ],
      fx: [screenTone({ opacity: 0.1 }), vignette({ opacity: 0.36 })],
      beats: [
        {
          text: 'At seven the fish came in wrong. A whole crate of it, silver and useless.',
          cues: [{ target: 'camera', do: 'scale', to: 1.2, dur: 'scene', ease: 'soft' }],
        },
        { text: 'She changed the menu on the board, and did not let her face change with it.' },
        { text: 'The room did not notice. That, at least, was the job.', hold: 0.8 },
      ],
    },

    // 5 ---------------------------------------------------------------------
    {
      id: 'burn',
      palette: 'storm',
      transition: 'flash',
      backdrop: kitchen({ palette: 'storm', seed: 'line' }),
      layers: [
        { id: 'pot', svg: props.stockpot('#333a44', '#1b1f26'), x: 320, y: 646, scale: 1.2 },
        {
          id: 'rin',
          svg: rin({ pose: 'reach', expression: 'surprised', ink: '#1b1f26', rim: '#dfe7f0' }),
          x: 880,
          y: FLOOR,
          scale: 1.02,
          ambient: 'k-breathe',
        },
      ],
      fx: [mist({ y: 300, count: 8 }), vignette({ opacity: 0.48 })],
      beats: [
        {
          text: 'At eight the oven ran hot and took the bread with it.',
          cues: [{ target: 'camera', do: 'shake', strength: 9, at: 0.2, dur: 1.1 }],
        },
        {
          text: 'Smoke came up the wall, the alarm went off over the pass, and nobody could hear the orders any more.',
          cues: [
            { target: 'camera', do: 'flash', color: '#ffffff', at: 0.2, dur: 0.5 },
            { target: 'camera', do: 'scale', to: 1.2, dur: 'scene', ease: 'soft' },
          ],
        },
        {
          text: 'She waved a towel at the ceiling and laughed, because the other option was worse.',
          hold: 0.6,
        },
      ],
    },

    // 6 ---------------------------------------------------------------------
    {
      id: 'plate',
      palette: 'storm',
      transition: 'cut',
      backdrop: kitchen({ palette: 'storm', seed: 'line' }),
      layers: [
        {
          id: 'rin',
          svg: rin({ pose: 'sit', expression: 'sad', ink: '#1b1f26', rim: '#dfe7f0' }),
          x: 780,
          y: FLOOR + 10,
          scale: 1.05,
          ambient: 'k-breathe',
        },
        { id: 'dish', svg: props.dish('#dfe7f0', '#8b95a3', '#1b1f26'), x: 1060, y: 800, scale: 0.9 },
      ],
      fx: [screenTone({ opacity: 0.13 }), vignette({ opacity: 0.5 })],
      beats: [
        {
          text: 'At nine, carrying four plates she should have carried in two trips, she lost one.',
          cues: [
            { target: 'dish', do: 'move', dy: 60, at: 0.9, dur: 0.4, ease: 'in' },
            { target: 'dish', do: 'turn', deg: 34, at: 0.9, dur: 0.4, ease: 'in' },
            { target: 'camera', do: 'shake', strength: 20, at: 1.3, dur: 0.9 },
            { target: 'camera', do: 'flash', color: '#e8eef7', at: 1.3, dur: 0.4 },
          ],
        },
        { text: 'It came apart on the tiles in a way that made the whole kitchen go quiet.' },
        {
          text: 'She knelt down and picked up the pieces, and did not say anything at all.',
          hold: 1.1,
          cues: [{ target: 'camera', do: 'scale', to: 1.24, dur: 'beat', ease: 'soft' }],
        },
      ],
    },

    // 7 ---------------------------------------------------------------------
    {
      id: 'empty',
      palette: 'storm',
      transition: 'fade',
      backdrop: kitchen({ palette: 'storm', seed: 'line' }),
      layers: [
        {
          id: 'rin',
          svg: rin({ pose: 'slump', expression: 'closed', ink: '#1b1f26', rim: '#dfe7f0' }),
          x: 800,
          y: FLOOR,
          scale: 1,
          ambient: 'k-breathe',
        },
      ],
      fx: [letterbox({ height: 56 }), vignette({ opacity: 0.5 })],
      beats: [
        {
          text: 'By eleven the last table had gone, and the room was empty.',
          cues: [{ target: 'camera', do: 'scale', to: 1.14, dur: 'scene', ease: 'soft' }],
        },
        { text: 'The bin by the door was full of things she had meant to be proud of.' },
        {
          text: 'She sat down on an upturned crate in the middle of her own kitchen, and let her hands shake.',
          hold: 1.2,
        },
      ],
    },

    // 8 ---------------------------------------------------------------------
    {
      id: 'alley',
      palette: 'night',
      transition: 'fade',
      backdrop: city({ palette: 'night', seed: 'nameless-street', disc: 300, discY: 160 }),
      layers: [
        {
          id: 'rin',
          svg: rin({ pose: 'back', expression: 'neutral', ink: '#0d1128', rim: '#bcd2ff' }),
          x: 700,
          y: 800,
          scale: 1,
          ambient: 'k-breathe',
        },
        { id: 'lantern', svg: props.lantern('#ffcf7a', '#0d1128'), x: 1180, y: 640, scale: 0.9 },
      ],
      fx: [mist({ y: 740 }), vignette({ opacity: 0.5 })],
      beats: [
        {
          text: 'She went out to the alley, where the light from the door made a long yellow rectangle on the ground.',
          cues: [{ target: 'camera', do: 'scale', to: 1.15, dur: 'scene', ease: 'soft' }],
        },
        {
          text: 'It was cold, and it was quiet, and for a while she thought seriously about not going back inside.',
        },
        {
          text: 'Then she thought about who had taught her. And she went back inside.',
          hold: 0.9,
          cues: [{ target: 'rin', do: 'move', dx: -90, dur: 'beat', ease: 'inOut' }],
        },
      ],
    },

    // 9 ---------------------------------------------------------------------
    {
      id: 'memory',
      palette: 'memory',
      transition: 'iris',
      backdrop: kitchen({ palette: 'memory', seed: 'old-kitchen' }),
      layers: [
        {
          id: 'nana',
          svg: nana({ pose: 'point', expression: 'smile', ink: '#544632', rim: '#fffaf0' }),
          x: 640,
          y: FLOOR,
          ambient: 'k-breathe',
        },
        {
          id: 'young',
          svg: rin({ pose: 'stand', expression: 'surprised', ink: '#544632', rim: '#fffaf0', scale: 0.72 }),
          x: 920,
          y: FLOOR,
          ambient: 'k-breathe',
        },
      ],
      fx: [lightRays({ seed: 'old-kitchen', count: 3, angle: -20 }), screenTone({ opacity: 0.09 }), sparkle({ count: 10 })],
      beats: [
        {
          text: 'Her grandmother had cooked in a room half this size for forty-one years.',
          cues: [{ target: 'camera', do: 'scale', to: 1.16, dur: 'scene', ease: 'soft' }],
        },
        {
          text: 'She used to say that anybody can cook well on a good day. That is not what a cook is for.',
        },
        {
          text: 'The first thing she ever taught Rin was an egg, on rice, and nothing else at all.',
          hold: 1,
        },
      ],
    },

    // 10 --------------------------------------------------------------------
    {
      id: 'ticket',
      palette: 'night',
      transition: 'fade',
      backdrop: kitchen({ palette: 'night', seed: 'line' }),
      layers: [
        {
          id: 'rin',
          svg: rin({ pose: 'stand', expression: 'surprised', ink: '#0d1128', rim: '#bcd2ff' }),
          x: 700,
          y: FLOOR,
          scale: 1,
          ambient: 'k-breathe',
        },
        { id: 'ticket', svg: props.letter('#f6efdd', '#0d1128'), x: 1080, y: 620, scale: 1.1, opacity: 0 },
      ],
      fx: [vignette({ opacity: 0.46 })],
      beats: [
        {
          text: 'The machine over the pass clicked once. Ten minutes after closing, one more ticket.',
          cues: [
            { target: 'ticket', do: 'enter', from: 'top', distance: 120, at: 0.9, dur: 0.9, ease: 'anticipate' },
            { target: 'camera', do: 'scale', to: 1.2, dur: 'scene', ease: 'soft' },
          ],
        },
        {
          text: 'Rin stared at it for a long time, because it did not have a table number written on it.',
          cues: [{ target: 'ticket', do: 'scale', to: 1.3, dur: 'beat', ease: 'soft' }],
        },
        {
          text: 'It said, in handwriting she knew: egg on rice, the way you used to make it.',
          hold: 1.3,
        },
      ],
    },

    // 11 --------------------------------------------------------------------
    {
      id: 'cooking',
      palette: 'night',
      transition: 'fade',
      backdrop: kitchen({ palette: 'night', seed: 'line' }),
      layers: [
        { id: 'pot', svg: props.stockpot('#232c55', '#0d1128'), x: 340, y: 646, scale: 1.1 },
        {
          id: 'rin',
          svg: rin({ pose: 'reach', expression: 'determined', ink: '#0d1128', rim: '#bcd2ff' }),
          x: 820,
          y: FLOOR,
          scale: 1.02,
          ambient: 'k-breathe',
        },
        { id: 'dish', svg: props.dish('#f4efe4', '#f6d97a', '#0d1128'), x: 1140, y: 700, opacity: 0 },
      ],
      fx: [fireflies({ seed: 'warmth', count: 12, color: '#ffe9a8' }), vignette({ opacity: 0.4 })],
      beats: [
        {
          text: 'She did not shout at anybody. She washed her hands and started the rice.',
          cues: [{ target: 'camera', do: 'scale', to: 1.18, dur: 'scene', ease: 'soft' }],
        },
        {
          text: 'It took four minutes, and she gave it all four, which she had not given anything all night.',
          cues: [{ target: 'dish', do: 'fade', to: 1, at: 1.2, dur: 1.4 }],
        },
        {
          text: 'Then she picked up the plate, and pushed the door open with her shoulder.',
          hold: 0.9,
          cues: [{ target: 'rin', do: 'move', dx: 190, dur: 'beat', ease: 'in' }],
        },
      ],
    },

    // 12 --------------------------------------------------------------------
    {
      id: 'reveal',
      palette: 'dusk',
      transition: 'flash',
      backdrop: diningRoom({ palette: 'dusk', seed: 'front-of-house' }),
      layers: [
        {
          id: 'rin',
          svg: rin({ pose: 'stand', expression: 'surprised', ink: '#241c36', rim: '#ffd9a0' }),
          x: 400,
          y: DINING,
          scale: 1,
          ambient: 'k-breathe',
        },
        {
          id: 'guest1',
          svg: character({ hair: 'short', hairColor: 'brown', outfit: 'coat', cloth: 'teal', pose: 'stand', expression: 'smile', ink: '#241c36', rim: '#ffd9a0' }),
          x: 940,
          y: DINING,
          scale: 0.92,
          flip: true,
          ambient: 'k-breathe',
          opacity: 0,
        },
        {
          id: 'guest2',
          svg: character({ hair: 'ponytail', hairColor: 'auburn', outfit: 'dress', cloth: 'ochre', pose: 'stand', expression: 'smile', ink: '#241c36', rim: '#ffd9a0' }),
          x: 1220,
          y: DINING,
          scale: 0.9,
          flip: true,
          ambient: 'k-breathe',
          opacity: 0,
        },
      ],
      fx: [sparkle({ seed: 'party', count: 18 }), vignette({ opacity: 0.3 })],
      beats: [
        {
          text: 'The dining room was full.',
          cues: [
            { target: 'guest1', do: 'fade', to: 1, dur: 0.7 },
            { target: 'guest2', do: 'fade', to: 1, at: 0.2, dur: 0.7 },
            { target: 'camera', do: 'scale', to: 1.16, dur: 'scene', ease: 'soft' },
          ],
        },
        {
          text: 'Every one of the six tables, and people standing at the back, and the greengrocer from two doors down holding a cake.',
        },
        {
          text: 'They had been out there in the dark, with the lights off, for nearly an hour.',
          hold: 1.1,
        },
      ],
    },

    // 13 --------------------------------------------------------------------
    {
      id: 'nana',
      palette: 'dusk',
      transition: 'fade',
      // The window table is slot 1, so it is cleared and staged here instead: the
      // guest sits, then the table is drawn in front of her.
      backdrop: diningRoom({ palette: 'dusk', seed: 'front-of-house', clearTable: 1 }),
      layers: [
        {
          id: 'nana',
          svg: nana({ pose: 'sit', expression: 'smile', ink: '#241c36', rim: '#ffd9a0' }),
          x: 806,
          y: 762,
          ambient: 'k-breathe',
        },
        { id: 'table', svg: props.diningTable('#b39189', '#96736f', '#241c36'), x: 806, y: 812, scale: 0.92 },
        {
          id: 'rin',
          svg: rin({ pose: 'stand', expression: 'sad', ink: '#241c36', rim: '#ffd9a0' }),
          x: 420,
          y: DINING,
          scale: 1,
          flip: true,
          ambient: 'k-breathe',
        },
        { id: 'dish', svg: props.dish('#f4efe4', '#f6d97a', '#241c36'), x: 876, y: 636, scale: 0.86, opacity: 0 },
      ],
      fx: [fireflies({ seed: 'candles', count: 14 }), vignette({ opacity: 0.34 })],
      beats: [
        {
          text: 'At the small table by the window, where she had always used to sit, was a woman who had not left her house in two years.',
          cues: [{ target: 'camera', do: 'scale', to: 1.14, dur: 'scene', ease: 'soft' }],
        },
        {
          text: 'She looked at the plate, and then at Rin, and she nodded once.',
          cues: [{ target: 'dish', do: 'fade', to: 1, at: 0.4, dur: 1 }],
        },
        {
          text: 'It was a bad day, she said. Everybody gets one. You are still here.',
          hold: 1.5,
        },
      ],
    },

    // 14 --------------------------------------------------------------------
    {
      id: 'morning',
      palette: 'dawn',
      transition: 'fade',
      backdrop: kitchen({ palette: 'dawn', seed: 'line' }),
      layers: [
        { id: 'pot', svg: props.stockpot('#4a4468', '#2b2340'), x: 330, y: 646, scale: 1.1 },
        {
          id: 'rin',
          svg: rin({ pose: 'stand', expression: 'smile', ink: '#2b2340', rim: '#ffe2b8' }),
          x: 840,
          y: FLOOR,
          scale: 1,
          ambient: 'k-breathe',
        },
      ],
      fx: [lightRays({ seed: 'after', count: 3, angle: -16 }), sparkle({ seed: 'after', count: 10 }), vignette({ opacity: 0.26 })],
      beats: [
        {
          text: 'They stayed until three. Somebody found the radio. The greengrocer’s cake was terrible and they ate all of it.',
          cues: [{ target: 'camera', do: 'scale', to: 1.14, dur: 'scene', ease: 'soft' }],
        },
        {
          text: 'In the morning Rin swept the floor, and set out the boards, and ground the pepper.',
        },
        {
          text: 'There were six tables. There was one year behind her. And there was tomorrow, which was the entire point.',
          hold: 2.2,
        },
      ],
    },
  ],
});
