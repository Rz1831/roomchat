import { page, sectionHead } from "../layout.js";
import { arrowRight, scissors, bottle, heart, calendar, check, leaf } from "../icons.js";
import { badge, stars, serviceCard, stylistCard, testimonialCard, priceTier, galleryGrid, faqList, beforeAfter, findUs } from "../components.js";
import { esc, money } from "../util.js";
import { imageFitClass } from "../salon.js";

const features = [
  { icon: bottle, title: "Premium Products", text: "High-quality, sustainable products chosen for scalp comfort and lasting colour." },
  { icon: scissors, title: "Expert Stylists", text: "Highly trained professionals who are genuinely passionate about healthy hair." },
  { icon: heart, title: "Personalized Care", text: "Custom treatments tailored to your texture, goals and real-life routine." },
  { icon: calendar, title: "Easy Booking", text: "Book online in minutes, reschedule in one click, and arrive to a chair that is ready." },
];

const tiers = [
  {
    name: "The Refresh",
    price: "$95",
    blurb: "A reset for hair that needs shape, shine and a little breathing room.",
    includes: ["Consultation & precision cut", "Cleanse and conditioning ritual", "Finished blow-dry", "Home-care plan"],
    cta: "Book a refresh",
    href: "/book?service=signature-cut-style",
  },
  {
    name: "The Signature",
    price: "$180",
    blurb: "Our most-loved visit: colour that grows out gracefully and a cut built around it.",
    includes: ["Colour or gloss service", "Bond-repair rinse", "Precision cut & style", "Take-home gloss drop"],
    cta: "Book the signature",
    href: "/book?service=dimensional-color",
    featured: true,
  },
  {
    name: "The Transformation",
    price: "$320",
    blurb: "For the big change — extensions, bridal or a full colour correction.",
    includes: ["Extended consultation", "Multi-step colour or extensions", "Treatment & finish", "Six-week check-in"],
    cta: "Plan a transformation",
    href: "/book?service=hand-tied-extensions",
  },
];

