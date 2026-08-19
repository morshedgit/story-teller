---
name: tech-explainer
description: Create a fast-paced, high-clarity technical explainer short in src/stories/<slug>/ — turning complex system architectures, algorithms, data structures, protocol flows, or engineering concepts into a 20–40s animated vector short with timed narration and step-by-step visual reveals. Use whenever the user asks to explain, animate, visualize, or create a video/short for a technical concept, software pattern, protocol, algorithm, or system design.
---

# Tech Explainer

Turn complex technical architectures, software patterns, data flows, or algorithms into a crisp **20–40 second** animated vector short.

A technical short is not a narrative fable — it is a **visual mental model**. Its job is to make an abstract concept instantly intuitive using diagrams, progressive layer reveals, kinetic camera pans, and punchy narration.

---

## Technical Pacing & Structure

Technical explainers move faster than narrative stories. Target **~3.8 to 4.2 words per second**:

| Runtime | Words | Beats | Shots | Structure |
|---|---|---|---|---|
| **20s** | ~75 | ~4 | 4 | Problem $\rightarrow$ Core Mechanism $\rightarrow$ Data Flow $\rightarrow$ Key Takeaway |
| **30s** | ~110 | ~6 | 6 | Problem $\rightarrow$ The Naive Way $\rightarrow$ The Core Innovation $\rightarrow$ Step-by-Step Flow $\rightarrow$ Trade-Off/Summary |
| **45s** | ~165 | ~9 | 8–9 | Full breakdown with edge-case or performance comparison |

---

## Directing Guidelines for Technical Explainers

### 1. Progressive Layer Reveals
Never dump an entire architecture diagram on screen at once. Start with the client/source, then reveal components as the narrator mentions them:
```ts
layers: [
  { id: 'client', svg: props.terminal(...), x: 300, y: 500 },
  { id: 'cache', svg: props.database(...), x: 800, y: 500, opacity: 0 },
  { id: 'database', svg: props.serverStack(...), x: 1300, y: 500, opacity: 0 },
],
beats: [
  {
    text: 'When a request arrives, the proxy checks cache first before hitting disk.',
    cues: [
      { target: 'cache', do: 'enter', from: 'bottom', at: 1.2 },
      { target: 'database', do: 'fade', to: 1, at: 3.0 },
    ],
  },
]
```

### 2. Kinetic Camera Pans Across the Pipeline
Use camera translations to follow data as it moves through a system:
```ts
// Pan from client (left) to server cluster (right)
{ target: 'camera', do: 'move', dx: -400, dur: 'beat', ease: 'inOut' }
```

### 3. Visual Callouts & Punch-Ins
When explaining a specific bottleneck or critical component, crash-zoom into that layer:
```ts
// Punch in tight on the database lock
...closeOn(1300, 500, 2.2)
```

### 4. Color Coding State Changes
Use layer variants (`swap`) to represent cache hits, packet dropped, server healthy/degraded:
```ts
variants: {
  hit: props.cacheNode({ status: 'green' }),
  miss: props.cacheNode({ status: 'red' }),
}
// Swap on the keyword "miss":
{ target: 'cache', do: 'swap', to: 'miss', at: 2.1 }
```

---

## Technical Explainer Staging

* **Palettes:** Use high-contrast modern palettes (`P.dawn`, `P.storm`, or neon/blueprint tones).
* **Backdrops:** Use clean structured locations (`classroom`, `rooftop`, or modern studio grids) or abstract minimal backdrops.
* **Effects:** Layer `screenTone` or subtle `lightRays` to keep vectors crisp and modern. Avoid heavy vintage filters (`sakura`, `mist`) unless thematically relevant.

---

## Production Workflow

1. **Script the Problem-Solution Spine:**
   * *Beat 1 (The Pain):* "Every database query locks the main thread, stalling user requests."
   * *Beat 2 (The Mechanism):* "An asynchronous write-ahead log batches operations in memory."
   * *Beat 3 (The Flow):* "Reads serve instantly from memory, while writes sync in the background."
   * *Beat 4 (The Result):* "Throughput jumps 10x with zero data loss."
2. **Scaffold & Stage:**
   `cp -r .claude/skills/anime-story/assets/story-scaffold src/stories/<slug>`
3. **Verify:**
   `npm run audit <slug>` $\rightarrow$ `npm run check` $\rightarrow$ `npm run narrate <slug>` $\rightarrow$ `npm run shoot <slug>`
