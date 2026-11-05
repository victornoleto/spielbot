// App scenes of the hello example: one beat per narration phrase (script.md). The demo app needs no login.
export default {
    '01-add-task': {
        setup: (p, h) => h.open('/', 800),
        beats: [
            async (p, h) => { await h.go(p.locator('#empty')); await h.wait(1200); },
            async (p, h) => {
                await h.type(p.locator('#title'), 'Record the product video');
                await h.wait(300);
                await h.click(p.locator('#priority'), 300);
                await p.locator('#priority').selectOption('High');
                await h.wait(500);
            },
            async (p, h) => { await h.click(p.getByRole('button', { name: 'Add' }), 1000); },
            async (p, h) => { await h.click(p.getByRole('checkbox', { name: 'Done' }), 1000); },
        ],
    },
};
