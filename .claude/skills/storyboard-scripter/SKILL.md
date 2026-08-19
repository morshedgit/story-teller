---
name: storyboard-scripter
description: Convert raw prose, story premises, memory fragments, interview transcripts, or book excerpts into voiceover-ready, beat-budgeted scripts formatted for Story Teller. Calculates word counts, punctuation pause budgets, atomic beat breaks, and rhythmic movement arcs. Use whenever the user asks to write, adapt, edit, script, or budget narration for an animated short.
---

# Storyboard Scripter

Transform raw ideas, prose, memories, or premises into tightly budgeted, poetic voiceover scripts for Story Teller.

Writing for narration is fundamentally different from writing prose for print. A listener cannot re-read a sentence; the words must create a single, clear mental image that lands in sync with the visual cut.

---

## 1. The Pacing Budget (3.5 WPM Rule)

Narration speaks at **~4.1 words per second**, plus **0.35s per sentence stop** (`.`, `!`, `?`) and **0.18s per soft pause** (`,`, `;`, `—`). The effective pace is **3.5 words per second**.

| Target Duration | Narration Word Count | Total Beats | Visual Movement Arc |
|---|---|---|---|
| **15 seconds** | ~45–55 words | 3 beats | 1 Movement: Hook $\rightarrow$ Turn $\rightarrow$ Payoff |
| **30 seconds** | **~95–105 words** | **6–7 beats** | 2 Movements: Premise & Cost $\rightarrow$ The Turn & Resolution |
| **60 seconds** | ~195–215 words | 12–14 beats | 3 Acts: Setup $\rightarrow$ Struggle $\rightarrow$ Realization $\rightarrow$ Aftermath |
| **2 minutes** | ~410–430 words | 24–26 beats | Extended narrative with flashback/memory movement |

---

## 2. The Atomic Beat Rule

A **beat** is one or two sentences ($\approx 12–18$ words, $\approx 4–5$ seconds).

### The Golden Rule of Beat Segmentation
**One Beat = Exactly One Mental Image.**

```
❌ Bad (Too many images crammed into one beat):
"The train arrived late and Mika ran through the rain with her bag slipping off her shoulder until she reached the empty ticket gate."

✓ Good (Broken into atomic image beats):
Beat 1: "The midnight train pulled in forty minutes late." (Image: Train platform)
Beat 2: "Mika ran through the downpour, clutching her soaked apron." (Image: Street rain)
Beat 3: "At the gate, not a single light was on." (Image: Dark station)
```

---

## 3. Rhythmic Movement Structure (The Rule of Threes)

Group narration into **3-beat movements**:

* **Beat 1 (Establish):** Where we are and what changed.
* **Beat 2 (Develop):** The specific sensory detail that makes it real.
* **Beat 3 (Land):** The line carrying the emotional truth. Always pair with `hold: 0.6–1.2`.

### Example 30-Second Movement Arc

```ts
// --- Movement 1: The Cost (The Night That Was) ---
// Beat 1: The fish came in wrong, the bread went black, and Mika dropped a plate at nine.
// Beat 2: By the time the last table left, she had stopped counting what it cost her.
// Beat 3: She turned off the burners one by one, and did not turn on the lights. [hold: 0.5]

// --- Movement 2: The Turn (The Unexpected Order) ---
// Beat 4: Ten minutes after the door was locked, the printer woke with one more ticket.
// Beat 5: She almost left it in the tray. Her hand went to it out of habit.
// Beat 6: Her mother’s order. She had driven four hours and had not called ahead.
// Beat 7: Mika read it twice. Then she started the rice. [hold: 1.2]
```

---

## 4. Narration Voice & Prose Principles

1. **Concrete Beats Abstract:** "She turned off the third burner" beats "She concluded her evening responsibilities".
2. **Short Words Carry Weight:** Prefer Anglo-Saxon root words (*cold*, *dark*, *rain*, *black*, *stone*) over Latinate abstractions (*unfavorable*, *precipitation*, *culmination*).
3. **Punctuate for Breathing:** Commas and em-dashes create natural pauses in neural TTS synthesis. Use them intentionally to let moments sink in.
4. **End on Action, Not Announcement:** Never write "She felt hopeful again." Write "She started the rice."
