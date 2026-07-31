# Pacing and narration voice

## The budget

A narrator reads at about **2.6 words per second**, unhurried, with pauses at
punctuation. Work backwards from the target runtime:

| Runtime | Narration words | Beats | Scenes |
|---|---|---|---|
| 2 min | ~300 | ~17 | 5–6 |
| **5 min** | **~750–800** | **~42** | **12–15** |
| 8 min | ~1250 | ~68 | 20–24 |

Per unit:

- **A beat** is one or two sentences, ~18 words, ~7 seconds.
- **A scene** is 3 beats, ~21 seconds.

Do this arithmetic *before* writing. Coming back to cut 200 words after staging
fourteen scenes means re-cueing all of them.

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

From `the-third-post-from-the-end`, scene 6 — three beats, one image each,
escalating, landing on stillness:

> "In February the rain came sideways for nine days."
> "On the ninth, the wind took the lantern off the post and rolled it down the tracks."
> "Yuki knelt in the water and did not get up for a long time." `hold: 1`

54 words, ~21 seconds. Beat 1 sets weather, beat 2 delivers the loss as a physical
event, beat 3 stops moving. The camera pushes in slowly across all three; the only
sharp cue is the lantern rolling, on beat 2.
