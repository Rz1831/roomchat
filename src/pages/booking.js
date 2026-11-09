import { page } from "../layout.js";
import { arrowRight, arrowLeft, check, calendar, clock, phone, pin } from "../icons.js";
import { esc, money, minutesToDuration, timeLabel } from "../util.js";

export const bookingPage = ({ services, stylists, user, preselect = "", today = "", status = null }) => {
  const pre = services.find((s) => s.slug === preselect);
  const closed = Boolean(status && status.closed);
  const closedNotice = closed
    ? `<div class="closure-note" role="alert">
        <p class="eyebrow" style="justify-content:flex-start">Temporarily closed</p>
        <h2 style="margin-bottom:10px">${esc(status.message || "We are closed until further notice.")}</h2>
        <p>Online booking is paused while we are away. Call the salon on +1 (323) 555-0184 and we will look after you the moment we reopen.</p>
      </div>`
    : "";
  const body = `
<section class="section" style="padding-top:clamp(28px,4vw,44px)">
  <div class="wrap">
    <div class="booking">
      <div>
        <p class="eyebrow">Book an appointment</p>
        <h1 style="font-size:clamp(2.2rem,4.4vw,3.4rem);margin-bottom:10px">Your Chair Is Waiting</h1>
        <p class="lede" style="font-size:.92rem;margin-bottom:26px">Five short steps. Free cancellation up to 24 hours before. You will get a confirmation email with a link to change anything.</p>

        ${closedNotice}
        <div class="progress" id="booking-progress" aria-label="Booking progress" ${closed ? "hidden" : ""}>
          ${["Service", "Stylist", "Date & time", "Details", "Review"].map((label, i) => `
            <span class="progress__step ${i === 0 ? "is-active" : ""}" data-step-label="${i + 1}">
              <span class="progress__dot">${i + 1}</span><span>${label}</span>
            </span>${i < 4 ? '<span class="progress__line" aria-hidden="true"></span>' : ""}`).join("")}
        </div>

        <form id="booking-form" novalidate ${closed ? "hidden" : ""}>
          <!-- 1: service -->
          <div class="wizard-step is-active" data-step="1">
            <h2>What can we do for you?</h2>
            <p>Choose one service to start. You can add a treatment during your visit.</p>
            <div class="option-list">
              ${services.map((s) => `
              <button type="button" class="option" data-service-id="${s.id}" data-service-name="${esc(s.name)}" data-service-price="${s.price}" data-service-duration="${s.duration}" data-service-slug="${esc(s.slug)}" aria-pressed="false">
                <img src="${esc(s.image)}" alt="" width="52" height="52" loading="lazy">
                <span class="option__body"><strong>${esc(s.name)}</strong><span>${esc(s.category)} · ${minutesToDuration(s.duration)}</span></span>
                <span class="option__price">${money(s.price)}</span>
                <span class="option__check" aria-hidden="true">✓</span>
              </button>`).join("")}
            </div>
            <div class="wizard-actions">
              <span></span>
              <button type="button" class="btn" data-next="2" disabled>Continue ${arrowRight}</button>
            </div>
          </div>

          <!-- 2: stylist -->
          <div class="wizard-step" data-step="2">
            <h2>Who would you like?</h2>
            <p>Pick a specialist, or let us match you with whoever is best for your hair that day.</p>
            <div class="stylist-grid">
              <button type="button" class="stylist-pick" data-stylist-id="" data-stylist-name="Any available stylist" aria-pressed="true">
                <span style="width:64px;height:64px;border-radius:50%;background:var(--beige);display:grid;place-items:center;color:var(--terracotta)">${check}</span>
                <strong>Any stylist</strong>
                <span>First available</span>
              </button>
              ${stylists.map((s) => `
              <button type="button" class="stylist-pick" data-stylist-id="${s.id}" data-stylist-name="${esc(s.name)}" aria-pressed="false">
                <img src="${esc(s.photo)}" alt="" width="64" height="64" loading="lazy">
                <strong>${esc(s.name)}</strong>
                <span>${esc(s.role)}</span>
              </button>`).join("")}
            </div>
            <div class="wizard-actions">
              <button type="button" class="btn btn--ghost" data-back="1">${arrowLeft} Back</button>
              <button type="button" class="btn" data-next="3">Continue ${arrowRight}</button>
            </div>
          </div>

          <!-- 3: date + time -->
          <div class="wizard-step" data-step="3">
            <h2>Pick a day and time</h2>
            <p id="slot-subtitle">Availability is live — booked slots are hidden.</p>
            <div class="calendar" id="calendar">
              <div class="calendar__head">
                <button type="button" class="slider-btn" data-cal-prev aria-label="Previous month">‹</button>
                <strong id="cal-label">…</strong>
                <button type="button" class="slider-btn" data-cal-next aria-label="Next month">›</button>
              </div>
              <div class="calendar__grid" id="cal-grid"></div>
            </div>
            <div id="slots-wrap">
              <div class="slots" id="slots" role="group" aria-label="Available times"></div>
              <p class="slots-empty" id="slots-empty" hidden>No times left on this day. Try another date.</p>
              <p class="slots-empty" id="slots-closed" hidden>The salon is closed on this day.</p>
            </div>
            <div class="wizard-actions">
              <button type="button" class="btn btn--ghost" data-back="2">${arrowLeft} Back</button>
              <button type="button" class="btn" data-next="4" disabled>Continue ${arrowRight}</button>
            </div>
          </div>

          <!-- 4: details -->
          <div class="wizard-step" data-step="4">
            <h2>Your details</h2>
            <p>We use these only for your appointment and the confirmation email.</p>
            <div class="form-row form-row--2">
              <div class="field">
                <label for="b-name">Full name</label>
                <input id="b-name" name="client_name" autocomplete="name" required value="${user ? esc(user.name) : ""}" placeholder="Your name">
                <span class="field__error" data-error-for="client_name">Please enter your name.</span>
              </div>
              <div class="field">
                <label for="b-email">Email</label>
                <input id="b-email" name="email" type="email" autocomplete="email" required value="${user ? esc(user.email) : ""}" placeholder="you@example.com">
                <span class="field__error" data-error-for="email">Please enter a valid email.</span>
              </div>
            </div>
            <div class="field">
              <label for="b-phone">Phone</label>
              <input id="b-phone" name="phone" type="tel" autocomplete="tel" required value="${user?.phone ? esc(user.phone) : ""}" placeholder="+1 (323) 555-0100">
              <span class="field__error" data-error-for="phone">Please enter a phone number.</span>
            </div>
            <div class="field">
              <label for="b-notes">Anything we should know? <span style="text-transform:none;letter-spacing:0">(optional)</span></label>
              <textarea id="b-notes" name="notes" style="min-height:90px" placeholder="Hair history, allergies, a photo you love, or just how you like your coffee."></textarea>
            </div>
            <label class="checkbox"><input type="checkbox" name="consent" required><span>I agree to the 24-hour cancellation policy and to LUMIÈRE storing these details to manage my appointment.</span></label>
            <span class="field__error" data-error-for="consent" style="margin-top:6px">Please accept the cancellation policy.</span>
            <div class="wizard-actions">
              <button type="button" class="btn btn--ghost" data-back="3">${arrowLeft} Back</button>
              <button type="button" class="btn" data-next="5">Review booking ${arrowRight}</button>
            </div>
          </div>

          <!-- 5: review -->
          <div class="wizard-step" data-step="5">
            <h2>One last look</h2>
            <p>Check the details, then we will hold the chair and send your confirmation.</p>
            <div class="review-block"><h3>Service</h3><p id="review-service">—</p></div>
            <div class="review-block"><h3>Stylist</h3><p id="review-stylist">—</p></div>
            <div class="review-block"><h3>Date & time</h3><p id="review-when">—</p></div>
            <div id="review-details" class="review-block" hidden><h3>Details</h3><p id="review-contact"></p></div>
            <div id="booking-error" class="alert alert--err" role="alert" hidden></div>
            <div class="wizard-actions">
              <button type="button" class="btn btn--ghost" data-back="3">${arrowLeft} Change date</button>
              <button type="submit" class="btn" id="confirm-booking">Confirm booking ${arrowRight}</button>
            </div>
          </div>
        </form>

        <div id="booking-success" class="confirmation" hidden>
          <div class="confirmation__icon">${check}</div>
          <p class="eyebrow" style="justify-content:center">You're booked</p>
          <h2 id="success-title">See you soon.</h2>
          <p class="lede" style="margin-inline:auto" id="success-text">A confirmation is on its way to your inbox.</p>
          <div class="ref-pill"><span>Reference</span><strong id="success-ref">—</strong></div>
          <div class="review-block" style="text-align:left" id="success-summary"></div>
          <div class="confirmation__actions">
            <a class="btn" href="/account">My appointments ${arrowRight}</a>
            <a class="btn btn--ghost" id="success-manage" href="#">Manage this booking</a>
          </div>
          <p class="form-note" style="margin-top:20px">Need to change something? Use the link above or the one in your email. Free up to 24 hours before.</p>
        </div>
      </div>

      <aside class="summary-card" aria-label="Booking summary">
        <h3>Your Appointment</h3>
        <div class="summary-line"><span>Service</span><strong id="sum-service">Not chosen</strong></div>
        <div class="summary-line"><span>Stylist</span><strong id="sum-stylist">Any available</strong></div>
        <div class="summary-line"><span>Date</span><strong id="sum-date">Not chosen</strong></div>
        <div class="summary-line"><span>Time</span><strong id="sum-time">Not chosen</strong></div>
        <div class="summary-line"><span>Duration</span><strong id="sum-duration">—</strong></div>
        <div class="summary-total"><span>From</span><strong id="sum-price">$0</strong></div>
        <ul style="display:flex;flex-direction:column;gap:10px;margin-top:20px;font-size:.8rem;color:var(--muted)">
          <li style="display:flex;gap:8px">${clock}<span>Free cancellation up to 24 hours before</span></li>
          <li style="display:flex;gap:8px">${pin}<span>1428 Abbot Kinney Blvd, Venice</span></li>
          <li style="display:flex;gap:8px">${phone}<span>+1 (323) 555-0184</span></li>
        </ul>
      </aside>
    </div>
  </div>
</section>
<script type="application/json" id="booking-data">${JSON.stringify({
    today,
    services: services.map((s) => ({ id: s.id, slug: s.slug, name: s.name, price: s.price, duration: s.duration })),
    stylists: stylists.map((s) => ({ id: s.id, name: s.name })),
    preselect,
  })}</script>`;

  return page({
    title: "Book an Appointment",
    description: "Book a cut, colour, treatment or extensions at LUMIÈRE Hair Salon. Live availability, instant confirmation and free cancellation up to 24 hours.",
    path: "/book",
    body,
    user,
    noindex: true,
  });
};
