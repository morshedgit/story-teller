/**
 * "Skip the Horizon" — ~60 seconds, twelve shots, twelve beats.
 *
 * An unhurried evening beach walk turns into a surreal cosmic encounter when
 * skipping a stone accidentally cracks open the boundary of the sky.
 */

import { defineStory, type Cue } from '../../lib/story';
import {
  PALETTES,
  character,
  props,
  ocean,
  oceanFrozen,
  skyFracture,
  cosmicRift,
  oceanPatched,
  screenTone,
  sparkle,
  mist,
  vignette,
} from './art';

/** Ground line for beach shoreline shots. Feet go here. */
const FLOOR = 780;

const P = PALETTES;

/**
 * Frame a shot tight on a world point (x, y) with a given zoom.
 * Snaps instantly (dur: 0.001) so the shot opens already framed.
 */
const closeOn = (x: number, y: number, zoom: number): Cue[] => [
  { target: 'camera', do: 'scale', to: zoom, at: 0, dur: 0.001 },
  { target: 'camera', do: 'move', dx: -(x - 800) * zoom, dy: -(y - 450) * zoom, at: 0, dur: 0.001 },
];

/** Cast Leo once — consistent hoodie, messy black hair, slate palette. */
const leo = (o: Parameters<typeof character>[0] = {}) =>
  character({
    hair: 'messy',
    hairColor: 'black',
    eyeColor: '#4f7ea8',
    outfit: 'hoodie',
    cloth: 'slate',
    cloth2: 'indigo',
    ...o,
  });

