# /// script
# requires-python = ">=3.12"
# dependencies = ["edge-tts>=7"]
# ///
"""Narrate every scene of a project's script.md: one audio file per scene and the timing table (timings.json).

Each line of a scene's ```narration block is one phrase, and one phrase is one beat: the capture starts beat i when
phrase i starts, and the composition times the captions from the same table. What you hear and what you see come
from timings.json.

When build/beats.json exists (written by `spielbot probe`), the pause after phrase i stretches until the on-screen
action of beat i fits, so phrase i+1 never starts before the screen gets there.

Usage: uv run toolkit/narrate/narrate.py <project> [scene ...]
Voice, rate, pause and engine come from <project>/project.json ("voice": {...}); flags override them:
  --engine edge|elevenlabs  --voice <id>  --rate +0%  --pause 0.7
Output: <project>/build/audio/<scene>.mp3 and <project>/build/timings.json.
"""
import argparse, asyncio, base64, json, os, re, subprocess, urllib.request
from pathlib import Path

RATE_HZ = 24000  # mono s16le


def scenes(project: Path) -> dict[str, list[str]]:
    text = (project / "script.md").read_text()
    found = re.findall(r"^### (\S+)\n.*?```narration\n(.*?)\n```", text, re.S | re.M)
    return {scene: [" ".join(l.split()) for l in lines.splitlines() if l.strip()] for scene, lines in found}


def to_pcm(data: bytes) -> bytes:
    return subprocess.run(["ffmpeg", "-v", "error", "-i", "pipe:0", "-f", "s16le", "-ac", "1", "-ar", str(RATE_HZ), "pipe:1"],
                          input=data, capture_output=True, check=True).stdout


async def speak_edge(phrase: str, voice: str, rate: str) -> tuple[bytes, list[float]]:
    """Free Microsoft Edge neural voices. Returns PCM and the start (s) of each word. The service sometimes returns
    nothing (NoAudioReceived): retry up to 4 times with a growing wait.
    Deliberate shortcut: the Edge service has no SLA; when it fails or the voice is not good enough, switch engine."""
    import edge_tts
    for attempt in range(4):
        mp3, words = bytearray(), []
        try:
            async for part in edge_tts.Communicate(phrase, voice, rate=rate, boundary="WordBoundary").stream():
                if part["type"] == "audio":
                    mp3 += part["data"]
                elif part["type"] == "WordBoundary":
                    words.append(part["offset"] / 1e7)
            break
        except edge_tts.exceptions.NoAudioReceived:
            if attempt == 3:
                raise RuntimeError(f"no audio for phrase: {phrase}")
            await asyncio.sleep(2 * (attempt + 1))
    return to_pcm(bytes(mp3)), words


