/**
 * "Skip the Horizon" — High-Fidelity 1-Minute Animated Anime Short.
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
  speedLines,
  vignette,
} from './art';

/** Ground line for beach shoreline shots. Feet go here. */
const FLOOR = 780;
/** Head height above ground line for character at scale 1. */
const HEAD = 402;

const P = PALETTES;

/**
 * Frame a shot tight on a world point (x, y) with a given zoom.
 * Snaps instantly (dur: 0.001) so the shot opens already framed.
 */
const closeOn = (x: number, y: number, zoom: number): Cue[] => [
  { target: 'camera', do: 'scale', to: zoom, at: 0, dur: 0.001 },
  { target: 'camera', do: 'move', dx: -(x - 800) * zoom, dy: -(y - 450) * zoom, at: 0, dur: 0.001 },
];

/** Cast Leo once — consistent oversized hoodie, messy black hair, slate palette. */
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
    // =========================================================================
    // ACT I: THE ROUTINE (Establishment & Build-up)
    // =========================================================================
    {
      // 1. Extreme Wide Shot (EWS) — Atmospheric coastal dusk walk
      id: 'dusk-walk',
      palette: P.dusk,
      transition: 'fade',
      backdrop: ocean({ palette: P.dusk, seed: 'shoreline', disc: 1200 }),
      layers: [
        {
          id: 'hero',
          svg: leo({ pose: 'walk', expression: 'neutral', ink: P.dusk.ink, rim: P.dusk.rim }),
          x: 600,
          y: FLOOR,
          ambient: 'k-breathe k-sway',
        },
      ],
      fx: [mist({ opacity: 0.16 }), vignette({ opacity: 0.35 })],
      beats: [
        {
          text: 'Leo walked the coastline at dusk because the rhythm of the ocean felt dependable and still.',
          cues: [
            ...closeOn(760, 480, 1.15),
            { target: 'camera', do: 'move', dx: -60, dur: 'scene', ease: 'linear' },
            { target: 'hero', do: 'move', dx: 80, dur: 'scene', ease: 'linear' },
          ],
          hold: 0.4,
        },
      ],
    },

    {
      // 2. Medium Shot (MS) — Reaching down for the black pebble
      id: 'find-stone',
      palette: P.dusk,
      transition: 'cut',
      backdrop: ocean({ palette: P.dusk, seed: 'shore-detail', disc: false }),
      layers: [
        {
          id: 'stone',
          svg: props.pebble(P.dusk.near, P.dusk.ink),
          x: 840,
          y: FLOOR - 10,
          scale: 1.4,
        },
        {
          id: 'hero',
          svg: leo({ pose: 'slump', expression: 'smile', ink: P.dusk.ink, rim: P.dusk.rim }),
          x: 800,
          y: FLOOR,
          scale: 1.3,
          ambient: 'k-breathe',
        },
      ],
      fx: [vignette({ opacity: 0.4 })],
      beats: [
        {
          text: 'He spotted a flat black stone by the foam line, weighed it in his palm, and squared his shoulders.',
          cues: [
            ...closeOn(800, 520, 1.45),
            { target: 'camera', do: 'scale', to: 1.56, dur: 'scene', ease: 'soft' },
            { target: 'stone', do: 'move', dy: -25, at: 2.2, dur: 0.8, ease: 'soft' },
          ],
          hold: 0.4,
        },
      ],
    },

    {
      // 3. Medium Close-Up (MCU) — Athletic sidearm wind-up & stone throw
      id: 'the-throw',
      palette: P.dusk,
      transition: 'cut',
      backdrop: ocean({ palette: P.dusk, seed: 'throw-angle', disc: 1260 }),
      layers: [
        {
          id: 'ripples',
          svg: props.splashRings('#ffffff', P.dusk.glowSoft),
          x: 880,
          y: FLOOR - 60,
          scale: 1.2,
          opacity: 0,
        },
        {
          id: 'hero',
          svg: leo({ pose: 'reach', expression: 'determined', ink: P.dusk.ink, rim: P.dusk.rim }),
          x: 720,
          y: FLOOR,
          scale: 1.35,
        },
      ],
      fx: [speedLines({ opacity: 0.35 }), vignette({ opacity: 0.4 })],
      beats: [
        {
          text: 'He whipped his wrist low across the mirror surf. One skip. Two skips. Three.',
          cues: [
            ...closeOn(760, 480, 1.55),
            { target: 'hero', do: 'move', dx: 40, dur: 0.6, ease: 'snap' },
            { target: 'ripples', do: 'fade', to: 1, at: 1.8, dur: 0.3 },
            { target: 'camera', do: 'move', dx: 50, dur: 'scene', ease: 'linear' },
          ],
          hold: 0.6,
        },
      ],
    },

    {
      // 4. Wide Shot (WS) — The Anomaly: Stone strikes invisible sky barrier
      id: 'the-clink',
      palette: P.dusk,
      transition: 'cut',
      backdrop: ocean({ palette: P.dusk, seed: 'horizon-view', disc: 1100 }),
      layers: [
        {
          id: 'stone-flight',
          svg: props.pebble(P.dusk.near, P.dusk.ink),
          x: 880,
          y: 430,
          scale: 1.1,
        },
        {
          id: 'spark',
          svg: props.sparkHit('#00f0ff', '#ffffff'),
          x: 880,
          y: 430,
          scale: 1.5,
          opacity: 0,
        },
      ],
      fx: [screenTone({ opacity: 0.2 }), vignette({ opacity: 0.45 })],
      beats: [
        {
          text: 'On the fourth skip, the stone struck empty air with the sharp ring of china on glass.',
          cues: [
            ...closeOn(880, 450, 1.35),
            // Stone travels then halts on the word "struck"
            { target: 'stone-flight', do: 'move', dx: 30, dy: -20, dur: 2.8, ease: 'linear' },
            // Violent impact tremor and spark burst
            { target: 'spark', do: 'fade', to: 1, at: 3.1, dur: 0.05 },
            { target: 'spark', do: 'scale', to: 2.0, at: 3.1, dur: 0.3, ease: 'snap' },
            { target: 'camera', do: 'shake', strength: 10, at: 3.12, dur: 0.55 },
            { target: 'spark', do: 'fade', to: 0, at: 3.6, dur: 0.3 },
          ],
          hold: 0.7,
        },
      ],
    },

    // =========================================================================
    // ACT II: THE CRACK IN THE SKY (The Cosmic Glitch)
    // =========================================================================
    {
      // 5. Close-Up (CU) — Stunned reaction as the ocean wave freezes solid
      id: 'ocean-freeze',
      palette: P.glitch,
      transition: 'cut',
      backdrop: oceanFrozen({ palette: P.glitch, seed: 'frozen-sea' }),
      layers: [
        {
          id: 'hero',
          svg: leo({ pose: 'stand', expression: 'surprised', ink: P.glitch.ink, rim: P.glitch.rim }),
          variants: {
            recoil: leo({ pose: 'slump', expression: 'surprised', ink: P.glitch.ink, rim: P.glitch.rim }),
          },
          x: 800,
          y: FLOOR,
          scale: 1.85,
          ambient: 'k-breathe',
        },
      ],
      fx: [screenTone({ opacity: 0.25 }), vignette({ opacity: 0.5 })],
      beats: [
        {
          text: 'The ocean froze mid-swell. The roar of the surf cut out like a pulled plug.',
          cues: [
            ...closeOn(800, FLOOR - HEAD + 30, 2.3),
            { target: 'hero', do: 'move', dx: -35, at: 1.2, dur: 0.3, ease: 'anticipate' },
            { target: 'hero', do: 'swap', to: 'recoil', at: 1.25 },
            { target: 'camera', do: 'scale', to: 2.45, dur: 'scene', ease: 'soft' },
          ],
          hold: 0.6,
        },
      ],
    },

    {
      // 6. Tight Insert / Zoom — Spiderweb fracture peeling the sky dome
      id: 'sky-fracture',
      palette: P.glitch,
      transition: 'cut',
      backdrop: skyFracture({ palette: P.glitch, seed: 'sky-rip' }),
      fx: [sparkle({ opacity: 0.55 }), vignette({ opacity: 0.45 })],
      beats: [
        {
          text: 'A glowing fracture spiderwebbed across the twilight, peeling open the seam of the sky.',
          cues: [
            ...closeOn(800, 420, 1.85),
            { target: 'camera', do: 'scale', to: 2.15, dur: 'scene', ease: 'soft' },
            { target: 'camera', do: 'shake', strength: 6, at: 2.8, dur: 0.4 },
          ],
          hold: 0.5,
        },
      ],
    },

    {
      // 7. Extreme Wide Shot (EWS) — The Infinite Celestial Clockwork Engine
      id: 'cosmic-engine',
      palette: P.cosmic,
      transition: 'flash',
      backdrop: cosmicRift({ palette: P.cosmic, seed: 'celestial-rift' }),
      layers: [
        {
          id: 'hero',
          svg: leo({ pose: 'stand', expression: 'surprised', ink: P.cosmic.ink, rim: P.cosmic.rim }),
          x: 800,
          y: FLOOR + 25,
          scale: 0.82,
          ambient: 'k-breathe',
        },
      ],
      fx: [sparkle({ opacity: 0.45 }), vignette({ opacity: 0.5 })],
      beats: [
        {
          text: 'Behind the blue stood an infinite clockwork engine—brass gears churning starlight above the ocean.',
          cues: [
            ...closeOn(800, 450, 1.05),
            { target: 'camera', do: 'scale', to: 1.16, dur: 'scene', ease: 'soft' },
          ],
          hold: 0.8,
        },
      ],
    },

    {
      // 8. Medium Shot (MS) — Giant Steampunk Brass Hand plucks pebble
      id: 'the-hand',
      palette: P.cosmic,
      transition: 'cut',
      backdrop: cosmicRift({ palette: P.cosmic, seed: 'celestial-rift' }),
      layers: [
        {
          id: 'pebble-midair',
          svg: props.pebble(P.cosmic.paper, P.cosmic.ink),
          x: 850,
          y: 420,
          scale: 1.2,
        },
        {
          id: 'cosmic-hand',
          svg: props.cosmicHand(P.cosmic.glowSoft, P.cosmic.near, P.cosmic.glow, P.cosmic.ink),
          x: 880,
          y: 280,
          scale: 1.5,
        },
        {
          id: 'hero',
          svg: leo({ pose: 'stand', expression: 'surprised', ink: P.cosmic.ink, rim: P.cosmic.rim }),
          x: 620,
          y: FLOOR,
          scale: 1.2,
          ambient: 'k-breathe',
        },
      ],
      fx: [vignette({ opacity: 0.45 })],
      beats: [
        {
          text: 'A colossal brass hand reached through the breach, delicately plucked the stuck pebble, and examined it.',
          cues: [
            ...closeOn(760, 490, 1.35),
            // Hand descends from above
            { target: 'cosmic-hand', do: 'move', dy: 70, at: 0.5, dur: 1.8, ease: 'soft' },
            // Plucks pebble upward
            { target: 'pebble-midair', do: 'move', dy: -50, at: 2.8, dur: 1.2, ease: 'soft' },
            { target: 'cosmic-hand', do: 'move', dy: -50, at: 2.8, dur: 1.2, ease: 'soft' },
          ],
          hold: 0.6,
        },
      ],
    },

    {
      // 9. Point of View / Insert (POV) — The Glowing Gold Token Drop
      id: 'gold-token',
      palette: P.cosmic,
      transition: 'cut',
      backdrop: ocean({ palette: P.cosmic, seed: 'token-backdrop', disc: false }),
      layers: [
        {
          id: 'coin',
          svg: props.goldCoin(P.cosmic.glow, P.cosmic.paper, P.cosmic.ink),
          x: 800,
          y: 380,
          scale: 0.8,
        },
      ],
      fx: [sparkle({ opacity: 0.7 }), vignette({ opacity: 0.5 })],
      beats: [
        {
          text: 'In exchange, it dropped a glowing gold token into Leo\'s hands. It buzzed with warm static.',
          cues: [
            ...closeOn(800, 450, 2.1),
            // Coin drops, scales up and pulses into palms
            { target: 'coin', do: 'move', dy: 80, at: 0.4, dur: 1.4, ease: 'anticipate' },
            { target: 'coin', do: 'scale', to: 1.35, at: 0.4, dur: 1.4, ease: 'anticipate' },
            { target: 'coin', do: 'turn', deg: 360, at: 0.4, dur: 1.4, ease: 'soft' },
          ],
          hold: 0.7,
        },
      ],
    },

    // =========================================================================
    // ACT III: THE RECEIPT (The Punchline & Resolution)
    // =========================================================================
    {
      // 10. Wide Shot (WS) — The Cosmic Duct Tape Quick Fix
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
          ambient: 'k-breathe',
        },
      ],
      fx: [vignette({ opacity: 0.4 })],
      beats: [
        {
          text: 'With a sharp hiss, a giant strip of sky-blue tape sealed the breach, and the sky snapped shut.',
          cues: [
            ...closeOn(800, 480, 1.22),
            // Slap tremor shockwave
            { target: 'camera', do: 'shake', strength: 12, at: 3.1, dur: 0.5, ease: 'out' },
            { target: 'camera', do: 'scale', to: 1.28, at: 3.1, dur: 0.15, ease: 'snap' },
          ],
          hold: 0.5,
        },
      ],
    },

    {
      // 11. Medium Wide Shot (MWS) — Ocean unfreezes & splash collapses
      id: 'waves-crash',
      palette: P.night,
      transition: 'cut',
      backdrop: ocean({ palette: P.night, seed: 'shoreline-night', disc: false }),
      layers: [
        {
          id: 'splash-burst',
          svg: props.waterSplash('#ffffff', '#38bdf8', P.night.ink),
          x: 840,
          y: FLOOR - 40,
          scale: 1.4,
          opacity: 0,
        },
        {
          id: 'hero',
          svg: leo({ pose: 'slump', expression: 'surprised', ink: P.night.ink, rim: P.night.rim }),
          variants: {
            smirk: leo({ pose: 'stand', expression: 'smile', ink: P.night.ink, rim: P.night.rim }),
          },
          x: 780,
          y: FLOOR,
          scale: 1.18,
        },
      ],
      fx: [mist({ opacity: 0.25 }), vignette({ opacity: 0.45 })],
      beats: [
        {
          text: 'The suspended waves collapsed back into sea foam all at once, soaking Leo\'s sneakers.',
          cues: [
            ...closeOn(780, 520, 1.32),
            // Giant wave splash impact
            { target: 'splash-burst', do: 'fade', to: 1, at: 1.8, dur: 0.1 },
            { target: 'splash-burst', do: 'scale', to: 1.6, at: 1.8, dur: 0.4, ease: 'snap' },
            { target: 'camera', do: 'shake', strength: 8, at: 1.85, dur: 0.6 },
            { target: 'hero', do: 'move', dx: -20, at: 1.85, dur: 0.2, ease: 'anticipate' },
            { target: 'hero', do: 'swap', to: 'smirk', at: 3.4 },
            { target: 'splash-burst', do: 'fade', to: 0, at: 3.2, dur: 0.8 },
          ],
          hold: 0.6,
        },
      ],
    },

    {
      // 12. Close-Up to Wide (CU -> WS) — Coin flip & next stone
      id: 'the-next-stone',
      palette: P.night,
      transition: 'cut',
      backdrop: ocean({ palette: P.night, seed: 'shoreline-night', disc: false }),
      layers: [
        {
          id: 'tossed-coin',
          svg: props.goldCoin(P.night.rim, '#ffffff', P.night.ink),
          x: 830,
          y: FLOOR - 260,
          scale: 0.6,
        },
        {
          id: 'hero',
          svg: leo({ pose: 'stand', expression: 'smile', ink: P.night.ink, rim: P.night.rim }),
          x: 800,
          y: FLOOR,
          scale: 1.38,
          ambient: 'k-breathe',
        },
      ],
      fx: [sparkle({ opacity: 0.35 }), vignette({ opacity: 0.4 })],
      beats: [
        {
          text: 'Leo looked at the coin, looked at the horizon... and picked up another stone.',
          cues: [
            ...closeOn(800, 460, 1.75),
            // Coin flip animation in the air
            { target: 'tossed-coin', do: 'move', dy: -70, at: 1.2, dur: 0.6, ease: 'out' },
            { target: 'tossed-coin', do: 'turn', deg: 360, at: 1.2, dur: 1.2, ease: 'linear' },
            { target: 'tossed-coin', do: 'move', dy: 70, at: 1.8, dur: 0.6, ease: 'in' },
            // Camera slow pull back to wide release
            { target: 'camera', do: 'scale', to: 1.18, at: 2.0, dur: 'scene', ease: 'soft' },
          ],
          hold: 1.6,
        },
      ],
    },
  ],
});
