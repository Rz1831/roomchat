import { arrowRight, star, check, clock, leafBadge } from "./icons.js";
import { esc, money, minutesToDuration, timeLabel } from "./util.js";

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

export const serviceCard = (s) => `
<article class="arch-card" data-reveal>
  <a class="arch-card__media" href="/services#${esc(s.slug)}" aria-label="${esc(s.name)} — view service details">
    <img src="${esc(s.image)}" alt="${esc(s.name)} at LUMIÈRE Hair Salon" loading="lazy" width="600" height="800">
  </a>
  <h3><a href="/services#${esc(s.slug)}">${esc(s.name)}</a></h3>
  <p>${esc(s.short_description)}</p>
  <div class="arch-card__meta">
    <span>${money(s.price)} · ${minutesToDuration(s.duration)}</span>
    <a class="link-arrow" href="/services#${esc(s.slug)}">Learn more ${arrowRight}</a>
  </div>
</article>`;

export const stylistCard = (s) => `
<article class="stylist" data-reveal>
  <div class="stylist__media">
    <img src="${esc(s.photo)}" alt="${esc(s.name)}, ${esc(s.role)}" loading="lazy" width="700" height="780">
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
  <button class="masonry__item" type="button" data-category="${esc(g.category)}" data-lightbox="${i}" data-src="${esc(g.image)}" data-caption="${esc(g.caption)}" aria-label="View: ${esc(g.caption)}">
    <img src="${esc(g.image)}" alt="${esc(g.caption)}" loading="lazy" width="900" height="${i % 3 === 0 ? 1200 : 900}">
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
