// App scenes: one entry per `app` scene of script.md, one beat per narration phrase (same order, same count).
// h: go, move, click, clickAt, type, replace, scroll, open, wait, down, up, mark('url', text). See toolkit/capture/lib.mjs.

/** Runs once before recording; the session (cookies, storage) is reused by every scene. Delete if the app is public. */
export async function login(page, { baseUrl, env }) {
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[type=email]', env.APP_USER);
    await page.fill('input[type=password]', env.APP_PASSWORD);
    await page.click('button[type=submit]');
    await page.waitForURL((u) => !u.pathname.startsWith('/login'));
}

/** Optional: per-context setup (route mocks, init scripts such as a collapsed sidebar). */
// export async function prepare(context, settings) {}

export default {
    '01-<slug>': {
        setup: (p, h) => h.open('/', 1500), // before the clock: cut from the video
        beats: [
            async (p, h) => { await h.go(p.getByRole('heading', { level: 1 })); await h.wait(1200); },
            async (p, h) => { await h.click(p.getByRole('button', { name: '<label>' }), 1000); },
        ],
    },
};
