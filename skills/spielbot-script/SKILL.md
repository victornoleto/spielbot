---
name: spielbot-script
description: Phase 2 of a spielbot video. Use to write or revise a video's script.md and project.json, scenes, chapters and narration.
---

# Script

Write `script.md` and `project.json` from the brief. Read `docs/principles.md` and `docs/project-format.md` first;
`examples/hello/` shows both files done.

1. **Look at the real thing.** For app scenes, open each screen the video covers (a quick Playwright script through
   `bin/spielbot explore`, or screenshots the user provides) so every phrase describes what actually exists.
2. **Structure.** Title card, then chapters when the video passes about 3 minutes (one chapter card per major
   feature), then scenes, then a closing card. One scene shows one task on one screen, 3 to 8 phrases.
3. **Phrases.** Each phrase pairs with one beat (`- **Beats:**` list for app scenes, the part that appears for
   cards and motion). It says what the viewer sees at that moment, in the brief's language, plain and concrete. The
   chapter card's phrases read the card title and subtitle word for word.
4. **project.json.** Language, voice, app settings, theme, every card's text, badges. Leave `music.tracks` empty
   until compose.
5. **Self-check.** Every scene has a Kind and a narration block; every app scene's beat count equals its phrase
   count; every card scene exists in `project.json` → `cards`; every motion scene is planned for `motion.mjs`.
   Estimate the length at about 2.6 words per second plus 0.7 s per phrase and compare with the brief.
6. Show the script with the estimated length, and wait.

**Gate:** the user approves the script. Next: `spielbot-explore` when there are app scenes, else `spielbot-voice`.
