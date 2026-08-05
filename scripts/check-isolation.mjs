#!/usr/bin/env node
/**
 * Story isolation check.
 *
 *   npm run check    (runs after `astro check`)
 *
 * A story owns its art. `src/lib/art-stencil/` is a thing to copy *from*, not a
 * dependency to import, and one story must never reach into another's directory.
 *
 * Both rules are invisible to the type system: importing the stencil typechecks
 * perfectly and renders correctly, and would quietly restore exactly the coupling
 * the per-story layout exists to remove. So they are checked here instead. A
 * convention nobody verifies decays back into a shared kit within a few stories.
 *
 * What a story MAY import from outside itself: `src/lib/story`, `src/lib/timing`
 * and `src/lib/svg` — types, the timeline resolver, and colourless markup helpers.
 * None of those carry any art.
 */

import { readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const STORY_DIR = join(ROOT, 'src', 'stories');

/** Matches the module specifier of any static or dynamic import / re-export. */
const IMPORT_RE = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;

async function filesUnder(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await filesUnder(path)));
    else if (/\.(ts|tsx|mjs|js|astro)$/.test(entry.name)) found.push(path);
  }
  return found;
}

async function storySlugs() {
  const entries = await readdir(STORY_DIR, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

async function main() {
  const slugs = await storySlugs();
  const violations = [];

  for (const slug of slugs) {
    for (const file of await filesUnder(join(STORY_DIR, slug))) {
      const source = await readFile(file, 'utf8');
      const where = relative(ROOT, file);

      for (const [, specifier] of source.matchAll(IMPORT_RE)) {
        if (specifier.includes('art-stencil') || specifier.includes('anime-kit')) {
          violations.push(
            `${where}\n    imports "${specifier}"\n    ` +
              'The stencil is copied from, never imported. Copy what this story needs into ' +
              `src/stories/${slug}/art/ and import that.`,
          );
          continue;
        }

        // Reaching into a sibling story. Resolve the specifier so this catches
        // `../other-story/art` as well as a bare mention of the slug.
        const target = specifier.startsWith('.')
          ? relative(STORY_DIR, resolve(file, '..', specifier))
          : null;
        const owner = target?.split(/[/\\]/)[0];
        if (owner && slugs.includes(owner) && owner !== slug) {
          violations.push(
            `${where}\n    imports "${specifier}" from the story "${owner}"\n    ` +
              'Stories are independent. Copy what you need rather than sharing it.',
          );
        }
      }
    }
  }

  if (violations.length) {
    console.error(`\nStory isolation broken in ${violations.length} place(s):\n`);
    for (const violation of violations) console.error(`  ${violation}\n`);
    process.exit(1);
  }

  console.log(`story isolation: ${slugs.length} stor${slugs.length === 1 ? 'y' : 'ies'} clean`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
