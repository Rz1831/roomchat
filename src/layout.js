import { STYLES } from "./styles.js";
import { arrowRight, instagram, facebook, pinterest, whatsapp, phone as phoneIcon, mail, pin, leaf, homeIcon, imageIcon, userIcon, scissors, calendar } from "./icons.js";
import { esc } from "./util.js";

const NAV = [
  ["/", "Home"],
  ["/services", "Services"],
  ["/about", "About"],
  ["/gallery", "Gallery"],
  ["/book", "Book"],
  ["/contact", "Contact"],
];

const isActive = (href, path) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

// One Lucide-style line icon per menu entry, so the mobile menu never shows a
// missing or unexplained glyph.
const NAV_ICONS = {
  "/": homeIcon,
  "/services": scissors,
  "/about": userIcon,
  "/gallery": imageIcon,
  "/book": calendar,
  "/contact": mail,
};

export const header = (path) => `
<header class="site-header" id="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/" aria-label="LUMIÈRE Hair Salon — home">
      <b>LUMIÈRE</b><span>Hair Salon</span>
    </a>
    <nav class="nav" aria-label="Main navigation">
      ${NAV.map(([href, label]) => `<a href="${href}" ${isActive(href, path) ? 'aria-current="page"' : ""}>${label}</a>`).join("")}
    </nav>
    <div class="header-actions">
      <a class="btn btn--sm" href="/book">Book Appointment ${arrowRight}</a>
      <button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">
        <span></span>
      </button>
    </div>
  </div>
</header>
<div class="mobile-nav" id="mobile-nav" aria-hidden="true">
  <nav class="mobile-nav__list" aria-label="Mobile navigation">
    ${NAV.map(([href, label]) => `<a class="mobile-nav__link" href="${href}" ${isActive(href, path) ? 'aria-current="page"' : ""}><span class="mobile-nav__label">${NAV_ICONS[href] || ""}<span>${label}</span></span>${arrowRight}</a>`).join("")}
  </nav>
  <a class="btn mobile-nav__cta" href="/book">Book Appointment ${arrowRight}</a>
  <div class="mobile-nav__foot">
    <a class="mobile-nav__phone" href="tel:+13235550184">${phoneIcon}<span>+1 (323) 555-0184</span></a>
    <div class="mobile-nav__socials">
      <a href="https://instagram.com" aria-label="LUMIÈRE on Instagram" rel="noopener noreferrer" target="_blank">${instagram}</a>
      <a href="https://facebook.com" aria-label="LUMIÈRE on Facebook" rel="noopener noreferrer" target="_blank">${facebook}</a>
      <a href="https://pinterest.com" aria-label="LUMIÈRE on Pinterest" rel="noopener noreferrer" target="_blank">${pinterest}</a>
      <a href="https://wa.me/13235550184" aria-label="Message us on WhatsApp" rel="noopener noreferrer" target="_blank">${whatsapp}</a>
    </div>
  </div>
</div>`;

export const footer = () => `
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-top">
      <div class="footer-brand">
        <a class="brand" href="/"><b>LUMIÈRE</b><span>Hair Salon</span></a>
        <p>Where beauty meets confidence. A warm, unhurried salon on Abbot Kinney, caring for Los Angeles hair since 2014.</p>
        <div class="socials">
          <a href="https://instagram.com" aria-label="LUMIÈRE on Instagram" rel="noopener noreferrer" target="_blank">${instagram}</a>
          <a href="https://facebook.com" aria-label="LUMIÈRE on Facebook" rel="noopener noreferrer" target="_blank">${facebook}</a>
          <a href="https://pinterest.com" aria-label="LUMIÈRE on Pinterest" rel="noopener noreferrer" target="_blank">${pinterest}</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Quick Links</h4>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/services">Services</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/gallery">Gallery</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Information</h4>
        <ul>
          <li><a href="/book">Book Appointment</a></li>
          <li><a href="/faq">FAQ</a></li>
          <li><a href="/blog">Care Tips</a></li>
          <li><a href="/gift-cards">Gift Cards</a></li>
          <li><a href="/privacy">Privacy Policy</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Contact</h4>
        <ul class="footer-contact">
          <li>${phoneIcon}<a href="tel:+13235550184">+1 (323) 555-0184</a></li>
          <li>${mail}<a href="mailto:hello@lumiere-salon.com">hello@lumiere-salon.com</a></li>
          <li>${pin}<span>1428 Abbot Kinney Blvd,<br>Los Angeles, CA 90291</span></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} Lumière Hair Salon. All rights reserved.</span>
      <div class="legal">
        <a href="/privacy">Privacy</a>
        <a href="/faq">FAQ</a>
      </div>
    </div>
  </div>
</footer>`;

