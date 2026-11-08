import { page, pageHero, sectionHead } from "../layout.js";
import { postCard } from "../components.js";
import { arrowRight } from "../icons.js";
import { esc } from "../util.js";

const fmt = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

export const blogPage = ({ posts, user }) => {
  const [lead, ...rest] = posts;
  return `
${pageHero({
  eyebrow: "Care tips",
  title: "Notes From the Chair",
  lede: "Practical guidance from our stylists — written for real mornings with real hair, not for a photo shoot.",
  crumbs: [["/blog", "Journal"]],
})}
<section class="section">
  <div class="wrap">
    ${lead ? `
    <article class="split" style="margin-bottom:clamp(36px,5vw,60px)">
      <a href="/blog/${esc(lead.slug)}" style="display:block;overflow:hidden;border-radius:var(--radius-lg)">
        <img src="${esc(lead.cover_image)}" alt="${esc(lead.title)}" width="1200" height="800" style="border-radius:var(--radius-lg);aspect-ratio:4/3;object-fit:cover">
      </a>
      <div>
        <p class="eyebrow">${esc(lead.category)} · Latest</p>
        <h2 style="font-size:clamp(1.9rem,3.4vw,2.8rem)"><a href="/blog/${esc(lead.slug)}">${esc(lead.title)}</a></h2>
        <p class="lede" style="margin-top:14px">${esc(lead.excerpt)}</p>
        <p style="font-size:.75rem;color:var(--muted);letter-spacing:.08em">${fmt(lead.published_at)}</p>
        <a class="link-arrow" href="/blog/${esc(lead.slug)}">Read the article ${arrowRight}</a>
      </div>
    </article>` : ""}
    <div class="card-grid card-grid--3">
      ${rest.map(postCard).join("")}
    </div>
  </div>
</section>
<section class="section section--beige">
  <div class="wrap">
    <div class="newsletter">
      <div>
        <p class="eyebrow">The note</p>
        <h2>Twice a Month, Never More</h2>
        <p class="lede" style="margin-top:10px">New care guides, seasonal switches and first access to the appointment book.</p>
      </div>
      <form data-newsletter novalidate>
        <label class="sr-only" for="newsletter-email">Email address</label>
        <input id="newsletter-email" type="email" name="email" placeholder="you@example.com" autocomplete="email" required>
        <button class="btn" type="submit">Subscribe ${arrowRight}</button>
      </form>
    </div>
  </div>
</section>`;
};

export const blogPageHtml = (data) =>
  page({
    title: "Care Tips & Journal",
    description: "Hair care guides, colour advice and salon notes from the stylists at LUMIÈRE Hair Salon in Los Angeles.",
    path: "/blog",
    body: blogPage(data),
    user: data.user,
  });

export const postPage = ({ post, others, user }) => {
  const body = `
${pageHero({ eyebrow: post.category, title: post.title, lede: post.excerpt, crumbs: [["/blog", "Journal"], ["/blog/" + post.slug, post.category]] })}
<section class="section">
  <div class="wrap">
    <article class="article">
      <div class="article__meta"><span>${fmt(post.published_at)}</span><span>·</span><span>${Math.max(2, Math.round(post.content.replace(/<[^>]+>/g, " ").split(/\s+/).length / 200))} min read</span><span>·</span><span>LUMIÈRE Studio</span></div>
      <img class="article__cover" src="${esc(post.cover_image)}" alt="${esc(post.title)}" width="1200" height="675">
      <div class="article__body">${post.content}</div>
      <div class="note-card" style="margin-top:36px;display:flex;gap:20px;flex-wrap:wrap;align-items:center;justify-content:space-between">
        <div><strong>Want this for your own hair?</strong><br><span style="font-size:.85rem">Book a consultation and we will build a plan around your routine.</span></div>
        <a class="btn btn--sm" href="/book">Book now ${arrowRight}</a>
      </div>
    </article>
  </div>
</section>
<section class="section section--beige">
  <div class="wrap">
    ${sectionHead({ eyebrow: "Keep reading", title: "More From the Journal" })}
    <div class="card-grid card-grid--3">
      ${others.slice(0, 3).map(postCard).join("")}
    </div>
  </div>
</section>`;
  return page({
    title: post.title,
    description: post.excerpt,
    path: "/blog/" + post.slug,
    body,
    user,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      image: post.cover_image,
      datePublished: post.published_at,
      author: { "@type": "Organization", name: "LUMIÈRE Hair Salon" },
      publisher: { "@type": "Organization", name: "LUMIÈRE Hair Salon" },
      description: post.excerpt,
    },
  });
};
