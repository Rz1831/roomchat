import { page, pageHero } from "../layout.js";
import { arrowRight, check, clock } from "../icons.js";
import { esc, longDay, timeLabel, money, minutesToDuration } from "../util.js";

export const managePage = ({ appointment: a, user }) => page({
  title: "Manage your appointment",
  description: "Cancel or reschedule your LUMIÈRE Hair Salon appointment.",
  path: "/manage",
  user,
  noindex: true,
  body: `
${pageHero({
  eyebrow: "Your booking",
  title: `Appointment ${esc(a.ref)}`,
  lede: "Cancel or move your visit below. Free changes up to 24 hours before your appointment.",
  crumbs: [["/manage", "Manage"]],
})}
<section class="section">
  <div class="wrap" style="max-width:760px">
    <div class="form-card" data-manage data-ref="${esc(a.ref)}" data-token="${esc(a.manage_token)}" data-service-id="${a.service_id}" data-stylist-id="${a.stylist_id || ""}">
      <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:flex-start">
        <div>
          <h2 style="font-size:1.8rem;margin-bottom:6px">${esc(a.service_name)}</h2>
          <p style="color:var(--muted);font-size:.9rem;margin:0">${longDay(a.date)} at ${timeLabel(a.time)} · ${minutesToDuration(a.duration)}</p>
          <p style="color:var(--muted);font-size:.9rem;margin:4px 0 0">With ${esc(a.stylist_name || "your assigned stylist")} · ${money(a.price)}</p>
        </div>
        <span class="badge-status badge-status--${esc(a.status)}" id="manage-status">${esc(a.status)}</span>
      </div>
      ${a.notes ? `<div class="note-card" style="margin-top:18px"><strong>Your notes</strong><p style="margin:6px 0 0">${esc(a.notes)}</p></div>` : ""}
      ${a.status === "cancelled" ? `<div class="alert alert--info" style="margin-top:18px">This appointment is cancelled. <a class="text-link" href="/book">Book a new time →</a></div>` : ""}

      <hr style="border:0;border-top:1px solid var(--line);margin:26px 0">

      <div id="reschedule-block" ${a.status === "cancelled" ? "hidden" : ""}>
        <h3 style="font-family:var(--sans);font-size:.75rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:500;margin-bottom:10px">Reschedule</h3>
        <div class="form-row form-row--2">
          <div class="field">
            <label for="m-date">New date</label>
            <input id="m-date" type="date" name="date">
          </div>
          <div class="field">
            <label for="m-time">Available times</label>
            <select id="m-time" name="time" disabled><option value="">Choose a date first</option></select>
          </div>
        </div>
        <button class="btn btn--ghost btn--sm" type="button" data-manage-reschedule disabled>Move my appointment ${arrowRight}</button>
      </div>

      <div id="manage-actions" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:24px;padding-top:22px;border-top:1px solid var(--line)" ${a.status === "cancelled" ? "hidden" : ""}>
        <button class="btn btn--ghost btn--sm" type="button" data-manage-cancel>Cancel appointment</button>
        <a class="btn btn--sm" href="/contact">Need help? ${arrowRight}</a>
      </div>
      <div id="manage-message" class="alert" role="status" hidden style="margin-top:16px"></div>
    </div>
    <p class="form-note" style="text-align:center;margin-top:18px">This private link was emailed to you. Anyone with it can change this booking, so please do not forward it.</p>
  </div>
</section>`,
});
