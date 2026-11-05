# spielbot

An agent-driven framework for narrated product videos. Open this folder in your coding agent (Claude Code, Codex,
OpenCode, …) and ask for a video; the agent interviews you, writes the script, generates the voice, records your
web app with a headless browser, composes chapters, captions and music, and renders a 1080p MP4.

```
git clone git@github.com:victornoleto/spielbot.git && cd spielbot
claude          # or codex, opencode
> Make a 3-minute video showing the customer sign-up of my app at http://localhost:3000
```

## How it works

One phrase of narration is one beat on screen. The voice is generated first, phrase by phrase; its timing table
then drives the browser recording, the captions and the cuts, so picture and speech stay in sync without manual
editing. See `docs/principles.md`.

| Step | Tool |
|---|---|
| Script, orchestration | your coding agent, guided by `AGENTS.md` and `skills/` |
| Screen capture | Playwright (headless Chromium) |
| Voice | edge-tts (free neural voices); ElevenLabs optional |
| Music | HeyGen's free catalog through HyperFrames `media-use`; or your own files |
| Audio and video processing | ffmpeg |
| Composition and render | HyperFrames (HTML to video) + GSAP |

## Requirements

Node 22+, Python 3.12+, uv, ffmpeg. `bin/spielbot doctor --fix` checks everything and installs the rest
(npm dependencies, Chromium for Playwright). Background music needs the heygen CLI and a free HyperFrames sign-in.

Try it: `bin/spielbot narrate examples/hello && bin/spielbot record examples/hello && bin/spielbot build examples/hello && bin/spielbot render examples/hello`.

## Licenses

spielbot is private for now. Third-party pieces keep their own terms: HyperFrames (Apache 2.0), IBM Plex Sans
(SIL OFL 1.1, bundled in `toolkit/compose/fonts/`), edge-tts (GPL-3.0 client of a Microsoft service without an SLA;
check the service terms before commercial use), the HeyGen catalog (its own license per track).
