# spielbot

https://github.com/user-attachments/assets/34bf80a0-d3d7-4b54-90f3-6c02a36a0866

**Lights, camera, agent.** spielbot is a framework that lets a coding agent produce narrated product videos end to
end. You open this repository in your agent (Claude Code, Codex, OpenCode or any harness that reads `AGENTS.md`),
describe the video you want, and the agent runs the production. It interviews you, writes the script, generates
the voice, records your web app with a headless browser, adds chapters, captions and music, and renders a 1080p MP4.

You talk; the agent directs; the toolkit does the mechanical work.

## Quick start

```bash
git clone <this-repository-url> spielbot
cd spielbot
bin/spielbot doctor --fix      # checks the toolchain and installs what it can
claude                         # or: codex, opencode, …
```

Then ask for the video in plain words:

```
> Make a 3-minute video showing how a new customer signs up in my app at http://localhost:3000
> Quero um vídeo de 5 minutos, em português, explicando o módulo de relatórios do meu sistema
> Make a 1-minute animated explainer (no app) about how our pricing works
```

The agent works in phases. After each phase it shows you the result (the brief, the script, a voice sample, the
recorded frames, the preview) and waits for your approval before the next one. Nothing is rendered until you have
seen and approved the preview.

## What you need

| Requirement | Why | Install |
|---|---|---|
| A coding agent | runs the production | Claude Code, Codex, OpenCode, … |
| Node 22+ | toolkit, browser automation, composition | https://nodejs.org |
| Python 3.12+ and [uv](https://docs.astral.sh/uv/) | narration | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| ffmpeg | audio and video processing | `apt install ffmpeg` / `brew install ffmpeg` |
| Chromium for Playwright | screen capture | installed by `bin/spielbot doctor --fix` |
| *(optional)* heygen CLI + free HyperFrames sign-in | background music from a free catalog | see `docs/music.md` |
| *(optional)* ElevenLabs API key | a paid, more natural voice | see `docs/voices.md` |

For app walkthroughs you also need the app running in a **local, staging or demo environment** (never
production), and test credentials if it has a login. The agent asks for them; you put them in the project's `.env`
yourself, so they never pass through the chat.

## How it works

**One phrase, one beat.** Every line of narration is paired with one on-screen action. The voice is generated
first, phrase by phrase, and its timing table becomes the single clock. The browser recording waits for each
phrase to start before playing its action, and the captions and cuts are timed from the same table. Picture and
speech stay in sync without any manual editing. When a feature changes, only its scene is regenerated.

```
script.md ──► voice (timings.json) ──► screen capture ──► composition ──► MP4
     ▲               ▲                       │
     └── probe: how long each action takes ──┘
```

| Phase | What happens | You approve |
|---|---|---|
| 0. Intake | short interview; writes `brief.md` | the brief |
| 1. Doctor | checks and installs the toolchain | — |
| 2. Script | scenes, chapters and narration in `script.md` | the script |
| 3. Explore | browser automation for each app scene, plus hooks that undo what the scenes create | — |
| 4. Voice | narration audio and the timing table | a voice sample |
| 5. Capture | records each app scene and checks the frame at the end of every phrase | — |
| 6. Compose | chapters, captions, cursor, music; a live preview | the preview |
| 7. Render | the MP4, verified (format, duration, loudness) and delivered | — |
| 8. Update | regenerates only the scenes that changed | the preview |

A video can mix three kinds of scenes:

- **app**: a real recording of your web app, with a smooth cursor and click ripples drawn on top;
- **card**: an animated title, chapter, list or closing card;
- **motion**: a custom animated diagram for ideas that have no screen.

## Running the toolkit by hand

The agent drives everything through one command, and you can too:

```bash
bin/spielbot help
bin/spielbot new my-video                 # projects/my-video from the template
bin/spielbot probe    projects/my-video   # measure each on-screen action
bin/spielbot narrate  projects/my-video   # voice + timings
bin/spielbot record   projects/my-video   # record the app scenes
bin/spielbot frames   projects/my-video   # end-of-phrase frames for checking
bin/spielbot build    projects/my-video   # HyperFrames composition
bin/spielbot preview  projects/my-video   # scrub and edit in the browser
bin/spielbot render   projects/my-video   # build/out/video.mp4
```

Try the bundled example, a 45-second video recorded against a small demo app:

```bash
bin/spielbot narrate examples/hello && bin/spielbot record examples/hello \
  && bin/spielbot build examples/hello && bin/spielbot render examples/hello hello
```

## Repository layout

| Path | Contents |
|---|---|
| `AGENTS.md`, `CLAUDE.md` | the agent's entry point: role, phases, rules |
| `skills/` | one skill per phase (also linked as `.claude/skills` and `.agents/skills`) |
| `docs/` | principles, project format, voices, music, pitfalls |
| `toolkit/` | narration, capture, composition and render engines |
| `templates/project/` | the starting files of a new video |
| `examples/` | `hello`, a complete project, and `demo-app`, the app it records |
| `projects/` | your videos (git-ignored) |

## Built with

| Step | Tool |
|---|---|
| Screen capture | [Playwright](https://playwright.dev) (headless Chromium) |
| Voice | [edge-tts](https://github.com/rany2/edge-tts) (free neural voices) or [ElevenLabs](https://elevenlabs.io) |
| Music | the free HeyGen catalog through HyperFrames `media-use`, or your own files |
| Audio and video processing | [ffmpeg](https://ffmpeg.org) |
| Composition and render | [HyperFrames](https://hyperframes.heygen.com) (HTML to video) and [GSAP](https://gsap.com) |

## License

MIT, see `LICENSE`. Third-party pieces keep their own terms: HyperFrames (Apache 2.0), IBM Plex Sans (SIL OFL 1.1,
bundled in `toolkit/compose/fonts/`), edge-tts (GPL-3.0, installed separately at run time; it uses a Microsoft
service without an SLA, so check that service's terms before commercial use), and each track of the HeyGen
catalog (its own license).
