---
name: spielbot-update
description: Use when an existing spielbot video needs changes: new or edited scenes, a feature that changed, a new voice or music.
---

# Update

Regenerate only what changed; the clock makes every scene independent.

1. Read the project's `STATE.md`, `brief.md` and `script.md`. List the changes with the user: scenes added,
   edited, removed or reordered.
2. Edit `script.md` (and `project.json` cards) as in `spielbot-script`. Inserting a scene: give it an id that sorts
   into place (`03b-…`); renumbering chapters only touches `project.json` and the chapter phrases.
3. For each changed app scene: update the beats, `probe` it, `narrate` it, `record` it, `frames` it
   (`spielbot-explore`, `spielbot-capture`). Card and motion scenes only need `narrate`.
4. A new voice regenerates everything: `probe` all, `narrate` all, `record` all.
5. `build`, `check`, snapshot the changed scenes, preview (`spielbot-compose`), then `spielbot-render`, and update
   `STATE.md`.

**Gate:** as in each phase used; the user approves the preview before the render.
