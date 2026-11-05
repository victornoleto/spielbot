// Capture engine: a headless Chromium that drives the app like a calm human and records one clip per scene,
// starting each beat exactly when its phrase starts (build/timings.json).
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';
import { chromium } from 'playwright-core';

export const VIEWPORT = { width: 1920, height: 1080 };

/** Project settings: project.json "app" plus the environment (process env wins over <project>/.env). */
export function settings(project) {
    const cfg = JSON.parse(readFileSync(join(project, 'project.json'), 'utf8'));
    const dotenv = existsSync(join(project, '.env')) ? parseEnv(readFileSync(join(project, '.env'), 'utf8')) : {};
    const env = { ...dotenv, ...process.env };
    const app = cfg.app ?? {};
    return {
        env,
        baseUrl: env.APP_URL ?? app.baseUrl ?? '',
        locale: app.locale ?? cfg.lang ?? 'en-US',
        timezone: app.timezone ?? 'UTC',
        ignoreHTTPSErrors: app.ignoreHTTPSErrors ?? true,
    };
}

const contextOptions = (s, extra = {}) => ({
    ignoreHTTPSErrors: s.ignoreHTTPSErrors, locale: s.locale, timezoneId: s.timezone, viewport: VIEWPORT, ...extra,
});

/** Logs in once with the project's `login(page, settings)` and returns the storageState (undefined without login). */
export async function session(browser, s, login) {
    if (!login) return undefined;
    const ctx = await browser.newContext(contextOptions(s));
    const page = await ctx.newPage();
    await login(page, s);
    await page.waitForLoadState('networkidle').catch(() => {});
    const state = await ctx.storageState();
    await ctx.close();
    return state;
}

/**
 * Records `scene` in a fresh context and saves build/clips/<scene>.webm and <scene>.json.
 * `setup(page, h)` runs before the clock starts (the composition cuts it); each `beats[i](page, h)` starts when phrase i
 * starts (`timing` = build/timings.json[scene]). With `probe`, nothing is recorded and nothing waits: it measures how
 * long each beat takes (narrate.py stretches the pause after a phrase whose action is longer than it) and takes a
 * screenshot at the end of each beat.
 */
export async function record(browser, state, s, build, scene, { setup, beats }, timing, { probe = false, prepare } = {}) {
    if (!probe && timing.phrases.length !== beats.length) throw new Error(`${beats.length} beats for ${timing.phrases.length} phrases`);
    const clips = join(build, 'clips');
    const shots = join(build, 'probe');
    mkdirSync(clips, { recursive: true });
    mkdirSync(shots, { recursive: true });
    const tmp = join(clips, `.tmp-${scene}`);
    const ctx = await browser.newContext(contextOptions(s, {
        storageState: state,
        ...(probe ? {} : { recordVideo: { dir: tmp, size: VIEWPORT } }),
    }));
    await prepare?.(ctx, s);
    const page = await ctx.newPage();
    const videoStart = Date.now();
    const h = helpers(page, s);
    const late = [];
    const durations = [];
    const marks = {};
    let t0 = Date.now();
    h.mark = (name, value) => { marks[name] = { t: (Date.now() - t0) / 1000, value }; };
    try {
        await setup?.(page, h);
        t0 = Date.now();
        for (const [i, fn] of beats.entries()) {
            if (!probe) {
                const target = t0 + (timing.phrases[i].start + 0.3) * 1000;
                if (Date.now() > target + 300) late.push(`phrase ${i + 1} started ${((Date.now() - target) / 1000).toFixed(1)} s late`);
                await page.waitForTimeout(Math.max(0, target - Date.now()));
            }
            const start = Date.now();
            await fn(page, h);
            durations.push(Math.round((Date.now() - start) / 100) / 10);
            if (probe) await page.screenshot({ path: join(shots, `${scene}-${i + 1}.png`) });
        }
        if (!probe) await page.waitForTimeout(Math.max(0, t0 + (timing.duration + 0.8) * 1000 - Date.now()));
    } catch (e) {
        await page.screenshot({ path: join(shots, `error-${scene}.png`) }).catch(() => {});
        throw e;
    } finally {
        const video = page.video();
        await ctx.close();
        if (video) {
            renameSync(await video.path(), join(clips, `${scene}.webm`));
            writeFileSync(join(clips, `${scene}.json`), JSON.stringify({ start: (t0 - videoStart) / 1000, late, durations, marks,
                // [t (s since phrase 1 starts; negative = setup, cut away), x, y, m|c|d|u]
                trail: h.trail.map(([t, x, y, k]) => [Math.round((t - t0) / 10) / 100, x, y, k]) }));
        }
        rmSync(tmp, { recursive: true, force: true });
    }
    return { late, durations };
}

