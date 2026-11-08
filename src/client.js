// Client-side behaviour for the public site: navigation, reveals, filters,
// lightbox, forms, the booking wizard and account/manage actions.
export const APP_JS = String.raw`
(function () {
  "use strict";
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const money = (n) => "$" + Number(n || 0).toLocaleString("en-US");

  function toast(message, type) {
    const stack = document.getElementById("toast-stack");
    if (!stack) return;
    const el = document.createElement("div");
    el.className = "toast" + (type ? " toast--" + type : "");
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; }, 4200);
    setTimeout(() => el.remove(), 4700);
  }
  window.lumiereToast = toast;

  function label12(t) {
    const [h, m] = String(t).split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    return ((h % 12) || 12) + ":" + String(m).padStart(2, "0") + " " + suffix;
  }
  function longDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00Z");
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  }
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v || "").trim());

  /* ---------- header ---------- */
  const header = document.getElementById("site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  const toggle = document.getElementById("nav-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      mobileNav.classList.toggle("is-open", !open);
    });
    $$("a", mobileNav).forEach((a) => a.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "false");
      mobileNav.classList.remove("is-open");
    }));
  }

  /* ---------- scroll reveals ---------- */
  const reveals = $$("[data-reveal]");
  if (reveals.length) {
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reveals.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
      reveals.forEach((el) => io.observe(el));
    }
  }

  /* ---------- testimonials slider ---------- */
  const track = document.getElementById("testimonial-track");
  if (track) {
    const step = () => {
      const card = track.querySelector(".testimonial");
      return card ? card.getBoundingClientRect().width + 24 : 320;
    };
    $$("[data-slide]").forEach((btn) => btn.addEventListener("click", () => {
      track.scrollBy({ left: btn.dataset.slide === "next" ? step() : -step(), behavior: "smooth" });
    }));
  }

  /* ---------- before / after ---------- */
  $$("[data-ba]").forEach((wrap) => {
    const range = wrap.querySelector(".ba__range");
    const after = wrap.querySelector(".ba__after");
    if (!range || !after) return;
    const apply = () => { after.style.clipPath = "inset(0 0 0 " + range.value + "%)"; };
    range.addEventListener("input", apply);
    apply();
  });

  /* ---------- gallery filter + lightbox ---------- */
  const masonry = document.getElementById("masonry");
  if (masonry) {
    const buttons = $$("[data-filter]");
    const items = $$(".masonry__item");
    buttons.forEach((btn) => btn.addEventListener("click", () => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      let shown = 0;
      items.forEach((item) => {
        const match = btn.dataset.filter === "all" || item.dataset.category === btn.dataset.filter;
        item.hidden = !match;
        if (match) shown++;
      });
      const empty = document.getElementById("gallery-empty");
      if (empty) empty.hidden = shown !== 0;
    }));

    const box = document.getElementById("lightbox");
    const img = document.getElementById("lightbox-img");
    const cap = document.getElementById("lightbox-cap");
    let current = 0;
    const visible = () => items.filter((i) => !i.hidden);
    function open(index) {
      const list = visible();
      if (!list.length) return;
      current = ((index % list.length) + list.length) % list.length;
      const item = list[current];
      img.src = item.dataset.src;
      img.alt = item.dataset.caption;
      cap.textContent = item.dataset.caption;
      box.hidden = false;
      box.classList.add("is-open");
      document.body.style.overflow = "hidden";
      box.querySelector("[data-lb-close]").focus();
    }
    function close() {
      box.classList.remove("is-open");
      box.hidden = true;
      document.body.style.overflow = "";
    }
    items.forEach((item, i) => item.addEventListener("click", () => open(visible().indexOf(item))));
    if (box) {
      box.querySelector("[data-lb-close]").addEventListener("click", close);
      box.querySelector("[data-lb-prev]").addEventListener("click", () => open(current - 1));
      box.querySelector("[data-lb-next]").addEventListener("click", () => open(current + 1));
      box.addEventListener("click", (e) => { if (e.target === box) close(); });
      document.addEventListener("keydown", (e) => {
        if (box.hidden) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowRight") open(current + 1);
        if (e.key === "ArrowLeft") open(current - 1);
      });
    }
  }

  /* ---------- generic form helpers ---------- */
  async function post(url, payload) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "same-origin",
    });
    let data = {};
    try { data = await res.json(); } catch (e) { data = {}; }
    if (!res.ok || data.ok === false) throw new Error(data.error || "Something went wrong. Please try again.");
    return data;
  }
  window.lumierePost = post;

  function showFieldError(form, name, show) {
    const el = form.querySelector('[data-error-for="' + name + '"]');
    if (el) el.classList.toggle("is-visible", !!show);
    const input = form.querySelector('[name="' + name + '"]');
    if (input) input.setAttribute("aria-invalid", show ? "true" : "false");
  }
  function busy(btn, isBusy, label) {
    if (!btn) return;
    btn.disabled = isBusy;
    if (label) btn.dataset.label = btn.dataset.label || btn.textContent;
    btn.textContent = isBusy ? "Just a moment…" : (btn.dataset.label || btn.textContent);
  }

  /* ---------- newsletter ---------- */
  $$("[data-newsletter]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (!isEmail(input.value)) { toast("Please enter a valid email address.", "err"); input.focus(); return; }
      const btn = form.querySelector("button");
      busy(btn, true);
      try {
        const data = await post("/api/newsletter", { email: input.value });
        toast(data.message || "You're subscribed.", "ok");
        form.reset();
      } catch (err) { toast(err.message, "err"); }
      finally { busy(btn, false); }
    });
  });

  /* ---------- contact ---------- */
  const contact = $("[data-contact]");
  if (contact) {
    contact.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = contact.querySelector('[name="name"]');
      const email = contact.querySelector('[name="email"]');
      const message = contact.querySelector('[name="message"]');
      const consent = contact.querySelector('[name="consent"]');
      let ok = true;
      if (!name.value.trim() || name.value.trim().length < 2) { showFieldError(contact, "name", true); ok = false; } else showFieldError(contact, "name", false);
      if (!isEmail(email.value)) { showFieldError(contact, "email", true); ok = false; } else showFieldError(contact, "email", false);
      if (!message.value.trim() || message.value.trim().length < 10) { showFieldError(contact, "message", true); ok = false; } else showFieldError(contact, "message", false);
      if (!consent.checked) { toast("Please confirm we may reply by email.", "err"); ok = false; }
      if (!ok) return;
      const btn = contact.querySelector("button[type=submit]");
      busy(btn, true);
      try {
        const data = await post("/api/contact", {
          name: name.value, email: email.value,
          phone: contact.querySelector('[name="phone"]').value,
          message: message.value,
        });
        toast(data.message, "ok");
        contact.reset();
      } catch (err) { toast(err.message, "err"); }
      finally { busy(btn, false); }
    });
  }

  /* ---------- gift cards ---------- */
  const gift = $("[data-gift]");
  if (gift) {
    const custom = gift.querySelector('[name="amount"]');
    const preview = document.getElementById("gift-preview-amount");
    const previewTo = document.getElementById("gift-preview-to");
    const setAmount = (value) => {
      if (preview) preview.textContent = money(value);
    };
    $$(".amount", gift).forEach((btn) => btn.addEventListener("click", () => {
      $$(".amount", gift).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      custom.value = btn.dataset.amount;
      setAmount(btn.dataset.amount);
    }));
    custom.addEventListener("input", () => {
      $$(".amount", gift).forEach((b) => b.setAttribute("aria-pressed", "false"));
      setAmount(custom.value || 0);
    });
    const recipient = gift.querySelector('[name="recipient"]');
    recipient.addEventListener("input", () => {
      if (previewTo) previewTo.textContent = recipient.value.trim() ? "For " + recipient.value.trim() : "For someone who deserves an hour off";
    });
    gift.addEventListener("submit", async (e) => {
      e.preventDefault();
      let ok = true;
      const checks = [["recipient", (v) => v.trim().length >= 2], ["recipient_email", isEmail], ["sender", (v) => v.trim().length >= 2]];
      checks.forEach(([name, valid]) => {
        const input = gift.querySelector('[name="' + name + '"]');
        const good = valid(input.value);
        showFieldError(gift, name, !good);
        if (!good) ok = false;
      });
      if (!gift.querySelector('[name="terms"]').checked) { toast("Please confirm you understand delivery.", "err"); ok = false; }
      if (!ok) return;
      const btn = gift.querySelector("button[type=submit]");
      busy(btn, true);
      try {
        const data = await post("/api/gift-cards", {
          amount: custom.value, recipient: recipient.value,
          recipient_email: gift.querySelector('[name="recipient_email"]').value,
          sender: gift.querySelector('[name="sender"]').value,
          message: gift.querySelector('[name="message"]').value,
          terms: true,
        });
        toast("Gift card " + data.code + " created — " + money(data.amount) + ".", "ok");
        let note = document.getElementById("gift-result");
        if (!note) {
          note = document.createElement("div");
          note.id = "gift-result";
          note.className = "alert alert--ok";
          gift.prepend(note);
        }
        note.innerHTML = "Gift card created. Code <strong>" + data.code + "</strong> — emailed to the recipient and ready to use.";
        gift.reset();
        $$(".amount", gift).forEach((b) => b.setAttribute("aria-pressed", "false"));
      } catch (err) { toast(err.message, "err"); }
      finally { busy(btn, false); }
    });
  }

  /* ---------- auth ---------- */
  const auth = $("[data-auth]");
  if (auth) {
    auth.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        email: auth.querySelector('[name="email"]').value,
        password: auth.querySelector('[name="password"]').value,
      };
      if (auth.dataset.auth === "signup") {
        payload.name = auth.querySelector('[name="name"]').value;
        payload.phone = auth.querySelector('[name="phone"]') ? auth.querySelector('[name="phone"]').value : "";
      }
      const errBox = document.getElementById("auth-error");
      if (errBox) errBox.hidden = true;
      const btn = auth.querySelector("button[type=submit]");
      busy(btn, true);
      try {
        await post("/api/auth/" + auth.dataset.auth, payload);
        window.location.assign(auth.dataset.auth === "signup" ? "/account" : "/account");
      } catch (err) {
        if (errBox) { errBox.textContent = err.message; errBox.hidden = false; }
        else toast(err.message, "err");
        busy(btn, false);
      }
    });
  }

  /* ---------- logout / account cancel ---------- */
  $$("[data-logout]").forEach((btn) => btn.addEventListener("click", async () => {
    try { await post("/api/auth/logout", {}); } catch (e) {}
    window.location.assign("/");
  }));

  $$("[data-cancel-appt]").forEach((btn) => btn.addEventListener("click", async () => {
    if (!confirm("Cancel this appointment? Free changes are available up to 24 hours before.")) return;
    busy(btn, true);
    try {
      await post("/api/me/appointments/" + btn.dataset.cancelAppt + "/cancel", {});
      toast("Appointment cancelled.", "ok");
      const row = btn.closest("[data-appt-row]");
      if (row) {
        const badge = row.querySelector(".badge-status");
        if (badge) { badge.textContent = "cancelled"; badge.className = "badge-status badge-status--cancelled"; }
      }
      btn.remove();
    } catch (err) { toast(err.message, "err"); busy(btn, false); }
  }));

  /* ---------- manage appointment ---------- */
  const manage = $("[data-manage]");
  if (manage) {
    const ref = manage.dataset.ref;
    const token = manage.dataset.token;
    const dateInput = document.getElementById("m-date");
    const timeSelect = document.getElementById("m-time");
    const msg = document.getElementById("manage-message");
    const moveBtn = manage.querySelector("[data-manage-reschedule]");
    const today = new Date().toISOString().slice(0, 10);
    if (dateInput) dateInput.min = today;

    const setMessage = (text, ok) => {
      if (!msg) return;
      msg.textContent = text;
      msg.className = "alert " + (ok ? "alert--ok" : "alert--err");
      msg.hidden = false;
    };

    if (dateInput) dateInput.addEventListener("change", async () => {
      timeSelect.disabled = true;
      timeSelect.innerHTML = "<option>Loading…</option>";
      moveBtn.disabled = true;
      try {
        const res = await fetch("/api/availability?date=" + encodeURIComponent(dateInput.value) + "&service=" + (manage.dataset.serviceId || ""));
        const data = await res.json();
        timeSelect.innerHTML = "";
        if (!data.slots || !data.slots.length) {
          timeSelect.innerHTML = "<option value=''>No times available</option>";
          return;
        }
        const first = document.createElement("option");
        first.value = ""; first.textContent = "Choose a time";
        timeSelect.appendChild(first);
        data.slots.forEach((slot) => {
          const opt = document.createElement("option");
          opt.value = slot; opt.textContent = label12(slot);
          timeSelect.appendChild(opt);
        });
        timeSelect.disabled = false;
      } catch (e) {
        timeSelect.innerHTML = "<option value=''>Try another date</option>";
      }
    });
    if (timeSelect) timeSelect.addEventListener("change", () => { moveBtn.disabled = !timeSelect.value; });

    if (moveBtn) moveBtn.addEventListener("click", async () => {
      busy(moveBtn, true);
      try {
        const data = await post("/api/manage/reschedule", { ref: ref, token: token, date: dateInput.value, time: timeSelect.value });
        setMessage(data.message, true);
        toast(data.message, "ok");
        setTimeout(() => window.location.reload(), 1600);
      } catch (err) { setMessage(err.message, false); busy(moveBtn, false); }
    });

    const cancelBtn = manage.querySelector("[data-manage-cancel]");
    if (cancelBtn) cancelBtn.addEventListener("click", async () => {
      if (!confirm("Cancel this appointment? This cannot be undone.")) return;
      busy(cancelBtn, true);
      try {
        const data = await post("/api/manage/cancel", { ref: ref, token: token });
        setMessage(data.message, true);
        toast(data.message, "ok");
        const badge = document.getElementById("manage-status");
        if (badge) { badge.textContent = "cancelled"; badge.className = "badge-status badge-status--cancelled"; }
        const block = document.getElementById("reschedule-block");
        const actions = document.getElementById("manage-actions");
        if (block) block.hidden = true;
        if (actions) actions.hidden = true;
      } catch (err) { setMessage(err.message, false); }
      finally { busy(cancelBtn, false); }
    });
  }

  /* ---------- booking wizard ---------- */
  const form = document.getElementById("booking-form");
  const dataEl = document.getElementById("booking-data");
  if (form && dataEl) {
    const data = JSON.parse(dataEl.textContent);
    const state = { service: null, stylist: { id: "", name: "Any available stylist" }, date: "", time: "" };
    const steps = $$(".wizard-step", form);
    const labels = $$("[data-step-label]");
    const sums = {
      service: document.getElementById("sum-service"),
      stylist: document.getElementById("sum-stylist"),
      date: document.getElementById("sum-date"),
      time: document.getElementById("sum-time"),
      duration: document.getElementById("sum-duration"),
      price: document.getElementById("sum-price"),
    };

    function renderSummary() {
      sums.service.textContent = state.service ? state.service.name : "Not chosen";
      sums.stylist.textContent = state.stylist.id ? state.stylist.name : "Any available";
      sums.date.textContent = state.date ? longDate(state.date) : "Not chosen";
      sums.time.textContent = state.time ? label12(state.time) : "Not chosen";
      sums.duration.textContent = state.service ? state.service.duration + " min" : "—";
      sums.price.textContent = state.service ? money(state.service.price) : "$0";
    }
    function showStep(n) {
      steps.forEach((s) => s.classList.toggle("is-active", Number(s.dataset.step) === n));
      labels.forEach((l) => {
        const i = Number(l.dataset.stepLabel);
        l.classList.toggle("is-active", i === n);
        l.classList.toggle("is-done", i < n);
      });
      const progress = document.getElementById("booking-progress");
      if (progress && window.innerWidth < 700) progress.scrollLeft = 0;
      const target = form.closest(".booking");
      if (target && n !== 1) window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - 90), behavior: "smooth" });
    }

    const next1 = form.querySelector('[data-next="2"]');
    $$("[data-service-id]").forEach((btn) => btn.addEventListener("click", () => {
      $$("[data-service-id]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      state.service = {
        id: Number(btn.dataset.serviceId), name: btn.dataset.serviceName,
        price: Number(btn.dataset.servicePrice), duration: Number(btn.dataset.serviceDuration),
        slug: btn.dataset.serviceSlug,
      };
      next1.disabled = false;
      renderSummary();
    }));

    $$("[data-stylist-id]").forEach((btn) => btn.addEventListener("click", () => {
      $$("[data-stylist-id]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      state.stylist = { id: btn.dataset.stylistId, name: btn.dataset.stylistName };
      renderSummary();
      state.date = ""; state.time = "";
      renderSummary();
    }));

    /* calendar */
    const calGrid = document.getElementById("cal-grid");
    const calLabel = document.getElementById("cal-label");
    const slotsEl = document.getElementById("slots");
    const emptyEl = document.getElementById("slots-empty");
    const closedEl = document.getElementById("slots-closed");
    const next3 = form.querySelector('[data-next="4"]');
    const todayISO = data.today || new Date().toISOString().slice(0, 10);
    const startDate = new Date(todayISO + "T00:00:00Z");
    let viewYear = startDate.getUTCFullYear();
    let viewMonth = startDate.getUTCMonth();
    let maxMonth = new Date(Date.UTC(viewYear, viewMonth + 4, 1));

    function renderCalendar() {
      calLabel.textContent = new Date(Date.UTC(viewYear, viewMonth, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
      calGrid.innerHTML = "";
      ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].forEach((d) => {
        const el = document.createElement("span");
        el.className = "calendar__dow"; el.textContent = d;
        calGrid.appendChild(el);
      });
      const first = new Date(Date.UTC(viewYear, viewMonth, 1));
      const days = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
      for (let i = 0; i < first.getUTCDay(); i++) calGrid.appendChild(document.createElement("span"));
      for (let d = 1; d <= days; d++) {
        const iso = new Date(Date.UTC(viewYear, viewMonth, d)).toISOString().slice(0, 10);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "day" + (iso === todayISO ? " is-today" : "");
        btn.textContent = d;
        btn.setAttribute("aria-pressed", String(iso === state.date));
        btn.setAttribute("aria-label", longDate(iso));
        if (iso < todayISO) btn.disabled = true;
        btn.addEventListener("click", () => {
          state.date = iso; state.time = "";
          $$(".day", calGrid).forEach((b) => b.setAttribute("aria-pressed", String(b.textContent === String(d))));
          renderSummary();
          loadSlots();
        });
        calGrid.appendChild(btn);
      }
    }
    function shiftMonth(delta) {
      const next = new Date(Date.UTC(viewYear, viewMonth + delta, 1));
      if (next < new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1)) || next > maxMonth) return;
      viewYear = next.getUTCFullYear(); viewMonth = next.getUTCMonth();
      renderCalendar();
    }
    const prev = form.querySelector("[data-cal-prev]");
    const next = form.querySelector("[data-cal-next]");
    if (prev) prev.addEventListener("click", () => shiftMonth(-1));
    if (next) next.addEventListener("click", () => shiftMonth(1));

    async function loadSlots() {
      if (!state.date) return;
      slotsEl.innerHTML = "";
      emptyEl.hidden = true;
      closedEl.hidden = true;
      next3.disabled = true;
      const loading = document.createElement("p");
      loading.className = "form-note"; loading.textContent = "Checking availability…";
      slotsEl.appendChild(loading);
      try {
        const params = new URLSearchParams({ date: state.date, service: String(state.service ? state.service.id : ""), stylist: String(state.stylist.id || "") });
        const res = await fetch("/api/availability?" + params.toString());
        const result = await res.json();
        slotsEl.innerHTML = "";
        if (!result.slots || !result.slots.length) {
          if (result.reason === "closed" || result.reason === "holiday" || result.reason === "stylist-off") {
            closedEl.hidden = false;
            closedEl.textContent = result.reason === "holiday"
              ? "The salon is closed on this date" + (result.note ? " (" + result.note + ")" : "") + ". Please choose another day."
              : result.reason === "stylist-off"
                ? "Your chosen stylist does not work on this day. Try another date or choose any stylist."
                : "The salon is closed on this day. Please choose another date.";
          } else {
            emptyEl.hidden = false;
          }
          return;
        }
        result.slots.forEach((slot) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "slot";
          btn.textContent = label12(slot);
          btn.setAttribute("aria-pressed", "false");
          btn.addEventListener("click", () => {
            state.time = slot;
            $$(".slot", slotsEl).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
            next3.disabled = false;
            renderSummary();
          });
          slotsEl.appendChild(btn);
        });
      } catch (err) {
        slotsEl.innerHTML = "";
        emptyEl.hidden = false;
        emptyEl.textContent = "We could not load availability. Please try another date.";
      }
    }

    form.querySelectorAll("[data-next]").forEach((btn) => btn.addEventListener("click", () => {
      const to = Number(btn.dataset.next);
      if (to === 5 && !validateDetails()) return;
      if (to === 3) { renderCalendar(); if (state.date) loadSlots(); }
      if (to === 5) fillReview();
      showStep(to);
    }));
    form.querySelectorAll("[data-back]").forEach((btn) => btn.addEventListener("click", () => showStep(Number(btn.dataset.back))));

    function validateDetails() {
      const name = form.querySelector('[name="client_name"]');
      const email = form.querySelector('[name="email"]');
      const phone = form.querySelector('[name="phone"]');
      const consent = form.querySelector('[name="consent"]');
      let ok = true;
      if (!name.value.trim() || name.value.trim().length < 2) { showFieldError(form, "client_name", true); ok = false; } else showFieldError(form, "client_name", false);
      if (!isEmail(email.value)) { showFieldError(form, "email", true); ok = false; } else showFieldError(form, "email", false);
      if (phone.value.replace(/\D/g, "").length < 7) { showFieldError(form, "phone", true); ok = false; } else showFieldError(form, "phone", false);
      if (!consent.checked) { showFieldError(form, "consent", true); ok = false; } else showFieldError(form, "consent", false);
      return ok;
    }

    function fillReview() {
      document.getElementById("review-service").textContent = state.service ? state.service.name + " · " + money(state.service.price) + " · " + state.service.duration + " min" : "—";
      document.getElementById("review-stylist").textContent = state.stylist.id ? state.stylist.name : "Any available stylist";
      document.getElementById("review-when").textContent = state.date ? longDate(state.date) + " at " + label12(state.time) : "—";
      const details = document.getElementById("review-details");
      const contactLine = document.getElementById("review-contact");
      details.hidden = false;
      contactLine.textContent = form.querySelector('[name="client_name"]').value + " · " + form.querySelector('[name="email"]').value + " · " + form.querySelector('[name="phone"]').value;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errBox = document.getElementById("booking-error");
      errBox.hidden = true;
      if (!state.service || !state.date || !state.time) {
        errBox.textContent = "Please choose a service, date and time first.";
        errBox.hidden = false;
        return;
      }
      if (!validateDetails()) { showStep(4); return; }
      const btn = document.getElementById("confirm-booking");
      busy(btn, true);
      try {
        const result = await post("/api/book", {
          service_id: state.service.id,
          stylist_id: state.stylist.id || null,
          date: state.date,
          time: state.time,
          client_name: form.querySelector('[name="client_name"]').value,
          email: form.querySelector('[name="email"]').value,
          phone: form.querySelector('[name="phone"]').value,
          notes: form.querySelector('[name="notes"]').value,
          consent: true,
        });
        form.hidden = true;
        const progress = document.getElementById("booking-progress");
        if (progress) progress.hidden = true;
        const success = document.getElementById("booking-success");
        success.hidden = false;
        document.getElementById("success-ref").textContent = result.ref;
        document.getElementById("success-summary").innerHTML =
          "<h3>Your appointment</h3><p>" + state.service.name + " with " + (state.stylist.id ? state.stylist.name : "any available stylist") +
          "<br>" + longDate(state.date) + " at " + label12(state.time) + "</p>";
        document.getElementById("success-manage").href = result.manage_url;
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        errBox.textContent = err.message;
        errBox.hidden = false;
      } finally {
        busy(btn, false);
      }
    });

    // preselect service
    if (data.preselect) {
      const btn = form.querySelector('[data-service-slug="' + data.preselect + '"]');
      if (btn) btn.click();
    }
    renderSummary();
  }

  /* ---------- cookie banner ---------- */
  const banner = document.getElementById("cookie-banner");
  if (banner) {
    let choice = null;
    try { choice = localStorage.getItem("lumiere-cookie"); } catch (e) {}
    if (!choice) setTimeout(() => { banner.hidden = false; }, 1200);
    $$("[data-cookie]", banner).forEach((btn) => btn.addEventListener("click", () => {
      try { localStorage.setItem("lumiere-cookie", btn.dataset.cookie); } catch (e) {}
      banner.hidden = true;
    }));
  }
})();
`;
