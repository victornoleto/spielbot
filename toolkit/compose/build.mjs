// Builds the HyperFrames composition of a project from its timing tables: nothing here is tuned by hand.
//   build/timings.json      (narrate.py)  start and end of each phrase, captions and scene length
//   build/clips/<scene>.json (capture)    where the video crosses phrase 1, the mouse trail, marks (url)
//   project.json            cards, badges, theme, music, labels
//   motion.mjs (optional)   custom drawn scenes
// Each scene is, in this order: a recorded clip (app), a card (project.json cards) or a motion scene (motion.mjs).
// Writes build/composition/ (index.html, compositions/, assets/), a self-contained HyperFrames project.
// Usage: node toolkit/compose/build.mjs <project> [--no-video]   (--no-video: keep the already converted clips)
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CARDS, DEFAULT_THEME, enter, esc, fontFaces, frame } from './cards.mjs';
import { soundtrack } from './music.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const project = resolve(args.find((a) => !a.startsWith('--')) ?? '');
const noVideo = args.includes('--no-video');
const build = join(project, 'build');
const comp = join(build, 'composition');
const clips = join(build, 'clips');
const cfg = JSON.parse(readFileSync(join(project, 'project.json'), 'utf8'));
const timings = JSON.parse(readFileSync(join(build, 'timings.json'), 'utf8'));
const motion = existsSync(join(project, 'motion.mjs')) ? (await import(pathToFileURL(join(project, 'motion.mjs')))).default : {};
const theme = { ...DEFAULT_THEME, ...cfg.theme };
const cards = cfg.cards ?? {};
const lang = cfg.lang ?? 'en-US';
const chapterLabel = cfg.labels?.chapter ?? (lang.startsWith('pt') ? 'Capítulo {n} de {total}' : 'Chapter {n} of {total}');

export const LEAD = 0.4; // s of picture before phrase 1 of each scene
const TAIL = 0.6; // s after the scene ends (speech or last action)