/**
 * Calm, human movement: the cursor glides (ease in and out) to the target before clicking. The cursor is not drawn in
 * the page: the recording keeps the mouse trail (h.trail) and the composition draws the cursor and click ripples on
 * top of the video (an injected cursor makes heavy pages, like a blurred modal backdrop, stop producing frames).
 */
export function helpers(page, s) {
    const wait = (ms) => page.waitForTimeout(ms);
    let pos = { x: 960, y: 540 };
    const trail = [];
    const note = (kind) => trail.push([Date.now(), Math.round(pos.x), Math.round(pos.y), kind]);
    const move = async (x, y) => {
        const dist = Math.hypot(x - pos.x, y - pos.y);
        const ms = Math.min(1200, Math.max(600, 400 + dist * 0.5));
        const steps = Math.round(ms / 16);
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
            const px = pos.x + (x - pos.x) * e;
            const py = pos.y + (y - pos.y) * e;
            await page.mouse.move(px, py);
            trail.push([Date.now(), Math.round(px), Math.round(py), 'm']);
            await wait(16);
        }
        pos = { x, y };
    };
    // Scrolls only when the target is off screen: scrollIntoViewIfNeeded hangs on some triggers inside modals.
    const go = async (loc) => {
        const el = typeof loc === 'string' ? page.locator(loc).first() : loc;
        await el.waitFor({ state: 'visible', timeout: 10000 }).catch((e) => {
            throw new Error(`${el}: ${e.message.split('\n')[0]}`);
        });
        let b = await el.boundingBox();
        if (!b) { await wait(500); b = await el.boundingBox(); } // redrawn between the wait and the measure
        if (!b || b.y < 0 || b.y + b.height > VIEWPORT.height) {
            await el.scrollIntoViewIfNeeded({ timeout: 10000 });
            b = await el.boundingBox();
        }
        if (!b) throw new Error(`no box for ${loc}`);
        await move(b.x + b.width / 2, b.y + b.height / 2);
        return el;
    };
    const press = async (x, y) => { note('c'); await page.mouse.click(x, y); };
    return {
        trail,
        wait,
        go,
        move,
        down: async () => { note('d'); await page.mouse.down(); },
        up: async () => { note('u'); await page.mouse.up(); },
        clickAt: async (x, y, after = 700) => { await move(x, y); await wait(300); await press(x, y); await wait(after); },
        click: async (loc, after = 700) => { await go(loc); await wait(350); await press(pos.x, pos.y); await wait(after); },
        type: async (loc, text) => { await go(loc); await press(pos.x, pos.y); await page.keyboard.type(text, { delay: 75 }); },
        /** Selects the field's text and types over it. */
        replace: async (loc, text) => {
            await go(loc); await press(pos.x, pos.y); await wait(200);
            await page.keyboard.press('ControlOrMeta+A');
            await page.keyboard.type(text, { delay: 75 });
            await wait(500);
        },
        /** Smooth scroll: the wheel in small steps, over (x, y). */
        scroll: async (dy, x = pos.x, y = pos.y) => {
            if (x !== pos.x || y !== pos.y) await move(x, y);
            const steps = Math.max(8, Math.round(Math.abs(dy) / 25));
            for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, dy / steps); await wait(20); }
            await wait(400);
        },
        open: async (route, settle = 1500) => {
            await page.goto(`${s.baseUrl}${route}`);
            await page.waitForLoadState('networkidle').catch(() => {});
            await wait(settle);
        },
    };
}

export async function browser(s) {
    // The machine's GPU: in software (swiftshader) heavy effects (blur over a map, WebGL) take seconds per frame and
    // the clip stutters. GL=software goes back to swiftshader on a machine without a GPU.
    const gl = process.env.GL === 'software'
        ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
        : ['--enable-gpu', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=gl'];
    // Headless date inputs follow the process LANG, not --lang (which only changes the UI language).
    const lang = s.locale.replace('-', '_');
    return chromium.launch({ headless: true, args: [`--lang=${s.locale}`, ...gl],
        env: { ...process.env, LANG: `${lang}.UTF-8`, LANGUAGE: lang } });
}
