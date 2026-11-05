---
name: spielbot-doctor
description: Phase 1 of a spielbot video, and whenever a toolkit command fails for a missing tool, browser, login or key.
---

# Doctor

1. Run `bin/spielbot doctor --fix`. It installs what needs no password (npm dependencies, Chromium for Playwright)
   and lists the rest with the command that fixes it.
2. For each `MISS`, hand the user the exact line. System packages need `sudo`, so the user runs them; interactive
   logins too (`! npx hyperframes auth login`). Wait, then rerun the doctor.
3. Optional items matter only when the brief uses them: the heygen CLI and the HyperFrames sign-in for catalog
   music, `ELEVENLABS_API_KEY` for the paid voice.
4. For app videos, also confirm the app answers: `curl -sI <baseUrl>` returns a status line.

**Gate:** the doctor exits 0 (or the user accepts a missing optional item) and the app answers. Next:
`spielbot-script`.
