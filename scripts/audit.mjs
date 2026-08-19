#!/usr/bin/env node
/**
 * Automated Storyboard Director Audit & QA Tool.
 *
 *   npm run audit <slug>
 *   npm run audit --all
 *
 * Evaluates storyboards against cinematography grammar, ground-line alignments,
 * camera viewport safety bounds, cue timing constraints, and visual continuity.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { build as esbuild } from 'esbuild';

const ROOT = resolve(import.meta.dirname, '..');
const STORY_DIR = join(ROOT, 'src', 'stories');
const AUDIO_DIR = join(ROOT, 'public', 'audio');

// Standard ground line references per backdrop
const GROUND_LINES = {
  kitchen: 790,
  ridge: 780,
  shrine: 780,
  station: 770,
  crossing: 780,
  classroom: 790,
  bedroom: 800,
  bridge: 770,
  rooftop: 790,
  alley: 810,
};

/** Load a story TypeScript file into memory via esbuild. */
async function loadStoryBundle(file) {
  const result = await esbuild({
    entryPoints: [file],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    logLevel: 'silent',
  });
  const code = result.outputFiles[0].text;
  const module = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  return module.default;
}

/** Load the resolveStory helper. */
async function loadTimingResolver() {
  const result = await esbuild({
    entryPoints: [join(ROOT, 'src', 'lib', 'timing.ts')],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    logLevel: 'silent',
  });
  const code = result.outputFiles[0].text;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}

async function storyFiles(slug) {
  const entries = readdirSync(STORY_DIR, { withFileTypes: true });
  const slugs = entries
    .filter((e) => e.isDirectory() && existsSync(join(STORY_DIR, e.name, 'story.ts')))
    .map((e) => e.name);

  if (!slug) return slugs.map((name) => join(STORY_DIR, name, 'story.ts'));
  if (!slugs.includes(slug)) {
    throw new Error(`No story directory for "${slug}". Found: ${slugs.join(', ') || '(none)'}`);
  }
  return [join(STORY_DIR, slug, 'story.ts')];
}

