#!/usr/bin/env node
/**
 * Visual QA.
 *
 *   npm run shoot kit             -> full art-stencil contact sheet
 *   npm run shoot <slug>          -> one PNG per scene of a story
 *   npm run shoot <slug> --sheet  -> a single stacked contact sheet instead
 *   npm run shoot <slug> --at=3.6,5   -> the exact story seconds named
 *
 * `--at` exists because the per-scene shots land mid-scene, which is the right
 * default for staging but blind to anything brief. A reaction that lasts a second
 * happens entirely between two of them, so a moment worth checking has to be asked
 * for by name.
 *
 * Builds the site, serves `dist/`, drives it with the pre-installed Chromium and
 * writes PNGs to `shots/`. This is the real quality gate for the art: a typecheck
 * cannot tell you that a character's hair is floating off their head.
 *
 * Uses the browser at PLAYWRIGHT_BROWSERS_PATH; never run `playwright install`.
 */

import { createReadStream, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const SHOTS = join(ROOT, 'shots');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

function serve(dir) {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let path = join(dir, decodeURIComponent(url.pathname));
    if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
    if (!existsSync(path)) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': MIME[extname(path)] ?? 'application/octet-stream' });
    createReadStream(path).pipe(res);
  });
  return new Promise((ok) => server.listen(0, () => ok({ server, port: server.address().port })));
}

async function main() {
  const args = process.argv.slice(2);
  const target = args.find((a) => !a.startsWith('--')) ?? 'kit';
  const asSheet = args.includes('--sheet');
  const skipBuild = args.includes('--no-build');
  const moments = (args.find((a) => a.startsWith('--at=')) ?? '')
    .slice(5)
    .split(',')
    .map((n) => Number.parseFloat(n))
    .filter((n) => Number.isFinite(n));

  if (!skipBuild) {
    console.log('building…');
    const build = spawnSync('npx', ['astro', 'build'], { cwd: ROOT, stdio: 'inherit' });
    if (build.status !== 0) process.exit(build.status ?? 1);
  }

  const { chromium } = await import('playwright');
  const { server, port } = await serve(DIST);

  // This image ships a pinned Chromium that may not match the build our playwright
  // package expects. Point at it directly rather than downloading a second copy.
  const preinstalled = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome'].find(
    (candidate) => existsSync(candidate),
  );

  rmSync(join(SHOTS, target), { recursive: true, force: true });
  mkdirSync(join(SHOTS, target), { recursive: true });

  const browser = await chromium.launch(preinstalled ? { executablePath: preinstalled } : {});
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });

  if (target === 'kit') {
    await page.goto(`http://localhost:${port}/kit-preview/`, { waitUntil: 'networkidle' });
    // Let one ambient cycle land somewhere interesting before capturing.
    await page.waitForTimeout(900);
    const out = join(SHOTS, 'kit', 'kit.png');
    await page.screenshot({ path: out, fullPage: true });
    console.log(`wrote ${out}`);
  } else {
    await page.goto(`http://localhost:${port}/stories/${target}/?still=1`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__story !== undefined, { timeout: 15000 });
    const sceneCount = await page.evaluate(() => window.__story.scenes.length);
    console.log(`${target}: ${sceneCount} scenes`);

    for (let i = 0; i < sceneCount; i += 1) {
      // Land mid-scene rather than on the cut, so entrance cues have played out.
      await page.evaluate((index) => window.__player.previewScene(index, 0.55), i);
      await page.waitForTimeout(320);
      const id = await page.evaluate((index) => window.__story.scenes[index].id, i);
      const out = join(SHOTS, target, `${String(i).padStart(2, '0')}-${id}.png`);
      await page.locator('[data-stage]').screenshot({ path: out });
      console.log(`wrote ${out}`);
    }

    for (const at of moments) {
      // Seeking straight to an absolute time, rather than stepping there, is also
      // the check: if a swap only looked right when arrived at forwards, this is
      // where it would come apart.
      await page.evaluate((time) => window.__player.seek(time), at);
      await page.waitForTimeout(320);
      const out = join(SHOTS, target, `at-${at.toFixed(2)}s.png`);
      await page.locator('[data-stage]').screenshot({ path: out });
      console.log(`wrote ${out}`);
    }

    if (asSheet) {
      await page.evaluate(() => window.__player.contactSheet());
      await page.waitForTimeout(600);
      const out = join(SHOTS, target, 'sheet.png');
      await page.screenshot({ path: out, fullPage: true });
      console.log(`wrote ${out}`);
    }
  }

  await browser.close();
  server.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
