/**
 * Story scaffold — copy the whole directory:
 *
 *   cp -r .claude/skills/anime-story/assets/story-scaffold src/stories/<slug>
 *
 * You get `story.ts` (this file) and `art/`, a full copy of the house style that now
 * belongs to this story alone. **Prune `art/` down to what you actually stage** — see
 * the note at the top of `art/index.ts`.
 *
 * The slug, the directory name and the `id` of every scene all matter: the slug must
 * equal the directory name, and scene ids become audio filenames.
 *
 * Delete this header and these comments as you go.
 */

import { defineStory } from '../../lib/story';
import {
  PALETTES,
  character,
  props,
  // backdrops — see references/art-kit.md for the full list and ground lines
  ridge,
  field,
  platform,
  // effects
  sakura,
  vignette,
} from './art';

const P = PALETTES;

// --- casting ---------------------------------------------------------------
// Define each character ONCE here. Per scene, override only `pose` and
// `expression`. This is what keeps them recognisable from shot to shot.

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
  slug: 'CHANGE-ME', // must match the directory name
  title: 'Change Me',
  logline: 'One sentence for the gallery card.',

  scenes: [
    {
      id: 'opening',
      palette: P.dawn, // the palette OBJECT, from this story's own art
      transition: 'fade',
      // Reuse the same `seed` for the same place across scenes so it looks
      // like itself every time you return to it.
      backdrop: ridge({ palette: P.dawn, seed: 'opening' }),
      layers: [
        {
          id: 'hero',
          svg: hero({ pose: 'stand', expression: 'neutral', ink: P.dawn.ink, rim: P.dawn.rim }),
          x: 700,
          y: 780, // the FEET. Check the ground line for this backdrop.
          scale: 1,
          ambient: 'k-breathe',
        },
      ],
      fx: [sakura(), vignette()],
      beats: [
        {
          text: 'First beat: establish where we are and what it cost.',
          // Every scene wants a camera move. Always scale up, never below 1.
          cues: [{ target: 'camera', do: 'scale', to: 1.14, dur: 'scene', ease: 'soft' }],
        },
        {
          text: 'Second beat: the line that carries the feeling.',
          hold: 0.6, // let the image land before the cut
        },
      ],
    },

    // Duplicate the block above. At the default ~30 seconds you want TWO scenes of
    // two beats: scene one establishes, scene two turns and lands. Change the palette
    // across the cut — that alone signals the turn. See references/pacing.md.
  ],
});
