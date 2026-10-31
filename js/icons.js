// Inline SVG icons for the editor option groups (24x24, currentColor).
(function (SLS) {
  const svg = body => `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  const person = (headY, headR, bodyTop, bodyBottom, width) =>
    `<circle cx="12" cy="${headY}" r="${headR}" fill="currentColor"/>` +
    `<path d="M${12 - width} ${bodyBottom} C${12 - width} ${bodyTop + 1} ${12 - width / 2} ${bodyTop} 12 ${bodyTop} S${12 + width} ${bodyTop + 1} ${12 + width} ${bodyBottom} Z" fill="currentColor"/>`;

  SLS.icons = {
    female: svg(`<circle cx="12" cy="5" r="3" fill="currentColor"/><path d="M12 9c-2 0-3 1-3.4 2.6L6.5 19h3l.5 3h4l.5-3h3l-2.1-7.4C15 10 14 9 12 9z" fill="currentColor"/>`),
    male: svg(`<circle cx="12" cy="5" r="3" fill="currentColor"/><path d="M8.5 9.5h7c.8 0 1.5.7 1.5 1.5v5h-2v6h-6v-6H7v-5c0-.8.7-1.5 1.5-1.5z" fill="currentColor"/>`),
    hair: svg(`<path d="M12 2.5c-4.4 0-7.5 3.2-7.5 7.6 0 3.6 1 6.6 2.3 9.4.3.6 1.2.4 1.2-.3V13c0-1.8 1-3.3 2.4-4.1.8 1.3 2.5 2.1 4.6 2.1h1.5v8.2c0 .7.9.9 1.2.3 1.3-2.8 1.8-5.8 1.8-9.4 0-4.4-3.1-7.6-7.5-7.6z" fill="currentColor"/>`),
    infant: svg(`<circle cx="12" cy="9" r="4" fill="currentColor"/><path d="M6 21c0-3.5 2.7-6 6-6s6 2.5 6 6z" fill="currentColor"/>`),
    toddler: svg(person(9, 3.2, 14, 21, 4)),
    child: svg(person(7, 3, 12, 21, 4)),
    teen: svg(person(5.5, 2.8, 10, 22, 4.2)),
    youngAdult: svg(person(4.8, 2.8, 9, 22, 4.6)),
    adult: svg(person(4.5, 3, 8.8, 22, 5.2)),
    elder: svg(person(5, 2.8, 9.5, 22, 4.8) + `<path d="M19 12v10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`),
    everyday: svg(`<circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></g>`),
    formal: svg(`<path d="M3 7l7 4-7 4zM21 7l-7 4 7 4z" fill="currentColor"/><rect x="10" y="9.5" width="4" height="5" rx="1" fill="currentColor"/>`),
    athletic: svg(`<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.5l3.8 2.8-1.5 4.4H9.7l-1.5-4.4z" fill="currentColor"/>`),
    sleep: svg(`<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="currentColor"/>`),
    party: svg(`<path d="M4 21l4.5-12 7.5 7.5z" fill="currentColor"/><g stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M14 3v3M19 6l-2 2M21 11h-3M11 5l1 2"/></g>`),
    swimwear: svg(`<path d="M2 15c2 0 2 1.5 4 1.5s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5M2 19.5c2 0 2 1.5 4 1.5s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="15" cy="6" r="2.5" fill="currentColor"/><path d="M5 12l5-4 3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`),
    hotWeather: svg(`<path d="M12 3c3 3.5 5 6.3 5 9.5a5 5 0 0 1-10 0C7 10 8.5 8 9.8 6.5c.2 2 1 3 2.2 3.5C11.4 7.7 11.6 5.3 12 3z" fill="currentColor"/>`),
    coldWeather: svg(`<g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5"/></g>`),
    human: svg(`<circle cx="12" cy="7" r="4" fill="currentColor"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8z" fill="currentColor"/>`),
    fairy: svg(`<path d="M12 12C9 6 4 3 2.5 5S4 12 12 12zM12 12c3-6 8-9 9.5-7S20 12 12 12zM12 12c-2.5 2-6.5 6-5 8s4.5-2.5 5-8zM12 12c2.5 2 6.5 6 5 8s-4.5-2.5-5-8z" fill="currentColor"/>`),
    vampire: svg(`<path d="M12 3C8 3 5 6 5 10c0 2.5 1 4.5 2.5 6l1.5 5h6l1.5-5C18 14.5 19 12.5 19 10c0-4-3-7-7-7z" fill="currentColor"/><path d="M10 15l.8 2.2.8-2.2M12.4 15l.8 2.2.8-2.2" fill="#fff"/>`),
    witch: svg(`<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H12v18H5.5A1.5 1.5 0 0 1 4 19.5zM12 3h6.5A1.5 1.5 0 0 1 20 4.5v15a1.5 1.5 0 0 1-1.5 1.5H12z" fill="currentColor"/><path d="M8 8.5l.7 1.4 1.5.2-1.1 1 .3 1.5L8 11.9l-1.4.7.3-1.5-1.1-1 1.5-.2zM15.5 13l.5 1 1 .2-.7.7.2 1-1-.5-1 .5.2-1-.7-.7 1-.2z" fill="#fff"/>`),
    palette: svg(`<path d="M12 3a9 9 0 0 0 0 18c1 0 1.6-.8 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5C21 6.6 17 3 12 3z" fill="currentColor"/><circle cx="7.5" cy="11" r="1.4" fill="#fff"/><circle cx="10" cy="7" r="1.4" fill="#fff"/><circle cx="14.5" cy="7" r="1.4" fill="#fff"/><circle cx="17" cy="11" r="1.4" fill="#fff"/>`),
    dropper: svg(`<path d="M19.3 4.7a2.4 2.4 0 0 0-3.4 0l-2.3 2.3-1-1-1.4 1.4 1 1-7.5 7.5L4 19.4 4.6 20l3.5-.7 7.5-7.5 1 1 1.4-1.4-1-1 2.3-2.3a2.4 2.4 0 0 0 0-3.4z" fill="currentColor"/>`),
    chevronLeft: svg(`<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`),
    chevronRight: svg(`<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`),
    close: svg(`<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`),
    help: svg(`<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.2" fill="currentColor"/>`),
    back: svg(`<path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`),
    folder: svg(`<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.6l2 2h8.4A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" fill="currentColor"/>`),
    download: svg(`<path d="M12 4v11M7 10l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`),
    check: svg(`<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`),
  };
})(globalThis.SLS = globalThis.SLS || {});
