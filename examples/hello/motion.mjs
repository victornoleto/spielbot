// Custom drawn scenes. Each returns { svg, script } for the shared frame (toolkit/compose/cards.mjs):
// `f[i]` is when phrase i starts (scene time), `theme` is project.json theme merged with the defaults, and
// `enter(selector, t)` / `esc(text)` are the toolkit helpers (fade-in tween, HTML escape).

export default {
    '02-how': ({ id, f, theme: t, enter, esc }) => {
        const steps = ['Script', 'Voice', 'Capture', 'Compose'];
        const svg = steps.map((s, i) => `<g id="${id}-k${i}" opacity="0">
        <rect x="${180 + i * 410}" y="440" width="330" height="200" rx="22" fill="${t.panel}" stroke="${t.accent}" stroke-width="4"/>
        <text x="${345 + i * 410}" y="555" font-size="44" font-weight="700" fill="${t.ink}" text-anchor="middle">${esc(s)}</text>
        ${i < steps.length - 1 ? `<path d="M${515 + i * 410} 540h70" stroke="${t.muted}" stroke-width="5"/>` : ''}
      </g>`).join('');
        const script = steps.map((_, i) => enter(`#${id}-k${i}`, `${f[i < 2 ? 0 : 1]} + ${(i % 2) * 0.6}`)).join('\n    ');
        return { svg, script };
    },
};
