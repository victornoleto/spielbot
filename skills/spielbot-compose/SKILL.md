---
name: spielbot-compose
description: Phase 6 of a spielbot video. Use to build the HyperFrames composition, add music, badges, cards or motion scenes, and preview.
---

# Compose

1. **Music** (when the brief asks for it): get tracks as in `docs/music.md` and map them in `project.json` →
   `music.tracks`, one per chapter by default.
2. **Motion scenes:** write each in `motion.mjs` (`docs/project-format.md`), every part appearing at its phrase.
3. **Build.** `bin/spielbot build <project>` (add `--no-video` when only cards, music or captions changed). It
   prints one line per scene with its start, length and kind.
4. **Check.** `bin/spielbot check <project>` prints JSON: `ok` must be true. Fix each error; weigh each warning.
5. **Look.** `bin/spielbot snapshot <project> --at <t1>,<t2>,…` with one time inside every card and motion scene,
   and read the contact sheet: text inside the frame, nothing overlapping, each part present when its phrase plays.
6. **Preview.** `bin/spielbot preview <project>` and give the user the URL it prints. The HyperFrames preview lets
   them scrub and edit.

**Gate:** check passes and the user approves the preview. Next: `spielbot-render`.