async function auditStory(file, { resolveStory }) {
  const story = await loadStoryBundle(file);
  const manifestPath = join(AUDIO_DIR, story.slug, 'manifest.json');
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;
  const resolved = resolveStory(story, manifest);

  const issues = { errors: [], warnings: [], suggestions: [], notes: [] };

  const report = (type, msg) => {
    issues[type].push(msg);
  };

  // 1. Pacing and Word Count Metrics
  const totalWords = story.scenes.reduce(
    (sum, sc) => sum + sc.beats.reduce((bSum, b) => bSum + b.text.trim().split(/\s+/).filter(Boolean).length, 0),
    0,
  );
  const totalBeats = story.scenes.reduce((sum, sc) => sum + sc.beats.length, 0);
  const totalShots = story.scenes.length;
  const runtime = resolved.duration;

  issues.notes.push(
    `Runtime: ${runtime.toFixed(1)}s ${resolved.hasAudio ? '(Voiced)' : '(Estimated)'} | Shots: ${totalShots} | Beats: ${totalBeats} | Words: ${totalWords}`,
  );

  if (totalShots > totalBeats) {
    report('errors', `Shots (${totalShots}) outnumber beats (${totalBeats}). In Story Teller, cuts occur on beat boundaries.`);
  }

  if (runtime < 20) {
    report('suggestions', `Story is quite brisk (${runtime.toFixed(1)}s). Consider adding pauses (hold) for breathing room.`);
  } else if (runtime > 45 && runtime < 60) {
    report('suggestions', `Story runtime is in the 45-60s bracket. Ensure visual pacing maintains engagement.`);
  }

  // 2. Audio & Ambient Soundscape Validation
  if (!resolved.hasAudio) {
    report(
      'warnings',
      `[${story.slug}] Story is running in silent estimated timing mode (no audio manifest found in public/audio/${story.slug}/). Run 'npm run narrate ${story.slug}' to generate voiceover.`,
    );
  }

  if (story.ambientAudio) {
    const cleanPath = story.ambientAudio.replace(/^\/+/, '');
    const ambientFile = join(ROOT, 'public', cleanPath);
    if (!existsSync(ambientFile)) {
      report(
        'warnings',
        `[${story.slug}] Story-level ambientAudio file not found: "${story.ambientAudio}" (expected at ${relative(ROOT, ambientFile)}).`,
      );
    }
  }

  // 3. Cinematography and Shot Diversity
  let prevBackdrop = null;
  let prevScale = null;
  let prevZoom = null;

  story.scenes.forEach((scene, sceneIdx) => {
    const sceneId = scene.id || `scene-${sceneIdx + 1}`;
    const prefix = `[${story.slug} / ${sceneId}]`;

    // Ambient Audio Check for Scene
    if (scene.ambientAudio) {
      const cleanPath = scene.ambientAudio.replace(/^\/+/, '');
      const ambientFile = join(ROOT, 'public', cleanPath);
      if (!existsSync(ambientFile)) {
        report(
          'warnings',
          `${prefix} Scene-level ambientAudio file not found: "${scene.ambientAudio}" (expected at ${relative(ROOT, ambientFile)}).`,
        );
      }
    }

    // Camera Cues Analysis
    const cameraCues = [];
    scene.beats.forEach((b) => {
      (b.cues ?? []).forEach((c) => {
        if (c.target === 'camera') cameraCues.push(c);
      });
    });

    let initialZoom = 1;
    let initialDx = 0;
    let initialDy = 0;

    for (const cue of cameraCues) {
      if (cue.do === 'scale' && (cue.at === 0 || cue.at === undefined)) {
        initialZoom = Number(cue.to) || 1;
      }
      if (cue.do === 'move' && (cue.at === 0 || cue.at === undefined)) {
        initialDx = Number(cue.dx) || 0;
        initialDy = Number(cue.dy) || 0;
      }
    }

    // Camera Bounds Check
    if (initialZoom < 0.98) {
      report('errors', `${prefix} Camera zoom is ${initialZoom}x (below 1.0). Canvas edges will be exposed!`);
    } else if (initialZoom > 1.05) {
      // Reconstruct target world point from screen delta: dx = -(X - 800) * Z
      const targetX = 800 - initialDx / initialZoom;
      const targetY = 450 - initialDy / initialZoom;

      const minX = 800 / initialZoom;
      const maxX = 1600 - 800 / initialZoom;
      const minY = 450 / initialZoom;
      const maxY = 900 - 450 / initialZoom;

      const tol = 15; // 15px tolerance
      if (targetX < minX - tol || targetX > maxX + tol || targetY < minY - tol || targetY > maxY + tol) {
        report(
          'warnings',
          `${prefix} Camera closeOn(${Math.round(targetX)}, ${Math.round(targetY)}, ${initialZoom.toFixed(1)}) may expose backdrop edge. Safe X: [${Math.round(minX)}, ${Math.round(maxX)}], Safe Y: [${Math.round(minY)}, ${Math.round(maxY)}]`,
        );
      }
    }

    // Camera Dynamic Check: Every shot should have camera movement or deliberate framing
    if (cameraCues.length === 0) {
      report('suggestions', `${prefix} No camera cues defined. Consider adding a subtle creep-in (scale: 1.12 dur: 'scene') or deliberate framing.`);
    }

    // Jump-Cut / Slideshow Detection
    const mainLayer = (scene.layers ?? []).find((l) => l.id.includes('hero') || l.id.includes('mika') || l.id === 'character');
    const currentScale = mainLayer?.scale ?? 1;

    if (
      sceneIdx > 0 &&
      scene.transition === 'cut' &&
      prevBackdrop &&
      scene.backdrop.slice(0, 40) === prevBackdrop.slice(0, 40) &&
      Math.abs(currentScale - (prevScale ?? 1)) < 0.05 &&
      Math.abs(initialZoom - (prevZoom ?? 1)) < 0.05
    ) {
      report(
        'warnings',
        `${prefix} Potential jump-cut with preceding scene: identical backdrop and camera framing with transition: 'cut'. Vary the framing distance (wide -> medium -> close).`,
      );
    }

    prevBackdrop = scene.backdrop;
    prevScale = currentScale;
    prevZoom = initialZoom;

    // 3. Layer and Variant Checks
    const definedVariants = new Set();
    const swappedVariants = new Set();

    (scene.layers ?? []).forEach((layer) => {
      if (layer.variants) {
        Object.keys(layer.variants).forEach((v) => definedVariants.add(`${layer.id}:${v}`));
      }

      // Check ground line if recognizable
      if (layer.y && (layer.id.includes('hero') || layer.id.includes('mika') || layer.scale === 1)) {
        for (const [key, expectedFloor] of Object.entries(GROUND_LINES)) {
          if (scene.backdrop.includes(key) && Math.abs(layer.y - expectedFloor) > 40 && layer.scale === 1) {
            report(
              'suggestions',
              `${prefix} Layer "${layer.id}" y=${layer.y} differs from standard "${key}" ground line (y=${expectedFloor}). Verify feet alignment.`,
            );
          }
        }
      }
    });

    // Check swap cues against defined variants
    scene.beats.forEach((beat, bIdx) => {
      const beatDur = resolved.scenes[sceneIdx]?.beats[bIdx]?.dur ?? 5;
      (beat.cues ?? []).forEach((cue) => {
        if (cue.do === 'swap' && cue.to !== 'base') {
          swappedVariants.add(`${cue.target}:${cue.to}`);
        }

        // Cue Timing Bounds Check
        const at = cue.at ?? 0;
        if (typeof cue.dur === 'number') {
          if (at + cue.dur > beatDur + 0.35) {
            report(
              'warnings',
              `${prefix} Beat ${bIdx} cue [${cue.do} on "${cue.target}"] runs until ${(at + cue.dur).toFixed(2)}s, exceeding beat duration (${beatDur.toFixed(2)}s).`,
            );
          }
        }
      });
    });

    for (const v of definedVariants) {
      if (!swappedVariants.has(v)) {
        report('suggestions', `${prefix} Variant "${v}" is defined but never swapped to in this scene.`);
      }
    }
  });

  return { story, resolved, issues };
}

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const strict = args.includes('--strict');
  const slug = args.find((arg) => !arg.startsWith('--'));

  const files = await storyFiles(all ? undefined : slug);
  const { resolveStory } = await loadTimingResolver();

  console.log('='.repeat(65));
  console.log('  Storyboard Director Audit & Quality Gate');
  console.log('='.repeat(65));

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const file of files) {
    const { story, issues } = await auditStory(file, { resolveStory });

    console.log(`\nStory: ${story.title} (${story.slug})`);
    issues.notes.forEach((n) => console.log(`  \x1b[36mℹ ${n}\x1b[0m`));

    if (issues.errors.length) {
      console.log(`  \x1b[31mErrors (${issues.errors.length}):\x1b[0m`);
      issues.errors.forEach((e) => console.log(`    ✗ ${e}`));
      totalErrors += issues.errors.length;
    }

    if (issues.warnings.length) {
      console.log(`  \x1b[33mWarnings (${issues.warnings.length}):\x1b[0m`);
      issues.warnings.forEach((w) => console.log(`    ⚠ ${w}`));
      totalWarnings += issues.warnings.length;
    }

    if (issues.suggestions.length) {
      console.log(`  \x1b[90mSuggestions (${issues.suggestions.length}):\x1b[0m`);
      issues.suggestions.forEach((s) => console.log(`    • ${s}`));
    }

    if (!issues.errors.length && !issues.warnings.length) {
      console.log('  \x1b[32m✓ Cinematography & staging passed all quality gates.\x1b[0m');
    }
  }

  console.log('\n' + '-'.repeat(65));
  if (totalErrors > 0 || (strict && totalWarnings > 0)) {
    const reason = totalErrors > 0 ? `${totalErrors} error(s) and ${totalWarnings} warning(s)` : `${totalWarnings} warning(s) in strict mode`;
    console.log(`\x1b[31mAudit failed with ${reason}.\x1b[0m\n`);
    process.exit(1);
  } else {
    console.log(`\x1b[32mAudit clean: 0 errors, ${totalWarnings} warning(s).\x1b[0m\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
