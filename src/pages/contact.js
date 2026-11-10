import { page, pageHero } from "../layout.js";
import { arrowRight, phone, mail, pin, clock, whatsapp } from "../icons.js";
import { findUs } from "../components.js";
import { esc, DAY_NAMES } from "../util.js";

export const contactPage = ({ hours, location = null, user }) => {
  const today = new Date().getDay();
  const salon = location || {};
  const address = salon.address || "1428 Abbot Kinney Blvd, Los Angeles, CA 90291";
  const phoneNumber = salon.phone || "+1 (323) 555-0184";
  const email = salon.email || "hello@lumiere-salon.com";
  const tel = phoneNumber.replace(/[^\d+]/g, "");
  const wa = tel.replace(/[^\d+]/g, "").replace(/^\+/, "");
  return `
${pageHero({
  eyebrow: "Contact",
  title: "Come In, or Just Say Hello",
  lede: "Questions about a service, a gift card or a bridal party? Send a note and a real person answers within one business day.",
  crumbs: [["/contact", "Contact"]],
})}
<section class="section">
  <div class="wrap contact-grid">
    <div>
      <h2 style="font-size:clamp(1.7rem,3vw,2.2rem);margin-bottom:6px">Send a Message</h2>
      <p class="lede" style="font-size:.9rem;margin-bottom:22px">For appointments, booking online is fastest. For everything else, this form reaches Amara directly.</p>
      <form class="form-card" data-contact novalidate>
        <div class="form-row form-row--2">
          <div class="field">
            <label for="c-name">Your name</label>
            <input id="c-name" name="name" autocomplete="name" required minlength="2">
            <span class="field__error" data-error-for="name">Please enter your name.</span>
          </div>
          <div class="field">
            <label for="c-email">Email</label>
            <input id="c-email" name="email" type="email" autocomplete="email" required>
            <span class="field__error" data-error-for="email">Please enter a valid email.</span>
          </div>
        </div>
        <div class="field">
          <label for="c-phone">Phone <span style="text-transform:none;letter-spacing:0">(optional)</span></label>
          <input id="c-phone" name="phone" type="tel" autocomplete="tel">
        </div>
        <div class="field">
          <label for="c-message">Message</label>
          <textarea id="c-message" name="message" required minlength="10" placeholder="Tell us what you are thinking about…"></textarea>
          <span class="field__error" data-error-for="message">Please add a little more detail.</span>
        </div>
        <label class="checkbox" style="margin-bottom:18px">
          <input type="checkbox" name="consent" required>
          <span>I am happy for LUMIÈRE to reply by email. We never add you to a list without asking.</span>
        </label>
        <button class="btn btn--block" type="submit">Send message ${arrowRight}</button>
        <p class="form-note" style="margin:12px 0 0">We reply within one business day, usually sooner.</p>
      </form>
    </div>
    <div>
      <h2 style="font-size:clamp(1.7rem,3vw,2.2rem);margin-bottom:16px">The Salon</h2>
      <ul class="contact-list">
        <li>${pin}<div><strong>Address</strong><span>${esc(address)}</span></div></li>
        <li>${phone}<div><strong>Phone</strong><a href="tel:${esc(tel)}">${esc(phoneNumber)}</a></div></li>
        <li>${mail}<div><strong>Email</strong><a href="mailto:${esc(email)}">${esc(email)}</a></div></li>
        <li>${whatsapp}<div><strong>WhatsApp</strong><a href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener noreferrer">Message the front desk</a></div></li>
      </ul>
      <h3 style="font-family:var(--sans);font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);font-weight:500;margin:28px 0 12px">Opening hours</h3>
      <ul class="hours-list">
        ${hours.map((h) => `<li class="${h.day === today ? "today" : ""}"><span>${DAY_NAMES[h.day]}</span><span>${h.closed ? "Closed" : `${h.open} – ${h.close}`}</span></li>`).join("")}
      </ul>
      <p class="form-note" style="margin-top:14px">Holiday hours are posted on Instagram. Last colour appointment starts 90 minutes before close.</p>
    </div>
  </div>
</section>
${findUs({ location, hours })}`;
};

export const contactPageHtml = (data) =>
  page({
    title: "Contact",
    description: "Visit LUMIÈRE Hair Salon at 1428 Abbot Kinney Blvd, Los Angeles. Call +1 (323) 555-0184, email hello@lumiere-salon.com or send a message.",
    path: "/contact",
    body: contactPage(data),
    user: data.user,
  });
