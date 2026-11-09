import { page } from "../layout.js";
import { arrowRight, calendar, check } from "../icons.js";

const NAV = [
  ["overview", "Overview"],
  ["appointments", "Appointments"],
  ["services", "Services"],
  ["stylists", "Stylists"],
  ["gallery", "Gallery"],
  ["blog", "Journal"],
  ["testimonials", "Testimonials"],
  ["giftcards", "Gift cards"],
  ["messages", "Inbox"],
  ["subscribers", "Subscribers"],
  ["hours", "Hours & holidays"],
];

const field = (name, label, type = "text", extra = "") => {
  const isOptions = type === "select" && extra.trim().startsWith("<");
  const attrs = isOptions ? "" : extra;
  return `
<div class="field">
  <label for="f-${name}">${label}</label>
  ${type === "textarea"
    ? `<textarea id="f-${name}" name="${name}" ${attrs}></textarea>`
    : type === "select"
      ? `<select id="f-${name}" name="${name}" ${attrs}>${isOptions ? extra : ""}</select>`
      : `<input id="f-${name}" name="${name}" type="${type}" ${attrs}>`}
</div>`;
};

const formFor = (entity, title, fields, { wide = false } = {}) => `
<form class="admin-form" data-admin-form="${entity}" hidden>
  <h3>${title}</h3>
  <input type="hidden" name="id">
  <div class="grid ${wide ? "grid--2" : "grid--2"}">${fields.join("")}</div>
  <div style="display:flex;gap:8px;margin-top:8px">
    <button class="btn btn--sm" type="submit">Save</button>
    <button class="btn btn--ghost btn--sm" type="button" data-form-cancel>Cancel</button>
  </div>
</form>`;

const tablePanel = (id, title, columns, form = "") => `
<section class="admin-panel" data-panel="${id}" role="tabpanel" aria-labelledby="tab-${id}">
  <div class="admin-toolbar">
    <h2>${title}</h2>
    <div class="admin-toolbar__actions">
      ${id === "appointments" ? `<input type="date" id="admin-appt-date" aria-label="Filter appointments by date" style="width:auto;min-height:40px;padding:8px 12px">` : `<button class="btn btn--sm" type="button" data-new="${id}">+ Add new</button>`}
    </div>
  </div>
  ${form}
  <div class="table-wrap">
    <table>
      <thead><tr>${columns.map((c) => `<th>${c}</th>`).join("")}<th>Actions</th></tr></thead>
      <tbody id="${id}-rows"><tr><td colspan="${columns.length + 1}"><div class="skeleton" style="height:38px"></div></td></tr></tbody>
    </table>
  </div>
</section>`;

