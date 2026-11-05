// Explore the app before writing beats: logs in with the project's login(), opens one page and runs a throwaway
// steps file, screenshotting on demand. Nothing is recorded.
// Usage (through the hooks): bin/spielbot explore <project> <steps.mjs>
// steps.mjs: export default async (page, h, shot) => { await h.open('/customers'); await shot('list'); … }
//   shot(name) saves build/explore/NN-<name>.png and prints its path; h are the capture helpers.
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { VIEWPORT, browser as launch, helpers, session, settings } from './lib.mjs';

const [projectArg, stepsArg] = process.argv.slice(2);
const project = resolve(projectArg);
const mod = await import(pathToFileURL(join(project, 'scenes.mjs'))).catch(() => ({}));
const steps = (await import(pathToFileURL(resolve(stepsArg)))).default;
const s = settings(project);
const out = join(project, 'build', 'explore');
mkdirSync(out, { recursive: true });
const b = await launch(s);
try {
    const state = await session(b, s, mod.login);
    const ctx = await b.newContext({ ignoreHTTPSErrors: s.ignoreHTTPSErrors, locale: s.locale, timezoneId: s.timezone, viewport: VIEWPORT, storageState: state });
    await mod.prepare?.(ctx, s);
    const page = await ctx.newPage();
    let n = 0;
    const shot = async (name = 'step') => {
        const path = join(out, `${String(++n).padStart(2, '0')}-${name}.png`);
        await page.screenshot({ path });
        console.log(path);
    };
    try { await steps(page, helpers(page, s), shot); }
    catch (e) { await shot('error'); throw e; }
} finally {
    await b.close();
}
