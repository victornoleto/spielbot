# Principles

## One phrase, one beat

Each line of a scene's narration is one **phrase**, and each phrase is one **beat**: the on-screen action that
starts when the phrase starts. Phrase N of a scene and beat N of the same scene in `scenes.mjs` (or the part that
appears at `f[N]` in a card or motion scene) are a pair, written together:

- the phrase says only what the screen shows during that beat;
- when an action changes, its phrase changes with it, and the other way around;
- the counts always match: a scene with 5 phrases has exactly 5 beats.

## One clock

`build/timings.json` is the single clock. The voice is generated first and writes it; the recording waits for each
phrase's start before playing its beat; the composition times captions, cards and cuts from it. Nothing is aligned
by hand, so a change is: edit the phrase and the beat, regenerate the scene, rebuild.

The loop that keeps the clock honest:

1. **probe** measures how long each beat takes on screen (`build/beats.json`);
2. **narrate** stretches the pause after any phrase shorter than its beat, so the next phrase never arrives before
   the screen does;
3. **record** plays each beat at its phrase's start and reports any beat that started LATE;
4. **frames** extracts the frame just before each next phrase: the action of the phrase must be complete in it.

## Reversible state

Every capture runs between the project's `hooks/setup.sh` and `hooks/teardown.sh`. Whatever the scenes create (a
record, an upload, a setting) is undone on exit, even after a crash, so the same scene can be recorded ten times
and the app ends as it started.

## Drawn where there is nothing to show

Real screens come from the real app. Cards and motion scenes draw only what has no screen: the title, chapters, a
concept, a summary. Cards that write on screen what the voice says carry no captions.