export default defineStory({
  slug: 'skip-the-horizon',
  title: 'Skip the Horizon',
  logline: 'A quiet dusk walk on the beach turns cosmic when a skipped stone cracks the sky.',
  ambientAudio: '/audio/ambient/ocean-waves.mp3',
  voice: {
    id: 'kokoro-en-v0_19',
    stability: 0.55,
    speed: 0.9,
  },
  scenes: [
    // --- ACT I: THE ROUTINE --------------------------------------------------
    {
      // 1. Extreme Wide Shot (EWS) — Establishing loneliness & routine
      id: 'dusk-walk',
      palette: P.dusk,
      transition: 'fade',
      backdrop: ocean({ palette: P.dusk, seed: 'shoreline', disc: 1200 }),
      layers: [
        {
          id: 'hero',
          svg: leo({ pose: 'walk', expression: 'neutral', ink: P.dusk.ink, rim: P.dusk.rim }),
          x: 620,
          y: FLOOR,
          ambient: 'k-breathe',
        },
      ],
      fx: [mist({ opacity: 0.12 }), vignette()],
      beats: [
        {
          text: 'Leo walked the coastline at dusk because the rhythm of the ocean felt dependable and still.',
          cues: [
            ...closeOn(760, 480, 1.15),
            { target: 'camera', do: 'move', dx: -50, dur: 'scene', ease: 'linear' },
          ],
          hold: 0.4,
        },
      ],
    },

    {
      // 2. Medium Shot (MS) — Finding the skipping stone
      id: 'find-stone',
      palette: P.dusk,
      transition: 'cut',
      backdrop: ocean({ palette: P.dusk, seed: 'shore-detail', disc: false }),
      layers: [
        {
          id: 'hero',
          svg: leo({ pose: 'slump', expression: 'smile', ink: P.dusk.ink, rim: P.dusk.rim }),
          x: 800,
          y: FLOOR,
          scale: 1.25,
        },
        {
          id: 'stone',
          svg: props.pebble(P.dusk.near, P.dusk.ink),
          x: 840,
          y: FLOOR - 20,
          scale: 1.2,
        },
      ],
      fx: [vignette()],
      beats: [
        {
          text: 'He spotted a flat black stone by the foam line, weighed it in his palm, and squared his shoulders.',
          cues: [
            ...closeOn(800, 520, 1.45),
            { target: 'camera', do: 'scale', to: 1.54, dur: 'scene', ease: 'soft' },
          ],
          hold: 0.4,
        },
      ],
    },

    {
      // 3. Medium Close-Up (MCU) — The throw
      id: 'the-throw',
      palette: P.dusk,
      transition: 'cut',
      backdrop: ocean({ palette: P.dusk, seed: 'throw-angle', disc: 1260 }),
      layers: [
        {
          id: 'hero',
          svg: leo({ pose: 'reach', expression: 'determined', ink: P.dusk.ink, rim: P.dusk.rim }),
          x: 750,
          y: FLOOR,
          scale: 1.3,
        },
      ],
      fx: [vignette()],
      beats: [
        {
          text: 'He whipped his wrist low across the mirror surf. One skip. Two skips. Three.',
          cues: [
            ...closeOn(750, 480, 1.6),
            { target: 'camera', do: 'move', dx: 45, dur: 'scene', ease: 'linear' },
          ],
          hold: 0.6,
        },
      ],
    },

    {
      // 4. Wide Shot (WS) — The Clink in Mid-Air
      id: 'the-clink',
      palette: P.dusk,
      transition: 'cut',
      backdrop: ocean({ palette: P.dusk, seed: 'horizon-view', disc: 1100 }),
      layers: [
        {
          id: 'stone-flight',
          svg: props.pebble(P.dusk.near, P.dusk.ink),
          x: 900,
          y: 440,
          scale: 1.0,
        },
      ],
      fx: [screenTone({ opacity: 0.15 }), vignette()],
      beats: [
        {
          text: 'On the fourth skip, the stone struck empty air with the sharp ring of china on glass.',
          cues: [
            ...closeOn(880, 460, 1.3),
            { target: 'camera', do: 'shake', strength: 7, at: 3.2, dur: 0.45 },
          ],
          hold: 0.7,
        },
      ],
    },

    // --- ACT II: THE CRACK IN THE SKY ----------------------------------------
    {
      // 5. Close-Up (CU) — Reaction to frozen waves
      id: 'ocean-freeze',
      palette: P.glitch,
      transition: 'cut',
      backdrop: oceanFrozen({ palette: P.glitch, seed: 'frozen-sea' }),
      layers: [
        {
          id: 'hero',
          svg: leo({ pose: 'stand', expression: 'surprised', ink: P.glitch.ink, rim: P.glitch.rim }),
          x: 800,
          y: FLOOR,
          scale: 1.75,
          ambient: 'k-breathe',
        },
      ],
      fx: [screenTone({ opacity: 0.2 }), vignette()],
      beats: [
        {
          text: 'The ocean froze mid-swell. The roar of the surf cut out like a pulled plug.',
          cues: [
            ...closeOn(800, 420, 2.2),
            { target: 'camera', do: 'scale', to: 2.32, dur: 'scene', ease: 'soft' },
          ],
          hold: 0.6,
        },
      ],
    },

    {
      // 6. Tight Insert / Zoom (Insert) — The fracture line
      id: 'sky-fracture',
      palette: P.glitch,
      transition: 'cut',
      backdrop: skyFracture({ palette: P.glitch, seed: 'sky-rip' }),
      fx: [sparkle({ opacity: 0.4 }), vignette()],
      beats: [
        {
          text: 'A glowing fracture spiderwebbed across the twilight, peeling open the seam of the sky.',
          cues: [
            ...closeOn(800, 450, 1.8),
            { target: 'camera', do: 'scale', to: 2.05, dur: 'scene', ease: 'soft' },
          ],
          hold: 0.5,
        },
      ],
    },

    {
      // 7. Extreme Wide Shot (EWS) — The Cosmic Engine
      id: 'cosmic-engine',
      palette: P.cosmic,
      transition: 'flash',
      backdrop: cosmicRift({ palette: P.cosmic, seed: 'celestial-rift' }),
      layers: [
        {
          id: 'hero',
          svg: leo({ pose: 'stand', expression: 'surprised', ink: P.cosmic.ink, rim: P.cosmic.rim }),
          x: 800,
          y: FLOOR + 20,
          scale: 0.8,
        },
      ],
      fx: [sparkle({ opacity: 0.35 }), vignette()],
      beats: [
        {
          text: 'Behind the blue stood an infinite clockwork engine—brass gears churning starlight above the ocean.',
          cues: [
            ...closeOn(800, 450, 1.05),
            { target: 'camera', do: 'scale', to: 1.14, dur: 'scene', ease: 'soft' },
          ],
          hold: 0.8,
        },
      ],
    },

    {
      // 8. Medium Shot (MS) — The Giant Brass Hand
      id: 'the-hand',
      palette: P.cosmic,
      transition: 'cut',
      backdrop: cosmicRift({ palette: P.cosmic, seed: 'celestial-rift' }),
      layers: [
        {
          id: 'cosmic-hand',
          svg: props.cosmicHand(P.cosmic.glowSoft, P.cosmic.near, P.cosmic.glow, P.cosmic.ink),
          x: 880,
          y: 380,
          scale: 1.4,
        },
        {
          id: 'hero',
          svg: leo({ pose: 'stand', expression: 'surprised', ink: P.cosmic.ink, rim: P.cosmic.rim }),
          x: 640,
          y: FLOOR,
          scale: 1.2,
        },
      ],
      fx: [vignette()],
      beats: [
        {
          text: 'A colossal brass hand reached through the breach, delicately plucked the stuck pebble, and examined it.',
          cues: [
            ...closeOn(760, 490, 1.35),
            { target: 'cosmic-hand', do: 'move', dy: -25, dur: 'beat', ease: 'soft' },
          ],
          hold: 0.6,
        },
      ],
    },

    {
      // 9. Point of View / Insert (CU) — The Golden Token
      id: 'gold-token',
      palette: P.cosmic,
      transition: 'cut',
      backdrop: ocean({ palette: P.cosmic, seed: 'token-backdrop', disc: false }),
      layers: [
        {
          id: 'coin',
          svg: props.goldCoin(P.cosmic.glow, P.cosmic.paper, P.cosmic.ink),
          x: 800,
          y: 450,
          scale: 1.1,
        },
      ],
      fx: [sparkle({ opacity: 0.5 }), vignette()],
      beats: [
        {
          text: 'In exchange, it dropped a glowing gold token into Leo\'s hands. It buzzed with warm static.',
          cues: [
            ...closeOn(800, 450, 2.1),
            { target: 'coin', do: 'scale', to: 1.22, dur: 'beat', ease: 'anticipate' },
          ],
          hold: 0.7,
        },
      ],
    },

    // --- ACT III: THE RECEIPT ------------------------------------------------
    {
      // 10. Wide Shot (WS) — The Duct Tape Fix
      id: 'duct-tape-fix',
      palette: P.dusk,
      transition: 'cut',
      backdrop: oceanPatched({ palette: P.dusk, seed: 'patched-sky', disc: 1180 }),
      layers: [
        {
          id: 'hero',
          svg: leo({ pose: 'stand', expression: 'surprised', ink: P.dusk.ink, rim: P.dusk.rim }),
          x: 800,
          y: FLOOR,
          scale: 1.05,
        },
      ],
      fx: [vignette()],
      beats: [
        {
          text: 'With a sharp hiss, a giant strip of sky-blue tape sealed the breach, and the sky snapped shut.',
          cues: [
            ...closeOn(800, 480, 1.22),
            { target: 'camera', do: 'shake', strength: 8, at: 3.2, dur: 0.45 },
          ],
          hold: 0.5,
        },
      ],
    },

    {
      // 11. Medium Wide Shot (MWS) — Ocean Unfreezes
      id: 'waves-crash',
      palette: P.night,
      transition: 'cut',
      backdrop: ocean({ palette: P.night, seed: 'shoreline-night', disc: false }),
      layers: [
        {
          id: 'hero',
          svg: leo({ pose: 'slump', expression: 'surprised', ink: P.night.ink, rim: P.night.rim }),
          variants: {
            smirk: leo({ pose: 'stand', expression: 'smile', ink: P.night.ink, rim: P.night.rim }),
          },
          x: 780,
          y: FLOOR,
          scale: 1.15,
        },
      ],
      fx: [mist({ opacity: 0.15 }), vignette()],
      beats: [
        {
          text: 'The suspended waves collapsed back into sea foam all at once, soaking Leo\'s sneakers.',
          cues: [
            ...closeOn(780, 520, 1.3),
            { target: 'camera', do: 'shake', strength: 5, at: 2.2, dur: 0.5 },
            { target: 'hero', do: 'swap', to: 'smirk', at: 3.2 },
          ],
          hold: 0.6,
        },
      ],
    },

    {
      // 12. Close-Up to Wide (CU -> WS) — The Next Stone
      id: 'the-next-stone',
      palette: P.night,
      transition: 'cut',
      backdrop: ocean({ palette: P.night, seed: 'shoreline-night', disc: false }),
      layers: [
        {
          id: 'hero',
          svg: leo({ pose: 'stand', expression: 'smile', ink: P.night.ink, rim: P.night.rim }),
          x: 800,
          y: FLOOR,
          scale: 1.35,
          ambient: 'k-breathe',
        },
      ],
      fx: [vignette()],
      beats: [
        {
          text: 'Leo looked at the coin, looked at the horizon... and picked up another stone.',
          cues: [
            ...closeOn(800, 460, 1.8),
            { target: 'camera', do: 'scale', to: 1.35, dur: 'scene', ease: 'soft' },
          ],
          hold: 1.5,
        },
      ],
    },
  ],
});
