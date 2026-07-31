# Story Teller

Narrated anime shorts, drawn in SVG. Give the `anime-story` skill a story; get back
a single committable file that renders as a ~5-minute animated short with timed
captions and voice narration.

Astro, static output, deployed to Cloudflare Workers. No runtime framework — the
scenes are plain SVG, CSS and the Web Animations API.

## How it works

A story is **one file**: `src/stories/<slug>.story.ts`. It holds narration, art (as
markup produced by the art kit) and animation cues. Everything else is shared:

| Piece | Where | What it does |
|---|---|---|
| Art kit | `src/lib/anime-kit/` | Palettes, backdrops, a character rig, props, effects. The reason twenty stories look like one library |
| Types | `src/lib/story.ts` | `Story` / `Scene` / `Layer` / `Beat` / `Cue` |
| Timeline | `src/lib/timing.ts` | Resolves a story to absolute seconds at **build time** |
| Cue compiler | `src/scripts/animate.ts` | Cues → paused Web Animations |
| Player | `src/scripts/player.ts` | One clock, audio sync, transport |
| Skill | `.claude/skills/anime-story/` | How to turn prose into a storyboard |

### The timing model

A **beat** is one or two sentences — the atomic unit of caption *and* audio. One MP3
is generated per beat, so beat boundaries are exact by construction and no timing
offsets are maintained by hand.

Every animation is a paused Web Animation whose `currentTime` is written from a
single clock each frame. The picture at time *t* is a pure function of *t*, so
scrubbing, pausing and jumping between scenes all work, and the animation cannot
drift from the voice.

Where the clock comes from depends on whether narration exists:

- **With audio** the playing `<audio>` element *is* the clock.
- **Without audio** it advances on `requestAnimationFrame` against a reading-speed
  estimate (`words / 2.6`).

Both paths run identical rendering code, so a story is watchable before any voice
has been generated and stays correct once it has.

## Commands

```bash
npm install
npm run dev                  # local dev server
npm run check                # types + validates every cue target
npm run build                # static dist/
npm run preview

npm run narrate <slug>       # generate narration audio (needs a TTS key)
npm run shoot <slug>         # one PNG per scene -> shots/<slug>/
npm run shoot kit            # art-kit contact sheet
```

In the player: `space` play/pause, `←`/`→` seek 5s, `n`/`p` scene, plus the
transport bar.

## Narration

```bash
export ELEVENLABS_API_KEY=...     # preferred
# or
export OPENAI_API_KEY=...

npm run narrate the-third-post-from-the-end
npm run build                     # picks up the real durations
```

Audio lands in `public/audio/<slug>/` as one MP3 per beat plus a `manifest.json` of
measured durations. Beats are content-hashed, so re-running after a one-line edit
regenerates one file rather than the whole story. Stale files are pruned.

**No key is required.** Without one the site builds and plays with captions and
estimated timing; the player shows a `captions only` badge. Nothing in the story
file changes when audio arrives.

> Generated audio is committed. That is roughly 3–6 MB per five-minute story — fine
> for a handful, but move `public/audio/` to R2 if the library grows past ~20.

## Adding a story

Invoke the `anime-story` skill with your prose. It will read
`.claude/skills/anime-story/references/` for the schema, the art catalogue and the
pacing budget, write the file, typecheck it, and screenshot every scene to check the
staging.

By hand: copy `.claude/skills/anime-story/assets/story-template.story.ts` into
`src/stories/`. Nothing needs registering — `src/stories/index.ts` globs the
directory and the route and gallery pick it up.

## Deployment

Static assets on Cloudflare Workers — no adapter, no server runtime.

Deploys run through **Cloudflare Workers Builds**: Cloudflare watches this
repository and builds on every push. There is no API token in this repo and no
deploy step in CI, because two systems publishing the same commit would race.

### Connecting it (once)

In the Cloudflare dashboard: **Workers & Pages → Create → Import a repository**,
pick `story-teller`, then set

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` (the default) |
| Root directory | `/` |
| Branch | `main` |

The Node version comes from `.nvmrc`, which Workers Builds reads automatically —
it takes priority over any dashboard variable, so CI and the deploy build stay on
the same version.

> **Name the Worker `story-teller`.** `wrangler deploy` takes its target from the
> `name` field in `wrangler.jsonc`, not from what the dashboard called the app. If
> those disagree you get two Workers: an empty one from the dashboard and the real
> one from the deploy. Either match the name or edit `wrangler.jsonc`.

`.github/workflows/ci.yml` typechecks, builds and validates `wrangler.jsonc` on
pushes and pull requests, so a broken commit fails in GitHub before Cloudflare
tries to ship it.

### Deploying by hand

```bash
npx wrangler deploy --dry-run    # validate config, no credentials needed
npm run deploy                   # build + publish
```

## Visual QA

`npm run shoot` is the real quality gate — a typecheck cannot tell you a character
is standing in mid-air. It builds, serves `dist/`, drives the player to the middle
of each scene with the repo's pinned Chromium and writes stills to `shots/`
(gitignored). `npm run shoot kit` renders every backdrop, pose, outfit and effect on
one page for reviewing changes to the kit itself.

Do not run `playwright install` — the browser is already provisioned.
