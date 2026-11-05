---
name: spielbot-capture
description: Phase 5 of a spielbot video. Use to record app scenes and verify each end-of-phrase frame against its phrase.
---

# Capture

1. **Record.** `bin/spielbot record <project> [scene…]`. A scene that prints `LATE` had a beat longer than its
   phrase: run `probe` for it, `narrate` it, and record it again. An `ERROR` leaves
   `build/probe/error-<scene>.png`: read it, fix the beat, probe again.
2. **Frames.** `bin/spielbot frames <project>` extracts the frame 0.25 s before each next phrase and prints the
   phrases in order. Read every grid in `build/frames/grid/` and compare frame N with phrase N: the action the phrase
   describes is complete and visible. Use `--mid` for actions undone within their beat.
3. Fix every mismatch at its source: the beat (it did something else), the phrase (it promised something the app
   does not show), or the data (seed it in the hooks). Then re-run the affected steps for that scene only.

**Gate:** zero LATE, zero ERROR, every end-of-phrase frame matches its phrase. Report the count ("42 of 42
frames match"). Next: `spielbot-compose`.
