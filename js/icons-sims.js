// Game-style option icons (glossy, colored). Unselected chips show them silver via CSS filter.
(function (SLS) {
  let n = 0;
  // Each icon gets its own gradient ids so copies on the page never clash.
  const icon = build => {
    const id = 'g' + (n++);
    return `<svg viewBox="0 0 32 32" aria-hidden="true">${build(s => `${id}${s}`)}</svg>`;
  };
  const lin = (id, a, b, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const rad = (id, a, b) => `<radialGradient id="${id}" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`;
  const ulin = (id, a, b) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="2" x2="0" y2="30"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;

  const GREEN = ['#dcf77a', '#6dbb1e'], GREEN_LINE = '#3d7a10';
  // Thick glossy stroke symbol: dark outline, gradient body, soft highlight.
  const symbol = d => icon(id => `<defs>${ulin(id('a'), ...GREEN)}</defs>
    <path d="${d}" fill="none" stroke="${GREEN_LINE}" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="url(#${id('a')})" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1" stroke-linecap="round" transform="translate(-.6 -.6)"/>`);

  // Standing Sim silhouette, scaled by height (0..1) and width.
  const sim = (h, w, extra = '', fill = GREEN, line = GREEN_LINE) => icon(id => {
    const top = 30 - 26 * h, head = 3.2 * (0.75 + h * 0.3), cy = top + head;
    const sh = cy + head + 1.2, hip = sh + (30 - sh) * 0.45;
    const body = `M${16 - w} ${sh + 2}q0-2 2-2h${2 * w - 4}q2 0 2 2v${hip - sh}h-1.4V30h-${w - 1.3}v-${(30 - hip) * 0.85}h-.8V30h-${w - 1.3}V${hip + 2}h-1.4z`;
    return `<defs>${lin(id('a'), ...fill)}</defs>${extra}
      <g fill="url(#${id('a')})" stroke="${line}" stroke-width="1.2" stroke-linejoin="round">
        <circle cx="16" cy="${cy}" r="${head}"/><path d="${body}"/></g>
      <ellipse cx="${15}" cy="${cy - head * .35}" rx="${head * .45}" ry="${head * .3}" fill="#fff" opacity=".45"/>`;
  });

  Object.assign(SLS.icons, {
    female: symbol('M16 4.6a6.4 6.4 0 1 1 0 12.8a6.4 6.4 0 1 1 0-12.8zM16 17.4V28.6M11.6 23.6h8.8'),
    male: symbol('M13 13.2a6.4 6.4 0 1 1 0 12.8a6.4 6.4 0 1 1 0-12.8zM17.6 14.6L25.4 6.8M19.6 6.4h6.2v6.2'),
    hair: icon(id => `<defs>${lin(id('a'), '#9be15d', '#4f9a17')}${lin(id('b'), '#ffffff', '#e4e7ec')}</defs>
      <ellipse cx="16" cy="18" rx="6.6" ry="8" fill="url(#${id('b')})" stroke="#8c939e" stroke-width="1.1"/>
      <path d="M7.4 17.5C7 9.8 10.6 4.6 16.6 4.6c5.8 0 8.8 4.4 8.6 10.2-.1 2.4-.6 4.3-1.4 6l-1.3-5.4c-3-.4-6.2-2-7.8-4.6-1 2.8-3.4 5-6.2 5.6l-.4 4.3z" fill="url(#${id('a')})" stroke="${GREEN_LINE}" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M11 9.6c1.4-2.4 3.6-3.4 6-3.2" stroke="#fff" stroke-opacity=".55" stroke-width="1.2" fill="none" stroke-linecap="round"/>`),
    infant: icon(id => `<defs>${lin(id('a'), ...GREEN)}</defs>
      <g fill="url(#${id('a')})" stroke="${GREEN_LINE}" stroke-width="1.2" stroke-linejoin="round">
        <circle cx="9" cy="15.5" r="4.2"/>
        <path d="M12.6 18.4c2-1.6 5.4-2.2 8.6-1.6 3 .6 4.8 2.4 5 4.6.2 1.8-.8 3.6-2.4 3.6h-1.6l.6 3h-3l-.8-3h-3.4l-1.4 3h-3l1.4-3.6c-1-1.2-1.2-3-.0-6z"/></g>`),
    toddler: sim(0.55, 4.2, ''),
    child: sim(0.72, 4, `<g stroke="#8c939e" stroke-width=".8" fill="none"><path d="M21.6 14.5c1.4-3 1.8-5 1.6-7"/></g><ellipse cx="23.6" cy="5.6" rx="2.6" ry="3.1" fill="#ff8fb1" stroke="#c2456f" stroke-width="1"/>`),
    teen: sim(0.86, 4.2),
    youngAdult: sim(0.95, 4.6),
    adult: sim(1, 5.1),
    elder: sim(0.92, 4.8, `<path d="M22.6 15.5v14.6M22.6 15.5c0-1.4 2-1.6 2.2-.2" stroke="#7a5a2c" stroke-width="1.6" fill="none" stroke-linecap="round"/>`),

    everyday: icon(id => `<defs>${rad(id('a'), '#fff6a8', '#f2a614')}</defs>
      <g fill="#ffc928" stroke="#d4870a" stroke-width="1" stroke-linejoin="round">${Array.from({ length: 10 }, (_, i) => `<path d="M16 1.6l2.2 5h-4.4z" transform="rotate(${i * 36} 16 16)"/>`).join('')}</g>
      <circle cx="16" cy="16" r="8.4" fill="url(#${id('a')})" stroke="#d4870a" stroke-width="1.2"/>
      <ellipse cx="13.4" cy="12.6" rx="3.2" ry="2" fill="#fff" opacity=".6"/>`),
    formal: icon(id => `<defs>${lin(id('a'), '#7fb3ff', '#2f6ed8', 1, 1)}</defs>
      <g fill="url(#${id('a')})" stroke="#1c4aa0" stroke-width="1.1" stroke-linejoin="round">
        <path d="M13 3.4h6l-1.2 4.4h-3.6z"/><path d="M14.2 7.8h3.6l3 15.6L16 29l-4.8-5.6z"/></g>
      <path d="M15 9.5l1.4 0" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>`),
    athletic: icon(id => `<defs>${rad(id('a'), '#ffffff', '#cfd4dc')}</defs>
      <circle cx="16" cy="16" r="12.4" fill="url(#${id('a')})" stroke="#4b5260" stroke-width="1.2"/>
      <g fill="#2b2f36"><path d="M16 10.4l4.6 3.3-1.8 5.4h-5.6l-1.8-5.4z"/><path d="M16 3.6l3 2.4-.4 2.4-2.6 1.8-2.6-1.8-.4-2.4z"/><path d="M27.6 13.6l-1.6 4.2-2.4.6-2.4-2.2.8-3 2.6-1.2z"/><path d="M4.4 13.6l1.6 4.2 2.4.6 2.4-2.2-.8-3-2.6-1.2z"/><path d="M9.4 26l3.6.6 1-2.4-1.6-2.4-3 .2-1.2 2.4z"/><path d="M22.6 26l-3.6.6-1-2.4 1.6-2.4 3 .2 1.2 2.4z"/></g>`),
    sleep: icon(id => `<defs>${lin(id('a'), '#fff3a1', '#f0b320', 1, 1)}</defs>
      <path d="M19.4 5.2A11 11 0 1 0 27 21.4 9 9 0 0 1 19.4 5.2z" fill="url(#${id('a')})" stroke="#c98a0c" stroke-width="1.2" stroke-linejoin="round"/>
      <g fill="#ffe36b" stroke="#c98a0c" stroke-width=".8" stroke-linejoin="round"><path d="M23 4.6l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z"/><path d="M27.4 12l.6 1.2 1.3.2-1 .9.3 1.3-1.2-.6-1.2.6.3-1.3-1-.9 1.3-.2z"/></g>`),
    party: icon(id => `<defs>${rad(id('a'), '#ffb3c8', '#e2366a')}${rad(id('b'), '#b9e0ff', '#2f86e0')}${rad(id('c'), '#fff2a0', '#f2b818')}</defs>
      <g stroke="#7a808c" stroke-width=".8" fill="none"><path d="M10 15.6l5 13M16.4 13l-.4 15.6M22.6 15.4l-6.6 13.2"/></g>
      <ellipse cx="10" cy="10.4" rx="5" ry="5.8" fill="url(#${id('a')})" stroke="#a81f4a" stroke-width="1"/>
      <ellipse cx="22.4" cy="10.2" rx="5" ry="5.8" fill="url(#${id('c')})" stroke="#b07b08" stroke-width="1"/>
      <ellipse cx="16.4" cy="7.6" rx="5" ry="5.8" fill="url(#${id('b')})" stroke="#1d5ea8" stroke-width="1"/>`),
    swimwear: icon(id => `<defs>${lin(id('a'), '#ffffff', '#d7dde6')}</defs>
      <g fill="url(#${id('a')})" stroke="#6b7380" stroke-width="1.2" stroke-linejoin="round">
        <path d="M4 19.6c0-2.4 2.4-3.4 4.6-2.6l3 1.2c1.8.6 3.4.2 4.6-1.2l3.2-3.8c1-1.2 1-2.6.2-3.6-1.4-1.6-.6-4.6 2.2-4.6 2.4 0 3.6 2.2 2.6 4.4l-2.4 5.2c4 .4 6 2.6 5.2 5.4-.8 3-4 4.6-7.6 4.6H10.4C6.6 24.6 4 22.6 4 19.6z"/></g>
      <path d="M24.6 8.4l2.6-.2-2 1.8z" fill="#ff9a1f" stroke="#c4650a" stroke-width=".8" stroke-linejoin="round"/>
      <circle cx="23.4" cy="7.4" r=".9" fill="#2b2f36"/>`),
    hotWeather: icon(id => `<defs>${lin(id('a'), '#ffd84a', '#ef4a1f')}</defs>
      <path d="M16 3c4.6 4.8 8.2 8.8 8.2 14.4A8.2 8.2 0 0 1 7.8 17.4c0-3.6 1.8-6.4 3.8-8.6.2 2.8 1.4 4.4 3.2 5.2-1-3.8-.6-7.4 1.2-11z" fill="url(#${id('a')})" stroke="#b5300d" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M16 15.4c2.2 2.4 3.6 4 3.6 6.4a3.6 3.6 0 0 1-7.2 0c0-1.8 1-3.2 2.2-4.2.2 1.2.8 1.8 1.6 2.2-.4-1.6-.4-3 0-4.4z" fill="#fff3b0"/>`),
    coldWeather: icon(id => `<defs>${lin(id('a'), '#e6f6ff', '#5fb4f0')}</defs>
      <g stroke="#2a78b8" stroke-width="5" stroke-linecap="round"><path d="M16 3.4v25.2M5.1 9.7l21.8 12.6M5.1 22.3l21.8-12.6"/></g>
      <g stroke="url(#${id('a')})" stroke-width="2.8" stroke-linecap="round"><path d="M16 3.4v25.2M5.1 9.7l21.8 12.6M5.1 22.3l21.8-12.6"/></g>
      <g stroke="#e6f6ff" stroke-width="1.6" stroke-linecap="round" fill="none"><path d="M12.8 5.6l3.2 2.6 3.2-2.6M12.8 26.4l3.2-2.6 3.2 2.6"/></g>`),

    human: sim(1, 5.2, '', ['#ffd1f1', '#d77ac8'], '#9b3f8c'),
    fairy: icon(id => `<defs>${lin(id('a'), '#c9fff0', '#38c9a8', 1, 1)}${lin(id('b'), '#ffe2f3', '#f08cc7', 1, 0)}</defs>
      <g stroke="#2b7f86" stroke-width="1.1" stroke-linejoin="round">
        <path d="M15.4 15C12.6 8.4 8.4 3.6 4.4 4.4 1.6 5 2.4 10 6 12.8c2.8 2.2 6.4 2.6 9.4 2.2z" fill="url(#${id('a')})"/>
        <path d="M16.6 15c2.8-6.6 7-11.4 11-10.6 2.8.6 2 5.6-1.6 8.4-2.8 2.2-6.4 2.6-9.4 2.2z" fill="url(#${id('a')})"/>
        <path d="M15.4 16.2c-3 .6-7.6 3.4-7.8 7.2-.2 3 3 3.6 5.4 1.4 1.6-1.6 2.4-4.8 2.4-8.6z" fill="url(#${id('b')})"/>
        <path d="M16.6 16.2c3 .6 7.6 3.4 7.8 7.2.2 3-3 3.6-5.4 1.4-1.6-1.6-2.4-4.8-2.4-8.6z" fill="url(#${id('b')})"/></g>
      <path d="M16 12v13" stroke="#3a3f48" stroke-width="1.6" stroke-linecap="round"/>`),
    vampire: icon(id => `<defs>${lin(id('a'), '#eef2ea', '#b7c2b4')}${lin(id('b'), '#e0313c', '#8f0f19')}</defs>
      <path d="M4.4 30c.8-4.6 3.6-7.4 7.6-8.6h8c4 1.2 6.8 4 7.6 8.6z" fill="url(#${id('b')})" stroke="#5c0910" stroke-width="1.1"/>
      <path d="M9 25.6l3-4.2h8l3 4.2-7 3z" fill="#1f2228"/>
      <ellipse cx="16" cy="13.8" rx="6.6" ry="8" fill="url(#${id('a')})" stroke="#5d6a5a" stroke-width="1.1"/>
      <path d="M9.4 12.4C9 7 11.8 4.4 16 4.4s7 2.6 6.6 8L20 9.4 16 12.6 12 9.4z" fill="#22252b"/>
      <g fill="#c4121f"><ellipse cx="13.3" cy="13.6" rx="1.2" ry=".9"/><ellipse cx="18.7" cy="13.6" rx="1.2" ry=".9"/></g>
      <path d="M13.6 18.2c1.6 1 3.2 1 4.8 0" stroke="#5d2a2a" stroke-width=".9" fill="none" stroke-linecap="round"/>
      <path d="M14.6 18.6l.4 1.2.4-1.1M16.6 18.6l.4 1.2.4-1.1" fill="#fff"/>`),
    witch: icon(id => `<defs>${lin(id('a'), '#d79a52', '#8a5222', 1, 1)}${rad(id('b'), '#fff1a6', '#d9a516')}</defs>
      <rect x="6.4" y="3.4" width="19.6" height="25.2" rx="2.4" fill="url(#${id('a')})" stroke="#56300f" stroke-width="1.2" transform="rotate(8 16 16)"/>
      <path d="M8.4 5.2l-1.6 22" stroke="#f3e2c0" stroke-width="1.4" transform="rotate(8 16 16)"/>
      <circle cx="16.6" cy="15.8" r="5.2" fill="url(#${id('b')})" stroke="#8a6408" stroke-width="1"/>
      <path d="M16.6 12.2l1 2.4 2.6.2-2 1.6.7 2.5-2.3-1.4-2.2 1.4.6-2.5-2-1.6 2.6-.2z" fill="#a8740c"/>`),
  });
})(globalThis.SLS = globalThis.SLS || {});
