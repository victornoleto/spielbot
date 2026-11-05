// Drawn scenes: the card templates (title, chapter, list, closing) and the frame that project motion scenes reuse.
// Every part appears when the narration names it: `f[i]` is when phrase i starts, in scene time.
// Cards are parameterized by project.json "cards" and "theme"; nothing here is project specific.

export const DEFAULT_THEME = {
    bg: '#0b1f44', panel: '#14295a', grid: '#1d3566', ink: '#ffffff', muted: '#9fb0d0', accent: '#1463ff', rail: '#2a4479',
    font: 'IBM Plex Sans',
};

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A GSAP line that fades and slides `sel` in at time `t`. */
export const enter = (sel, t, from = { opacity: 0, y: 24 }) =>
    `tl.fromTo("${sel}", ${JSON.stringify(from)}, { opacity: 1, y: 0, x: 0, duration: 0.6, ease: "power3.out" }, ${t});`;

export const fontFaces = (font) => [400, 500, 600, 700].map((w) =>
    `@font-face { font-family: '${font}'; font-weight: ${w}; src: url('assets/fonts/ibm-plex-sans-latin-${w}-normal.woff2') format('woff2'); }`).join('\n    ');

/**
 * The frame of every drawn scene: a 1920x1080 SVG stage over a faint grid, plus optional HTML on top (`extra`).
 * Project motion scenes (<project>/motion.mjs) return { svg, script, extra? } and get wrapped here.
 */
export function frame(t, id, dur, { svg, script, extra = '', style = '' }) {
    return `<template>
  <style>
    ${fontFaces(t.font)}
    #root { position: absolute; inset: 0; overflow: hidden; background: ${t.bg}; font-family: '${t.font}', sans-serif; color: ${t.ink}; }
    #${id}-stage { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
    text { font-family: '${t.font}', sans-serif; }
    ${style}
  </style>
  <div id="root" data-composition-id="${id}" data-width="1920" data-height="1080">
    <svg id="${id}-stage" class="clip" data-start="0" data-duration="${dur}" viewBox="0 0 1920 1080" aria-hidden="true">
      <defs>
        <pattern id="${id}-grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="${t.grid}" stroke-width="1"/></pattern>
      </defs>
      <rect width="1920" height="1080" fill="url(#${id}-grid)"/>
      ${svg}
    </svg>
    ${extra}
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    ${script}
    window.__timelines["${id}"] = tl;
  </script>
</template>
`;
}

// A comet (head and fading tail) that crosses the stage; chapter cards use it to draw the title underline.
const comet = (t, id) => `<g id="${id}">
      <line x1="-90" y1="0" x2="0" y2="0" stroke="${t.accent}" stroke-width="10" stroke-linecap="round" opacity="0.35"/>
      <circle r="14" fill="${t.ink}" stroke="${t.accent}" stroke-width="6"/>
    </g>`;

