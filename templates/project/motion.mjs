// Optional custom drawn scenes (kind: motion). Each returns { svg, script } for the shared 1920x1080 frame.
// Args: id (prefix every element id with it), dur, f (start of each phrase, scene time), theme, enter(selector, t),
// esc(text). Animate with GSAP lines on `tl`; make each part appear when the narration names it (f[i]).
export default {
    // '02-<slug>': ({ id, f, theme: t, enter, esc }) => ({
    //     svg: `<text id="${id}-a" x="200" y="300" font-size="64" fill="${t.ink}" opacity="0">${esc('Hello')}</text>`,
    //     script: enter(`#${id}-a`, f[0]),
    // }),
};
