# Story Teller

Narrated anime shorts, drawn in SVG. Give the `anime-story` skill a story; get back
a committable directory that renders as a ~30-second animated short with timed
captions and voice narration — generated locally, with no API key.

Astro, static output, deployed to Cloudflare Workers. No runtime framework — the
scenes are plain SVG, CSS and the Web Animations API.

## How it works

A story is **one directory**: `src/stories/<slug>/`, holding `story.ts` — narration,
staging and animation cues — and `art/`, the palettes, backdrops, character rig, props
and effects **that story owns**.

| Piece | Where | What it does |
|---|---|---|
| A story's art | `src/stories/<slug>/art/` | Owned outright. Editing it cannot affect any other story |
| Art stencil | `src/lib/art-stencil/` | The house style, as a thing to **copy from**. No story imports it |
| SVG helpers | `src/lib/svg.ts` | Frame size, seeded RNG, markup helpers. Shared because none of it has a colour |
| Types | `src/lib/story.ts` | `Story` / `Scene` / `Layer` / `Beat` / `Cue`. Imports no art |
| Timeline | `src/lib/timing.ts` | Resolves a story to absolute seconds at **build time** |
| Cue compiler | `src/scripts/animate.ts` | Cues → paused Web Animations |
| Player | `src/scripts/player.ts` | One clock, audio sync & ducking, transport |
| Isolation guard | `scripts/check-isolation.mjs` | Fails the build if a story imports the stencil or another story |
| Director QA Audit | `scripts/audit.mjs` | Automated cinematography, camera bounds, and staging quality gate |
| Skill | `.claude/skills/anime-story/` | How to turn prose into a storyboard |

### Generative, isolated vector art (No hardcoded glass ceilings)

Instead of relying on fixed, pre-coded visual templates that lock the system into a limited box of shapes, art in Story Teller is **generative declarative SVG code**.

* **Engine vs. Generative Skills:** The engine provides the timeline, WAAPI interpolation channels (`--cue-x`, `--cue-y`, `--cue-s`, `--cue-r`), master audio synchronization, and director QA audit tools. The agent skills (`art-director`, `anime-story`, `tech-explainer`, `motion-comic`) teach generative SVG drawing, cel-shading, anatomy, perspective, and lighting rules from scratch.
* **Isolated Ownership:** When a story is authored in `src/stories/<slug>/`, it owns its art outright in `art/` or inline in `story.ts`. An agent can draw custom characters, creatures, spaceships, historical scenes, or architectural spaces freely without depending on pre-baked library functions or risking regressions in other stories.
* **Zero Engine Bias:** The engine is structurally agnostic (`ScenePalette` requires only `name`, `tint`, `tintOpacity`; `Layer` requires only `id`, `svg`, `x`, `y`). It renders humans, animals, spaceships, microscopic diagrams, or abstract geometry with equal fidelity.

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
  estimate (`words / 4.1`, plus punctuation — fitted to real generated audio).

Both paths run identical rendering code, so a story is watchable before any voice
has been generated and stays correct once it has.

## Commands

```bash
npm install
npm run dev                  # local dev server
npm run check                # types + validates every cue target
npm run audit last-ticket    # automated cinematography & staging QA
npm run build                # static dist/
npm run preview

npm run narrate <slug>       # generate narration audio (no key needed)
npm run shoot <slug>         # one PNG per scene -> shots/<slug>/
npm run shoot kit            # art-kit contact sheet
```

In the player: `space` play/pause, `←`/`→` seek 5s, `n`/`p` scene, plus the
transport bar.

## Narration

```bash
npm run narrate last-ticket       # no key, no account, no network
npm run build                     # picks up the real durations
```

Narration is **generated on your machine** by default, with
[sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) and a neural voice model. There
is no API key, no per-character cost and no quota, and nothing about the story leaves
the box. The voice model (~65–300 MB) is downloaded once into `.tts-models/`
(gitignored) and reused after that; `scripts/tts_local.py` does the synthesis and
`scripts/narrate.mjs` encodes the result to MP3 in pure JavaScript.

| Env var | Effect |
|---|---|
| `TTS_LOCAL_MODEL` | Voice model directory name. Default `kokoro-en-v0_19` |
| `ELEVENLABS_API_KEY` / `OPENAI_API_KEY` | Use that hosted provider instead |
| `TTS_PROVIDER` | Force `local`, `elevenlabs` or `openai` |

Audio lands in `public/audio/<slug>/` as one MP3 per beat plus a `manifest.json` of
measured durations. Beats are content-hashed — including the voice — so re-running
after a one-line edit regenerates one file rather than the whole story, while
switching voices correctly regenerates all of them. Stale files are pruned.

> **Hosted providers may be unreachable.** In sandboxes whose proxy allowlists
> outbound hosts, `api.elevenlabs.io` and friends fail at CONNECT before a key
> matters. The local driver is the one that always works.

> Generated audio is committed. A 30-second story is a few hundred KB; a five-minute
> one is 3–6 MB — fine for a handful, but move `public/audio/` to R2 past ~20.

### Single-file export

```bash
npm run standalone last-ticket --with-audio
```

Folds the CSS, JS and narration into one HTML file that plays from `file://` with no
server. `--with-audio` is required for a narrated story: the export refuses to write
a file that would fetch its audio and play silently.

## Director Skills Suite

The studio includes specialized skills in `.claude/skills/`:

### Genre & Format Directors
| Skill | Role & Usage |
|---|---|
| **`anime-story`** | Lead Anime Director: Creates ~30s animated anime shorts with character rigs, staging, and cinematography cues. |
| **`tech-explainer`** | Technical Explainer: Creates punchy 20–40s visual explainers for system architectures, algorithms, and data flows. |
| **`motion-comic`** | Manga & Noir: Creates high-contrast graphic novel shorts with widescreen letterboxing, crash-zooms, and speed lines. |
| **`social-reels`** | Vertical 9:16 Shorts: Creates mobile-first shorts for TikTok, Reels, and Shorts with 1.5s hooks and centered safe-zone staging. |

### Studio Specialists
| Skill | Role & Usage |
|---|---|
| **`storyboard-scripter`** | Narration Scripter: Adapts raw prose, budgets word counts (3.5 WPM), and breaks narration into atomic visual beats. |
| **`art-director`** | Art Director: Crafts SVG palettes, custom backdrop builders, character rigs, and furniture/props in `1600 x 900` coordinates. |
| **`shot-animator`** | Animation Choreographer: Choreographs multi-layer timing, easing curves (`snap`, `anticipate`, `soft`), and camera physics. |
| **`sound-director`** | Audio & Sound Engineer: Curates ambient soundscapes, calibrates voice settings, and fine-tunes dynamic voice ducking. |
| **`story-doctor`** | Diagnostic & Polish: Critiques, audits, re-times, and fixes camera/staging defects in existing storyboards. |

## Adding a story

Invoke any of the directing skills (e.g. `anime-story`, `tech-explainer`, or `motion-comic`) with your premise or prose. The agent reads the schema, art catalogue, and cinematography guides, writes the storyboard, prunes art, runs `npm run audit`, and generates visuals and narration.

By hand:

```bash
cp -r .claude/skills/anime-story/assets/story-scaffold src/stories/<slug>
```

Then set the slug, prune `art/` to what you use, and write the scenes. Nothing needs
registering — `src/stories/index.ts` globs for `*/story.ts`, and the route and gallery
pick it up.

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
