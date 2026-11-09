import { page, pageHero, sectionHead } from "../layout.js";
import { arrowRight, check } from "../icons.js";
import { faqList } from "../components.js";
import { esc, money, minutesToDuration, timeLabel } from "../util.js";

const CATEGORY_COPY = {
  Cuts: "Shape first. Every cut begins with a dry consultation so we can see how your hair actually falls.",
  Color: "Dimensional, lived-in colour built in layers so grow-out stays graceful.",
  Treatments: "Scalp and strand health — the foundation everything else sits on.",
  Extensions: "Length and volume that moves like your own hair. Colour-matched in daylight.",
  Bridal: "Calm, unhurried styling for the day you will look at forever.",
};

export const servicesPage = ({ services, faqs, user }) => {
  const categories = [...new Set(services.map((s) => s.category))];
  const body = `
${pageHero({
    eyebrow: "Our services",
    title: "Luxury Care For Every You",
    lede: "Every service includes a consultation, a proper cleanse and a finish you can recreate at home. Prices are starting points, not guesses.",
    crumbs: [["/services", "Services"]],
  })}
<section class="section">
  <div class="wrap">
    ${categories.map((cat) => `
    <div class="service-category">
      <div class="service-category__head">
        <h2>${esc(cat)}</h2>
        <span>${services.filter((s) => s.category === cat).length} services</span>
      </div>
      <p class="lede" style="margin:-6px 0 8px;font-size:.9rem">${esc(CATEGORY_COPY[cat] || "")}</p>
      ${services.filter((s) => s.category === cat).map((s) => `
      <article class="service-row" id="${esc(s.slug)}">
        <img src="${esc(s.image)}" alt="${esc(s.name)}" loading="lazy" width="64" height="64">
        <div>
          <h3>${esc(s.name)}</h3>
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
            <span class="service-row__dur">${minutesToDuration(s.duration)}</span>
            <span class="service-row__dur">${esc(s.category)}</span>
          </div>
        </div>
        <div class="service-row__meta">
          <span class="service-row__price">${money(s.price)}</span>
          <a class="btn btn--ghost btn--sm" href="/book?service=${esc(s.slug)}">Book this service ${arrowRight}</a>
        </div>
        <p>${esc(s.description)}</p>
      </article>`).join("")}
    </div>`).join("")}

    <div class="note-card" style="max-width:820px">
      <strong>Not sure what to book?</strong> Start with a signature cut or call the salon on +1 (323) 555-0184. We will talk through your hair, your routine and your budget, then book the right appointment the first time — no consultation fee.
    </div>
  </div>
</section>

<section class="section section--beige">
  <div class="wrap" style="max-width:900px">
    ${sectionHead({ eyebrow: "Good to know", title: "Service Questions", center: true })}
    ${faqList(faqs.slice(0, 4))}
    <p style="margin-top:24px"><a class="link-arrow" href="/faq">All questions ${arrowRight}</a></p>
  </div>
</section>`;

  return page({
    title: "Services & Pricing",
    description: "Cuts, dimensional colour, scalp treatments and hand-tied extensions at LUMIÈRE Hair Salon in Los Angeles. Transparent prices and durations.",
    path: "/services",
    body,
    user,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: services.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: { "@type": "Service", name: s.name, description: s.short_description, offers: { "@type": "Offer", price: s.price, priceCurrency: "USD" } },
      })),
    },
  });
};
