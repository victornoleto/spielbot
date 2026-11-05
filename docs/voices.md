# Voices

`project.json` → `voice`: `engine`, `id`, `rate`, `pause` (seconds between phrases, stretched when a beat needs
more). Change only `voice`; the rest of the pipeline is the same for every engine.

## edge (default, free)

Microsoft Edge neural voices through `edge-tts`, with word timings for captions. No account. The service has no
SLA: a failing request is retried 4 times, and an outage means switching engine.

- pt-BR: `pt-BR-AntonioNeural` (male, default), `pt-BR-FranciscaNeural` (female), `pt-BR-ThalitaMultilingualNeural`
- en-US: `en-US-AndrewNeural`, `en-US-AvaNeural`, `en-US-BrianNeural`, `en-US-EmmaNeural`
- list all: `uvx edge-tts --list-voices`
- sample one phrase: `uvx edge-tts --voice <id> --text "<phrase>" --write-media /tmp/sample.mp3`

`rate` speeds or slows the voice (`-10%`, `+5%`).

## elevenlabs (paid)

More natural prosody and voice cloning. `id` is the ElevenLabs voice id; the model defaults to
`eleven_multilingual_v2` (override with `ELEVENLABS_MODEL`). Billing is 1 credit per character: count the
characters of every narration block before a full run and tell the user the total. Regenerating a scene costs
again, so try a single scene first (`bin/spielbot narrate <project> <scene>`).

The key comes only from the user's shell: `! export ELEVENLABS_API_KEY=...`. `rate` is ignored.

Status: implemented against the documented `with-timestamps` endpoint, not yet run with a live key. Verify the first
run: audio plays, captions land on the right words.

## Adding an engine

Add `async def speak_<name>(phrase, voice, rate) -> (pcm_24k_mono_s16le, [word start seconds])` to
`toolkit/narrate/narrate.py` and register it in `ENGINES`. Nothing else changes.
