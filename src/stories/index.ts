/**
 * Story registry.
 *
 * Every `*.story.ts` in this directory is picked up automatically — adding a story
 * means adding one file and nothing else. No import list to update, no route to
 * register, no config to touch.
 */

import type { Story } from '../lib/story';
import type { AudioManifest } from '../lib/timing';

const modules = import.meta.glob<{ default: Story }>('./*.story.ts', { eager: true });

/**
 * Generated narration manifests, keyed by slug.
 *
 * `import.meta.glob` is used rather than reading the filesystem so a missing
 * manifest is simply an absent key instead of a build error — that is the whole
 * mechanism by which a story renders correctly before its voice exists.
 */
const manifests = import.meta.glob<{ default: AudioManifest }>('/public/audio/*/manifest.json', {
  eager: true,
});

export const stories: Story[] = Object.values(modules)
  .map((module) => module.default)
  .sort((a, b) => a.title.localeCompare(b.title));

export function manifestFor(slug: string): AudioManifest | null {
  const entry = manifests[`/public/audio/${slug}/manifest.json`];
  return entry?.default ?? null;
}

export function storyBySlug(slug: string): Story | undefined {
  return stories.find((story) => story.slug === slug);
}
