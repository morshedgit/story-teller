---
name: social-reels
description: Create vertical (9:16) mobile-first animated shorts for TikTok, Instagram Reels, and YouTube Shorts in src/stories/<slug>/ — utilizing aggressive 1.5s visual hooks, center safe-zone framing, rapid cutting pacing, and high-impact mobile captions. Use whenever the user asks for a TikTok video, Reels short, YouTube Shorts story, vertical animation, or 9:16 mobile storyboard.
---

# Social Reels & Vertical Shorts

Create high-engagement, **vertical (9:16) mobile shorts** for TikTok, Instagram Reels, and YouTube Shorts in Story Teller.

Mobile viewers scroll rapidly. A vertical short must hook the viewer within the **first 1.5 seconds**, maintain centered action within the mobile safe zone, and cut aggressively every 2.5–3.5 seconds.

---

## 1. Vertical Framing & The Center Safe Zone

The canvas is $1600 \times 900$. In vertical 9:16 display mode, only the center vertical slice is visible:

$$\text{Horizontal Safe Zone: } x \in [547, 1053] \quad (\text{Width: } 506\text{px centered at } x = 800)$$

```
+------------------+------------------+------------------+
|   (Cropped Out)  |  9:16 SAFE ZONE  |   (Cropped Out)  |
|                  |   x = 547..1053  |                  |
|                  |                  |                  |
|                  |     [HERO]       |                  |
|                  |     x = 800      |                  |
|                  |                  |                  |
+------------------+------------------+------------------+
```

### Staging Rules for Vertical Shorts
1. **Center All Key Action:** Position character origins at $x \approx 750–850$. Never place the main subject at $x < 500$ or $x > 1100$.
2. **Target Head Close-Ups:** Vertical video loves tight Close-Ups. Use camera zoom:
   ```ts
   ...closeOn(800, FLOOR - HEAD, 2.2)
   ```
3. **Keep Captions in Lower Third:** Caption text sits in the lower center area, styled for maximum legibility on small screens.

---

## 2. The 3-Second Mobile Pacing Formula

| Time | Stage | Action |
|---|---|---|
| **0.0–1.5s** | **The Visual Hook** | Shock, immediate motion, crash zoom, high-contrast palette (`P.storm` or `P.dusk`). |
| **1.5–8.0s** | **The Conflict** | Tight medium shots, character reaching or turning, punchy narration beats. |
| **8.0–20.0s** | **The Escalation** | Fast cuts (2–3 seconds per shot), camera shakes, expression swaps. |
| **20.0–30.0s** | **The Climax & Loop** | Final dramatic realization, hold 0.8s, visual element that seamlessly loops back to beat 1. |

---

## 3. High-Energy Mobile Cues

Vertical shorts thrive on dynamic transitions:

```ts
// 1. Instant Mobile Punch-In (Hook)
{ target: 'camera', do: 'scale', to: 1.8, at: 0, dur: 0.001 }

// 2. High-Impact Shake on Beat Drops
{ target: 'camera', do: 'shake', strength: 12, at: 1.2, dur: 0.45, ease: 'out' }

// 3. Fast Flash Transition to Climax
transition: 'flash'
```

---

## 4. Mobile Production Checklist

* [ ] Is character $x$ placed firmly between $600$ and $1000$?
* [ ] Does Shot 1 open on high energy (tight framing or sudden motion) within 1.5s?
* [ ] Are narration lines under 14 words per beat to keep cuts brisk?
* [ ] Have you tested the standalone bundle (`npm run standalone <slug> --with-audio`) on mobile?
