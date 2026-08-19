# Story Teller Guidelines: Generic Engine + Studio Skills Architecture

Always follow the core architectural principles defined in [AGENTS.md](file:///users/sadeq/projects/story-teller/AGENTS.md):

1. **Generic Engine Invariant:** Keep `src/lib/`, `scripts/`, `src/components/`, and `src/lib/art-stencil/` 100% generic, reusable, and decoupled from any individual story.
2. **Dynamic Generation via Skills:** When the user requests a new story or animation, use the studio skills in `.claude/skills/` (`anime-story`, `art-director`, `shot-animator`, etc.) to scaffold a self-contained story directory under `src/stories/<slug>/`.
3. **Strict Story Isolation:** Every story owns its art in `src/stories/<slug>/art/`. Never import directly from `src/lib/art-stencil/` or other stories.
4. **Resilient Audio QA:** Validate audio generation (`npm run narrate <slug>`) and run `npm run audit <slug>` and `npm run check` to verify before completion.
