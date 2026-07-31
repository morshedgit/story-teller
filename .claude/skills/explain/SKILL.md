---
name: explain
description: Re-explain the previous message in plain, jargon-free language — full picture first, then the details — the way a senior engineer answers a system design interview question. Use when the user asks to explain, unpack, clarify, break down, simplify, ELI5, or "say that again in plain English" — whether they mean the last message, a specific part of it, or something they just pasted in. Also use for "what does this mean", "I don't follow", "wait, why?", or "explain it like I'm new here".
---

# Explain

Take what was just said and re-say it so someone can actually hold it in their head.

The reader is smart but does not have your context. They should finish the explanation able to describe the thing to a third person, not just nod along.

## Step 1: Pick the target

Default target is the **immediately preceding assistant message** in this conversation.

Override the default when:
- The user quotes or names something specific ("explain the retry part", "what's a reducer?") — explain that, in the context of the surrounding message.
- The user pasted content (code, an error, a doc, a diff) in their request — that pasted thing is the target.
- The previous message was tool output or a plan rather than prose — explain what it *means* and what it implies, not what it literally says line by line.

If the previous message was already short and plain, don't pad it. Say the one thing that was actually confusing and stop.

## Step 2: Find the spine before writing

Answer these for yourself first. Do not write until you can:

1. **What is this thing, in one sentence, using no borrowed vocabulary?**
2. **What problem does it exist to solve?** If it solves nothing, that's the most important thing to say.
3. **What is the end-to-end flow?** Something goes in, something happens, something comes out. Name those three.
4. **What are the 2–4 real parts?** Not every part — the ones that carry the weight.
5. **Where does it strain?** Every design trades something away. Name the trade.

If you can't answer #2 or #3, you don't understand it well enough to explain it — go read the code or the source material first.

## Step 3: Write it in this shape

Top-down, widest first. Each section should make sense even if the reader stops there.

**1. The one-liner.** Open with the whole answer compressed into a sentence or two. No throat-clearing, no "great question", no restating the question. If the reader reads only this, they have the gist.

**2. The why.** The problem, the pain, the thing that used to be hard. This is what makes the rest stick — mechanism without motive is just trivia.

**3. The shape.** How it works end to end, in one pass, at low resolution. Follow one concrete unit — one request, one file, one message — all the way through the system. Concrete beats abstract: "you click save" beats "upon a persistence event".

**4. The pieces.** Now zoom in, one part per paragraph, in the order they appear in the flow you just described. For each: what it does, why it's separate from the others, and what breaks if it's missing.

**5. The trade.** What this approach costs, when it's the wrong choice, what the alternative would have been. This is the part that shows you actually understand it, and it's the part most explanations skip.

Sections 3 and 4 are the interview move: the interviewer wants the whiteboard boxes before the class definitions. Never open with the class definitions.

## Rules

**On words**
- Zero unexplained jargon. If a term is genuinely load-bearing, define it in-line the first time in six words or fewer, then use it freely: "an idempotent call — safe to repeat — means…". Never define a term you then never use again.
- Prefer the short word. *Use* not *utilize*, *so* not *thereby*, *fix* not *remediate*.
- Kill nominalizations. "The system does a validation of" → "the system validates".
- No acronym appears before its expansion.

**On structure**
- Cohesive prose, not bullet soup. Paragraphs connected by actual reasoning — "because of that", "which is why", "the catch is". Bullets are for genuine lists of parallel items, not as a substitute for thinking through the connection.
- One idea per paragraph. Three to five sentences.
- Never number things that aren't sequential.

**On substance**
- One good analogy, placed in section 2 or 3, and only if it's load-bearing. Then drop it — don't extend a metaphor past its useful life, and never mix two.
- Show the concrete case before the general rule. A person understands "if the server dies mid-write, the row is half-written" faster than "atomicity violations under partial failure".
- Say the uncomfortable part. If the previous message glossed something, hand-waved a risk, or made an assumption that might be wrong, name it. Explaining is not defending.
- Do not repeat the original message's phrasing. If you find yourself reaching for the same sentence, you're summarizing, not explaining.

**On length**
- Match the material. A confusing sentence gets three paragraphs. A whole architecture gets a page. Nothing gets two pages.
- No summary section at the end. You already led with the summary.

## Anti-patterns

| Don't | Do |
| --- | --- |
| Start with implementation details and build up | Start with the whole and decompose |
| "As I mentioned above…" | Say the thing again, better |
| Define every term you use | Define only the 1–3 that carry the idea |
| A wall of bullets | Paragraphs with connective tissue |
| End with "In summary…" | Lead with the summary; end with the trade-off |
| Hedge everything ("it may possibly…") | Commit; flag the one real uncertainty explicitly |
| Explain what the words said | Explain what the words *mean* and why they matter |
