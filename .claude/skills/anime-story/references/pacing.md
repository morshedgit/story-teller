# Pacing and narration voice

## The budget

The generated narrator reads at about **3.5 words per second** once punctuation
pauses are counted. Work backwards from the target runtime:

| Runtime | Narration words | Beats | Scenes |
|---|---|---|---|
| **30 sec** | **~95–105** | **~6** | **2** |
| 2 min | ~415 | ~23 | 7–8 |
| 5 min | ~1050 | ~58 | 19–20 |
| 8 min | ~1650 | ~92 | ~30 |

**Default to 30 seconds** unless the user asks for a length. Short pieces can be
re-cut in a single pass, which is what you want while the art is still being judged.
The longer rows are where a story goes once the look is settled.

Per unit:

- **A beat** is one or two sentences, ~18 words, ~5 seconds.
- **A scene** is 3 beats, ~16 seconds. At the 30-second length that is two scenes of
  three beats. A single-scene story has no cut in it and reads as a screensaver.

Do this arithmetic *before* writing. Coming back to cut 200 words after staging
fourteen scenes means re-cueing all of them.

**Punctuation is part of the budget.** `estimateBeatDuration()` in `src/lib/story.ts`
charges 0.35s per sentence stop and 0.18s per comma on top of the word count, so two
drafts of equal length can differ by seconds. The estimate is fitted to real generated
audio and lands within about half a second per beat, but it is still an estimate:
measure rather than assume. `window.__story.duration` in the browser is the resolved
runtime, and it is exact once `npm run narrate` has run.

If the user's prose is much shorter than the target, expand it — add the quiet
observational beats a narrator would. If it is much longer, cut to the spine and
say in your report what you dropped.

## Cutting prose into beats

A beat is a **unit of attention**, not a sentence count. Break where the listener's
mental image changes.

Good:

> "Autumn went. Winter came, and the lantern froze to the post."

One image, two clauses, ~7s. The next beat moves to a new image.

Bad — three images crammed together, nothing lands:

> "Autumn went and winter came and the lantern froze to the post while she kept
> walking down to the station every night even when the snow was deep."

Bad — too thin to justify its own caption:

> "Autumn went."

### Structural rhythm

- **Beat 1** of a scene establishes: where we are, what changed.
- **Beat 2** develops: the detail that makes it specific.
- **Beat 3** lands: the line that carries the feeling. Give it `hold: 0.6–1.2`.

Scene-level shape for a 14-scene piece: 2 scenes to establish, 3–4 to build the
want, 1 to break it, 2–3 in the low place, 3 to turn it, 1–2 to rest. Put the
`memory` palette flashback early, around scene 3.

### At 30 seconds

None of that arc advice applies — there is no room for an arc, and a flashback inside
two scenes just costs you the ending. The shape is:

- **Scene 1** establishes the situation and what it cost. Two beats.
- **Scene 2** turns it and lands. Two or three beats, the last one holding.

Everything is carried by the turn between the two scenes, so the cut has to earn it.
Two things make the pair read as one place rather than two:

- **Keep the character on the same mark across the cut.** Moving them across the frame
  between scenes reads as teleporting, not as time passing.
- **Reuse a position for a different object.** In `last-ticket` a stockpot stands at
  x 250 in scene 1 and the finished dish fades in on that exact mark in scene 2 — same
  spot, opposite end of the night. That rhyme does more than a third scene would.

A palette change across the cut is the cheapest way to signal the turn: `storm` to
`dawn` reads as the night breaking without a word spent on it.

## Narration voice

Write for the ear, in third person past tense, plainly.

**Do:**
- Short declaratives. Let the images carry the weight.
- Concrete nouns over abstractions. "The lantern froze to the post" beats "it was a
  hard winter."
- Specific numbers. "Four hundred and eleven times" is memorable; "many times" is not.
- Understatement at the emotional peak. Say less exactly where it matters most.
- Repeat one phrase across the piece so the ending can land on it.

**Don't:**
- Describe what the animation already shows. If she is walking, don't say she walks —
  say what she was thinking about.
- Use dialogue. There is one narrator and no lip sync. Report speech instead:
  *"She told him he was an idiot. He agreed."*
- Write sentences that need punctuation to parse. They are heard, not read.
- Use words a TTS voice will mangle — obscure proper nouns, dense clauses,
  parentheticals.

### Names and numbers

Spell numbers out (`four hundred and eleven`, not `411`) — TTS reads digits
inconsistently. Introduce each character's name in narration the first time they
appear on screen, since there are no name cards.

## Worked example

`last-ticket` in full — 97 words, **29.6 seconds measured** with real narration, two
scenes of three and four beats:

> **service** (`storm`)
> "The fish came in wrong, the bread went black, and Mika dropped a plate at nine."
> "By the time the last table left, she had stopped counting what it cost her."
> "She turned off the burners one by one, and did not turn on the lights." `hold: 0.5`
>
> **ticket** (`dawn`)
> "Ten minutes after the door was locked, the printer woke with one more ticket."
> "She almost left it in the tray. Her hand went to it out of habit."
> "Her mother's order. She had driven four hours and had not called ahead."
> "Mika read it twice. Then she started the rice." `hold: 1.2`

Scene 1 is the whole bad night in three lines — the disasters are *reported*, not
staged, which is what buys the room to show only the aftermath, and it closes on an
image rather than a statement. Scene 2 is the turn, and it earns the turn by first
letting her nearly refuse it. The last beat is the shortest in the piece and gets the
longest hold.

Note what is not there: no dialogue, no adjective doing work a noun could do, and
nothing describing what the picture already shows. She is slumped on screen, so the
narration never says she was tired.
