import { arrowRight, star, check, clock, leafBadge, pin, phone, mail } from "./icons.js";
import { esc, money, minutesToDuration, timeLabel, DAY_NAMES } from "./util.js";
import { directionsUrl, imageFitClass } from "./salon.js";

// "Find Us" block: the owner's saved map embed on the left, salon details on the
// right. Without a saved map the column collapses and only the details show.
export const findUs = ({ location, hours = [] } = {}) => {
  if (!location) return "";
  const today = new Date().getDay();
  const tel = String(location.phone || "").replace(/[^\d+]/g, "");
  const embed = location.embed || "";
  const canDirections = Boolean(location.address || location.link);
  return `
<section class="section section--beige find-us" id="find-us">
  <div class="wrap find-us__grid${embed ? "" : " find-us__grid--solo"}">
    ${embed ? `
    <div class="find-us__map" data-reveal>
      <iframe class="map" src="${esc(embed)}" title="Map showing ${esc(location.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
    </div>` : ""}
    <div class="find-us__copy" data-reveal>
      <p class="eyebrow">Visit us</p>
      <h2>${esc(location.name || "Find the salon")}</h2>
      ${location.description ? `<p class="lede">${esc(location.description)}</p>` : ""}
      <ul class="find-us__details">
        ${location.address ? `<li>${pin}<div><strong>Address</strong><span>${esc(location.address)}</span></div></li>` : ""}
        ${location.phone ? `<li>${phone}<div><strong>Phone</strong><a href="tel:${esc(tel)}">${esc(location.phone)}</a></div></li>` : ""}
        ${location.email ? `<li>${mail}<div><strong>Email</strong><a href="mailto:${esc(location.email)}">${esc(location.email)}</a></div></li>` : ""}
      </ul>
      ${hours.length ? `
      <div class="find-us__hours">
        <h3>Opening hours</h3>
        <ul class="hours-list">
          ${hours.map((h) => `<li class="${Number(h.day) === today ? "today" : ""}"><span>${DAY_NAMES[h.day]}</span><span>${h.closed ? "Closed" : `${esc(h.open)} – ${esc(h.close)}`}</span></li>`).join("")}
        </ul>
      </div>` : ""}
      <div class="find-us__actions">
        ${canDirections ? `<a class="btn" href="${esc(directionsUrl(location))}" target="_blank" rel="noopener noreferrer">Get directions ${arrowRight}</a>` : ""}
        ${location.phone ? `<a class="btn btn--ghost" href="tel:${esc(tel)}">Call us ${phone}</a>` : ""}
      </div>
    </div>
  </div>
</section>`;
};

export const badge = () => `
<div class="badge" aria-hidden="true">
  <svg class="badge__ring" viewBox="0 0 120 120">
    <defs><path id="badge-circle" d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0"/></defs>
    <text><textPath href="#badge-circle" startOffset="0">LUMIÈRE · HAIR SALON · LOS ANGELES · </textPath></text>
  </svg>
  <span class="badge__leaf">${leafBadge}</span>
</div>`;

export const stars = (rating = 5) =>
  `<span class="stars" aria-label="${rating} out of 5 stars">${Array.from({ length: 5 }, (_, i) => star(i < rating)).join("")}</span>`;

export const serviceCard = (s, settings = {}) => `
<article class="arch-card" data-reveal>
  <a class="arch-card__media" href="/services#${esc(s.slug)}" aria-label="${esc(s.name)} — view service details">
    <img src="${esc(s.image)}" alt="${esc(s.name)} at LUMIÈRE Hair Salon" loading="lazy" width="600" height="800" data-slot="service:${s.id}"${imageFitClass(settings, `service:${s.id}`) ? ' class="img--contain"' : ""}>
  </a>
  <h3><a href="/services#${esc(s.slug)}">${esc(s.name)}</a></h3>
  <p>${esc(s.short_description)}</p>
  <div class="arch-card__meta">
    <span>${money(s.price)} · ${minutesToDuration(s.duration)}</span>
    <a class="link-arrow" href="/services#${esc(s.slug)}">Learn more ${arrowRight}</a>
  </div>
</article>`;

