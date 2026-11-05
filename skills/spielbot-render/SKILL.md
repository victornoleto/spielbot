---
name: spielbot-render
description: Phase 7 of a spielbot video. Use to render the final MP4, follow its progress, verify it and deliver it.
---

# Render

1. Estimate first: rendering takes about 1.5 times the video length on a recent laptop. Above 5 minutes of render,
   confirm with the user.
2. `bin/spielbot render <project> <name>` (run it in the background for long videos and poll
   `bin/spielbot progress <project>` every few minutes). It ends by printing the streams and the integrated loudness.
3. **Verify:** h264 1920x1080 at 30/1, an aac stream, duration within 0.1 s of the composition's total, loudness
   between -20 and -16 LUFS.
4. **Deliver** to the brief's destination. For a remote machine: `rsync -av --progress <file> <host>:<dir>/`, then
   compare `sha256sum` on both sides.
5. Write `<project>/STATE.md`: what was delivered (path, duration, size, checksum), the voice and music used, and
   how to regenerate it.

**Gate:** the file is delivered and verified. A later change to this video starts at `spielbot-update`.
