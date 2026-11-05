# Project format

A project is a folder (`bin/spielbot new <slug>` copies `templates/project/`). `examples/hello/` is a complete one.

| File | Written by | Purpose |
|---|---|---|
| `brief.md` | intake | goal, audience, language, scope, app access, voice, music, look, delivery |
| `script.md` | script | scenes in order and their narration: the source of truth for what is said |
| `project.json` | script | language, voice, app settings, theme, cards, badges, music |
| `scenes.mjs` | explore | app scenes: the beats that drive the browser, optional `login` and `prepare` |
| `motion.mjs` | script/compose | optional custom drawn scenes |
| `hooks/setup.sh`, `hooks/teardown.sh` | explore | make the app state reversible around every capture |
| `.env` | the user | app credentials (git-ignored; `.env.example` lists the names) |
| `assets/` | any | images, logos, music files; copied into the composition as `assets/…` |
| `build/` | toolkit | everything generated; safe to delete |

## script.md

Scenes are `### <scene-id>` headings, in video order. The id is kebab-case and unique, with a sortable prefix:
`00-intro`, `cap1-signup`, `01-new-customer`, `01b-validation`, `99-end`. Under each heading:

- `- **Kind:** app | card (<type>) | motion`
- `- **Visual:**` or `- **Beats:**` (a numbered list, one item per phrase)
- a fenced block with the info string `narration`: one phrase per line. Blank lines are ignored; a long phrase
  stays on one line.

A phrase is one sentence of about 6 to 25 words, spoken in under 8 seconds. Numbers and acronyms are written the way
they should be spoken when the voice mispronounces them.

## project.json

```json
{
  "title": "…", "lang": "pt-BR",
  "voice": { "engine": "edge", "id": "pt-BR-AntonioNeural", "rate": "+0%", "pause": 0.7 },
  "app": { "baseUrl": "http://localhost:3000", "locale": "pt-BR", "timezone": "America/Sao_Paulo", "ignoreHTTPSErrors": true },
  "theme": { "bg": "#0b1f44", "panel": "#14295a", "grid": "#1d3566", "ink": "#ffffff", "muted": "#9fb0d0", "accent": "#1463ff", "rail": "#2a4479" },
  "cards": { "<scene-id>": { "type": "title|chapter|list|closing", … } },
  "badges": { "<scene-id>": [{ "icon": "new|before|progress", "text": "New" }] },
  "labels": { "chapter": "Chapter {n} of {total}" },
  "captions": true,
  "music": { "tracks": { "<scene-id where the track starts>": "<path relative to the project>" }, "bed": 0.09, "highlight": 0.2 }
}
```

Every key but `title` and `lang` is optional; `theme` merges over the defaults shown. `APP_URL` in the environment
overrides `app.baseUrl`.

### Cards

Each card part appears when its phrase starts (`f[i]`):

| type | fields | phrase → part |
|---|---|---|
| `title` | `title`, `subtitle?`, `image?`, `size?` | 1 → title, 2 → subtitle; the image wipes in |
| `chapter` | `title`, `subtitle?` | 1 → title, 2 → subtitle; numbered in script order, "Chapter n of N"; no captions |
| `list` | `title`, `items` (max 6) | 1 → title, 1+i → item i lights up |
| `closing` | `lines` (max 2), `logo?`, `background?` | i → line i |

`"captions": false` on a card hides its captions; `"captions": false` at the top level hides all captions.

## scenes.mjs

```js
export async function login(page, { baseUrl, env, locale, timezone }) { … }   // optional, runs once
export async function prepare(context, settings) { … }                         // optional, per scene context
export default {
  '<scene-id>': {
    setup: (page, h) => h.open('/customers', 1500),   // before the clock; cut from the video
    beats: [ async (page, h) => { … }, … ],           // exactly one per phrase
  },
};
```

The helpers `h` move a visible, calm cursor (drawn later by the composition, with click ripples):

| helper | does |
|---|---|
| `go(locator)` | waits for the element, scrolls it into view if needed, glides the cursor to its center |
| `move(x, y)` | glides the cursor to a point |
| `click(locator, after=700)` / `clickAt(x, y, after)` | glide, click, wait `after` ms |
| `type(locator, text)` | glide, click, type at a human pace |
| `replace(locator, text)` | select the field's text and type over it |
| `scroll(dy, x?, y?)` | smooth wheel scroll |
| `open(route, settle=1500)` | navigate to `baseUrl + route` and wait for the network to settle |
| `wait(ms)`, `down()`, `up()` | pause; mouse down/up for drags (move between them) |
| `mark('url', text)` | shows a URL pill over the video from this moment |

Prefer role and label locators (`page.getByRole('button', { name: 'Save' })`); they survive restyling. A beat
should end with the result visible and hold it for at least 800 ms.

## motion.mjs

`export default { '<scene-id>': ({ id, dur, f, theme, enter, esc }) => ({ svg, script, extra?, style? }) }`.
`svg` is markup for a 1920x1080 SVG stage; prefix every element id with `id`. `script` is GSAP code on the paused
timeline `tl`, deterministic (no `Math.random`, no timers, no infinite repeats). `enter(selector, t)` fades and
slides an element in at `t`. To hide a motion scene's captions, set a property on its function after the object:
`scenes['02-x'].captions = false` (with `const scenes = { … }; export default scenes;`).
