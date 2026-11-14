// Small, dependency-free SVG icon set. Every icon is stroke-based so it can
// inherit colour from the surrounding text.
const svg = (paths, { fill = "none", stroke = "currentColor", sw = 1.5 } = {}) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

export const arrowRight = svg('<path d="M4 12h15M13 6l6 6-6 6"/>');
export const arrowLeft = svg('<path d="M20 12H5M11 6l-6 6 6 6"/>');
export const leaf = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4c0 9-5.5 14-11 14a5 5 0 0 1-5-5C4 7.5 10.5 4 20 4Z"/><path d="M4 20c2.5-5 6-8.5 11-11"/></svg>`;
export const sparkle = svg('<path d="M12 3v6M12 15v6M3 12h6M15 12h6"/><circle cx="12" cy="12" r="1.6"/>');
export const scissors = svg('<circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><path d="M8 7.5 20 18M8 16.5 20 6"/>');
export const bottle = svg('<path d="M9 3h6M10 3v4l-2 3v8a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V10l-2-3V3"/><path d="M8 14h8"/>');
export const heart = svg('<path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z"/>');
export const calendar = svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>');
export const clock = svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>');
export const check = svg('<path d="M5 12.5 9.5 17 19 7"/>');
export const phone = svg('<path d="M6.5 3h3l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2L21 14.5v3a2.5 2.5 0 0 1-2.7 2.5A17.5 17.5 0 0 1 4 5.7 2.5 2.5 0 0 1 6.5 3Z"/>');
export const mail = svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>');
export const pin = svg('<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>');
export const star = (filled) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.3"><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.9l-5.3 2.7 1.1-5.8-4.3-4.1 5.9-.8Z"/></svg>`;
export const whatsapp = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 15L2 22l5.2-1.4A9.9 9.9 0 1 0 12.04 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3a8 8 0 1 1 6.8 3.7Zm4.5-5.9c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.6-.7c.1-.2.1-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.4 3.8 2.2.8 2.6.7 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.2-.2-.2-.4-.3Z"/></svg>`;
export const instagram = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2c-2.7 0-3 0-4 .1-1.1 0-1.8.2-2.4.5a4.8 4.8 0 0 0-1.8 1.1A4.8 4.8 0 0 0 2.7 5.7c-.3.6-.5 1.3-.5 2.4-.1 1-.1 1.3-.1 4s0 3 .1 4c0 1.1.2 1.8.5 2.4a4.8 4.8 0 0 0 1.1 1.8 4.8 4.8 0 0 0 1.8 1.1c.6.3 1.3.5 2.4.5 1 .1 1.3.1 4 .1s3 0 4-.1c1.1 0 1.8-.2 2.4-.5a5 5 0 0 0 2.9-2.9c.3-.6.5-1.3.5-2.4.1-1 .1-1.3.1-4s0-3-.1-4c0-1.1-.2-1.8-.5-2.4a4.8 4.8 0 0 0-1.1-1.8 4.8 4.8 0 0 0-1.8-1.1c-.6-.3-1.3-.5-2.4-.5-1-.1-1.3-.1-4-.1Zm0 1.8c2.7 0 2.9 0 4 .1.9 0 1.4.2 1.7.3.4.2.7.4 1 .7.3.3.5.6.7 1 .1.3.3.8.3 1.7.1 1 .1 1.3.1 4s0 2.9-.1 4c0 .9-.2 1.4-.3 1.7-.2.4-.4.7-.7 1-.3.3-.6.5-1 .7-.3.1-.8.3-1.7.3-1 .1-1.3.1-4 .1s-2.9 0-4-.1c-.9 0-1.4-.2-1.7-.3-.4-.2-.7-.4-1-.7-.3-.3-.5-.6-.7-1-.1-.3-.3-.8-.3-1.7-.1-1-.1-1.3-.1-4s0-2.9.1-4c0-.9.2-1.4.3-1.7.2-.4.4-.7.7-1 .3-.3.6-.5 1-.7.3-.1.8-.3 1.7-.3 1-.1 1.3-.1 4-.1Zm0 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm6.4-8.4a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z"/></svg>`;
export const facebook = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 22v-8h2.7l.4-3H14V9.2c0-.9.3-1.5 1.6-1.5h1.6V5c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V11H8v3h2.8v8H14Z"/></svg>`;
export const pinterest = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.7 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.9 1.6 1.9 1.9 0 3.3-2.3 3.3-5.1 0-2.1-1.5-3.6-4-3.6-3 0-4.8 2.2-4.8 4.5 0 .9.3 1.9.7 2.4.1.1.1.2.1.3l-.3 1c0 .2-.1.2-.3.1-1.3-.6-2.1-2.5-2.1-4 0-3.2 2.4-6.2 6.9-6.2 3.6 0 6.4 2.6 6.4 6 0 3.6-2.2 6.4-5.4 6.4-1.1 0-2.1-.6-2.4-1.2l-.7 2.5c-.2 1-.9 2.2-1.4 2.9A10 10 0 1 0 12 2Z"/></svg>`;
export const leafBadge = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4c0 9-5.5 14-11 14a5 5 0 0 1-5-5C4 7.5 10.5 4 20 4Z"/><path d="M4 20c2.5-5 6-8.5 11-11"/></svg>`;
export const closeIcon = svg('<path d="M6 6l12 12M18 6 6 18"/>');
export const homeIcon = svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>');
export const imageIcon = svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m4 17.5 4.5-4.5 3.5 3.5 3-3L20 17"/>');
export const userIcon = svg('<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>');
export const plusIcon = svg('<path d="M12 5v14M5 12h14"/>');
export const chevronDown = svg('<path d="m6 9 6 6 6-6"/>');
