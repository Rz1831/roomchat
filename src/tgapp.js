// Telegram Mini App panel — mobile-first admin for the salon.
export const TG_JS = String.raw`
(function () {
  "use strict";
  const tg = window.Telegram && window.Telegram.WebApp;
  try { if (tg) { tg.ready(); tg.expand(); } } catch (e) {}
  const initData = (tg && tg.initData) ||
    new URLSearchParams((location.hash || "").replace(/^#/, "")).get("tgWebAppData") || "";

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "$" + Number(n || 0).toLocaleString("en-US");
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const main = document.getElementById("tg-main");
  const state = { data: null, tab: "appointments", date: "", pending: null };

  function toast(message, bad) {
    let el = document.getElementById("tg-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "tg-toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.className = "tg-toast is-on" + (bad ? " is-bad" : "");
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.className = "tg-toast"; }, 3200);
  }

  async function api(path, opts) {
    opts = opts || {};
    const headers = { "x-telegram-init-data": initData };
    let body;
    if (opts.form) body = opts.form;
    else if (opts.body) { headers["content-type"] = "application/json"; body = JSON.stringify(opts.body); }
    const res = await fetch(path, { method: opts.method || (body ? "POST" : "GET"), headers, body });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) throw new Error(data.error || "Request failed");
    return data;
  }

  /* ---------- tricks ---------- */
  function pill(status) {
    return '<span class="tpill tpill--' + esc(status) + '">' + esc(status) + "</span>";
  }

  function apptCards(list) {
    if (!list || !list.length) return '<p class="tmuted">Nothing booked.</p>';
    return list.map((a) => (
      '<article class="tcard">' +
        '<div class="trow"><strong>' + esc(a.time) + " · " + esc(a.client_name) + "</strong>" + pill(a.status) + "</div>" +
        "<p>" + esc(a.service_name) + (a.stylist_name ? " · " + esc(a.stylist_name) : "") + "</p>" +
        '<p class="tmuted">' + esc(a.phone) + " · " + esc(a.email) + " · " + esc(a.ref) + "</p>" +
        (a.notes ? '<p class="tmuted">“' + esc(a.notes) + '”</p>' : "") +
        '<div class="tbtns">' +
          (a.status !== "confirmed" ? '<button data-act="appt" data-id="' + a.id + '" data-status="confirmed">Confirm</button>' : "") +
          (a.status !== "completed" ? '<button class="tghost" data-act="appt" data-id="' + a.id + '" data-status="completed">Done</button>' : "") +
          (a.status !== "cancelled" ? '<button class="tghost" data-act="appt" data-id="' + a.id + '" data-status="cancelled">Cancel</button>' : "") +
        "</div>" +
      "</article>"
    )).join("");
  }

  function blockCards(list) {
    if (!list || !list.length) return '<p class="tmuted">No manual blocks.</p>';
    return list.map((b) => (
      '<div class="tcard tcard--row">' +
        "<div><strong>" + esc(b.time) + "</strong> · " + esc(b.client_name || "Blocked") + (b.service_name ? " — " + esc(b.service_name) : "") +
        '<div class="tmuted">' + esc(b.phone || "") + "</div></div>" +
        '<button class="tghost" data-act="unblock" data-id="' + b.id + '">Free slot</button>' +
      "</div>"
    )).join("");
  }

  /* ---------- tabs ---------- */
  function renderAppointments() {
    const d = state.data;
    const date = state.date || d.today;
    return (
      '<section class="tsection">' +
        '<h2>Appointments</h2>' +
        '<div class="tfield"><label for="appt-date">Day</label>' +
          '<input id="appt-date" type="date" value="' + esc(date) + '" data-act="pick-date">' +
        "</div>" +
        '<div id="day-list">' + (date === d.today ? apptCards(d.today) : "") + "</div>" +
        '<h3>Awaiting confirmation</h3>' + apptCards(d.pending) +
      "</section>" +
      '<section class="tsection">' +
        "<h2>Mark a slot as taken</h2>" +
        '<form data-form="block">' +
          '<div class="ttwo"><div class="tfield"><label>Date</label><input type="date" name="date" value="' + esc(date) + '" required></div>' +
          '<div class="tfield"><label>Time</label><input type="time" name="time" step="900" required></div></div>' +
          '<div class="ttwo"><div class="tfield"><label>Client (optional)</label><input name="client_name" placeholder="Walk-in / phone booking"></div>' +
          '<div class="tfield"><label>Phone (optional)</label><input name="phone" type="tel"></div></div>' +
          '<div class="tfield"><label>Service (optional)</label><select name="service_id"><option value="">—</option>' +
            d.services.map((s) => '<option value="' + s.id + '">' + esc(s.name) + "</option>").join("") +
          "</select></div>" +
          '<button type="submit">Mark as taken</button>' +
        "</form>" +
        "<h3>Blocked slots</h3>" + blockCards(d.blocks) +
      "</section>"
    );
  }

  function renderAvailability() {
    const d = state.data;
    const s = d.settings;
    return (
      '<section class="tsection"><h2>Working hours & days</h2>' +
        '<form data-form="hours">' +
          d.hours.map((h) => (
            '<div class="thours">' +
              "<strong>" + DAYS[h.day].slice(0, 3) + "</strong>" +
              '<input type="time" name="open-' + h.day + '" value="' + esc(h.open) + '" aria-label="' + DAYS[h.day] + ' opening">' +
              '<input type="time" name="close-' + h.day + '" value="' + esc(h.close) + '" aria-label="' + DAYS[h.day] + ' closing">' +
              '<label class="tcheck"><input type="checkbox" name="closed-' + h.day + '"' + (h.closed ? " checked" : "") + "> off</label>" +
            "</div>"
          )).join("") +
          '<button type="submit">Save hours</button>' +
        "</form>" +
        '<form data-form="rules" class="trules">' +
          '<div class="ttwo">' +
            '<div class="tfield"><label>Slot length</label><select name="slot_interval">' +
              [15, 30, 60].map((n) => '<option value="' + n + '"' + (Number(s.slot_interval) === n ? " selected" : "") + ">" + n + " min</option>").join("") +
            "</select></div>" +
            '<div class="tfield"><label>Daily summary</label><select name="daily_summary">' +
              '<option value="1"' + (s.daily_summary === "1" ? " selected" : "") + ">On</option>" +
              '<option value="0"' + (s.daily_summary === "0" ? " selected" : "") + ">Off</option>" +
            "</select></div>" +
          "</div>" +
          '<div class="ttwo">' +
            '<div class="tfield"><label>Break starts</label><input type="time" name="break_start" value="' + esc(s.break_start || "") + '"></div>' +
            '<div class="tfield"><label>Break ends</label><input type="time" name="break_end" value="' + esc(s.break_end || "") + '"></div>' +
          "</div>" +
          '<button type="submit">Save rules</button>' +
        "</form>" +
      "</section>" +
      '<section class="tsection"><h2>Closed days</h2>' +
        (d.status.closed ? '<div class="talert">Closed now — ' + esc(d.status.message) + '<button class="tghost" data-act="reopen">Reopen now</button></div>' : "") +
        (d.closures.length ? d.closures.map((c) => (
          '<div class="tcard tcard--row"><div>' +
            "<strong>" + (c.indefinite ? "Until further notice" : (c.end_date && c.end_date !== c.start_date ? esc(c.start_date) + " → " + esc(c.end_date) : esc(c.start_date))) + "</strong>" +
            (c.message ? '<div class="tmuted">' + esc(c.message) + "</div>" : "") +
            '</div><button class="tghost" data-act="del-closure" data-id="' + c.id + '">Delete</button></div>'
        )).join("") : '<p class="tmuted">No closures saved.</p>') +
        '<form data-form="closure">' +
          '<div class="ttwo"><div class="tfield"><label>From</label><input type="date" name="start_date" required></div>' +
          '<div class="tfield"><label>To (optional)</label><input type="date" name="end_date"></div></div>' +
          '<div class="tfield"><label>Message on the website</label><input name="message" placeholder="Closed for the holiday"></div>' +
          '<label class="tcheck"><input type="checkbox" name="indefinite"> Closed until further notice</label>' +
          '<button type="submit">Close these days</button>' +
        "</form>" +
      "</section>"
    );
  }

  function renderServices() {
    const d = state.data;
    const cats = d.categories;
    const options = (selected) => cats.map((c) => '<option' + (c === selected ? " selected" : "") + ">" + esc(c) + "</option>").join("");
    return (
      '<section class="tsection"><h2>Services & prices</h2>' +
        d.services.map((s) => (
          '<details class="tcard"><summary><strong>' + esc(s.name) + "</strong> — " + money(s.price) + " · " + s.duration + " min" +
            (s.active ? "" : ' <span class="tpill tpill--cancelled">hidden</span>') + "</summary>" +
            '<form data-form="service" data-id="' + s.id + '">' +
              '<div class="tfield"><label>Name</label><input name="name" value="' + esc(s.name) + '"></div>' +
              '<div class="ttwo"><div class="tfield"><label>Price ($)</label><input name="price" type="number" min="0" value="' + s.price + '"></div>' +
              '<div class="tfield"><label>Minutes</label><input name="duration" type="number" min="15" step="15" value="' + s.duration + '"></div></div>' +
              '<div class="tfield"><label>Description</label><textarea name="description" rows="3">' + esc(s.description) + "</textarea></div>" +
              '<div class="tfield"><label>Category</label><select name="category">' + options(s.category) + "</select></div>" +
              '<label class="tcheck"><input type="checkbox" name="active"' + (s.active ? " checked" : "") + "> Visible on the website</label>" +
              '<div class="tbtns"><button type="submit">Save</button><button type="button" class="tghost" data-act="del-service" data-id="' + s.id + '">Delete</button></div>' +
            "</form>" +
          "</details>"
        )).join("") +
      "</section>" +
      '<section class="tsection"><h2>Add a service</h2>' +
        '<form data-form="new-service">' +
          '<div class="tfield"><label>Category</label><select name="category">' + options() + "</select></div>" +
          '<div class="tfield"><label>Name</label><input name="name" required></div>' +
          '<div class="tfield"><label>Description</label><textarea name="description" rows="2"></textarea></div>' +
          '<div class="ttwo"><div class="tfield"><label>Minutes</label><input name="duration" type="number" value="60" min="15" step="15"></div>' +
          '<div class="tfield"><label>Price ($)</label><input name="price" type="number" value="100" min="0"></div></div>' +
          '<button type="submit">Add service</button>' +
        "</form>" +
      "</section>" +
      '<section class="tsection"><h2>Categories</h2>' +
        cats.map((c) => (
          '<div class="tcard tcard--row"><strong>' + esc(c) + "</strong>" +
            '<div class="tbtns"><button class="tghost" data-act="rename-cat" data-name="' + esc(c) + '">Rename</button>' +
            '<button class="tghost" data-act="del-cat" data-name="' + esc(c) + '">Delete</button></div></div>'
        )).join("") +
        '<form data-form="new-cat" class="tinline"><input name="name" placeholder="New category" required><button type="submit">Add</button></form>' +
      "</section>"
    );
  }

  function renderImages() {
    const d = state.data;
    return (
      '<section class="tsection"><h2>Website images</h2>' +
        '<p class="tmuted">Tap a tile to upload a replacement. Changes are live immediately.</p>' +
        '<div class="tgrid">' + d.images.map((s) => (
          '<figure class="ttile"><img src="' + esc(s.url) + '" alt="' + esc(s.label) + '" loading="lazy">' +
            "<figcaption>" + esc(s.label) + "</figcaption>" +
            '<label class="tfit">Image fit' +
              '<select data-act="fit" data-slot="' + esc(s.key) + '">' +
                '<option value="cover"' + (s.fit === "contain" ? "" : " selected") + '>Fill frame</option>' +
                '<option value="contain"' + (s.fit === "contain" ? " selected" : "") + '>Show full image</option>' +
              "</select></label>" +
            '<button data-act="pick" data-slot="' + esc(s.key) + '">Replace</button></figure>'
        )).join("") + "</div>" +
      "</section>" +
      '<section class="tsection"><h2>Gallery</h2>' +
        '<button data-act="add-gallery">Add a gallery photo</button>' +
        '<div class="tgrid">' + d.gallery.map((g) => (
          '<figure class="ttile"><img src="' + esc(g.image) + '" alt="' + esc(g.caption) + '" loading="lazy">' +
            "<figcaption>" + esc(g.caption) + "</figcaption>" +
            '<div class="tbtns"><button data-act="pick" data-slot="gallery:' + g.id + '">Replace</button>' +
            '<button class="tghost" data-act="del-gallery" data-id="' + g.id + '">Delete</button></div></figure>'
        )).join("") + "</div>" +
      "</section>"
    );
  }

  function mapPreview(s) {
    if (!s.map_embed) return '<p class="tmuted">No map saved yet — the website shows the address and contact details only.</p>';
    return '<div class="tmap"><iframe src="' + esc(s.map_embed) + '" title="Map preview" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>';
  }

  function renderSettings() {
    const s = state.data.settings;
    return (
      '<section class="tsection"><h2>Salon details</h2>' +
        '<form data-form="settings">' +
          '<div class="tfield"><label>Salon name</label><input name="salon_name" value="' + esc(s.salon_name) + '"></div>' +
          '<div class="ttwo"><div class="tfield"><label>Phone</label><input name="salon_phone" value="' + esc(s.salon_phone) + '"></div>' +
          '<div class="tfield"><label>Email</label><input name="salon_email" type="email" value="' + esc(s.salon_email) + '"></div></div>' +
          '<div class="tfield"><label>Address</label><input name="salon_address" value="' + esc(s.salon_address) + '"></div>' +
          '<div class="tfield"><label>Short description (next to the map)</label><textarea name="salon_tagline" rows="2">' + esc(s.salon_tagline) + "</textarea></div>" +
          '<div class="tfield"><label>Google Maps / Google Business link</label><input name="map_link" inputmode="url" placeholder="maps.app.goo.gl/… or google.com/maps/…" value="' + esc(s.map_link) + '"></div>' +
          '<p class="tmuted">Paste a share link, a full Maps URL, or the “Embed a map” code from Google Maps. Only Google Maps links are accepted.</p>' +
          mapPreview(s) +
          '<div class="tfield"><label>Opening message (bar on the website)</label><textarea name="salon_message" rows="2">' + esc(s.salon_message) + "</textarea></div>" +
          '<div class="tfield"><label>Daily summary</label><select name="daily_summary">' +
            '<option value="1"' + (s.daily_summary === "1" ? " selected" : "") + ">On</option>" +
            '<option value="0"' + (s.daily_summary === "0" ? " selected" : "") + ">Off</option>" +
          "</select></div>" +
          '<button type="submit">Save settings</button>' +
        "</form>" +
      "</section>"
    );
  }

  const TABS = [
    ["appointments", "Appointments"],
    ["availability", "Availability"],
    ["services", "Services"],
    ["images", "Images"],
    ["settings", "Settings"],
  ];

  function render() {
    if (!state.data) return;
    document.getElementById("tg-tabs").innerHTML = TABS.map((t) =>
      '<button data-tab="' + t[0] + '" class="' + (state.tab === t[0] ? "is-on" : "") + '">' + t[1] + "</button>"
    ).join("");
    main.innerHTML =
      state.tab === "appointments" ? renderAppointments() :
      state.tab === "availability" ? renderAvailability() :
      state.tab === "services" ? renderServices() :
      state.tab === "images" ? renderImages() : renderSettings();
    const who = document.getElementById("tg-who");
    if (who && state.data.user) who.textContent = state.data.user.first_name || "Owner";
  }

  async function refresh() {
    state.data = await api("/api/tg/bootstrap");
    render();
  }

  /* ---------- events ---------- */
  document.addEventListener("click", async (event) => {
    const tabBtn = event.target.closest("[data-tab]");
    if (tabBtn) { state.tab = tabBtn.dataset.tab; render(); return; }

    const btn = event.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    try {
      if (act === "appt") {
        await api("/api/tg/appointments/" + btn.dataset.id + "/status", { method: "POST", body: { status: btn.dataset.status } });
        await refresh();
        toast("Appointment " + btn.dataset.status + ".");
      }
      if (act === "unblock") {
        await api("/api/tg/blocks/" + btn.dataset.id, { method: "DELETE" });
        await refresh();
        toast("Slot freed.");
      }
      if (act === "del-closure") {
        await api("/api/tg/closures/" + btn.dataset.id, { method: "DELETE" });
        await refresh();
        toast("Closure removed.");
      }
      if (act === "reopen") {
        await api("/api/tg/closures/reopen", { method: "POST", body: {} });
        await refresh();
        toast("Salon reopened.");
      }
      if (act === "del-service") {
        if (!confirm("Delete this service?")) return;
        await api("/api/tg/services/" + btn.dataset.id, { method: "DELETE" });
        await refresh();
        toast("Service deleted.");
      }
      if (act === "rename-cat") {
        const name = prompt("New category name", btn.dataset.name);
        if (!name) return;
        await api("/api/tg/categories", { body: { from: btn.dataset.name, name } });
        await refresh();
      }
      if (act === "del-cat") {
        if (!confirm("Delete category " + btn.dataset.name + "?")) return;
        await api("/api/tg/categories/" + encodeURIComponent(btn.dataset.name), { method: "DELETE" });
        await refresh();
      }
      if (act === "pick") { state.pending = { slot: btn.dataset.slot }; document.getElementById("tg-file").click(); }
      if (act === "add-gallery") { state.pending = { slot: "gallery" }; document.getElementById("tg-file").click(); }
      if (act === "del-gallery") {
        if (!confirm("Remove this photo from the gallery?")) return;
        await api("/api/tg/gallery/" + btn.dataset.id, { method: "DELETE" });
        await refresh();
        toast("Removed.");
      }
    } catch (err) { toast(err.message, true); }
  });

  document.addEventListener("change", async (event) => {
    if (event.target.matches('[data-act="pick-date"]')) {
      state.date = event.target.value;
      try {
        const data = await api("/api/tg/appointments?date=" + encodeURIComponent(state.date));
        const box = document.getElementById("day-list");
        if (box) box.innerHTML = apptCards(data.appointments);
      } catch (err) { toast(err.message, true); }
    }
    if (event.target.matches('[data-act="fit"]')) {
      try {
        await api("/api/tg/image-fit", { body: { key: event.target.dataset.slot, fit: event.target.value } });
        await refresh();
        toast("Image fit saved.");
      } catch (err) { toast(err.message, true); }
    }
  });

  // Shrink only what is larger than 2000px on the long side, keeping the ratio.
  // Photos inside that limit are uploaded byte-for-byte
  async function prepareImage(file) {
    try {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type) || typeof createImageBitmap !== "function") return file;
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
      if (scale === 1) { if (bitmap.close) bitmap.close(); return file; }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((done) => canvas.toBlob(done, "image/jpeg", 0.9));
      if (bitmap.close) bitmap.close();
      if (!blob) return file;
      return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
    } catch (err) {
      return file;
    }
  }

  document.getElementById("tg-file").addEventListener("change", async (event) => {
    const chosen = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!chosen || !state.pending) return;
    try {
      const file = await prepareImage(chosen);
      const form = new FormData();
      form.append("file", file);
      form.append("slot", state.pending.slot);
      await api("/api/tg/media", { form });
      state.pending = null;
      await refresh();
      toast("Image updated.");
    } catch (err) { toast(err.message, true); }
  });

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();
    const kind = form.dataset.form;
    const fd = new FormData(form);
    const val = (name) => String(fd.get(name) || "").trim();
    try {
      if (kind === "block") {
        await api("/api/tg/blocks", { body: {
          date: val("date"), time: val("time"), client_name: val("client_name"),
          phone: val("phone"), service_id: val("service_id") || null,
        } });
        await refresh();
        toast("Slot marked as taken.");
      }
      if (kind === "hours") {
        const hours = state.data.hours.map((h) => ({
          day: h.day,
          open: val("open-" + h.day) || h.open,
          close: val("close-" + h.day) || h.close,
          closed: fd.get("closed-" + h.day) ? 1 : 0,
        }));
        await api("/api/tg/hours", { method: "PUT", body: { hours } });
        await refresh();
        toast("Hours saved.");
      }
      if (kind === "rules") {
        await api("/api/tg/settings", { method: "PUT", body: {
          slot_interval: val("slot_interval"), break_start: val("break_start"),
          break_end: val("break_end"), daily_summary: val("daily_summary"),
        } });
        await refresh();
        toast("Rules saved.");
      }
      if (kind === "closure") {
        await api("/api/tg/closures", { body: {
          start_date: val("start_date"), end_date: val("end_date") || null,
          indefinite: !!fd.get("indefinite"), message: val("message"),
        } });
        await refresh();
        toast("Closure saved.");
      }
      if (kind === "service") {
        await api("/api/tg/services/" + form.dataset.id, { method: "PUT", body: {
          name: val("name"), price: val("price"), duration: val("duration"),
          description: val("description"), category: val("category"),
          active: fd.get("active") ? 1 : 0,
        } });
        await refresh();
        toast("Service saved.");
      }
      if (kind === "new-service") {
        await api("/api/tg/services", { body: {
          name: val("name"), category: val("category"), description: val("description"),
          short_description: val("description"), duration: val("duration"), price: val("price"),
        } });
        await refresh();
        toast("Service added.");
      }
      if (kind === "new-cat") {
        await api("/api/tg/categories", { body: { name: val("name") } });
        await refresh();
        toast("Category added.");
      }
      if (kind === "settings") {
        await api("/api/tg/settings", { method: "PUT", body: {
          salon_name: val("salon_name"), salon_phone: val("salon_phone"),
          salon_email: val("salon_email"), salon_address: val("salon_address"),
          salon_tagline: val("salon_tagline"), salon_message: val("salon_message"),
          map_link: val("map_link"), daily_summary: val("daily_summary"),
        } });
        await refresh();
        toast("Settings saved — live on the website.");
      }
    } catch (err) { toast(err.message, true); }
  });

  refresh().catch((err) => {
    main.innerHTML = '<div class="tgate"><h1>Owner only</h1><p>' + esc(err.message) + "</p>" +
      "<p>Open this panel from the button in your Telegram bot.</p></div>";
  });
})();
`;
