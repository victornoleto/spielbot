# Pitfalls

Real failures from production runs, with the fix already in the toolkit or the rule to follow.

- **Beat started LATE.** A beat took longer than its phrase plus pause. Run `probe` again after changing beats,
  then `narrate` (it reads `build/beats.json`), then `record`. Never record with stale beats.
- **Phrase/beat count mismatch.** `record` refuses to run. Fix the script or `scenes.mjs` so they pair one to one.
- **Action undone before the end-of-phrase frame.** A filter applied and cleared inside one beat never shows in
  the frame check: use `frames --mid` for that scene and look at the 45/70/85% frames.
- **Heavy pages stutter in headless.** Blur behind modals, maps and WebGL need the GPU: the browser launches with
  GL on by default; `GL=software` is for machines without a GPU and will be slow on those pages.
- **Injected cursor freezes frames.** The toolkit never draws a cursor in the page; it records the mouse trail and
  the composition draws it. Keep it that way.
- **Date inputs in the wrong locale.** Headless date fields follow the process `LANG`; set `app.locale` and the
  toolkit exports the matching `LANG`.
- **scrollIntoView hangs inside modals.** `h.go` only scrolls when the target is off screen; do not call
  `scrollIntoViewIfNeeded` yourself in a beat.
- **Music loop holes.** Tracks with silent or faded tails leave gaps at the loop seam; the toolkit trims them. If
  you mix by hand, check with `ffmpeg -i <file> -af silencedetect=n=-45dB:d=0.5 -f null -`.
- **Render shows no progress.** `render` runs with `--quiet`; use `bin/spielbot progress <project>`.
- **A data-dependent screen differs from the script.** Local or staging data may lack what a scene needs (an empty
  result, a missing record). Seed it in `hooks/setup.sh`, or change the scene to show what exists and say so in the
  phrase. Never narrate what the screen does not show.
- **Long captures and big copies.** An action that copies large files (reprocessing, imports) must be undone by
  `teardown.sh`, including files on disk, or disk fills across retakes.
