#!/usr/bin/env node
/**
 * Single-file export.
 *
 *   npm run standalone <slug>               -> dist-standalone/<slug>.html
 *   npm run standalone <slug> --with-audio  -> ...with the narration folded in
 *   npm run standalone <slug> --embed       -> dist-standalone/<slug>.embed.html
 *   npm run standalone <slug> --no-build    -> reuse the current dist/
 *
 * Folds a built story page's CSS and JS into the document so it plays with no
 * server and no sibling files — for showing a story to someone who cannot reach
 * the dev server or the deployed site.
 *
 * This post-processes the real built page rather than re-emitting the markup, so
 * it cannot drift from what actually deploys. It works because the build is
 * already flat: the client JS is a single chunk with no imports, the CSS has no
 * url() references, every scene's SVG is server-rendered into the HTML, and the
 * resolved timeline rides along in an inline script.
 *
 * Narration is the one thing still fetched at runtime, so a narrated story needs
 * `--with-audio`. Exporting one without it fails rather than writing a file that
 * looks fine and plays silently.
 *
 * `--embed` drops the document skeleton for hosts that supply their own.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'dist-standalone');

/** Inline `<script>` bodies must not contain a literal `</script`. It shows up
 *  inside string literals in bundled code and would close the tag early. */
function escapeScript(js) {
  return js.replace(/<\/script/gi, '<\\/script');
}

function readAsset(href) {
  const path = join(DIST, href.replace(/^\//, ''));
  if (!existsSync(path)) throw new Error(`asset referenced by the page is missing: ${href}`);
  return readFileSync(path, 'utf8');
}

function inline(html) {
  let out = html;

  out = out.replace(/<link\s+rel="stylesheet"\s+href="([^"]+)"\s*\/?>/gi, (_m, href) => {
    return `<style>\n${readAsset(href)}\n</style>`;
  });

  out = out.replace(
    /<script\s+type="module"\s+src="([^"]+)"\s*><\/script>/gi,
    (_m, src) => `<script type="module">\n${escapeScript(readAsset(src))}\n</script>`,
  );

  // The favicon is the only remaining file reference, and it is tiny.
  out = out.replace(/<link\s+rel="icon"\s+href="([^"]+)"([^>]*)>/gi, (_m, href, rest) => {
    const svg = readFileSync(join(ROOT, 'public', href.replace(/^\//, '')), 'utf8');
    return `<link rel="icon" href="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"${rest}>`;
  });

  // "← All stories" goes nowhere once the page is on its own.
  out = out.replace(/<a class="back" href="\/"([^>]*)>.*?<\/a>/i, '');

  return out;
}

/**
 * Strip the document skeleton, keeping the head's <style> blocks by moving them
 * into the body. Hosts that wrap content in their own document reject a page
 * that brings its own <html>/<head>/<body>.
 */
function toEmbed(html) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  const styles = head.match(/<style>[\s\S]*?<\/style>/gi) ?? [];
  return `${styles.join('\n')}\n${body}`;
}

/**
 * Inline every beat's narration as a `data:` URI.
 *
 * Audio is the one thing the page fetches at runtime, and it is not reachable by
 * the `href`/`src` rewriting above: the URLs live inside the resolved timeline in
 * the inline payload, and the `<audio>` element's `src` is set by the player as
 * each beat starts.
 *
 * Rewriting the payload's string values is enough, and is safer than re-serialising
 * the payload — the surrounding markup is left byte-identical.
 */
function inlineAudio(html) {
  let count = 0;
  const out = html.replace(/"(audio|ambientAudio)":"(\/audio\/[^"]+)"/g, (_m, key, url) => {
    const path = join(DIST, url.replace(/^\//, ''));
    if (!existsSync(path)) throw new Error(`the page references ${url}, which is not in dist/`);
    count += 1;
    return `"${key}":"data:audio/mpeg;base64,${readFileSync(path).toString('base64')}"`;
  });
  return { html: out, count };
}

/**
 * Every URL the finished document would still go to the network for.
 *
 * Deliberately not limited to `href`/`src`: the defect this exists to catch was
 * beat audio sitting in a JSON payload, where an attribute-shaped check never
 * looked. Anything root-relative or absolute counts, wherever it appears.
 */
function externalReferences(html) {
  const found = new Set();

  // Root-relative paths in string literals. The character class is what keeps this
  // from matching self-closing SVG tags — `"/><circle` is not a URL.
  for (const [, url] of html.matchAll(/"(\/[A-Za-z0-9_\-./%~]+)"/g)) found.add(url);

  // Absolute URLs, minus XML namespaces, which are identifiers and never fetched.
  for (const [, url] of html.matchAll(/(https?:\/\/[^"'\s)<>]+)/g)) {
    if (!url.startsWith('http://www.w3.org/')) found.add(url);
  }

  // CSS url(), unless already inlined or pointing at an in-document SVG paint
  // server. Scoped to <style> blocks so it does not match `new URL(...)` in the
  // bundled player.
  for (const [, css] of html.matchAll(/<style>([\s\S]*?)<\/style>/gi)) {
    for (const [, url] of css.matchAll(/\burl\(\s*['"]?([^)'"]+)/gi)) {
      if (!url.startsWith('data:') && !url.startsWith('#')) found.add(url);
    }
  }

  return [...found];
}

/** The whole point is that the file stands alone. Prove it before writing. */
function assertSelfContained(html, label) {
  const leftovers = externalReferences(html);
  if (!leftovers.length) return;

  const audio = leftovers.filter((url) => url.startsWith('/audio/'));
  const hint = audio.length
    ? '\n\nThis story has narration. Re-run with --with-audio to fold the MP3s into the file.'
    : '';
  throw new Error(
    `${label} still references external assets, so it will not play on its own:\n  ${leftovers.join('\n  ')}${hint}`,
  );
}

function main() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith('--'));
  const embed = args.includes('--embed');
  const skipBuild = args.includes('--no-build');
  const withAudio = args.includes('--with-audio');

  if (!slug) {
    console.error('usage: npm run standalone <slug> [--embed] [--no-build] [--with-audio]');
    process.exit(1);
  }

  if (!skipBuild) {
    console.log('building…');
    const build = spawnSync('npx', ['astro', 'build'], { cwd: ROOT, stdio: 'inherit' });
    if (build.status !== 0) process.exit(build.status ?? 1);
  }

  const src = join(DIST, 'stories', slug, 'index.html');
  if (!existsSync(src)) {
    console.error(`no built page for "${slug}" — expected ${src}`);
    process.exit(1);
  }

  let page = inline(readFileSync(src, 'utf8'));
  if (withAudio) {
    const result = inlineAudio(page);
    page = result.html;
    console.log(`inlined ${result.count} narration clip(s)`);
  }

  const html = embed ? toEmbed(page) : page;
  const name = embed ? `${slug}.embed.html` : `${slug}.html`;

  assertSelfContained(html, name);

  mkdirSync(OUT, { recursive: true });
  const dest = join(OUT, name);
  writeFileSync(dest, html);
  console.log(`wrote ${dest} (${Math.round(html.length / 1024)} KB)`);
}

main();
