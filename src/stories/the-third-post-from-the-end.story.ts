/**
 * "The Third Post From the End" — an original short.
 *
 * This is the reference story: it is written to exercise every part of the art kit
 * (day and night, six palettes, two characters, weather, impact FX, camera pushes)
 * so that a change to the engine or the kit is caught here before it reaches
 * anything else.
 *
 * Shape: 14 scenes, 42 beats, ~4:50 at a storybook reading pace.
 */

import { defineStory } from '../lib/story';
import {
  character,
  city,
  field,
  fireflies,
  forest,
  lightRays,
  mist,
  ocean,
  platform,
  props,
  rain,
  ridge,
  room,
  sakura,
  screenTone,
  shrine,
  snow,
  sparkle,
  speedLines,
  vignette,
} from '../lib/anime-kit';

// --- casting ---------------------------------------------------------------
// Defined once so the same two people look like themselves in all fourteen scenes.
// Only `pose` and `expression` change from shot to shot.

const yuki = (pose: Parameters<typeof character>[0] = {}) =>
  character({
    hair: 'long',
    hairColor: 'black',
    eyeColor: '#5b6fb8',
    outfit: 'uniform',
    cloth: 'indigo',
    ...pose,
  });

const sora = (pose: Parameters<typeof character>[0] = {}) =>
  character({
    hair: 'messy',
    hairColor: 'brown',
    eyeColor: '#6b8f5a',
    outfit: 'hoodie',
    cloth: 'moss',
    ...pose,
  });

/** Platform deck sits at y=750, so anyone standing on it has their feet just below. */
const DECK = 786;