export const floating = () => `
<div class="floating-call" aria-label="Quick contact">
  <a href="https://wa.me/13235550184" target="_blank" rel="noopener noreferrer" aria-label="Message us on WhatsApp">${whatsapp}</a>
  <a href="tel:+13235550184" aria-label="Call the salon">${phoneIcon}</a>
</div>
<div class="toast-stack" id="toast-stack" role="status" aria-live="polite"></div>`;

const cookieBanner = () => `
<div class="cookie-banner" id="cookie-banner" hidden>
  <p>We use essential cookies to keep booking and the site working, plus anonymous analytics. Your booking details can be remembered on this device so you book faster — you can clear them at any time. Read our <a href="/privacy">privacy policy</a>.</p>
  <div style="display:flex;gap:8px">
    <button class="btn btn--sm" data-cookie="all">Accept</button>
    <button class="btn btn--sm btn--outline-light" data-cookie="essential">Essential only</button>
  </div>
</div>`;

export const page = ({
  title,
  description = "LUMIÈRE Hair Salon — expert cuts, dimensional colour and restorative treatments in Los Angeles. Book your experience today.",
  path = "/",
  body = "",
  script = "app",
  user = null,
  bodyClass = "",
  noindex = false,
  jsonLd = null,
  headerExtra = "",
  settings = null,
  edit = false,
}) => {
  const fullTitle = title ? `${title} — LUMIÈRE Hair Salon` : "LUMIÈRE Hair Salon — Healthy Hair. Beautiful You.";
  const origin = "https://lumiere-salon.com";
  const ogImage = (settings && settings["image.banner"]) || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80";
  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${origin}${path}">
<meta name="theme-color" content="#FBF3EC">
${noindex ? '<meta name="robots" content="noindex, nofollow">' : ""}
<meta property="og:type" content="website">
<meta property="og:site_name" content="LUMIÈRE Hair Salon">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${origin}${path}">
<meta property="og:image" content="${esc(ogImage.startsWith("/") ? "https://lumiere-salon.com" + ogImage : ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(fullTitle)}">
<meta name="twitter:description" content="${esc(description)}">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#C0643F"/><path d="M23 8c0 7-4.3 11-8.6 11A3.9 3.9 0 0 1 10.5 15C10.5 10.6 15.6 8 23 8Z" fill="none" stroke="#FBF3EC" stroke-width="1.6"/><path d="M11 24c2-4 4.7-6.7 8.6-8.6" fill="none" stroke="#FBF3EC" stroke-width="1.6" stroke-linecap="round"/></svg>`)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>${STYLES}</style>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ""}
${headerExtra}
</head>
<body class="${bodyClass}">
<a class="skip-link" href="#main">Skip to content</a>
${header(path)}
<main id="main">
${body}
</main>
${footer()}
${floating()}
${cookieBanner()}
${(Array.isArray(script) ? script : [script]).map((s) => `<script src="/assets/${s}.js" defer></script>`).join("")}
${edit ? '<script src="/assets/edit.js" defer></script>' : ""}
</body>
</html>`;
};

export const pageHero = ({ eyebrow, title, lede, crumbs = [] }) => `
<section class="page-hero">
  <div class="wrap">
    ${crumbs.length ? `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a>${crumbs.map(([href, label]) => ` <span aria-hidden="true">/</span> <a href="${href}">${label}</a>`).join("")}</nav>` : ""}
    ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ""}
    <h1>${title}</h1>
    ${lede ? `<p class="lede">${lede}</p>` : ""}
  </div>
</section>`;

export const sectionHead = ({ eyebrow, title, lede, action, center = false }) => `
<div class="section-head ${center ? "center" : ""}" data-reveal>
  <div class="section-head__text">
    ${eyebrow ? `<p class="eyebrow ${center ? "eyebrow--center" : ""}">${eyebrow}</p>` : ""}
    <h2>${title}</h2>
    ${lede ? `<p class="lede">${lede}</p>` : ""}
  </div>
  ${action || ""}
</div>`;

export const logoMark = leaf;
