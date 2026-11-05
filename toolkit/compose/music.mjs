// Background music: one track per section (project.json music.tracks: { '<scene where it starts>': 'assets/...' }),
// switching with a 1.5 s crossfade. Each track is normalized to -20 LUFS, has silence and fade tails trimmed from both
// ends (without that, the loop seam becomes a ~2 s hole), and loops with a 3 s crossfade until it covers its section.
// The level comes from a volume automation lane: `bed` under content scenes (default 0.09, about 21 dB under a -20
// LUFS voice) and `highlight` on cards (default 0.2).
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * @param starts   { scene: start (s) } in timeline order
 * @param total    timeline length (s)
 * @param loud     scene => true when the music should be at `highlight` (cards)
 * Returns the <audio> tag for index.html, or '' without tracks.
 */
export function soundtrack({ project, comp, music = {}, starts, total, loud }) {
    const tracks = music.tracks ?? {};
    if (!Object.keys(tracks).length) return '';
    const bed = music.bed ?? 0.09, highlight = music.highlight ?? 0.2;
    const tmp = join(comp, '.media', 'mix');
    mkdirSync(tmp, { recursive: true });
    mkdirSync(join(comp, 'assets', 'bgm'), { recursive: true });
    const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args]);
    const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]));
    const sections = Object.entries(tracks).map(([scene, file]) => {
        if (starts[scene] === undefined) throw new Error(`music.tracks: scene ${scene} is not in timings.json`);
        return { start: starts[scene], file: join(project, file) };
    }).sort((a, b) => a.start - b.start);
    sections[0].start = 0; // the first track always opens the video
    const X = 1.5, D = 3;
    const TRIM = 'silenceremove=start_periods=1:start_threshold=-36dB:start_silence=0.05';
    sections.forEach((sec, i) => {
        const end = sections[i + 1]?.start ?? total;
        const len = r2(end - sec.start + (sections[i + 1] ? X : 0));
        const norm = join(tmp, `${i}-norm.wav`);
        ff(['-i', sec.file, '-af', `loudnorm=I=-20:TP=-2,aresample=48000,${TRIM},areverse,${TRIM},areverse`, '-ac', '2', norm]);
        const T = dur(norm);
        const n = Math.max(1, Math.ceil((len - D) / (T - D)));
        const ins = Array.from({ length: n }, () => ['-i', norm]).flat();
        let g = '', last = '[0:a]';
        for (let k = 1; k < n; k++) { g += `${last}[${k}:a]acrossfade=d=${D}[l${k}];`; last = `[l${k}]`; }
        ff([...ins, '-filter_complex', `${g}${last}atrim=0:${len}[o]`, '-map', '[o]', join(tmp, `${i}.wav`)]);
    });
    const ins = sections.map((_, i) => ['-i', join(tmp, `${i}.wav`)]).flat();
    let g = '', last = '[0:a]';
    for (let k = 1; k < sections.length; k++) { g += `${last}[${k}:a]acrossfade=d=${X}[c${k}];`; last = `[c${k}]`; }
    ff([...ins, '-filter_complex', `${g}${last}atrim=0:${total},afade=t=in:d=2,afade=t=out:st=${r2(Math.max(0, total - 4))}:d=4[o]`,
        '-map', '[o]', '-b:a', '160k', join(comp, 'assets', 'bgm', 'soundtrack.mp3')]);
    // Volume lane: rises 0.5 s before a highlighted scene and falls 0.5 s after it ends.
    const scenes = Object.keys(starts);
    const pts = [{ t: 0, v: loud(scenes[0]) ? highlight : bed }];
    scenes.forEach((scene, i) => {
        if (!i) return;
        const v = loud(scene) ? highlight : bed;
        const prev = pts[pts.length - 1].v;
        if (v !== prev) pts.push({ t: r2(starts[scene] - 0.5), v: prev }, { t: r2(starts[scene] + 0.5), v });
    });
    const lane = JSON.stringify({ version: 1, lanes: [{ target: 'volume', points: pts }] }).replaceAll('"', '&quot;');
    return `<audio id="bgm" class="clip" src="assets/bgm/soundtrack.mp3" data-start="0" data-duration="${total}" data-track-index="4" data-volume="1" data-automation="${lane}"></audio>`;
}
