/**
 * Story template — copy to `src/stories/<slug>.story.ts` and fill in.
 *
 * The slug, the filename and the `id` of every scene all matter: the slug must
 * match the filename, and scene ids become audio filenames.
 *
 * Delete this header and these comments as you go.
 */

import { defineStory } from '../lib/story';
import {
  character,
  props,
  // backdrops — see references/art-kit.md for the full list and ground lines
  ridge,
  field,
  platform,
  // effects
  sakura,
  vignette,
} from '../lib/anime-kit';

// --- casting ---------------------------------------------------------------
// Define each character ONCE here. Per scene, override only `pose` and
// `expression`. This is what keeps them recognisable across a dozen scenes.

const hero = (o: Parameters<typeof character>[0] = {}) =>
  character({
    hair: 'ponytail',
    hairColor: 'auburn',
    eyeColor: '#5b6fb8',
    outfit: 'uniform',
    cloth: 'indigo',
    ...o,
  });

export default defineStory({
  slug: 'CHANGE-ME', // must match the filename before `.story.ts`
  title: 'Change Me',
  logline: 'One sentence for the gallery card.',

  scenes: [
    {
      id: 'opening',
      palette: 'dawn',
      transition: 'fade',
      // Reuse the same `seed` for the same place across scenes so it looks
      // like itself every time you return to it.
      backdrop: ridge({ palette: 'dawn', seed: 'opening' }),
      layers: [
        {
          id: 'hero',
          svg: hero({ pose: 'stand', expression: 'neutral', ink: '#2b2340', rim: '#ffe2b8' }),
          x: 700,
          y: 780, // the FEET. Check the ground line for this backdrop.
          scale: 1,
          ambient: 'k-breathe',
        },
      ],
      fx: [sakura(), vignette()],
      beats: [
        {
          text: 'First beat: establish where we are and what has changed.',
          // Every scene wants a camera move. Always scale up, never below 1.
          cues: [{ target: 'camera', do: 'scale', to: 1.14, dur: 'scene', ease: 'soft' }],
        },
        { text: 'Second beat: the specific detail that makes this place real.' },
        {
          text: 'Third beat: the line that carries the feeling.',
          hold: 0.8, // let the image land before the cut
        },
      ],
    },

    // Duplicate the block above. Aim for 12–15 scenes at ~3 beats each for
    // roughly five minutes — see references/pacing.md for the budget table.
  ],
});