export const homePage = ({ services, stylists, testimonials, gallery, faqs, user, settings = {}, hours = [], location = null }) => {
  const img = (key, fallback) => esc(settings[key] || fallback);
  const featured = services.filter((s) => s.featured).slice(0, 4);
  const proofAvatars = testimonials.slice(0, 3);

  const body = `
<section class="hero">
  <div class="wrap hero__grid">
    <div class="hero__copy">
      <p class="eyebrow">Where confidence blossoms</p>
      <h1>Healthy Hair.<br>Beautiful You.<em>Every Day.</em></h1>
      <p class="lede">Expert care. Personalised treatments. Effortless beauty that lasts — in a sunlit studio on Abbot Kinney, where nobody rushes you.</p>
      <div class="hero__cta">
        <a class="btn" href="/book">Book Your Experience ${arrowRight}</a>
        <a class="link-arrow" href="/services">Explore services ${arrowRight}</a>
      </div>
      <div class="hero__proof">
        <span class="avatars">
          ${proofAvatars.map((t) => `<img src="${esc(t.photo)}" alt="" width="44" height="44" loading="lazy">`).join("")}
        </span>
        <span class="proof__text">
          <strong>Loved by 500+ clients</strong>
          <span style="display:flex;align-items:center;gap:8px;margin-top:2px">${stars(5)} 4.9/5 (120 reviews)</span>
        </span>
      </div>
    </div>
    <div class="hero__media">
      <span class="hero__note">Abbot Kinney · Est. 2014</span>
      <div class="hero__frame">
        <img src="${img("image.hero", "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1100&q=85")}" data-slot="image.hero" alt="A LUMIÈRE stylist shaping a client's wavy hair by the window" width="1100" height="1265" fetchpriority="high"${imageFitClass(settings, "image.hero") ? ' class="img--contain"' : ""}>
      </div>
      ${badge()}
    </div>
  </div>
</section>

<section class="features" aria-label="Why clients choose LUMIÈRE">
  <div class="wrap features__grid">
    ${features.map((f) => `
    <div class="feature">
      <span class="feature__icon">${f.icon}</span>
      <div>
        <h3>${f.title}</h3>
        <p>${f.text}</p>
      </div>
    </div>`).join("")}
  </div>
</section>

<section class="section" id="services-preview">
  <div class="wrap">
    ${sectionHead({
      eyebrow: "Our services",
      title: "Luxury Care For Every You",
      lede: "From precision cuts to transformative colour, we bring out the best in your hair — and keep it that way between visits.",
      action: `<a class="link-arrow" href="/services">View all services ${arrowRight}</a>`,
    })}
    <div class="card-grid card-grid--4">
      ${featured.map((s) => serviceCard(s, settings)).join("")}
    </div>
  </div>
</section>

<section class="story">
  <div class="wrap story__inner">
    <div>
      <p class="eyebrow">More than a salon</p>
      <h2>It's Your Time.<br><em>It's Your Glow.</em></h2>
      <p>We built LUMIÈRE around a simple belief: beautiful hair starts with a healthy scalp and an honest conversation. No upsell scripts, no rushed blow-dries. Just a warm room, good coffee, and stylists who listen before they pick up the scissors.</p>
      <p style="margin-top:18px"><a class="btn btn--light" href="/about">Our story ${arrowRight}</a></p>
      <p class="story__sign">— Amara Laurent, Founder</p>
    </div>
    <div class="story__media">
      <img src="${img("image.story", "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1000&q=80")}" data-slot="image.story" alt="A warm corner of the salon — woven pendants, olive walls and a table of books" width="1000" height="800" loading="lazy"${imageFitClass(settings, "image.story") ? ' class="img--contain"' : ""}>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap cta">
    <div class="cta__media" data-reveal>
      <img src="${img("image.cta", "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80")}" data-slot="image.cta" alt="The bright, plant-filled interior of LUMIÈRE Hair Salon" width="900" height="900" loading="lazy"${imageFitClass(settings, "image.cta") ? ' class="img--contain"' : ""}>
    </div>
    <div class="cta__copy" data-reveal>
      <p class="eyebrow">Ready when you are</p>
      <h2>Ready for Your Best Hair?</h2>
      <p class="lede">Tell us what you are dreaming about. We will tell you honestly what is possible, how long it takes, and what it costs — before you sit down.</p>
      <div style="display:flex;gap:14px;flex-wrap:wrap">
        <a class="btn" href="/book">Book Appointment ${arrowRight}</a>
        <a class="link-arrow" href="tel:+13235550184" style="align-self:center">Or call the salon ${arrowRight}</a>
      </div>
    </div>
  </div>
</section>

<section class="section section--beige" id="team">
  <div class="wrap">
    ${sectionHead({
      eyebrow: "Meet the team",
      title: "The Hands Behind the Hair",
      lede: "Four specialists, one shared standard: hair that looks as good on day twenty as it did on day one.",
      action: `<a class="link-arrow" href="/about">Meet the full team ${arrowRight}</a>`,
    })}
    <div class="card-grid card-grid--4">
      ${stylists.map((s) => stylistCard(s, settings)).join("")}
    </div>
  </div>
</section>

<section class="section" id="results">
  <div class="wrap">
    ${sectionHead({
      eyebrow: "Before & after",
      title: "The Difference Is in the Detail",
      lede: "Drag the handle to see the same client, same light, same hair — before and after a LUMIÈRE colour and cut.",
      action: `<a class="link-arrow" href="/gallery">See the full gallery ${arrowRight}</a>`,
    })}
    <div class="card-grid card-grid--2">
      <div data-reveal>${beforeAfter(
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1503104834685-7205e8607eb9?auto=format&fit=crop&w=1000&q=80",
        "Warm, brassy lengths before a tonal correction",
        "The same hair after a soft copper gloss and shape cut",
        "Copper gloss transformation",
      )}</div>
      <div data-reveal>${beforeAfter(
        "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&w=1000&q=80",
        "Fine hair with a grown-out, heavy perimeter",
        "After a blunt collarbone cut and bond treatment",
        "Collarbone cut transformation",
      )}</div>
    </div>
  </div>
</section>

<section class="section section--tight testimonials" id="testimonials">
  <div class="wrap">
    ${sectionHead({
      eyebrow: "Client love",
      title: "Kind Words, Real Hair",
      lede: "4.9 out of 5 across 120 reviews — and a lot of clients who have been with us since the beginning.",
    })}
    <div class="testimonial-track" id="testimonial-track" tabindex="0" aria-label="Client testimonials">
      ${testimonials.map(testimonialCard).join("")}
    </div>
    <div class="slider-controls">
      <button class="slider-btn" data-slide="prev" aria-label="Previous testimonials"><span aria-hidden="true">‹</span></button>
      <button class="slider-btn" data-slide="next" aria-label="Next testimonials"><span aria-hidden="true">›</span></button>
    </div>
  </div>
</section>

<section class="section" id="pricing">
  <div class="wrap">
    ${sectionHead({
      eyebrow: "Investment",
      title: "Clear Prices, No Surprises",
      lede: "Every price includes the consultation, the cleanse and the finish. What we quote is what you pay.",
      center: true,
    })}
    <div class="card-grid card-grid--3" style="max-width:1080px;margin-inline:auto">
      ${tiers.map(priceTier).join("")}
    </div>
    <p style="text-align:center;margin:24px 0 0;font-size:.82rem;color:var(--muted)">Prices start at. Long or dense hair may need extra time — we will always confirm before we begin.</p>
  </div>
</section>

<section class="section section--tight">
  <div class="wrap">
    ${sectionHead({
      eyebrow: "@lumierehairsalon",
      title: "A Little Glow in Your Feed",
      center: true,
    })}
    <div class="ig-strip">
      ${gallery.slice(0, 6).map((g) => `<a href="/gallery" aria-label="View ${esc(g.caption)} in the gallery"><img src="${esc(g.image)}" alt="${esc(g.caption)}" loading="lazy" width="400" height="400"></a>`).join("")}
    </div>
  </div>
</section>

<section class="section section--beige" id="faq">
  <div class="wrap" style="max-width:900px">
    ${sectionHead({ eyebrow: "Questions", title: "Before You Book", centered: true, lede: "The things clients ask us most often, answered plainly.", center: true })}
    ${faqList(faqs.slice(0, 5))}
    <p style="margin-top:24px"><a class="link-arrow" href="/faq">All questions ${arrowRight}</a></p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="newsletter" data-reveal>
      <div>
        <p class="eyebrow">The note</p>
        <h2>Good Hair, in Your Inbox</h2>
        <p class="lede" style="margin:10px 0 0">Seasonal care tips, first access to new services, and the occasional love letter from Amara. Twice a month, never more.</p>
      </div>
      <div>
        <form data-newsletter novalidate>
          <label class="sr-only" for="newsletter-email">Email address</label>
          <input id="newsletter-email" type="email" name="email" placeholder="you@example.com" autocomplete="email" required>
          <button class="btn" type="submit">Subscribe ${arrowRight}</button>
        </form>
        <p class="form-note">No spam. Unsubscribe any time. We never share your address.</p>
      </div>
    </div>
  </div>
</section>

${findUs({ location, hours })}
`;

  return page({
    title: null,
    description: "LUMIÈRE Hair Salon in Los Angeles — precision cuts, dimensional colour, scalp treatments and hand-tied extensions. Book your experience online.",
    path: "/",
    body,
    user,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "HairSalon",
      name: "LUMIÈRE Hair Salon",
      image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80",
      url: "https://lumiere-salon.com",
      telephone: "+1 (323) 555-0184",
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        streetAddress: "1428 Abbot Kinney Blvd",
        addressLocality: "Los Angeles",
        addressRegion: "CA",
        postalCode: "90291",
        addressCountry: "US",
      },
      openingHoursSpecification: [
        { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday"], opens: "10:00", closes: "19:00" },
        { "@type": "OpeningHoursSpecification", dayOfWeek: ["Thursday", "Friday"], opens: "10:00", closes: "20:00" },
        { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "17:00" },
      ],
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "120" },
    },
  });
};
