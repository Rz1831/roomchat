import { page, pageHero } from "../layout.js";
import { faqList } from "../components.js";
import { arrowRight } from "../icons.js";

export const faqPage = ({ faqs, user }) =>
  page({
    title: "Frequently Asked Questions",
    description: "Answers about booking, cancellations, colour consultations, parking, products and gift cards at LUMIÈRE Hair Salon.",
    path: "/faq",
    user,
    body: `
${pageHero({
  eyebrow: "Help",
  title: "Questions, Answered",
  lede: "If the answer you need is not here, call the salon on +1 (323) 555-0184 — a person picks up.",
  crumbs: [["/faq", "FAQ"]],
})}
<section class="section">
  <div class="wrap" style="max-width:900px">
    ${faqList(faqs, { openFirst: true })}
    <div class="note-card" style="margin-top:36px;display:flex;gap:20px;align-items:center;justify-content:space-between;flex-wrap:wrap">
      <div><strong>Still not sure?</strong><br><span style="font-size:.87rem">Send a note and we will answer within one business day.</span></div>
      <a class="btn btn--sm" href="/contact">Contact us ${arrowRight}</a>
    </div>
  </div>
</section>`,
  });

export const privacyPage = ({ user }) =>
  page({
    title: "Privacy Policy",
    description: "How LUMIÈRE Hair Salon collects, uses and protects your personal information.",
    path: "/privacy",
    user,
    body: `
${pageHero({
  eyebrow: "Legal",
  title: "Privacy Policy",
  lede: "We collect the minimum we need to look after your hair and your booking. This page explains exactly what that means.",
  crumbs: [["/privacy", "Privacy"]],
})}
<section class="section">
  <div class="wrap">
    <article class="article article__body">
      <p style="color:var(--muted);font-size:.85rem">Last updated: 1 November 2026</p>
      <h2>What we collect</h2>
      <p>When you book, we collect your name, email, phone number and any notes you add about your hair. When you create an account we also store a securely hashed password. When you buy a gift card we collect the recipient's name and email so we can deliver it. Our contact form stores your message and contact details.</p>
      <h2>How we use it</h2>
      <ul>
        <li>To confirm, remind you about, reschedule or cancel appointments.</li>
        <li>To keep a service history so your next visit starts informed, not from scratch.</li>
        <li>To answer messages you send us.</li>
        <li>To send the newsletter — only if you asked for it, and only until you unsubscribe.</li>
      </ul>
      <h2>Cookies</h2>
      <p>We use one essential cookie to keep you signed in. With your permission we also use anonymous analytics to understand which pages are useful. You can withdraw that permission at any time using the cookie banner or your browser settings. Declining analytics cookies does not affect booking or sign-in.</p>
      <h2>Who we share data with</h2>
      <p>We do not sell personal information. Booking data is stored in our own database. Email delivery and payment processing are handled by processors who see only what is needed to deliver the message or take the payment. Our map embed is provided by Google and loads only on the contact page.</p>
      <h2>How long we keep it</h2>
      <p>Appointment history is kept for three years so we can advise accurately on colour and treatments. Contact messages are deleted after two years. Newsletter subscribers remain until they unsubscribe. Account holders can ask us to delete their account and history at any time.</p>
      <h2>Your rights</h2>
      <p>You can ask for a copy of your data, correct it, or have it deleted. Email <a class="text-link" href="mailto:hello@lumiere-salon.com">hello@lumiere-salon.com</a> and we will respond within 30 days. If you are in California, you also have the right to opt out of any sharing of personal information for advertising — we do not do this.</p>
      <h2>Security</h2>
      <p>Passwords are stored as PBKDF2 hashes and never in plain text. Sessions expire after 30 days and can be ended by signing out. Access to the salon dashboard is limited to staff accounts.</p>
      <h2>Contact</h2>
      <p>LUMIÈRE Hair Salon, 1428 Abbot Kinney Blvd, Los Angeles, CA 90291. Email <a class="text-link" href="mailto:hello@lumiere-salon.com">hello@lumiere-salon.com</a> or call +1 (323) 555-0184.</p>
    </article>
  </div>
</section>`,
  });

export const notFoundPage = ({ user, path }) =>
  page({
    title: "Page not found",
    description: "That page could not be found at LUMIÈRE Hair Salon.",
    path,
    noindex: true,
    user,
    body: `
<section class="section">
  <div class="wrap error-page">
    <div class="code" aria-hidden="true">404</div>
    <h1>This Page Has Left the Chair</h1>
    <p class="lede" style="margin-inline:auto">The link may be old, or the page may have moved. Everything worth seeing is one click away.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:26px">
      <a class="btn" href="/">Back to home ${arrowRight}</a>
      <a class="btn btn--ghost" href="/book">Book an appointment</a>
    </div>
    <p style="margin-top:28px;font-size:.85rem;color:var(--muted)">Looking for something specific? <a class="text-link" href="/contact">Tell us</a>.</p>
  </div>
</section>`,
  });
