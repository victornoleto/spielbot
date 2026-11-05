# Script: Hello, spielbot

A 40-second smoke test of the whole pipeline: two cards, one recorded app scene, one motion scene and a closing card.
Each line of a `narration` block is one phrase, and phrase N is beat N of the scene in `scenes.mjs`.

### 00-intro

- **Kind:** card (title)
- **Visual:** the title, then the subtitle.

```narration
Hello, spielbot.
This video was planned, recorded and edited by an agent.
```

### cap1-tasks

- **Kind:** card (chapter)
- **Visual:** chapter 1 card; the narration reads the title, then the subtitle.

```narration
Adding a task.
From an empty board to a finished item.
```

### 01-add-task

- **Kind:** app
- **Beats:**
  1. the cursor rests on the empty state;
  2. types the task and picks High;
  3. clicks Add, the task appears;
  4. ticks the checkbox, the task is struck through.

```narration
This is a small task board, still empty.
We type the task and set its priority to high.
One click on Add puts it on the board.
Another click marks it as done.
```

### 02-how

- **Kind:** motion
- **Visual:** four boxes in a row (Script, Voice, Capture, Compose); the first two light on phrase 1, the last two on
  phrase 2.

```narration
First the script and the voice, phrase by phrase.
Then the screen is recorded on that same clock, and everything is put together.
```

### 03-end

- **Kind:** card (closing)

```narration
One phrase, one beat.
Made with spielbot.
```