function title(t, id, dur, f, c) {
    const img = c.image
        ? `<rect x="1086" y="236" width="628" height="608" rx="22" fill="${t.panel}"/>
      <image id="${id}-img" href="${esc(c.image)}" x="1090" y="240" width="620" height="600" preserveAspectRatio="xMidYMid slice" style="clip-path: inset(0 100% 0 0 round 18px)"/>`
        : '';
    const svg = `
      <text id="${id}-tit" x="150" y="470" font-size="${c.size ?? 128}" font-weight="700" fill="${t.ink}" opacity="0">${esc(c.title)}</text>
      ${c.subtitle ? `<text id="${id}-sub" x="154" y="560" font-size="40" font-weight="400" fill="${t.muted}" opacity="0">${esc(c.subtitle)}</text>` : ''}
      ${img}`;
    const script = `
    ${enter(`#${id}-tit`, f[0] ?? 0.2)}
    ${c.subtitle ? enter(`#${id}-sub`, f[1] ?? (f[0] ?? 0.2) + 1) : ''}
    ${c.image ? `tl.fromTo("#${id}-img", { clipPath: "inset(0 100% 0 0 round 18px)" }, { clipPath: "inset(0 0% 0 0 round 18px)", duration: 3.6, ease: "power1.inOut" }, 0.2);` : ''}`;
    return { svg, script };
}

/** Chapter card: the number in outline, a progress bar across chapters, the title and the subtitle; a comet crosses
 * the stage and leaves the line that underlines the title. The narration reads the title, then the subtitle. */
function chapter(t, id, dur, f, c, { n, total, label }) {
    const seg = Math.min(96, Math.floor(1000 / total) - 14), gap = 14;
    const svg = `
      <text id="${id}-num" x="200" y="640" font-size="360" font-weight="700" fill="none" stroke="${t.accent}" stroke-width="6" opacity="0">${String(n).padStart(2, '0')}</text>
      <g id="${id}-bar" opacity="0">
        ${Array.from({ length: total }, (_, i) => `<rect x="${640 + i * (seg + gap)}" y="372" width="${seg}" height="10" rx="5" fill="${i + 1 < n ? t.muted : i + 1 === n ? t.accent : t.rail}"/>`).join('')}
        <text x="640" y="350" font-size="30" font-weight="600" fill="${t.muted}">${esc(label)}</text>
      </g>
      <text id="${id}-tit" x="636" y="530" font-size="96" font-weight="700" fill="${t.ink}" opacity="0">${esc(c.title)}</text>
      <line id="${id}-line" x1="640" y1="580" x2="1720" y2="580" stroke="${t.accent}" stroke-width="6" stroke-linecap="round" style="clip-path: inset(0 100% 0 0)"/>
      ${c.subtitle ? `<text id="${id}-sub" x="640" y="660" font-size="40" font-weight="400" fill="${t.muted}" opacity="0">${esc(c.subtitle)}</text>` : ''}
      ${comet(t, `${id}-comet`)}`;
    const script = `
    tl.fromTo("#${id}-num", { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" }, 0.1);
    ${enter(`#${id}-bar`, 0.25, { opacity: 0, y: -12 })}
    ${enter(`#${id}-tit`, Math.max(0.35, (f[0] ?? 0.4) - 0.1))}
    tl.fromTo("#${id}-comet", { x: 520, y: 580, opacity: 1 }, { x: 1720, y: 580, duration: 1.4, ease: "power1.inOut" }, 0.75);
    tl.to("#${id}-comet", { opacity: 0, duration: 0.3 }, 2.15);
    tl.fromTo("#${id}-line", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "power1.inOut" }, 0.75);
    ${c.subtitle ? enter(`#${id}-sub`, Math.max(0.9, (f[1] ?? (f[0] ?? 0.4) + 1) - 0.1)) : ''}`;
    return { svg, script };
}

/** List card: a title (phrase 1) and one item lit per following phrase, on a vertical rail. Up to 6 items. */
function list(t, id, dur, f, c) {
    const items = c.items.slice(0, 6);
    const step = 118;
    const svg = `
      <text id="${id}-tit" x="200" y="200" font-size="64" font-weight="700" fill="${t.ink}" opacity="0">${esc(c.title)}</text>
      <line x1="232" y1="290" x2="232" y2="${290 + (items.length - 1) * step}" stroke="${t.rail}" stroke-width="4"/>
      ${items.map((it, i) => `<g id="${id}-k${i}" opacity="0.22">
        <circle cx="232" cy="${290 + i * step}" r="18" fill="${t.bg}" stroke="${t.ink}" stroke-width="4"/>
        <circle id="${id}-kp${i}" cx="232" cy="${290 + i * step}" r="9" fill="${t.ink}" opacity="0"/>
        <text x="290" y="${302 + i * step}" font-size="40" font-weight="600" fill="${t.ink}">${esc(it)}</text>
      </g>`).join('')}`;
    const script = `
    ${enter(`#${id}-tit`, f[0] ?? 0.2)}
    ${items.map((_, i) => {
        const at = f[i + 1] ?? (f[0] ?? 0.2) + 1 + i * 0.8;
        return `tl.fromTo("#${id}-k${i}", { opacity: 0.22 }, { opacity: 1, duration: 0.4, ease: "power2.out" }, ${at});
    tl.fromTo("#${id}-kp${i}", { opacity: 0 }, { opacity: 1, duration: 0.3 }, ${at});`;
    }).join('\n    ')}`;
    return { svg, script };
}

/** Closing card: optional logo on a light background and up to 2 lines, one per phrase. */
function closing(t, id, dur, f, c) {
    const lines = c.lines.slice(0, 2);
    const bg = c.background ?? '#ffffff';
    const svg = `
      <rect width="1920" height="1080" fill="${bg}"/>
      ${c.logo ? `<image id="${id}-logo" href="${esc(c.logo)}" x="760" y="280" width="400" height="260" preserveAspectRatio="xMidYMid meet" opacity="0"/>` : ''}
      ${lines.map((l, i) => `<text id="${id}-l${i}" x="960" y="${640 + i * 72}" font-size="${i ? 34 : 54}" font-weight="${i ? 500 : 700}" fill="${i ? '#4a5a7a' : t.bg}" text-anchor="middle" opacity="0">${esc(l)}</text>`).join('')}`;
    const script = `
    ${c.logo ? enter(`#${id}-logo`, 0.1, { opacity: 0, y: -30 }) : ''}
    ${lines.map((_, i) => enter(`#${id}-l${i}`, f[i] ?? 0.4 + i)).join('\n    ')}`;
    return { svg, script };
}

export const CARDS = { title, chapter, list, closing };
