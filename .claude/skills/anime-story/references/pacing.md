# Pacing and narration voice

## The budget

The generated narrator reads at about **3.5 words per second** once punctuation
pauses are counted. Work backwards from the target runtime:

| Runtime | Narration words | Beats | Shots |
|---|---|---|---|
| **30 sec** | **~95–105** | **~6** | **6–9** |
| 2 min | ~415 | ~23 | 24–34 |
| 5 min | ~1050 | ~58 | 60–85 |
| 8 min | ~1650 | ~92 | 95–130 |

**Default to 30 seconds** unless the user asks for a length. Short pieces can be
re-cut in a single pass, which is what you want while the art is still being judged.
The longer rows are where a story goes once the look is settled.

Per unit:

- **A beat** is one or two sentences, ~18 words, ~5 seconds. It is a unit of
  *narration*.
- **A shot** — a `scene` in the storyboard — is one framing, held **3–5 seconds**. It
  is a unit of *picture*.

**These are different axes, and conflating them is what makes a story flat.** A beat
can span two shots, and a shot can carry two beats. Six beats does not mean six
shots; it means roughly thirty seconds of narration, over which you cut as often as
the picture needs. A 30-second piece holding one framing for fifteen seconds is a
screensaver with a voice on it, however good the writing is.

Most shots are **the same place seen differently**. You are not looking for six
locations — you are looking for a wide that establishes, a medium that plays the
action, and a close that carries the moment, restaged from the same backdrop with
the character at a different `scale` and `y`.

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

Narration groups into threes:

- **Beat 1** establishes: where we are, what changed.
- **Beat 2** develops: the detail that makes it specific.
- **Beat 3** lands: the line that carries the feeling. Give it `hold: 0.6–1.2`.

Call each such group a **movement**. A movement is a unit of story, and it is what
the arc is built from — it is not a shot. Expect two or three shots inside one.

Arc shape for a 14-movement piece: 2 movements to establish, 3–4 to build the want,
1 to break it, 2–3 in the low place, 3 to turn it, 1–2 to rest. Put the `memory`
palette flashback early, around the third.

### At 30 seconds

None of that arc advice applies — there is no room for an arc. The narrative shape is
two movements:

- **First movement** establishes the situation and what it cost. About three beats.
- **Second movement** turns it and lands. Three beats, the last one holding.

That is the *writing*. The *picture* cuts more often than that. Six to nine shots
across the two movements, which in practice means roughly:

| | Shot | Framing |
|---|---|---|
| 1 | establish the place | wide, figure small |
| 2 | settle on the character | medium |
| 3 | the detail that hurts | close — a prop, a hand, a face |
| 4 | the turn arrives | medium, new palette |
| 5 | the reaction to it | **close**, with a `swap` |
| 6 | the last image | wide again, so the ending has air |

That is a template, not a rule, but if your storyboard has fewer than five entries
you have written a slideshow. **Two shots is the failure mode this table exists to
prevent.**

Three things keep many shots reading as one continuous place:

- **Keep the character on the same mark across a cut** unless you mean them to have
  moved. Sliding them sideways between shots reads as teleporting.
- **Cut on the framing, not the location.** Same backdrop, different `scale` — that is
  a camera move in a real film and it is free here.
- **Reuse a position for a different object.** In `last-ticket` a stockpot stands at
  x 250 in the first movement and the finished dish fades in on that exact mark in the
  second — same spot, opposite end of the night.

A palette change across the turn is the cheapest way to signal it: `storm` to `dawn`
reads as the night breaking without a word spent on it. Use `transition: 'cut'`
between shots inside a movement, and `'fade'` at the turn.

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

`last-ticket` in full — 97 words, **29.6 seconds measured** with real narration.

Read this for the *writing*: the beat breaks, the restraint, the voice. Its shot
rhythm is not exemplary — it holds two framings across the whole piece, which is the
flatness the shot table above exists to prevent. Copy the prose discipline, not the
storyboard.

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
