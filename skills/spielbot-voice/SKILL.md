---
name: spielbot-voice
description: Phase 4 of a spielbot video. Use to choose a voice and generate narration audio and timings.json.
---

# Voice

1. **Sample.** Generate one representative phrase in 2 or 3 candidate voices (`docs/voices.md`) into
   `build/samples/`, and give the user the paths to listen to. Paid engines need the user's yes first, with the
   character count of the whole script.
2. Set the chosen voice in `project.json` → `voice`.
3. **Narrate.** With app scenes, make sure `build/beats.json` is fresh (from the last `probe`), then
   `bin/spielbot narrate <project>`. It prints each scene's length and the total.
4. Listen-check without ears: phrases with odd pronunciation are usually numbers, acronyms and foreign words.
   Rewrite those phrases the way they should sound and regenerate only their scenes
   (`bin/spielbot narrate <project> <scene>`).

**Gate:** the user approves the voice and the total length. Next: `spielbot-capture` when there are app scenes,
else `spielbot-compose`.
