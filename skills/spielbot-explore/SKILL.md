---
name: spielbot-explore
description: Phase 3 of a spielbot video. Use to write scenes.mjs beats, selectors, login and the state hooks for app scenes.
---

# Explore

Make every app scene run unattended and leave the app as it found it.

1. **Hooks first.** Decide with the user how the state is restored, then write `hooks/setup.sh` and
   `hooks/teardown.sh`. Common shapes: save the max id of each table the scenes write to and delete above it on
   teardown (children first); snapshot and restore a database; seed demo data; start and stop a local server
   (`examples/hello/hooks/`). Files the scenes upload or generate are deleted too.
2. **Login.** Write `login()` in `scenes.mjs` with credentials from `env`. Skip it for public apps.
3. **Find the path.** For each scene, write the clicks in a throwaway steps file outside the project
   (`export default async (page, h, shot) => { … }`, see `toolkit/capture/explore.mjs`) and run it between the hooks:
   `bin/spielbot explore <project> <steps.mjs>`. Call `shot('name')` after each step and read every screenshot.
   Prefer role, label and text locators.
4. **Write the beats.** One async function per phrase, in order, using the `h` helpers (`docs/project-format.md`).
   Everything that must not appear (navigation to the start screen, closing a leftover toast) goes in `setup`.
5. **Probe.** `bin/spielbot probe <project>`: every scene prints `ok` with its beat durations, and
   `build/probe/<scene>-<n>.png` shows the result of each beat. Read every screenshot against its phrase.
6. **Restored.** After the probe, confirm teardown removed what the scenes created (query, listing or screenshot).

**Gate:** every scene probes `ok`, every probe screenshot matches its phrase, the state is restored. Next:
`spielbot-voice`.