// Composition ids come from the whole scene name, so two scenes never collide.
const id = (scene) => `s-${scene.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
const r2 = (n) => Math.round(n * 100) / 100;

const ICONS = {
    // clock with arrow (existing), sparkle (new), hourglass (in progress): a badge always has text and icon, never color alone.
    before: '<path d="M4 12a8 8 0 1 0 2.3-5.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 4v4h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 8v4l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    new: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill="currentColor"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" fill="currentColor"/>',
    progress: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
};
const badgesHtml = (scene, c) => {
    const list = cfg.badges?.[scene] ?? [];
    if (!list.length) return '';
    return `<div id="${c}-badges" class="badges clip" data-start="0" data-duration="__DUR__">${list.map((b, i) =>
        `<span class="badge${b.icon === 'new' ? ' badge-strong' : ''}" id="${c}-b${i}">${ICONS[b.icon] ? `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">${ICONS[b.icon]}</svg>` : ''}${esc(b.text)}</span>`).join('')}</div>`;
};
const BADGE_STYLE = `
    .badges { position: absolute; left: 0; top: 10px; width: 1920px; display: flex; justify-content: center; gap: 12px; z-index: 5; }
    .badge { display: inline-flex; align-items: center; gap: 10px; padding: 7px 18px 7px 14px; border-radius: 999px;
      font: 600 22px/1 '${theme.font}', sans-serif; background: #fff; color: ${theme.bg}; box-shadow: 0 4px 16px rgba(0,0,0,.25); opacity: 0; }
    .badge-strong { background: ${theme.bg}; color: #fff; outline: 2px solid #fff; }`;
const badgeAnim = (c) => `tl.fromTo("#${c}-badges .badge", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.12 }, 0.5);`;

/** Recorded scene: the trimmed clip, badges on top, the cursor and click ripples from the trail, the URL when marked. */
function appScene(scene, dur) {
    const c = id(scene);
    const meta = JSON.parse(readFileSync(join(clips, `${scene}.json`)));
    const pts = meta.trail.map(([t, x, y, k]) => [r2(t + LEAD), x, y, k]);
    const before = pts.filter((p) => p[0] < 0).at(-1) ?? [0, 960, 540, 'm'];
    const inside = pts.filter((p) => p[0] >= 0 && p[0] < dur);
    const mov = [];
    for (const p of inside) {
        const last = mov.at(-1);
        if (p[3] !== 'm' || !last || p[0] - last[0] >= 1 / 30) mov.push(p);
    }
    const clicks = inside.filter((p) => p[3] === 'c' || p[3] === 'd');
    const url = meta.marks?.url;
    const badges = badgesHtml(scene, c).replace('__DUR__', dur);
    return `<template>
  <style>
    ${fontFaces(theme.font)}
    #root { position: absolute; inset: 0; overflow: hidden; background: #000; }
    #${c}-v { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; object-fit: contain; }
    ${BADGE_STYLE}
    #${c}-cur { position: absolute; left: 0; top: 0; width: 34px; height: 34px; z-index: 8; }
    .rip { position: absolute; width: 56px; height: 56px; margin: -28px 0 0 -28px; border-radius: 50%;
      border: 4px solid #fff; box-shadow: 0 0 0 3px ${theme.bg}; opacity: 0; z-index: 7; }
    .url { position: absolute; left: 460px; top: 72px; width: 1000px; display: flex; align-items: center; gap: 14px;
      padding: 14px 22px; border-radius: 14px; background: #fff; color: #33415c; box-shadow: 0 10px 32px rgba(0,0,0,.35);
      font: 400 26px/1.2 '${theme.font}', sans-serif; opacity: 0; z-index: 6; }
  </style>
  <div id="root" data-composition-id="${c}" data-width="1920" data-height="1080">
    <video id="${c}-v" class="clip" data-start="0" data-duration="${dur}" src="assets/clips/${c}.mp4" muted playsinline></video>
    ${badges}
    ${url ? `<div id="${c}-url" class="url"><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg><span>${esc(url.value)}</span></div>` : ''}
    ${clicks.map((p, i) => `<div class="rip" id="${c}-r${i}" style="left:${p[1]}px;top:${p[2]}px"></div>`).join('\n    ')}
    <svg id="${c}-cur" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 2l7 19 2.6-7.4L20 11z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    ${badges ? badgeAnim(c) : ''}
    // Cursor: the recorded trail [t, x, y]; the arrow tip is at (3, 2) of the drawing.
    const P = ${JSON.stringify(mov.map(([t, x, y]) => [t, x, y]))};
    tl.set("#${c}-cur", { x: ${before[1] - 4}, y: ${before[2] - 3}, transformOrigin: "4px 3px" }, 0);
    for (let i = 0; i < P.length; i++) {
      const [t, x, y] = P[i];
      const prev = i ? P[i - 1][0] : 0;
      if (i && t - prev < 0.25) tl.to("#${c}-cur", { x: x - 4, y: y - 3, duration: t - prev, ease: "none" }, prev);
      else tl.set("#${c}-cur", { x: x - 4, y: y - 3 }, t);
    }
    const C = ${JSON.stringify(clicks.map((p) => p[0]))};
    C.forEach((t, i) => {
      // set + to, not fromTo: fromTo applies its start state at creation and the ring would show before the click.
      tl.set("#${c}-r" + i, { scale: 0.3, opacity: 1 }, t);
      tl.to("#${c}-r" + i, { scale: 1.4, opacity: 0, duration: 0.55, ease: "power2.out" }, t);
      tl.to("#${c}-cur", { scale: 0.82, duration: 0.08, ease: "power1.out" }, t);
      tl.to("#${c}-cur", { scale: 1, duration: 0.14, ease: "power1.out" }, t + 0.1);
    });
    ${url ? `tl.fromTo("#${c}-url", { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, ${r2(url.t + LEAD + 0.2)});` : ''}
    window.__timelines["${c}"] = tl;
  </script>
</template>
`;
}

function convert(scene, dur) {
    const meta = JSON.parse(readFileSync(join(clips, `${scene}.json`)));
    const start = Math.max(0, meta.start - LEAD);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(start), '-i', join(clips, `${scene}.webm`), '-t', String(dur),
        '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-an',
        join(comp, 'assets', 'clips', `${id(scene)}.mp4`)]);
}

const chapters = Object.keys(timings).filter((s) => cards[s]?.type === 'chapter');

function drawnScene(scene, dur, f) {
    const c = id(scene);
    const badges = badgesHtml(scene, c).replace('__DUR__', dur);
    let parts;
    if (cards[scene]) {
        const card = cards[scene];
        const make = CARDS[card.type];
        if (!make) throw new Error(`${scene}: unknown card type "${card.type}" (title, chapter, list, closing)`);
        const n = chapters.indexOf(scene) + 1;
        parts = make(theme, c, dur, f, card, { n, total: chapters.length, label: chapterLabel.replace('{n}', n).replace('{total}', chapters.length) });
    } else if (motion[scene]) {
        parts = motion[scene]({ id: c, dur, f, theme, enter, esc });
    } else {
        throw new Error(`${scene}: no recorded clip, no card in project.json and no scene in motion.mjs`);
    }
    return frame(theme, c, dur, {
        ...parts,
        extra: `${parts.extra ?? ''}${badges}`,
        style: `${parts.style ?? ''}${badges ? BADGE_STYLE.replace('top: 10px', 'top: 24px') : ''}`,
        script: `${parts.script}${badges ? `\n    ${badgeAnim(c)}` : ''}`,
    });
}

