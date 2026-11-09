// Staff dashboard: tabbed panels, table CRUD and appointment management.
export const ADMIN_JS = String.raw`
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "$" + Number(n || 0).toLocaleString("en-US");
  const toast = (m, t) => window.lumiereToast ? window.lumiereToast(m, t) : console.log(m);
  const state = {};
  let active = "overview";

  async function api(url, options = {}) {
    const res = await fetch(url, { credentials: "same-origin", ...options,
      headers: { "content-type": "application/json", ...(options.headers || {}) } });
    let data = {};
    try { data = await res.json(); } catch (e) {}
    if (!res.ok || data.ok === false) throw new Error(data.error || "Request failed");
    return data;
  }

  const thumb = (src) => src ? '<img src="' + esc(src) + '" alt="" width="40" height="40" style="width:40px;height:40px;border-radius:8px;object-fit:cover">' : "—";
  const statusPill = (s) => '<span class="badge-status badge-status--' + esc(s) + '">' + esc(s) + "</span>";

  const config = {
    appointments: {
      cols: ["Ref", "When", "Client", "Service", "Stylist", "Status"],
      row: (a) => [
        "<strong>" + esc(a.ref) + "</strong>",
        esc(a.date) + "<br><span style='color:var(--muted)'>" + esc(a.time) + "</span>",
        esc(a.client_name) + "<br><span style='color:var(--muted);font-size:.75rem'>" + esc(a.email) + "</span>",
        esc(a.service_name),
        esc(a.stylist_name || "Any"),
        statusPill(a.status),
      ],
      actions: (a) => [
        a.status !== "confirmed" && a.status !== "completed" ? ['confirm', 'Confirm', ''] : null,
        a.status !== "cancelled" && a.status !== "completed" ? ['cancel', 'Cancel', 'mini-btn--danger'] : null,
        a.status !== "completed" ? ['completed', 'Complete', ''] : null,
      ].filter(Boolean),
      entity: "appointments",
    },
    services: {
      cols: ["Service", "Category", "Price", "Duration", "Active"],
      row: (s) => [
        "<div style='display:flex;gap:10px;align-items:center'>" + thumb(s.image) + "<span>" + esc(s.name) + "</span></div>",
        esc(s.category), money(s.price), esc(s.duration) + " min", s.active ? "Yes" : "Hidden",
      ],
      entity: "services",
    },
    stylists: {
      cols: ["Stylist", "Role", "Days", "Hours", "Active"],
      row: (s) => [
        "<div style='display:flex;gap:10px;align-items:center'>" + thumb(s.photo) + "<span>" + esc(s.name) + "</span></div>",
        esc(s.role), esc(s.working_days), esc(s.start_time) + "–" + esc(s.end_time), s.active ? "Yes" : "Hidden",
      ],
      entity: "stylists",
    },
    gallery: {
      cols: ["Image", "Category", "Caption", "Order"],
      row: (g) => [thumb(g.image), esc(g.category), esc(g.caption), esc(g.sort_order)],
      entity: "gallery",
    },
    blog: {
      cols: ["Title", "Category", "Published", "Slug"],
      row: (p) => [esc(p.title), esc(p.category), esc(p.published_at), esc(p.slug)],
      entity: "blog",
    },
    testimonials: {
      cols: ["Client", "Rating", "Testimonial", "Visible"],
      row: (t) => [esc(t.name), esc(t.rating) + " ★", "<span style='max-width:340px;display:inline-block'>" + esc(t.text.slice(0, 110)) + "…</span>", t.approved ? "Yes" : "Hidden"],
      entity: "testimonials",
      extra: (t) => [['toggle-approved', t.approved ? "Hide" : "Approve", ""]],
    },
    giftcards: {
      cols: ["Code", "Amount", "Recipient", "Sender", "Status", "Created"],
      row: (g) => [esc(g.code), money(g.amount), esc(g.recipient), esc(g.sender), esc(g.status), esc(String(g.created_at).slice(0, 10))],
      entity: "gift_cards",
      extra: (g) => [['toggle-gift', g.status === "active" ? "Disable" : "Enable", ""]],
    },
    messages: { entity: "messages" },
    subscribers: { entity: "subscribers" },
    hours: { entity: "hours" },
  };

  function renderRows(entity) {
    const cfg = config[entity];
    const tbody = document.getElementById(entity + "-rows");
    if (!cfg || !tbody) return;
    const items = state[entity] || [];
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="' + (cfg.cols.length + 1) + '"><div class="empty">Nothing here yet.</div></td></tr>';
      return;
    }
    tbody.innerHTML = items.map((item) => {
      const acts = [];
      if (cfg.actions) cfg.actions(item).forEach(([act, label, cls]) => {
        acts.push('<button class="mini-btn ' + cls + '" data-act="' + act + '" data-id="' + esc(item.id) + '">' + label + "</button>");
      });
      if (cfg.extra) cfg.extra(item).forEach(([act, label, cls]) => {
        acts.push('<button class="mini-btn ' + cls + '" data-act="' + act + '" data-id="' + esc(item.id) + '">' + label + "</button>");
      });
      if (entity !== "appointments" && entity !== "messages") {
        acts.push('<button class="mini-btn" data-act="edit" data-id="' + esc(item.id) + '" data-entity="' + entity + '">Edit</button>');
        acts.push('<button class="mini-btn mini-btn--danger" data-act="delete" data-id="' + esc(item.id) + '" data-entity="' + entity + '">Delete</button>');
      }
      return "<tr>" + cfg.row(item).map((c) => "<td>" + c + "</td>").join("") + "<td><div class='row-actions'>" + acts.join("") + "</div></td></tr>";
    }).join("");
  }

  async function load(entity) {
    const cfg = config[entity];
    if (!cfg) return;
    try {
      if (entity === "appointments") {
        const date = $("#admin-appt-date") ? $("#admin-appt-date").value : "";
        const data = await api("/api/admin/appointments" + (date ? "?date=" + encodeURIComponent(date) : ""));
        state.appointments = data.appointments;
        renderRows("appointments");
      } else if (entity === "services" || entity === "stylists" || entity === "gallery" || entity === "blog" || entity === "testimonials" || entity === "giftcards") {
        const data = await api("/api/admin/" + cfg.entity);
        state[entity] = data.items;
        renderRows(entity);
      } else if (entity === "messages") {
        const data = await api("/api/admin/messages");
        state.messages = data.messages;
        renderMessages(data.messages);
      } else if (entity === "subscribers") {
        const data = await api("/api/admin/subscribers");
        state.subscribers = data.subscribers;
        renderSubscribers(data.subscribers);
      } else if (entity === "hours") {
        const data = await api("/api/admin/hours");
        state.hours = data.hours;
        renderHours(data.hours);
      }
    } catch (err) {
      toast(err.message, "err");
    }
  }

  async function loadHolidays() {
    try {
      const data = await api("/api/admin/holidays");
      const tbody = document.getElementById("holidays-rows");
      tbody.innerHTML = data.items.length
        ? data.items.map((h) => "<tr><td>" + esc(h.date) + "</td><td>" + esc(h.reason) + "</td><td><div class='row-actions'><button class='mini-btn mini-btn--danger' data-act='delete-holiday' data-id='" + esc(h.date) + "'>Delete</button></div></td></tr>").join("")
        : "<tr><td colspan='3'><div class='empty'>No closures scheduled.</div></td></tr>";
    } catch (err) { toast(err.message, "err"); }
  }

  function renderMessages(list) {
    const wrap = document.getElementById("messages-list");
    const count = document.getElementById("message-count");
    if (count) count.textContent = list.filter((m) => m.status === "new").length + " unread";
    if (!list.length) { wrap.innerHTML = '<div class="empty">Inbox is empty.</div>'; return; }
    wrap.innerHTML = list.map((m) => '<article class="admin-form" style="margin:0">' +
      '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">' +
      '<div><strong style="font-weight:500">' + esc(m.name) + '</strong> <span style="color:var(--muted);font-size:.8rem">&lt;' + esc(m.email) + "&gt;" + (m.phone ? " · " + esc(m.phone) : "") + "</span></div>" +
      '<span class="badge-status badge-status--' + (m.status === "new" ? "pending" : m.status === "read" ? "confirmed" : "completed") + '">' + esc(m.status) + "</span></div>" +
      '<p style="margin:10px 0;font-size:.9rem">' + esc(m.message) + "</p>" +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      (m.status !== "read" ? '<button class="mini-btn" data-act="read-message" data-id="' + m.id + '">Mark read</button>' : "") +
      '<a class="mini-btn" href="mailto:' + esc(m.email) + '?subject=Re%3A%20your%20message%20to%20LUMI%C3%88RE">Reply by email</a>' +
      '<button class="mini-btn mini-btn--danger" data-act="delete-message" data-id="' + m.id + '">Delete</button>' +
      '<span style="margin-left:auto;font-size:.72rem;color:var(--muted)">' + esc(String(m.created_at).slice(0, 16)) + "</span></div></article>").join("");
  }

  function renderSubscribers(list) {
    const tbody = document.getElementById("subscribers-rows");
    tbody.innerHTML = list.length
      ? list.map((s) => "<tr><td>" + esc(s.email) + "</td><td>" + esc(String(s.created_at).slice(0, 10)) + "</td><td><button class='mini-btn mini-btn--danger' data-act='delete-subscriber' data-id='" + s.id + "'>Remove</button></td></tr>").join("")
      : "<tr><td colspan='3'><div class='empty'>No subscribers yet.</div></td></tr>";
  }

  function renderHours(hours) {
    const form = document.getElementById("hours-form");
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    form.innerHTML = "<div class='table-wrap'><table style='min-width:520px'><thead><tr><th>Day</th><th>Opens</th><th>Closes</th><th>Closed</th></tr></thead><tbody>" +
      hours.map((h) => "<tr data-day='" + h.day + "'><td>" + days[h.day] + "</td>" +
        "<td><input type='time' name='open-" + h.day + "' value='" + esc(h.open) + "' style='min-height:36px;padding:6px 8px'></td>" +
        "<td><input type='time' name='close-" + h.day + "' value='" + esc(h.close) + "' style='min-height:36px;padding:6px 8px'></td>" +
        "<td><input type='checkbox' name='closed-" + h.day + "' " + (h.closed ? "checked" : "") + " style='width:18px;height:18px;min-height:0'></td></tr>").join("") +
      "</tbody></table></div>";
  }

  async function loadOverview() {
    try {
      const data = await api("/api/admin/summary");
      const stats = data.stats || {};
      document.getElementById("stat-today").textContent = stats.today ?? 0;
      document.getElementById("stat-revenue").textContent = money(stats.revenue);
      document.getElementById("stat-clients").textContent = stats.new_clients ?? 0;
      document.getElementById("stat-pending").textContent = stats.pending ?? 0;
      const emailMode = document.getElementById("email-mode");
      if (emailMode) emailMode.textContent = data.email_mode;
      document.getElementById("today-rows").innerHTML = data.today.length
        ? data.today.map((a) => "<tr><td>" + esc(a.time) + "</td><td>" + esc(a.client_name) + "</td><td>" + esc(a.service_name) + "</td><td>" + esc(a.stylist_name || "Any") + "</td><td>" + statusPill(a.status) + "</td><td><div class='row-actions'>" +
          (a.status !== "confirmed" ? "<button class='mini-btn' data-act='confirm' data-id='" + a.id + "'>Confirm</button>" : "") +
          (a.status !== "cancelled" ? "<button class='mini-btn mini-btn--danger' data-act='cancel' data-id='" + a.id + "'>Cancel</button>" : "") +
          "</div></td></tr>").join("")
        : "<tr><td colspan='6'><div class='empty'>No appointments today.</div></td></tr>";
    } catch (err) { toast(err.message, "err"); }
  }

  /* tabs */
  function activate(name) {
    active = name;
    document.querySelectorAll("[data-admin-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.adminTab === name)));
    document.querySelectorAll(".admin-panel").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === name));
    if (name === "overview") loadOverview();
    else if (name === "holidays") loadHolidays();
    else load(name);
    const addBtn = document.querySelector('[data-panel="' + name + '"] [data-new]');
    if (addBtn) addBtn.hidden = name === "appointments";
  }
  document.querySelectorAll("[data-admin-tab]").forEach((btn) => btn.addEventListener("click", () => activate(btn.dataset.adminTab)));
  document.querySelectorAll("[data-goto]").forEach((link) => link.addEventListener("click", (e) => {
    e.preventDefault(); activate(link.dataset.goto);
  }));

  /* form open / submit */
  document.addEventListener("click", async (e) => {
    const newBtn = e.target.closest("[data-new]");
    if (newBtn) {
      const entity = newBtn.dataset.new;
      const form = document.querySelector('[data-admin-form="' + entity + '"]');
      if (form) {
        form.reset();
        form.hidden = false;
        const id = form.querySelector('[name="id"]');
        if (id) id.value = "";
        form.scrollIntoView({ behavior: "smooth", block: "center" });
        const first = form.querySelector("input:not([type=hidden])");
        if (first) first.focus();
      }
      return;
    }
    const cancel = e.target.closest("[data-form-cancel]");
    if (cancel) { const form = cancel.closest("form"); form.hidden = true; form.reset(); return; }

    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    try {
      if (["confirm", "cancel", "completed"].includes(act)) {
        await api("/api/admin/appointments/" + id, { method: "PATCH", body: JSON.stringify({ status: act }) });
        toast("Appointment " + (act === "completed" ? "completed" : act + "ed") + ".", "ok");
        load("appointments"); loadOverview();
      } else if (act === "edit") {
        const entity = btn.dataset.entity;
        const form = document.querySelector('[data-admin-form="' + entity + '"]');
        const item = (state[entity] || []).find((x) => String(x.id) === String(id));
        if (!form || !item) return;
        form.hidden = false;
        Object.entries(item).forEach(([key, value]) => {
          const input = form.querySelector('[name="' + key + '"]');
          if (input) input.value = value === null ? "" : value;
        });
        form.querySelector('[name="id"]').value = item.id;
        form.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (act === "delete") {
        if (!confirm("Delete this item permanently?")) return;
        await api("/api/admin/" + btn.dataset.entity + "/" + id, { method: "DELETE" });
        toast("Deleted.", "ok");
        load(btn.dataset.entity);
      } else if (act === "delete-holiday") {
        await api("/api/admin/holidays/" + encodeURIComponent(id), { method: "DELETE" });
        toast("Closure removed.", "ok");
        loadHolidays();
      } else if (act === "toggle-approved") {
        const item = (state.testimonials || []).find((x) => String(x.id) === String(id));
        await api("/api/admin/testimonials/" + id, { method: "PUT", body: JSON.stringify({ ...item, approved: item.approved ? 0 : 1 }) });
        toast("Visibility updated.", "ok");
        load("testimonials");
      } else if (act === "toggle-gift") {
        const item = (state.giftcards || []).find((x) => String(x.id) === String(id));
        await api("/api/admin/giftcards/" + id, { method: "PUT", body: JSON.stringify({ ...item, status: item.status === "active" ? "disabled" : "active" }) });
        toast("Gift card updated.", "ok");
        load("giftcards");
      } else if (act === "read-message") {
        await api("/api/admin/messages/" + id, { method: "PATCH", body: JSON.stringify({ status: "read" }) });
        load("messages");
      } else if (act === "delete-message") {
        if (!confirm("Delete this message?")) return;
        await api("/api/admin/messages/" + id, { method: "DELETE" });
        load("messages");
      } else if (act === "delete-subscriber") {
        if (!confirm("Remove this subscriber?")) return;
        await api("/api/admin/subscribers/" + id, { method: "DELETE" });
        load("subscribers");
      }
    } catch (err) { toast(err.message, "err"); }
  });

  document.querySelectorAll("[data-admin-form]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const entity = form.dataset.adminForm;
      const payload = {};
      new FormData(form).forEach((value, key) => { if (key !== "id") payload[key] = value; });
      const id = form.querySelector('[name="id"]') ? form.querySelector('[name="id"]').value : "";
      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      try {
        if (entity === "holidays") {
          await api("/api/admin/holidays", { method: "POST", body: JSON.stringify(payload) });
          loadHolidays();
        } else if (id) {
          await api("/api/admin/" + entity + "/" + id, { method: "PUT", body: JSON.stringify(payload) });
          load(entity);
        } else {
          await api("/api/admin/" + entity, { method: "POST", body: JSON.stringify(payload) });
          load(entity);
        }
        toast("Saved.", "ok");
        form.reset();
        form.hidden = true;
      } catch (err) { toast(err.message, "err"); }
      finally { if (btn) btn.disabled = false; }
    });
  });

  const apptDate = document.getElementById("admin-appt-date");
  if (apptDate) apptDate.addEventListener("change", () => load("appointments"));

  const saveHours = document.getElementById("save-hours");
  if (saveHours) saveHours.addEventListener("click", async () => {
    const hours = (state.hours || []).map((h) => ({
      day: h.day,
      open: (document.querySelector('[name="open-' + h.day + '"]') || {}).value || h.open,
      close: (document.querySelector('[name="close-' + h.day + '"]') || {}).value || h.close,
      closed: !!(document.querySelector('[name="closed-' + h.day + '"]') || {}).checked,
    }));
    try {
      await api("/api/admin/hours", { method: "PUT", body: JSON.stringify({ hours }) });
      toast("Opening hours saved.", "ok");
      load("hours");
    } catch (err) { toast(err.message, "err"); }
  });

  loadOverview();
})();
`;