export const adminPage = ({ user }) => page({
  title: "Salon Dashboard",
  description: "LUMIÈRE staff dashboard.",
  path: "/admin",
  user,
  noindex: true,
  script: ["app", "admin"],
  body: `
<section class="section" style="padding-top:clamp(24px,4vw,40px)">
  <div class="wrap">
    <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:14px;margin-bottom:26px">
      <div>
        <p class="eyebrow">Staff dashboard</p>
        <h1 style="font-size:clamp(2rem,4vw,2.9rem)">Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${user.name.split(" ")[0]}.</h1>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a class="btn btn--ghost btn--sm" href="/" target="_blank" rel="noopener">View site ${arrowRight}</a>
        <button class="btn btn--ghost btn--sm" type="button" data-logout>Sign out</button>
      </div>
    </div>

    <div class="admin-shell">
      <nav class="admin-nav" role="tablist" aria-label="Dashboard sections">
        ${NAV.map(([id, label], i) => `<button role="tab" id="tab-${id}" aria-controls="panel-${id}" aria-selected="${i === 0}" data-admin-tab="${id}">${label}</button>`).join("")}
      </nav>
      <div>
        <section class="admin-panel is-active" data-panel="overview" role="tabpanel" aria-labelledby="tab-overview">
          <div class="stat-grid" style="margin-bottom:22px">
            <div class="stat"><span>Today</span><b id="stat-today">–</b><small>appointments</small></div>
            <div class="stat"><span>This week</span><b id="stat-revenue">–</b><small>booked revenue</small></div>
            <div class="stat"><span>New clients</span><b id="stat-clients">–</b><small>in the last 30 days</small></div>
            <div class="stat"><span>Pending</span><b id="stat-pending">–</b><small>need confirmation</small></div>
          </div>
          <div class="admin-toolbar"><h2>Today's Schedule</h2><a class="mini-btn" href="/admin" data-goto="appointments">See all</a></div>
          <div class="table-wrap"><table><thead><tr><th>Time</th><th>Client</th><th>Service</th><th>Stylist</th><th>Status</th><th>Actions</th></tr></thead><tbody id="today-rows"></tbody></table></div>
          <div style="display:grid;gap:14px;grid-template-columns:1fr;margin-top:22px" class="admin-notes">
            <div class="note-card"><strong>Running the desk</strong><p style="margin:8px 0 0;font-size:.83rem">Confirm pending requests before the end of the day. Cancellations inside 24 hours are charged 50% — the policy is on every confirmation email.</p></div>
            <div class="note-card"><strong>Email delivery</strong><p style="margin:8px 0 0;font-size:.83rem" id="email-mode">Checking email provider…</p></div>
          </div>
        </section>

        ${tablePanel("appointments", "Appointments", ["Ref", "Date", "Client", "Service", "Stylist", "Status"])}

        ${tablePanel("services", "Services", ["Name", "Category", "Price", "Duration", "Active"],
          formFor("services", "Service", [
            field("name", "Name", "text", "required"),
            field("slug", "Slug", "text", "required"),
            field("category", "Category", "text", "required"),
            field("price", "Price (USD)", "number", "required min='0'"),
            field("duration", "Duration (minutes)", "number", "required min='15'"),
            field("image", "Image URL", "url", "required"),
            field("short_description", "Card description", "text", "required"),
            field("description", "Full description", "textarea", "required"),
            field("sort_order", "Sort order", "number"),
            field("active", "Active", "select", "<option value='1'>Active</option><option value='0'>Hidden</option>"),
          ]))}

        ${tablePanel("stylists", "Stylists", ["Name", "Role", "Working days", "Hours", "Active"],
          formFor("stylists", "Stylist", [
            field("name", "Name", "text", "required"),
            field("role", "Role", "text", "required"),
            field("photo", "Photo URL", "url", "required"),
            field("specialties", "Specialties (comma separated)", "text", "required"),
            field("bio", "Bio", "textarea", "required"),
            field("working_days", "Working days (0=Sun … 6=Sat)", "text", "required"),
            field("start_time", "Start", "time", "required"),
            field("end_time", "End", "time", "required"),
            field("sort_order", "Sort order", "number"),
            field("active", "Active", "select", "<option value='1'>Active</option><option value='0'>Hidden</option>"),
          ]))}

        ${tablePanel("gallery", "Gallery", ["Image", "Category", "Caption", "Order"],
          formFor("gallery", "Gallery image", [
            field("image", "Image URL", "url", "required"),
            field("category", "Category", "select", "<option>Cuts</option><option>Color</option><option>Treatments</option><option>Extensions</option>"),
            field("caption", "Caption", "text", "required"),
            field("sort_order", "Sort order", "number"),
          ], { wide: true }))}

        ${tablePanel("blog", "Journal posts", ["Title", "Category", "Published", "Slug"],
          formFor("blog", "Journal post", [
            field("title", "Title", "text", "required"),
            field("slug", "Slug", "text", "required"),
            field("category", "Category", "text", "required"),
            field("published_at", "Published date", "date", "required"),
            field("cover_image", "Cover image URL", "url", "required"),
            field("excerpt", "Excerpt", "textarea", "required"),
            field("content", "Content (HTML)", "textarea", "required"),
          ]))}

        ${tablePanel("testimonials", "Testimonials", ["Name", "Rating", "Text", "Approved"],
          formFor("testimonials", "Testimonial", [
            field("name", "Client name", "text", "required"),
            field("rating", "Rating", "number", "min='1' max='5' required"),
            field("photo", "Photo URL", "url"),
            field("text", "Testimonial", "textarea", "required"),
            field("approved", "Visible on site", "select", "<option value='1'>Approved</option><option value='0'>Hidden</option>"),
          ]))}

        ${tablePanel("giftcards", "Gift cards", ["Code", "Amount", "Recipient", "Sender", "Status", "Created"],
          formFor("giftcards", "Gift card", [
            field("amount", "Amount", "number", "required min='25'"),
            field("recipient", "Recipient", "text", "required"),
            field("recipient_email", "Recipient email", "email", "required"),
            field("sender", "Sender", "text", "required"),
            field("message", "Message", "textarea"),
          ]))}

        <section class="admin-panel" data-panel="messages" role="tabpanel" aria-labelledby="tab-messages">
          <div class="admin-toolbar"><h2>Inbox</h2><span class="form-note" id="message-count"></span></div>
          <div id="messages-list" style="display:flex;flex-direction:column;gap:12px"></div>
        </section>

        <section class="admin-panel" data-panel="subscribers" role="tabpanel" aria-labelledby="tab-subscribers">
          <div class="admin-toolbar">
            <h2>Newsletter subscribers</h2>
            <div class="admin-toolbar__actions">
              <a class="btn btn--sm btn--ghost" href="/api/admin/subscribers.csv" download>Export CSV</a>
            </div>
          </div>
          <div class="table-wrap"><table><thead><tr><th>Email</th><th>Joined</th><th></th></tr></thead><tbody id="subscribers-rows"></tbody></table></div>
        </section>

        <section class="admin-panel" data-panel="hours" role="tabpanel" aria-labelledby="tab-hours">
          <div class="admin-toolbar"><h2>Opening hours</h2><button class="btn btn--sm" type="button" id="save-hours">Save hours</button></div>
          <form id="hours-form" class="admin-form"></form>
          <div class="admin-toolbar" style="margin-top:26px"><h2>Holidays & closures</h2></div>
          <form class="admin-form" data-admin-form="holidays">
            <div class="grid grid--2">
              ${field("date", "Date", "date", "required")}
              ${field("reason", "Reason", "text", "required placeholder='Staff training'")}
            </div>
            <button class="btn btn--sm" type="submit">Add closure</button>
          </form>
          <div class="table-wrap"><table><thead><tr><th>Date</th><th>Reason</th><th></th></tr></thead><tbody id="holidays-rows"></tbody></table></div>
        </section>
      </div>
    </div>
  </div>
</section>`,
});