// Captions stay off where the card already writes on screen what the voice says.
const captioned = (scene) => !(cards[scene]?.type === 'chapter' || cards[scene]?.captions === false || motion[scene]?.captions === false);

rmSync(join(comp, 'compositions'), { recursive: true, force: true });
for (const d of ['compositions', 'assets/clips', 'assets/audio', 'assets/fonts']) mkdirSync(join(comp, d), { recursive: true });
cpSync(join(HERE, 'fonts'), join(comp, 'assets', 'fonts'), { recursive: true });
cpSync(join(build, 'audio'), join(comp, 'assets', 'audio'), { recursive: true });
if (existsSync(join(project, 'assets'))) cpSync(join(project, 'assets'), join(comp, 'assets'), { recursive: true });
writeFileSync(join(comp, 'hyperframes.json'), JSON.stringify({
    $schema: 'https://hyperframes.heygen.com/schema/hyperframes.json',
    paths: { blocks: 'compositions', components: 'compositions/components', assets: 'assets' },
    media: { autoProxy: true },
}, null, 2));
writeFileSync(join(comp, 'meta.json'), JSON.stringify({ id: 'composition', name: cfg.title ?? 'video' }, null, 2));

let t = 0;
const starts = {};
const hosts = [];
const audios = [];
const caps = [];
for (const [scene, tp] of Object.entries(timings)) {
    const c = id(scene);
    const dur = r2(LEAD + tp.duration + TAIL);
    const recorded = existsSync(join(clips, `${scene}.json`)) && existsSync(join(clips, `${scene}.webm`));
    const html = recorded ? appScene(scene, dur) : drawnScene(scene, dur, tp.phrases.map((p) => r2(p.start + LEAD)));
    if (recorded && !noVideo) convert(scene, dur);
    writeFileSync(join(comp, 'compositions', `${c}.html`), html);
    hosts.push(`<div id="${c}" data-composition-id="${c}" data-composition-src="compositions/${c}.html" data-start="${r2(t)}" data-duration="${dur}" data-track-index="1" data-track-kind="graphics" data-width="1920" data-height="1080"></div>`);
    audios.push(`<audio id="a-${c}" class="clip" src="assets/audio/${scene}.mp3" data-start="${r2(t + LEAD)}" data-duration="${r2(tp.phrases.at(-1).end)}" data-track-index="3" data-volume="1"></audio>`);
    if (captioned(scene)) for (const l of tp.captions) caps.push({ start: r2(t + LEAD + l.start), end: r2(t + LEAD + l.end), text: l.text });
    console.log(`${c.padEnd(28)} ${r2(t).toFixed(1).padStart(6)} s  +${dur.toFixed(1)} s  ${recorded ? 'clip' : cards[scene] ? `card:${cards[scene].type}` : 'motion'}`);
    starts[scene] = r2(t);
    t += dur;
}
const total = r2(t);
const music = soundtrack({ project, comp, music: cfg.music, starts, total, loud: (s) => Boolean(cards[s]) });

// Captions: one group per chunk, one visible at a time (the next starts where the previous ends).
writeFileSync(join(comp, 'compositions', 'captions.html'), `<template>
  <style>
    ${fontFaces(theme.font)}
    #root { position: absolute; inset: 0; pointer-events: none; }
    .cap { position: absolute; left: 0; bottom: 64px; width: 1920px; text-align: center; }
    .cap span { display: inline-block; max-width: 1500px; padding: 10px 26px 12px; border-radius: 14px;
      background: rgba(11, 31, 68, 0.86); color: #fff; font: 500 40px/1.3 '${theme.font}', sans-serif; }
  </style>
  <div id="root" data-composition-id="captions" data-width="1920" data-height="1080">
    ${cfg.captions === false ? '' : caps.map((l, i) => `<div id="cap${i}" class="cap clip" data-start="${l.start}" data-duration="${r2(Math.max(0.3, (caps[i + 1] && caps[i + 1].start < l.end + 0.8 ? caps[i + 1].start : l.end + 0.3) - l.start))}"><span>${esc(l.text)}</span></div>`).join('\n    ')}
  </div>
  <script>
    window.__timelines["captions"] = gsap.timeline({ paused: true });
  </script>
</template>
`);

writeFileSync(join(comp, 'index.html'), `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: ${theme.bg}; }
      #root { width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <!-- Generated by spielbot (toolkit/compose/build.mjs) from build/timings.json and build/clips/*.json: do not edit by hand. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="1920" data-height="1080">
      ${hosts.join('\n      ')}
      <div id="captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="${total}" data-track-index="2" data-track-kind="captions" data-width="1920" data-height="1080" style="z-index: 10"></div>
      ${audios.join('\n      ')}
      ${music}
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`);
console.log(`total ${total} s (${(total / 60).toFixed(1)} min)${music ? ', with music' : ', no music'}`);
