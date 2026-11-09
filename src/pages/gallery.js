import { page, pageHero } from "../layout.js";
import { arrowRight } from "../icons.js";
import { galleryGrid, beforeAfter } from "../components.js";
import { esc } from "../util.js";

export const galleryPage = ({ gallery, user }) => `
${pageHero({
  eyebrow: "Gallery",
  title: "Hair We Have Loved",
  lede: "Real clients, real light, no filters. Filter by the service you are considering, then tap any image to see it full size.",
  crumbs: [["/gallery", "Gallery"]],
})}
<section class="section">
  <div class="wrap">
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
      <button class="btn btn--sm" type="button" data-edit-only hidden data-edit-add>+ Add an image</button>
    </div>
    <div class="filter-bar" role="group" aria-label="Filter gallery by category">
      <button class="filter-btn" data-filter="all" aria-pressed="true">All</button>
      ${["Cuts", "Color", "Treatments", "Extensions"].map((c) => `<button class="filter-btn" data-filter="${c}" aria-pressed="false">${c}</button>`).join("")}
    </div>
    ${galleryGrid(gallery)}
    <div id="gallery-empty" class="empty" hidden>No images in this category yet — try another filter.</div>
    <p style="text-align:center;margin-top:28px;font-size:.82rem;color:var(--muted)">Every image shows a client who gave us permission to share. Colour results vary with hair history.</p>
  </div>
</section>

<section class="section section--beige">
  <div class="wrap">
    <div class="section-head" style="margin-bottom:28px">
      <div class="section-head__text">
        <p class="eyebrow">See the change</p>
        <h2>Drag to Compare</h2>
        <p class="lede" style="margin-top:12px">Two recent transformations, photographed in the same window light.</p>
      </div>
    </div>
    <div class="card-grid card-grid--2">
      ${beforeAfter(
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1503104834685-7205e8607eb9?auto=format&fit=crop&w=1000&q=80",
        "Before a copper gloss correction",
        "After a copper gloss and shape cut",
        "Copper gloss transformation",
      )}
      ${beforeAfter(
        "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&w=1000&q=80",
        "Before a collarbone cut",
        "After a blunt collarbone cut and bond treatment",
        "Collarbone cut transformation",
      )}
    </div>
    <div style="text-align:center;margin-top:36px"><a class="btn" href="/book">Book Your Experience ${arrowRight}</a></div>
  </div>
</section>

<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Gallery image" hidden>
  <button class="lightbox__close" data-lb-close aria-label="Close image">✕</button>
  <button class="lightbox__nav lightbox__nav--prev" data-lb-prev aria-label="Previous image">‹</button>
  <div>
    <img id="lightbox-img" src="" alt="">
    <p class="lightbox__cap" id="lightbox-cap"></p>
  </div>
  <button class="lightbox__nav lightbox__nav--next" data-lb-next aria-label="Next image">›</button>
</div>`;

export const galleryPageHtml = (data) =>
  page({
    title: "Gallery",
    description: "Browse cuts, colour, treatments and extensions from LUMIÈRE Hair Salon in Los Angeles — real clients, real results.",
    path: "/gallery",
    body: galleryPage(data),
    user: data.user,
  });
