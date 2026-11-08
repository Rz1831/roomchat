import { page, pageHero, sectionHead } from "../layout.js";
import { arrowRight, check } from "../icons.js";
import { faqList } from "../components.js";
import { esc, money } from "../util.js";

export const giftPage = ({ faqs, user }) => `
${pageHero({
  eyebrow: "Gift cards",
  title: "Give Good Hair",
  lede: "A LUMIÈRE gift card is the rare present that is always the right size. Sent by email in seconds, valid for any service or product.",
  crumbs: [["/gift-cards", "Gift Cards"]],
})}
<section class="section">
  <div class="wrap gift-grid">
    <form class="form-card" data-gift novalidate>
      <h2 style="font-size:1.7rem;margin-bottom:6px">Choose an amount</h2>
      <p class="form-note" style="margin-bottom:16px">Cards never expire and can be topped up at the desk.</p>
      <div class="amount-grid" role="group" aria-label="Gift card amount">
        ${[75, 100, 150, 200, 300, 500].map((a, i) => `<button type="button" class="amount" data-amount="${a}" aria-pressed="${i === 2 ? "true" : "false"}">${money(a)}</button>`).join("")}
      </div>
      <div class="field">
        <label for="g-custom">Or enter a custom amount</label>
        <input id="g-custom" name="amount" type="number" min="25" max="2000" step="5" inputmode="numeric" placeholder="150">
      </div>
      <div class="form-row form-row--2">
        <div class="field">
          <label for="g-recipient">Recipient's name</label>
          <input id="g-recipient" name="recipient" required autocomplete="off" placeholder="Sophie">
          <span class="field__error" data-error-for="recipient">Please add the recipient's name.</span>
        </div>
        <div class="field">
          <label for="g-email">Recipient's email</label>
          <input id="g-email" name="recipient_email" type="email" required autocomplete="off" placeholder="sophie@example.com">
          <span class="field__error" data-error-for="recipient_email">We need a valid email to deliver the card.</span>
        </div>
      </div>
      <div class="field">
        <label for="g-sender">Your name</label>
        <input id="g-sender" name="sender" required autocomplete="name" placeholder="From Alex">
        <span class="field__error" data-error-for="sender">Please tell us who it is from.</span>
      </div>
      <div class="field">
        <label for="g-message">A short message <span style="text-transform:none;letter-spacing:0">(optional)</span></label>
        <textarea id="g-message" name="message" maxlength="220" style="min-height:90px" placeholder="For the woman who never buys anything for herself."></textarea>
      </div>
      <label class="checkbox" style="margin-bottom:18px"><input type="checkbox" name="terms" required><span>I understand the card is delivered by email and is non-refundable.</span></label>
      <button class="btn btn--block" type="submit">Purchase gift card ${arrowRight}</button>
      <p class="form-note" style="margin:12px 0 0">Demo checkout: the card is created and the code shown on screen. Connect Stripe to take payment.</p>
    </form>
    <div>
      <div class="gift-preview" aria-hidden="true">
        <div class="brand"><b>LUMIÈRE</b><span style="font-size:.55rem;letter-spacing:.4em">GIFT CARD</span></div>
        <div>
          <div class="gift-preview__amount" id="gift-preview-amount">$150</div>
          <div class="gift-preview__to" id="gift-preview-to">For someone who deserves an hour off</div>
        </div>
      </div>
      <ul class="hours-list" style="margin-top:22px">
        <li><span>Delivered</span><span>By email, instantly</span></li>
        <li><span>Valid</span><span>Any service or product</span></li>
        <li><span>Expires</span><span>Never</span></li>
        <li><span>Redeem</span><span>Online or at the desk</span></li>
      </ul>
      <div class="note-card" style="margin-top:20px"><strong>Need a physical card?</strong> We can post a letterpress card with the code inside — choose "pick up in salon" after checkout and we will have it ready.</div>
    </div>
  </div>
</section>
<section class="section section--beige">
  <div class="wrap" style="max-width:900px">
    ${sectionHead({ eyebrow: "Questions", title: "Gift Card Basics", center: true })}
    ${faqList(faqs.filter((f) => /gift|bridal|parking/i.test(f.q)).slice(0, 3))}
  </div>
</section>`;

export const giftPageHtml = (data) =>
  page({
    title: "Gift Cards",
    description: "Give the gift of healthy hair — LUMIÈRE Hair Salon gift cards from $75, delivered instantly by email and valid on any service.",
    path: "/gift-cards",
    body: giftPage(data),
    user: data.user,
  });