async def speak_elevenlabs(phrase: str, voice: str, rate: str) -> tuple[bytes, list[float]]:
    """ElevenLabs (paid; Multilingual v2 costs 1 credit per character). The key comes only from the environment:
    ELEVENLABS_API_KEY, exported in the user's shell, never written to a file. `voice` is the ElevenLabs voice id.
    `rate` is ignored (ElevenLabs has no rate knob on this endpoint)."""
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        raise SystemExit("ELEVENLABS_API_KEY is not set: ask the user to run `! export ELEVENLABS_API_KEY=...`")
    body = json.dumps({"text": phrase, "model_id": os.environ.get("ELEVENLABS_MODEL", "eleven_multilingual_v2")}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps", data=body,
                                 headers={"xi-api-key": key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        out = json.load(r)
    al = out["alignment"]
    chars, starts = al["characters"], al["character_start_times_seconds"]
    # A word starts at the first character after a space (or at the very first character).
    words = [starts[i] for i, c in enumerate(chars) if not c.isspace() and (i == 0 or chars[i - 1].isspace())]
    return to_pcm(base64.b64decode(out["audio_base64"])), words


ENGINES = {"edge": speak_edge, "elevenlabs": speak_elevenlabs}


def captions(phrase: str, start: float, end: float, words: list[float]) -> list[dict]:
    """Split the phrase in chunks of up to 8 words (preferring a comma) and time each by the word that opens it."""
    tokens, chunks, cur = phrase.split(), [], []
    for i, t in enumerate(tokens):
        cur.append(i)
        if len(cur) >= 8 or (len(cur) >= 4 and t[-1] in ",;:") or i == len(tokens) - 1:
            chunks.append(cur)
            cur = []
    at = lambda i: start + words[min(i, len(words) - 1)] if words else start
    out = []
    for n, ch in enumerate(chunks):
        ch_end = at(chunks[n + 1][0]) if n + 1 < len(chunks) else end
        out.append({"start": round(at(ch[0]), 3), "end": round(ch_end, 3), "text": " ".join(tokens[i] for i in ch)})
    return out


async def scene(out_dir: Path, name: str, phrases: list[str], speak, voice: str, rate: str, pause: float,
                beats: list[float]) -> dict:
    """`beats[i]`: how long beat i takes on screen (build/beats.json)."""
    pcm, t, items, subs = bytearray(), 0.0, [], []
    for i, phrase in enumerate(phrases):
        if i:
            short = beats[i - 1] + 0.6 - (items[-1]["end"] - items[-1]["start"]) if i - 1 < len(beats) else 0
            p = max(pause, short)
            pcm += b"\0\0" * int(RATE_HZ * p)
            t += p
        audio, words = await speak(phrase, voice, rate)
        dur = len(audio) / 2 / RATE_HZ
        items.append({"start": round(t, 3), "end": round(t + dur, 3), "text": phrase})
        subs += captions(phrase, t, t + dur, words)
        pcm += audio
        t += dur
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ac", "1", "-ar", str(RATE_HZ), "-i", "pipe:0",
                    "-b:a", "96k", str(out_dir / f"{name}.mp3")], input=bytes(pcm), check=True)
    if len(beats) >= len(phrases):
        t = max(t, items[-1]["start"] + beats[len(phrases) - 1] + 0.8)
    return {"duration": round(t, 3), "phrases": items, "captions": subs}


async def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("project", type=Path)
    p.add_argument("--engine")
    p.add_argument("--voice")
    p.add_argument("--rate")
    p.add_argument("--pause", type=float)
    p.add_argument("scene", nargs="*")
    a = p.parse_args()
    project = a.project.resolve()
    cfg = json.loads((project / "project.json").read_text()).get("voice", {})
    engine = a.engine or cfg.get("engine", "edge")
    voice = a.voice or cfg.get("id", "pt-BR-AntonioNeural")
    rate = a.rate or cfg.get("rate", "+0%")
    pause = a.pause if a.pause is not None else cfg.get("pause", 0.7)
    build = project / "build"
    out_dir = build / "audio"
    out_dir.mkdir(parents=True, exist_ok=True)
    f_timings, f_beats = build / "timings.json", build / "beats.json"
    timings = json.loads(f_timings.read_text()) if f_timings.exists() else {}
    beats = json.loads(f_beats.read_text()) if f_beats.exists() else {}
    all_scenes = scenes(project)
    unknown = [s for s in a.scene if s not in all_scenes]
    if unknown:
        raise SystemExit(f"not in script.md: {', '.join(unknown)}")
    for name in a.scene or all_scenes:
        timings[name] = await scene(out_dir, name, all_scenes[name], ENGINES[engine], voice, rate, pause, beats.get(name, []))
    timings = {s: timings[s] for s in all_scenes if s in timings}
    f_timings.write_text(json.dumps(timings, indent=2, ensure_ascii=False))
    for s, d in timings.items():
        print(f"{d['duration']:7.1f}s  {len(d['phrases']):2d} phrases  {s}")
    total = sum(d["duration"] for d in timings.values())
    print(f"{total:7.1f}s  total ({total / 60:.1f} min)")


asyncio.run(main())
