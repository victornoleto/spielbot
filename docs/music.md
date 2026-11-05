# Music

Optional. `project.json` → `music.tracks` maps the scene where each track starts to an audio file (relative to the
project). The first track always starts at 0. The toolkit then:

1. normalizes each track to -20 LUFS and trims silence and fade tails from both ends;
2. loops each track with a 3 s crossfade until it covers its section; switches tracks with a 1.5 s crossfade;
3. fades the whole bed in (2 s) and out (4 s);
4. writes a volume lane: `bed` (0.09, about 21 dB under the voice) under content scenes and `highlight` (0.2) on
   cards, rising 0.5 s before and falling 0.5 s after.

A good default is one track per chapter, with the change on the chapter card.

## Free catalog (HeyGen, via HyperFrames)

Needs the heygen CLI and a free HyperFrames sign-in (`bin/spielbot doctor` reports both; the user runs
`! npx hyperframes auth login`). From the project folder:

```
npx --yes hyperframes@0.9.16 media-use resolve --type bgm --provider heygen --intent "<mood, tempo, no vocals>" --project .
```

It prints `resolved bgm_00N → .media/audio/bgm/bgm_00N.wav`. Use that path in `music.tracks`. Resolve several
intents to get distinct tracks; `--candidates` lists what is already cached. Instrumental, steady tracks without
a strong melody sit best under speech.

## User files

Put them in `assets/music/` and reference `assets/music/<file>`. Confirm the user holds the rights.
