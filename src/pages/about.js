import { page, pageHero, sectionHead } from "../layout.js";
import { arrowRight, heart, leaf, sparkle } from "../icons.js";
import { esc } from "../util.js";

const values = [
  { icon: heart, title: "Listen first", text: "Every appointment opens with a conversation, not a cape. We ask what you hated about your last cut before we ask what you want next." },
  { icon: leaf, title: "Health over hype", text: "We will talk you out of a service that would damage your hair — even when it is on our own price list." },
  { icon: sparkle, title: "A room that slows down", text: "No overlapping clients, no stopwatch. Your slot is yours, with proper coffee and a playlist that is not too loud." },
];

export const aboutPage = ({ stylists, user }) => `
${pageHero({
  eyebrow: "Our story",
  title: "More Than a Salon",
  lede: "A sunlit studio on Abbot Kinney, built on the belief that healthy hair is a long conversation, not a quick transaction.",
  crumbs: [["/about", "About"]],
})}
<section class="section">
  <div class="wrap split">
    <div data-reveal>
      <p class="eyebrow">Since 2014</p>
      <h2>One chair, a good pair of scissors, and a different idea.</h2>
      <p class="lede" style="margin-top:16px">Amara Laurent trained in Paris and spent a decade in editorial suites before opening LUMIÈRE with a single chair and a rule she still keeps: no client leaves without understanding their own hair.</p>
      <p class="lede">Today the salon has four chairs, a treatment room and a team that has stayed together for years. We are still independent, still owner-run, and still more interested in the health of your ends than the number of services we can add to a ticket.</p>
      <p class="quote-large" style="margin-top:28px">“The best compliment is a client who does not need us for six weeks.”</p>
    </div>
    <img src="https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=1000&q=80" alt="The LUMIÈRE salon interior with warm light, mirrors and plants" width="1000" height="800" loading="lazy">
  </div>
</section>

<section class="section section--beige">
  <div class="wrap">
    ${sectionHead({ eyebrow: "What we believe", title: "Three Things We Do Not Compromise", center: true })}
    <div class="card-grid card-grid--3">
      ${values.map((v) => `
      <div class="value-card" data-reveal>
        <span class="feature__icon" style="width:auto;height:auto;margin-bottom:12px">${v.icon}</span>
        <h3>${esc(v.title)}</h3>
        <p>${esc(v.text)}</p>
      </div>`).join("")}
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <img src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1000&q=80" alt="A stylist finishing a client's soft waves in natural light" width="1000" height="800" loading="lazy">
    <div data-reveal>
      <p class="eyebrow">The last ten years</p>
      <h2>A Quiet Timeline</h2>
      <div class="timeline" style="margin-top:24px">
        <div class="timeline__item"><h3>2014</h3><p>Amara opens LUMIÈRE with one chair and a waiting list of seventeen clients.</p></div>
        <div class="timeline__item"><h3>2017</h3><p>Naomi joins and builds the colour programme; the salon becomes known for balayage on dark hair.</p></div>
        <div class="timeline__item"><h3>2021</h3><p>We add the treatment room and the scalp ritual that now sells out most weeks.</p></div>
        <div class="timeline__item"><h3>2024</h3><p>Sofia and Ines complete the team; LUMIÈRE is named a Los Angeles Local Favourite.</p></div>
        <div class="timeline__item"><h3>Today</h3><p>Four chairs, one standard, and a book that fills four weeks out. Thank you for trusting us.</p></div>
      </div>
    </div>
  </div>
</section>

<section class="section section--beige" id="team">
  <div class="wrap">
    ${sectionHead({
      eyebrow: "The team",
      title: "People Who Do This Properly",
      lede: "Between them, our stylists have more than forty years behind the chair — and every one of them still takes classes.",
    })}
    <div class="team-strip">
      ${stylists.map((s) => `
      <div data-reveal>
        <img src="${esc(s.photo)}" alt="${esc(s.name)}, ${esc(s.role)}" width="700" height="900" loading="lazy">
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.role)}</p>
      </div>`).join("")}
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap cta">
    <div class="cta__media" data-reveal>
      <img src="https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=80" alt="A finished soft layered cut at LUMIÈRE" width="900" height="900" loading="lazy">
    </div>
    <div class="cta__copy" data-reveal>
      <p class="eyebrow">Come say hello</p>
      <h2>The Chair Is Warm</h2>
      <p class="lede">Book a first visit and we will spend the first ten minutes just talking. Bring photos, bring your routine, bring the story of the last haircut you regretted.</p>
      <a class="btn" href="/book">Book Your Experience ${arrowRight}</a>
    </div>
  </div>
</section>`;

export const aboutPageWrapped = (data) =>
  page({
    title: "About & Our Story",
    description: "The story, values and team behind LUMIÈRE Hair Salon — an independent, owner-run salon on Abbot Kinney in Los Angeles since 2014.",
    path: "/about",
    body: aboutPage(data),
    user: data.user,
  });