export default defineStory({
  slug: 'the-third-post-from-the-end',
  title: 'The Third Post From the End',
  logline:
    'A girl lights a lantern at a forgotten railway station every night for a year. On the last train before the line closes, someone finally gets off.',
  credit: 'Written and animated for Story Teller',
  voice: { stability: 0.45, speed: 0.96 },

  scenes: [
    // 1 ---------------------------------------------------------------------
    {
      id: 'valley',
      palette: 'dusk',
      transition: 'fade',
      backdrop: ridge({ palette: 'dusk', seed: 'valley', disc: 1240, clouds: 5 }),
      layers: [
        { id: 'birds', svg: props.bird('#3a2f4a'), x: 1080, y: 250, scale: 1.6, opacity: 0.7 },
        { id: 'birds2', svg: props.bird('#3a2f4a'), x: 1180, y: 300, scale: 1.1, opacity: 0.55 },
      ],
      fx: [mist({ y: 640 }), vignette()],
      beats: [
        {
          text: 'In the valley where the mountains fold over each other, there was a railway line that everyone had forgotten.',
          cues: [{ target: 'camera', do: 'scale', to: 1.12, dur: 'scene', ease: 'soft' }],
        },
        { text: 'One train came up in the morning. One train came down at night. That was all.' },
        {
          text: 'And at the small station at the end of it, a girl lit a lantern. Every single evening.',
          hold: 0.8,
          cues: [{ target: 'birds', do: 'move', dx: -260, dy: -60, dur: 'beat', ease: 'linear' }],
        },
      ],
    },

    // 2 ---------------------------------------------------------------------
    {
      id: 'lighting',
      palette: 'dusk',
      transition: 'fade',
      backdrop: platform({ palette: 'dusk', seed: 'station', disc: 300 }),
      layers: [
        { id: 'lantern', svg: props.lantern('#ffb15e', '#241c36'), x: 976, y: 470, opacity: 0 },
        {
          id: 'yuki',
          svg: yuki({ pose: 'reach', expression: 'neutral', ink: '#241c36', rim: '#ffd9a0' }),
          x: 900,
          y: DECK,
          scale: 0.95,
          ambient: 'k-breathe',
          opacity: 0,
        },
      ],
      fx: [vignette({ opacity: 0.3 })],
      beats: [
        {
          text: 'Her name was Yuki, and she was very good at waiting.',
          cues: [{ target: 'yuki', do: 'enter', from: 'left', distance: 200, dur: 1.1 }],
        },
        {
          text: 'She hung the lantern on the third post from the end, where the light would fall across the tracks.',
          cues: [
            { target: 'lantern', do: 'fade', to: 1, at: 0.6, dur: 1.2 },
            { target: 'camera', do: 'scale', to: 1.2, dur: 'scene', ease: 'soft' },
          ],
        },
        {
          text: 'So that anyone passing in the dark would know that somebody was still here.',
          hold: 0.6,
        },
      ],
    },

    // 3 ---------------------------------------------------------------------
    {
      id: 'promise',
      palette: 'memory',
      transition: 'iris',
      backdrop: field({ palette: 'memory', seed: 'hill', disc: 1120, clouds: 3 }),
      layers: [
        {
          id: 'yuki',
          svg: yuki({ pose: 'stand', expression: 'smile', ink: '#544632', rim: '#fffaf0' }),
          x: 660,
          y: 800,
          scale: 0.9,
          ambient: 'k-breathe',
        },
        {
          id: 'sora',
          svg: sora({ pose: 'point', expression: 'smile', ink: '#544632', rim: '#fffaf0' }),
          x: 900,
          y: 800,
          scale: 0.9,
          flip: true,
          ambient: 'k-breathe',
        },
      ],
      fx: [lightRays({ seed: 'hill', count: 6 }), sakura({ seed: 'hill', count: 18, color: '#e8d3ae' }), screenTone({ opacity: 0.08 })],
      beats: [
        {
          text: 'A year before, on a hill above the town, a boy had told her he was leaving.',
          cues: [{ target: 'camera', do: 'scale', to: 1.14, dur: 'scene', ease: 'soft' }],
        },
        {
          text: 'He said the city was full of things worth seeing. He said he would come back and tell her all of them.',
          cues: [{ target: 'sora', do: 'bob', amount: 6, dur: 'beat' }],
        },
        {
          text: 'She had not asked him to promise. She had simply believed him, which is a harder thing.',
          hold: 0.9,
        },
      ],
    },

    // 4 ---------------------------------------------------------------------
    {
      id: 'waiting',
      palette: 'night',
      transition: 'fade',
      backdrop: platform({ palette: 'night', seed: 'station', disc: 300, discY: 170 }),
      layers: [
        { id: 'lantern', svg: props.lantern('#ffcf7a', '#0d1128'), x: 976, y: 470 },
        {
          id: 'yuki',
          svg: yuki({ pose: 'stand', expression: 'neutral', ink: '#0d1128', rim: '#bcd2ff' }),
          x: 620,
          y: DECK,
          scale: 0.95,
          ambient: 'k-breathe',
        },
        { id: 'train', svg: props.trainCar('#2a3358', '#ffe9b0', '#0d1128'), x: 2400, y: 742, scale: 0.72, opacity: 0 },
      ],
      fx: [snow({ seed: 'winter', count: 46 }), vignette()],
      beats: [
        { text: 'Autumn went. Winter came, and the lantern froze to the post.' },
        {
          text: 'The last train would pass at ten, its windows warm and full of strangers.',
          cues: [
            { target: 'train', do: 'show', at: 0 },
            { target: 'train', do: 'move', dx: -3000, dur: 'beat', ease: 'linear' },
          ],
        },
        {
          text: 'Yuki would watch it go, and then walk home along the rails.',
          hold: 0.5,
          cues: [{ target: 'camera', do: 'scale', to: 1.1, dur: 'beat', ease: 'soft' }],
        },
      ],
    },

    // 5 ---------------------------------------------------------------------
    {
      id: 'city',
      palette: 'night',
      transition: 'wipe',
      backdrop: city({ palette: 'night', seed: 'metro', disc: 250, discY: 150 }),
      layers: [
        {
          id: 'sora',
          svg: sora({ pose: 'slump', expression: 'closed', ink: '#0d1128', rim: '#bcd2ff' }),
          x: 460,
          y: 800,
          scale: 1.05,
          ambient: 'k-breathe',
        },
        { id: 'glow', svg: props.lantern('#ffb15e', '#0d1128'), x: 1380, y: 560, scale: 0.5, opacity: 0 },
      ],
      fx: [vignette({ opacity: 0.5 })],
      beats: [
        {
          text: 'Far away, the boy — his name was Sora — was learning that a city is mostly noise.',
          cues: [{ target: 'camera', do: 'move', dx: -70, dur: 'scene', ease: 'soft' }, { target: 'camera', do: 'scale', to: 1.16, dur: 'scene', ease: 'soft' }],
        },
        { text: 'Every night he took a train home, and every night he fell asleep against the window.' },
        {
          text: 'And every night, somewhere near the end of the line, a small orange light went past.',
          hold: 0.7,
          cues: [{ target: 'glow', do: 'fade', to: 1, at: 1.4, dur: 1.6 }],
        },
      ],
    },

    // 6 ---------------------------------------------------------------------
    {
      id: 'storm',
      palette: 'storm',
      transition: 'flash',
      backdrop: ridge({ palette: 'storm', seed: 'gale', disc: false, clouds: 7 }),
      layers: [
        {
          id: 'yuki',
          svg: yuki({ pose: 'sit', expression: 'sad', ink: '#1b1f26', rim: '#dfe7f0' }),
          x: 820,
          y: 812,
          scale: 1.05,
        },
        { id: 'lantern', svg: props.lantern('#8d939c', '#1b1f26'), x: 1120, y: 830, scale: 0.8, opacity: 0 },
      ],
      fx: [rain({ seed: 'gale', count: 110, angle: 18 }), vignette({ opacity: 0.55 })],
      beats: [
        {
          text: 'In February the rain came sideways for nine days.',
          cues: [{ target: 'camera', do: 'shake', strength: 8, at: 0.2, dur: 1.4 }],
        },
        {
          text: 'On the ninth, the wind took the lantern off the post and rolled it down the tracks.',
          cues: [
            { target: 'lantern', do: 'show', at: 0.3 },
            { target: 'lantern', do: 'move', dx: 300, at: 0.3, dur: 1.8, ease: 'out' },
            { target: 'lantern', do: 'turn', deg: 420, at: 0.3, dur: 1.8, ease: 'out' },
          ],
        },
        {
          text: 'Yuki knelt in the water and did not get up for a long time.',
          hold: 1,
          cues: [{ target: 'camera', do: 'scale', to: 1.22, dur: 'beat', ease: 'soft' }],
        },
      ],
    },

    // 7 ---------------------------------------------------------------------
    {
      id: 'walk',
      palette: 'night',
      transition: 'fade',
      backdrop: forest({ palette: 'night', seed: 'pines' }),
      layers: [
        {
          id: 'yuki',
          svg: yuki({ pose: 'walk', expression: 'sad', ink: '#0d1128', rim: '#bcd2ff' }),
          x: 1180,
          y: 830,
          scale: 1,
          ambient: 'k-breathe',
        },
      ],
      fx: [mist({ y: 760, count: 7 }), vignette({ opacity: 0.55 })],
      beats: [
        {
          text: 'She carried the broken thing home through the pines.',
          cues: [{ target: 'yuki', do: 'move', dx: -300, dur: 'scene', ease: 'linear' }],
        },
        { text: 'She told herself she would stop. That a year was enough. That she had been very silly.' },
        {
          text: 'She said it out loud, twice, to see if it would hold.',
          hold: 1.1,
          cues: [{ target: 'camera', do: 'scale', to: 1.12, dur: 'beat', ease: 'soft' }],
        },
      ],
    },

    // 8 ---------------------------------------------------------------------
    {
      id: 'letter',
      palette: 'memory',
      transition: 'fade',
      backdrop: room({ palette: 'memory', seed: 'home' }),
      layers: [
        {
          id: 'yuki',
          svg: yuki({ pose: 'sit', expression: 'surprised', ink: '#544632', rim: '#fffaf0' }),
          x: 520,
          y: 790,
          scale: 1.05,
          ambient: 'k-breathe',
        },
        { id: 'letter', svg: props.letter('#f6efdd', '#544632'), x: 960, y: 800, scale: 1.4, opacity: 0 },
      ],
      fx: [lightRays({ seed: 'home', count: 4, angle: -22 }), sparkle({ seed: 'home', count: 12 })],
      beats: [
        {
          text: 'In the morning there was a letter under the door, and no stamp on it.',
          cues: [
            { target: 'letter', do: 'enter', from: 'bottom', distance: 120, at: 0.8, dur: 1 },
            { target: 'camera', do: 'scale', to: 1.15, dur: 'scene', ease: 'soft' },
          ],
        },
        {
          text: 'It said: I have seen your light from the train four hundred and eleven times.',
          cues: [{ target: 'letter', do: 'scale', to: 1.15, dur: 'beat', ease: 'soft' }],
        },
        {
          text: 'It said: I have been too much of a coward to get off. Please leave it on one more night.',
          hold: 1,
        },
      ],
    },

    // 9 ---------------------------------------------------------------------
    {
      id: 'lastnight',
      palette: 'dusk',
      transition: 'fade',
      backdrop: platform({ palette: 'dusk', seed: 'station', disc: 300 }),
      layers: [
        { id: 'lantern', svg: props.lantern('#ffb15e', '#241c36'), x: 976, y: 470, opacity: 0 },
        {
          id: 'yuki',
          svg: yuki({ pose: 'reach', expression: 'determined', ink: '#241c36', rim: '#ffd9a0' }),
          x: 900,
          y: DECK,
          scale: 0.95,
          ambient: 'k-breathe',
        },
      ],
      fx: [sakura({ seed: 'spring', count: 24 }), vignette({ opacity: 0.34 })],
      beats: [
        { text: 'The branch line closed that spring. The evening of the last train, the whole town came to look.' },
        {
          text: 'Yuki did not come to look. She came to hang a lantern on the third post from the end.',
          cues: [{ target: 'camera', do: 'scale', to: 1.18, dur: 'scene', ease: 'soft' }],
        },
        {
          text: 'Her hands were not steady. She lit it anyway.',
          hold: 0.8,
          cues: [{ target: 'lantern', do: 'fade', to: 1, at: 0.9, dur: 1.4 }],
        },
      ],
    },

    // 10 --------------------------------------------------------------------
    {
      id: 'approach',
      palette: 'night',
      transition: 'fade',
      backdrop: ridge({ palette: 'night', seed: 'valley', disc: 1240, discY: 190 }),
      layers: [
        { id: 'lantern', svg: props.lantern('#ffcf7a', '#0d1128'), x: 300, y: 720, scale: 1.1 },
        // The distant train is the subject of this scene — without it the frame is
        // just an empty valley while the narration describes something arriving.
        { id: 'train', svg: props.trainCar('#232c55', '#ffe9b0', '#0d1128'), x: 1290, y: 686, scale: 0.34, opacity: 0.9 },
        { id: 'headlight', svg: props.lantern('#eaf2ff', '#0d1128'), x: 1420, y: 640, scale: 0.4, opacity: 0 },
      ],
      fx: [fireflies({ seed: 'valley-night', count: 22 }), mist({ y: 700 }), vignette()],
      beats: [
        {
          text: 'At two minutes past ten, a sound came down the valley that was not the wind.',
          cues: [{ target: 'camera', do: 'scale', to: 1.16, dur: 'scene', ease: 'soft' }],
        },
        {
          text: 'The rails began to hum. The lantern swung once, then twice.',
          cues: [
            { target: 'lantern', do: 'turn', deg: 9, at: 0.2, dur: 0.8, ease: 'inOut' },
            { target: 'lantern', do: 'turn', deg: -18, at: 1, dur: 1, ease: 'inOut' },
            { target: 'lantern', do: 'turn', deg: 9, at: 2, dur: 0.9, ease: 'inOut' },
          ],
        },
        {
          text: 'And the light of it caught the underside of the trees.',
          hold: 0.5,
          cues: [
            { target: 'headlight', do: 'fade', to: 1, dur: 'beat', ease: 'in' },
            { target: 'train', do: 'move', dx: -160, dur: 'beat', ease: 'in' },
            { target: 'train', do: 'scale', to: 1.35, dur: 'beat', ease: 'in' },
          ],
        },
      ],
    },

    // 11 --------------------------------------------------------------------
    {
      id: 'arrival',
      palette: 'night',
      transition: 'flash',
      backdrop: platform({ palette: 'night', seed: 'station', disc: false }),
      layers: [
        { id: 'train', svg: props.trainCar('#2a3358', '#ffe9b0', '#0d1128'), x: 2600, y: 720, scale: 0.78 },
        { id: 'lantern', svg: props.lantern('#ffcf7a', '#0d1128'), x: 976, y: 470 },
      ],
      fx: [speedLines({ seed: 'arrive', count: 46, cx: 900, cy: 500, opacity: 0.34 }), vignette({ opacity: 0.5 })],
      beats: [
        {
          text: 'The train came through the cutting far too fast, the way last things always do.',
          cues: [
            { target: 'train', do: 'move', dx: -1700, dur: 'beat', ease: 'linear' },
            { target: 'camera', do: 'scale', to: 1.14, dur: 'scene', ease: 'soft' },
          ],
        },
        {
          text: 'Then the brakes took hold, and the whole valley filled with white noise and steam.',
          cues: [
            { target: 'train', do: 'move', dx: -140, dur: 'beat', ease: 'out' },
            { target: 'camera', do: 'shake', strength: 16, at: 0, dur: 1.2 },
            { target: 'camera', do: 'flash', color: '#ffffff', at: 0.1, dur: 0.6 },
          ],
        },
        {
          text: 'And it stopped. For the first time in a year, it stopped.',
          hold: 1.2,
        },
      ],
    },

    // 12 --------------------------------------------------------------------
    {
      id: 'meeting',
      palette: 'night',
      transition: 'fade',
      backdrop: platform({ palette: 'night', seed: 'station', disc: false }),
      layers: [
        { id: 'train', svg: props.trainCar('#2a3358', '#ffe9b0', '#0d1128'), x: 300, y: 720, scale: 0.78 },
        { id: 'lantern', svg: props.lantern('#ffcf7a', '#0d1128'), x: 976, y: 470 },
        {
          id: 'sora',
          svg: sora({ pose: 'stand', expression: 'worried', ink: '#0d1128', rim: '#bcd2ff' }),
          x: 700,
          y: DECK,
          scale: 0.95,
          ambient: 'k-breathe',
          opacity: 0,
        },
        {
          id: 'yuki',
          svg: yuki({ pose: 'stand', expression: 'surprised', ink: '#0d1128', rim: '#bcd2ff' }),
          x: 1120,
          y: DECK,
          scale: 0.95,
          flip: true,
          ambient: 'k-breathe',
        },
      ],
      fx: [fireflies({ seed: 'meet', count: 14 }), vignette({ opacity: 0.44 })],
      beats: [
        {
          text: 'A door opened. A boy stepped down onto the platform with a bag he had clearly packed badly.',
          cues: [{ target: 'sora', do: 'enter', from: 'left', distance: 160, at: 0.5, dur: 1.3 }],
        },
        {
          text: 'He looked at the lantern first. Then, at last, at her.',
          cues: [{ target: 'camera', do: 'scale', to: 1.2, dur: 'scene', ease: 'soft' }],
        },
        {
          text: 'Neither of them said anything worth writing down. It did not seem to matter.',
          hold: 1.4,
          cues: [{ target: 'sora', do: 'move', dx: 110, dur: 'beat', ease: 'soft' }],
        },
      ],
    },

    // 13 --------------------------------------------------------------------
    {
      id: 'steps',
      palette: 'dusk',
      transition: 'fade',
      backdrop: shrine({ palette: 'dusk', seed: 'hilltop', disc: 260 }),
      layers: [
        {
          id: 'yuki',
          svg: yuki({ pose: 'walk', expression: 'smile', ink: '#241c36', rim: '#ffd9a0' }),
          x: 700,
          y: 880,
          scale: 0.8,
          ambient: 'k-breathe',
        },
        {
          id: 'sora',
          svg: sora({ pose: 'walk', expression: 'smile', ink: '#241c36', rim: '#ffd9a0' }),
          x: 880,
          y: 880,
          scale: 0.8,
          ambient: 'k-breathe',
        },
      ],
      fx: [sakura({ seed: 'shrine', count: 22 }), vignette({ opacity: 0.34 })],
      beats: [
        {
          text: 'They walked up to the shrine because it was the only place still open.',
          cues: [
            { target: 'yuki', do: 'move', dy: -120, dur: 'scene', ease: 'linear' },
            { target: 'sora', do: 'move', dy: -120, dur: 'scene', ease: 'linear' },
            { target: 'camera', do: 'scale', to: 1.12, dur: 'scene', ease: 'soft' },
          ],
        },
        { text: 'He told her about the city — the towers, the trains, the four hundred and eleven nights.' },
        { text: 'She told him he was an idiot. He agreed. They kept climbing.', hold: 1 },
      ],
    },

    // 14 --------------------------------------------------------------------
    {
      id: 'morning',
      palette: 'dawn',
      transition: 'fade',
      backdrop: ocean({ palette: 'dawn', seed: 'coast', disc: 1140, discY: 250 }),
      layers: [
        { id: 'lantern', svg: props.lantern('#ffb15e', '#2b2340'), x: 300, y: 730, scale: 1.35, opacity: 0 },
        { id: 'birds', svg: props.bird('#5d5580'), x: 900, y: 220, scale: 1.4, opacity: 0.65 },
      ],
      fx: [lightRays({ seed: 'coast', count: 3, angle: -10, color: '#ffe6c4' }), sparkle({ seed: 'coast', count: 14 }), vignette({ opacity: 0.28 })],
      beats: [
        {
          text: 'By morning the line was gone, and the rails were already going quiet under the grass.',
          cues: [
            { target: 'camera', do: 'scale', to: 1.14, dur: 'scene', ease: 'soft' },
            { target: 'birds', do: 'move', dx: 300, dy: -90, dur: 'scene', ease: 'linear' },
          ],
        },
        {
          text: 'But on the third post from the end, someone had hung a lantern.',
          cues: [{ target: 'lantern', do: 'fade', to: 1, at: 0.4, dur: 1.6 }],
        },
        {
          text: 'And it is still there, in case anyone is passing in the dark.',
          hold: 2.4,
        },
      ],
    },
  ],
});
