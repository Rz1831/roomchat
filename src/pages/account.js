import { page } from "../layout.js";
import { arrowRight, calendar, clock, check, sparkle } from "../icons.js";
import { esc, formatDate, longDay, timeLabel, money, todayISO } from "../util.js";

export const authPage = ({ mode = "login", user = null }) => {
  const isLogin = mode === "login";
  return page({
    title: isLogin ? "Sign in" : "Create an account",
    description: isLogin
      ? "Sign in to see and manage your LUMIÈRE Hair Salon appointments."
      : "Create a LUMIÈRE account to book faster, see your appointment history and collect loyalty points.",
    path: isLogin ? "/login" : "/signup",
    user,
    noindex: true,
    body: `
<section>
  <div class="wrap auth-shell">
    <p class="eyebrow">${isLogin ? "Welcome back" : "Join the list"}</p>
    <h1>${isLogin ? "Sign In" : "Create Your Account"}</h1>
    <p class="lede">${isLogin ? "See upcoming appointments, rebook in one click and keep your loyalty points in one place." : "Booking gets faster and every completed visit earns points toward a treatment on us."}</p>
    <form class="form-card" data-auth="${isLogin ? "login" : "signup"}" novalidate>
      <div id="auth-error" class="alert alert--err" role="alert" hidden></div>
      ${isLogin ? "" : `
      <div class="field">
        <label for="a-name">Full name</label>
        <input id="a-name" name="name" autocomplete="name" required minlength="2">
        <span class="field__error" data-error-for="name">Please enter your name.</span>
      </div>
      <div class="field">
        <label for="a-phone">Phone <span style="text-transform:none;letter-spacing:0">(optional)</span></label>
        <input id="a-phone" name="phone" type="tel" autocomplete="tel">
      </div>`}
      <div class="field">
        <label for="a-email">Email</label>
        <input id="a-email" name="email" type="email" autocomplete="email" required>
        <span class="field__error" data-error-for="email">Please enter a valid email.</span>
      </div>
      <div class="field">
        <label for="a-password">Password</label>
        <input id="a-password" name="password" type="password" autocomplete="${isLogin ? "current-password" : "new-password"}" required minlength="${isLogin ? 1 : 8}">
        <span class="field__hint">${isLogin ? "" : "At least 8 characters."}</span>
        <span class="field__error" data-error-for="password">Please check your password.</span>
      </div>
      <button class="btn btn--block" type="submit">${isLogin ? "Sign in" : "Create account"} ${arrowRight}</button>
    </form>
    <p class="auth-alt">${isLogin ? `New here? <a class="text-link" href="/signup">Create an account</a>` : `Already have one? <a class="text-link" href="/login">Sign in</a>`}</p>
    <p class="auth-alt" style="margin-top:10px"><a class="text-link" href="/book">Or book without an account →</a></p>
  </div>
</section>`,
  });
};

const apptCard = (a, { past = false } = {}) => `
<div class="appt-card" data-appt-row="${a.id}">
  <div class="appt-card__date">
    <b>${new Date(a.date + "T12:00:00Z").toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" })}</b>
    <span>${new Date(a.date + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })}</span>
  </div>
  <div class="appt-card__body">
    <h3>${esc(a.service_name)}</h3>
    <p>${longDay(a.date)} at ${timeLabel(a.time)} · ${esc(a.stylist_name || "Any available stylist")}</p>
    <span class="badge-status badge-status--${esc(a.status)}">${esc(a.status)}</span>
  </div>
  <div class="appt-card__actions">
    ${!past && a.status === "confirmed" ? `<button class="mini-btn mini-btn--danger" data-cancel-appt="${a.id}" type="button">Cancel</button>` : ""}
    ${!past && a.status === "pending" ? `<button class="mini-btn mini-btn--danger" data-cancel-appt="${a.id}" type="button">Cancel</button>` : ""}
    <a class="mini-btn" href="/manage?ref=${encodeURIComponent(a.ref)}&token=${encodeURIComponent(a.manage_token)}">Manage</a>
    <a class="mini-btn" href="/book?service=${esc(a.service_slug)}">Rebook</a>
  </div>
</div>`;

export const accountPage = ({ user, upcoming, past }) => {
  const completed = past.filter((a) => a.status === "completed").length;
  const points = 100 + completed * 250;
  const nextTier = points >= 2000 ? 4000 : 2000;
  const pct = Math.min(100, Math.round((points / nextTier) * 100));

  return page({
    title: "My Account",
    description: "Your LUMIÈRE Hair Salon appointments, loyalty points and rebooking.",
    path: "/account",
    user,
    noindex: true,
    body: `
${requiresLogin}
<section class="section" style="padding-top:clamp(28px,4vw,44px)">
  <div class="wrap">
    <div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:flex-end;margin-bottom:28px">
      <div>
        <p class="eyebrow">My account</p>
        <h1 style="font-size:clamp(2.1rem,4vw,3.1rem)">Hello, ${esc(user.name.split(" ")[0])}.</h1>
        <p class="lede" style="font-size:.9rem;margin-top:8px">Everything you have booked, and the points you have earned, in one place.</p>
      </div>
      <button class="btn btn--ghost btn--sm" data-logout type="button">Sign out</button>
    </div>
    <div class="account-grid">
      <div>
        <h2 style="font-size:1.7rem;margin-bottom:14px">Upcoming Appointments</h2>
        ${upcoming.length ? upcoming.map((a) => apptCard(a)).join("") : `<div class="empty">No upcoming appointments yet. <a class="text-link" href="/book">Find your time</a>.</div>`}
        <h2 style="font-size:1.7rem;margin:36px 0 14px">History</h2>
        ${past.length ? past.slice(0, 8).map((a) => apptCard(a, { past: true })).join("") : `<div class="empty">Your first visit will show up here.</div>`}
      </div>
      <aside>
        <div class="loyalty">
          <p class="eyebrow" style="color:rgba(251,243,236,.7)">Lumière rewards</p>
          <div class="loyalty__points">${points} <small>points</small></div>
          <p style="margin-top:10px">${points >= 2000 ? "You have unlocked a complimentary scalp ritual." : `${nextTier - points} points until a complimentary scalp ritual.`}</p>
          <div class="progress-bar" aria-label="${pct}% toward next reward"><i style="width:${pct}%"></i></div>
          <p style="margin:16px 0 0;font-size:.75rem">250 points per completed visit · 100 welcome points</p>
        </div>
        <div class="note-card" style="margin-top:18px">
          <strong>How rewards work</strong>
          <p style="margin:8px 0 0;font-size:.83rem">Points are added after each completed appointment. At 2,000 points, choose any 30-minute treatment on us. Points never expire.</p>
        </div>
        <div class="note-card" style="margin-top:14px">
          <strong>Contact details</strong>
          <p style="margin:8px 0 0;font-size:.83rem">${esc(user.email)}${user.phone ? `<br>${esc(user.phone)}` : ""}</p>
        </div>
        <a class="btn btn--block" href="/book" style="margin-top:18px">Book again ${arrowRight}</a>
      </aside>
    </div>
  </div>
</section>`,
  });
};

const requiresLogin = "";
