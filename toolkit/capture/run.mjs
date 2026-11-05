// Probe or record the app scenes of a project, one beat per narration phrase.
// Usage: node toolkit/capture/run.mjs <project> [--probe] [scene ...]   (no scene: all app scenes)
//   --probe: records nothing; measures how long each beat takes (build/beats.json, which narrate.py uses to stretch
//            the pause after a phrase whose action is longer) and screenshots the end of each beat (build/probe/).
//   default: reads build/timings.json and records build/clips/<scene>.webm + <scene>.json.
// <project>/scenes.mjs exports: default { '<scene>': { setup?, beats: [...] } }, and optionally
//   login(page, settings) (runs once; the session is reused) and prepare(context, settings) (routes, init scripts).
// Always run it through `spielbot probe|record`, which wraps it in the project's setup/teardown hooks.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { browser as launch, record, session, settings } from './lib.mjs';

const args = process.argv.slice(2);
const project = resolve(args.find((a) => !a.startsWith('--')) ?? '');
const probe = args.includes('--probe');
const wanted = args.filter((a) => !a.startsWith('--')).slice(1);
const build = join(project, 'build');
const mod = await import(pathToFileURL(join(project, 'scenes.mjs')));
const scenes = mod.default ?? {};
const unknown = wanted.filter((w) => !scenes[w]);
if (unknown.length) throw new Error(`not in scenes.mjs: ${unknown.join(', ')}`);
const F_TIMINGS = join(build, 'timings.json');
const F_BEATS = join(build, 'beats.json');
const timings = existsSync(F_TIMINGS) ? JSON.parse(readFileSync(F_TIMINGS)) : {};
const beats = existsSync(F_BEATS) ? JSON.parse(readFileSync(F_BEATS)) : {};

const s = settings(project);
const b = await launch(s);
let failed = 0;
try {
    const state = await session(b, s, mod.login);
    for (const [scene, cfg] of Object.entries(scenes)) {
        if (wanted.length && !wanted.includes(scene)) continue;
        if (!probe && !timings[scene]) { console.log(`${scene}: no timings (run spielbot narrate)`); failed++; continue; }
        process.stdout.write(`${scene}… `);
        const t = Date.now();
        try {
            const r = await record(b, state, s, build, scene, cfg, timings[scene], { probe, prepare: mod.prepare });
            if (probe) beats[scene] = r.durations;
            console.log(`ok (${((Date.now() - t) / 1000).toFixed(0)} s) beats: ${r.durations.join(' ')}${r.late.length ? `\n  LATE: ${r.late.join('; ')}` : ''}`);
            if (r.late.length) failed++;
        } catch (e) {
            console.log(`ERROR: ${e.message.split('\n')[0]}  (screenshot: build/probe/error-${scene}.png)`);
            failed++;
        }
    }
} finally {
    if (probe) writeFileSync(F_BEATS, JSON.stringify(beats, null, 2));
    await b.close();
}
process.exitCode = failed ? 1 : 0;