export const stylistCard = (s, settings = {}) => `
<article class="stylist" data-reveal>
  <div class="stylist__media">
    <img src="${esc(s.photo)}" alt="${esc(s.name)}, ${esc(s.role)}" loading="lazy" width="700" height="780" data-slot="stylist:${s.id}"${imageFitClass(settings, `stylist:${s.id}`) ? ' class="img--contain"' : ""}>
  </div>
  <div class="stylist__body">
    <h3>${esc(s.name)}</h3>
    <p class="stylist__role">${esc(s.role)}</p>
    <p>${esc(s.bio)}</p>
    <div class="stylist__tags">${String(s.specialties || "").split(",").slice(0, 3).map((t) => `<span class="tag">${esc(t.trim())}</span>`).join("")}</div>
  </div>
</article>`;

export const testimonialCard = (t) => `
<figure class="testimonial">
  ${stars(t.rating)}
  <blockquote class="testimonial__quote">“${esc(t.text)}”</blockquote>
  <figcaption class="testimonial__by">
    <img src="${esc(t.photo || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80")}" alt="" loading="lazy" width="44" height="44">
    <span><strong>${esc(t.name)}</strong><span>Verified client</span></span>
  </figcaption>
</figure>`;

export const priceTier = (tier) => `
<article class="price-card ${tier.featured ? "price-card--featured" : ""}" data-reveal>
  ${tier.featured ? '<span class="price-card__badge">Most loved</span>' : ""}
  <h3>${esc(tier.name)}</h3>
  <p style="font-size:.86rem;margin:0">${esc(tier.blurb)}</p>
  <div class="price-card__price">${esc(tier.price)}</div>
  <ul>${tier.includes.map((i) => `<li>${check}<span>${esc(i)}</span></li>`).join("")}</ul>
  <a class="btn ${tier.featured ? "btn--light" : "btn--ghost"} btn--block" href="${tier.href}">${esc(tier.cta)} ${arrowRight}</a>
</article>`;

export const faqList = (items, { openFirst = false } = {}) => `
<div class="faq">
  ${items.map((f, i) => `
  <details ${openFirst && i === 0 ? "open" : ""}>
    <summary>${esc(f.q)}<span class="plus" aria-hidden="true"></span></summary>
    <div class="faq__answer">${esc(f.a)}</div>
  </details>`).join("")}
</div>`;

export const galleryGrid = (items, { limit = 0, interactive = true } = {}) => `
<div class="masonry" id="masonry">
  ${items.slice(0, limit || items.length).map((g, i) => `
  <button class="masonry__item" type="button" data-category="${esc(g.category)}" data-lightbox="${i}" data-gallery-item="${g.id}" data-src="${esc(g.image)}" data-caption="${esc(g.caption)}" aria-label="View: ${esc(g.caption)}">
    <img src="${esc(g.image)}" alt="${esc(g.caption)}" loading="lazy"${g.width && g.height ? ` width="${g.width}" height="${g.height}"` : ""} data-slot="gallery:${g.id}">
    <span class="masonry__cap">${esc(g.caption)}</span>
  </button>`).join("")}
</div>`;

export const postCard = (p) => `
<article class="post-card" data-reveal>
  <a class="post-card__media" href="/blog/${esc(p.slug)}" tabindex="-1" aria-hidden="true">
    <img src="${esc(p.cover_image)}" alt="" loading="lazy" width="1200" height="750">
  </a>
  <div class="post-card__body">
    <span class="post-card__meta">${esc(p.category)} · ${new Date(p.published_at + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</span>
    <h3><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a></h3>
    <p>${esc(p.excerpt)}</p>
    <a class="link-arrow" href="/blog/${esc(p.slug)}">Read article ${arrowRight}</a>
  </div>
</article>`;

export const beforeAfter = (before, after, beforeAlt, afterAlt, label) => `
<div class="ba" data-ba>
  <img src="${esc(before)}" alt="${esc(beforeAlt)}" loading="lazy" width="900" height="700">
  <img class="ba__after" src="${esc(after)}" alt="${esc(afterAlt)}" loading="lazy" width="900" height="700">
  <span class="ba__handle" aria-hidden="true"></span>
  <span class="ba__label ba__label--before">Before</span>
  <span class="ba__label ba__label--after">After</span>
  <input class="ba__range" type="range" min="0" max="100" value="50" aria-label="${esc(label)} before and after comparison">
</div>`;

export const timePill = (t) => `<span class="tag">${clock} ${timeLabel(t)}</span>`;

export const errorNote = (msg) => `<div class="alert alert--err" role="alert">${esc(msg)}</div>`;
