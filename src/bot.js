// Telegram bot: inline-button control room for the salon, driven by the same
// domain functions as the website and the Mini App panel.
import { all, one, run, getHours, queueEmail } from "./db.js";
import {
  sendMessage, editMessage, answerCallback, downloadTelegramFile, tgConfigured,
} from "./telegram.js";
import {
  ensureSalon, getSettings, availableSlots, addBlock, deleteBlock, getBlocks,
  appointmentsOn, appointmentsBetween, pendingAppointments, getClosures, addClosure,
  deleteClosure, closureLabel, saveHours, toggleDay, hoursForDay, setSlotInterval, setBreak,
  getServicesFull, getCategories, createService, updateService, deleteService,
  addCategory, renameCategory, deleteCategory,
  imageSlots, setImageSlot, saveMedia, addGalleryItem, deleteGalleryItem, galleryItems,
  siteStatus,
} from "./salon.js";
import { todayISO, addDays, longDay, timeLabel, money, minutesToDuration, DAY_NAMES } from "./util.js";

const origin = (env) => String(env.PUBLIC_ORIGIN || "https://lumiere-salon.com").replace(/\/+$/, "");
const back = (to = "menu", label = "‹ Back") => [{ text: label, callback_data: to }];

/* ---------------- conversation state ---------------- */

const stateOf = async (db, chat) => {
  const row = await one(db, "SELECT step, payload FROM tg_state WHERE chat_id = ?", String(chat));
  if (!row) return { step: "", payload: {} };
  let payload = {};
  try { payload = JSON.parse(row.payload || "{}"); } catch { payload = {}; }
  return { step: row.step, payload };
};

const setState = (db, chat, step, payload = {}) =>
  run(
    db,
    `INSERT INTO tg_state (chat_id, step, payload, updated_at) VALUES (?,?,?,datetime('now'))
     ON CONFLICT(chat_id) DO UPDATE SET step = excluded.step, payload = excluded.payload, updated_at = excluded.updated_at`,
    String(chat), step, JSON.stringify(payload),
  );

const clearState = (db, chat) => run(db, "DELETE FROM tg_state WHERE chat_id = ?", String(chat));

/* ---------------- views ---------------- */

const menuView = (env) => ({
  text: [
    "✂️ LUMIÈRE — control room",
    "",
    "Pick a section. Everything you change here appears on the website immediately.",
  ].join("\n"),
  keyboard: [
    [{ text: "📅 Appointments", callback_data: "appts:today" }, { text: "⏳ Pending", callback_data: "appts:pending" }],
    [{ text: "➕ Manual booking", callback_data: "mn:date" }, { text: "🚫 Taken slots", callback_data: "um" }],
    [{ text: "🕒 Working hours & days", callback_data: "hr" }],
    [{ text: "⛔ Closed days", callback_data: "cl" }],
    [{ text: "💇 Services & prices", callback_data: "sv" }],
    [{ text: "🖼 Website images", callback_data: "im" }],
    [{ text: "🌐 Open web panel", web_app: { url: `${origin(env)}/tg` } }],
    [{ text: "❓ Help", callback_data: "help" }],
  ],
});

const helpView = (env) => ({
  text: [
    "❓ Help",
    "",
    "/start or /menu — this menu",
    "/today — today's appointments",
    "/summary — send today's schedule now",
    "",
    "Every section has a ‹ Back button. Anything you change here is live on the website at once.",
    "",
    "The web panel opens from “🌐 Open Web Panel” and needs no password — it validates your Telegram account.",
  ].join("\n"),
  keyboard: [[{ text: "🌐 Open web panel", web_app: { url: `${origin(env)}/tg` } }], back()],
});

const appointmentsView = async (db, kind) => {
  const today = todayISO();
  let rows = [];
  let title = "📅 Appointments";
  if (kind === "today") { rows = await appointmentsOn(db, today); title = `📅 Today · ${longDay(today)}`; }
  else if (kind === "tomorrow") { const d = addDays(today, 1); rows = await appointmentsOn(db, d); title = `📅 Tomorrow · ${longDay(d)}`; }
  else if (kind === "week") { rows = await appointmentsBetween(db, today, addDays(today, 6)); title = "📅 Next 7 days"; }
  else { rows = await pendingAppointments(db); title = "⏳ Awaiting confirmation"; }

  const blocks = kind === "today" || kind === "tomorrow"
    ? await getBlocks(db, { date: kind === "today" ? today : addDays(today, 1) })
    : [];

  const lines = [title, ""];
  if (!rows.length) lines.push("Nothing booked.");
  rows.slice(0, 12).forEach((a) => {
    lines.push(`${a.time} · ${a.client_name} — ${a.service_name}${a.stylist_name ? ` · ${a.stylist_name}` : ""}`);
    lines.push(`      ${a.phone} · ${a.status}`);
  });
  if (rows.length > 12) lines.push("", `…and ${rows.length - 12} more in the web panel.`);
  if (blocks.length) {
    lines.push("", "Blocked by you:");
    blocks.forEach((b) => lines.push(`${b.time} · ${b.client_name || "manual block"}${b.service_name ? ` — ${b.service_name}` : ""}`));
  }

  const keyboard = [];
  rows.filter((a) => a.status === "pending").slice(0, 5).forEach((a) => {
    keyboard.push([
      { text: `✅ ${a.time} ${String(a.client_name).split(" ")[0]}`, callback_data: `appt:c:${a.id}` },
      { text: "❌ Cancel", callback_data: `appt:x:${a.id}` },
    ]);
  });
  rows.filter((a) => a.status !== "pending").slice(0, 4).forEach((a) => {
    keyboard.push([{ text: `❌ Cancel ${a.time} ${String(a.client_name).split(" ")[0]}`, callback_data: `appt:x:${a.id}` }]);
  });
  keyboard.push([
    { text: "☀️ Today", callback_data: "appts:today" },
    { text: "🌅 Tomorrow", callback_data: "appts:tomorrow" },
  ]);
  keyboard.push([
    { text: "🗓 This week", callback_data: "appts:week" },
    { text: "⏳ Pending", callback_data: "appts:pending" },
  ]);
  keyboard.push([{ text: "📣 Send today's summary", callback_data: "appts:summary" }]);
  keyboard.push(back());
  return { text: lines.join("\n"), keyboard };
};

const manualDatesView = async (db) => {
  const today = todayISO();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  const keyboard = [];
  for (let i = 0; i < days.length; i += 2) {
    keyboard.push(days.slice(i, i + 2).map((d) => ({
      text: `${longDay(d).replace(/,/g, "")}`.slice(0, 24),
      callback_data: `mn:d:${d}`,
    })));
  }
  keyboard.push(back());
  return { text: ["➕ Manual booking", "", "Which day is taken? Pick a date."].join("\n"), keyboard };
};

const manualSlotsView = async (db, date) => {
  const { slots, reason, note } = await availableSlots(db, { date });
  if (!slots.length) {
    const why = reason === "closure" || reason === "holiday"
      ? `The salon is closed that day${note ? ` — ${note}` : ""}.`
      : reason === "closed" ? "That is a day off in your working hours." : "No free slots left that day.";
    return { text: `➕ Manual booking\n\n${longDay(date)}\n${why}`, keyboard: [back("mn:date", "‹ Another day")] };
  }
  const keyboard = [];
  for (let i = 0; i < slots.length; i += 3) {
    keyboard.push(slots.slice(i, i + 3).map((t) => ({ text: timeLabel(t), callback_data: `mn:t:${date}:${t}` })));
  }
  keyboard.push(back("mn:date", "‹ Another day"));
  return { text: `➕ Manual booking\n\n${longDay(date)}\nPick the time that is taken.`, keyboard };
};

const hoursView = async (db) => {
  const hours = await getHours(db);
  const settings = await getSettings(db);
  const lines = ["🕒 Working hours & days", ""];
  hours.forEach((h) => lines.push(`• ${DAY_NAMES[h.day]} — ${h.closed ? "closed" : `${h.open} – ${h.close}`}`));
  lines.push("", `Booking slots every ${settings.slot_interval} min`);
  lines.push(settings.break_start && settings.break_end ? `Break ${settings.break_start} – ${settings.break_end}` : "No break set");
  const keyboard = hours.map((h) => [{
    text: `${DAY_NAMES[h.day].slice(0, 3)} · ${h.closed ? "closed" : `${h.open}–${h.close}`}`,
    callback_data: `hr:d:${h.day}`,
  }]);
  keyboard.push([{ text: `⏱ Slot length: ${settings.slot_interval} min`, callback_data: "hr:i" }]);
  keyboard.push([{ text: settings.break_start ? `☕ Break ${settings.break_start}–${settings.break_end}` : "☕ Set a break", callback_data: "hr:b" }]);
  keyboard.push(back());
  return { text: lines.join("\n"), keyboard };
};

const hoursDayView = async (db, day) => {
  const h = await hoursForDay(db, day);
  if (!h) return { text: "That day is missing.", keyboard: [back("hr")] };
  return {
    text: [
      `🕒 ${DAY_NAMES[h.day]}`,
      "",
      h.closed ? "Day off — no online booking." : `Open ${h.open} – ${h.close}`,
    ].join("\n"),
    keyboard: [
      [{ text: h.closed ? "✅ Make it a working day" : "⛔ Make it a day off", callback_data: `hr:t:${day}` }],
      [{ text: `Opening time (${h.open})`, callback_data: `hr:o:${day}` }, { text: `Closing time (${h.close})`, callback_data: `hr:c:${day}` }],
      back("hr", "‹ All days"),
    ],
  };
};

const closuresView = async (db) => {
  const rows = await getClosures(db);
  const status = await siteStatus(db);
  const lines = ["⛔ Closed days", "", status.closed ? `Now: ${status.message}` : "Now: open as usual."];
  if (rows.length) {
    lines.push("");
    rows.forEach((c) => lines.push(`• ${closureLabel(c)}${c.message ? ` — ${c.message}` : ""}`));
  } else {
    lines.push("", "No closures saved.");
  }
  const keyboard = rows.slice(0, 6).map((c) => [{ text: `🗑 ${closureLabel(c)}`.slice(0, 40), callback_data: `cl:del:${c.id}` }]);
  keyboard.push([{ text: "➕ Close a single day", callback_data: "cl:one" }]);
  keyboard.push([{ text: "➕ Close a date range", callback_data: "cl:range" }]);
  keyboard.push([{ text: "⛔ Until further notice", callback_data: "cl:indef" }]);
  if (status.closed) keyboard.push([{ text: "✅ Reopen now", callback_data: "cl:reopen" }]);
  keyboard.push(back());
  return { text: lines.join("\n"), keyboard };
};

const servicesView = async (db) => {
  const services = await getServicesFull(db);
  const cats = await getCategories(db);
  const lines = ["💇 Services & prices", ""];
  const usedCats = cats.filter((c) => services.some((s) => s.category === c));
  if (!usedCats.length) lines.push("No services yet.");
  usedCats.forEach((cat) => {
    lines.push(cat);
    services.filter((s) => s.category === cat).forEach((s) => {
      lines.push(`• ${s.name} — ${money(s.price)} · ${minutesToDuration(s.duration)}${s.active ? "" : " (hidden)"}`);
    });
    lines.push("");
  });
  const keyboard = [];
  for (let i = 0; i < services.length; i += 2) {
    keyboard.push(services.slice(i, i + 2).map((s) => ({
      text: `${s.name}${s.active ? "" : " ⏸"}`.slice(0, 22),
      callback_data: `sv:${s.id}`,
    })));
  }
  keyboard.push([{ text: "➕ Add service", callback_data: "sv:a" }]);
  keyboard.push([{ text: "🗂 Categories", callback_data: "sv:cats" }, { text: "‹ Back", callback_data: "menu" }]);
  return { text: lines.join("\n"), keyboard };
};

const serviceView = async (db, id) => {
  const s = await one(db, "SELECT * FROM services WHERE id = ?", Number(id));
  if (!s) return { text: "That service no longer exists.", keyboard: [back("sv", "‹ Services")] };
  return {
    text: [
      `💇 ${s.name}`,
      "",
      `${s.category} · ${money(s.price)} · ${minutesToDuration(s.duration)}`,
      s.active ? "Visible on the website" : "Hidden from the website",
      "",
      s.short_description || s.description || "",
    ].join("\n"),
    keyboard: [
      [{ text: "💵 Price", callback_data: `svp:${s.id}` }, { text: "⏱ Duration", callback_data: `svd:${s.id}` }],
      [{ text: "✏️ Name", callback_data: `svn:${s.id}` }, { text: "📝 Description", callback_data: `svx:${s.id}` }],
      [{ text: "🖼 Photo", callback_data: `svi:${s.id}` }],
      [{ text: s.active ? "⏸ Hide from website" : "✅ Show on website", callback_data: `svt:${s.id}` }],
      [{ text: "🗑 Delete service", callback_data: `svdl:${s.id}` }],
      back("sv", "‹ Services"),
    ],
  };
};

const categoriesView = async (db) => {
  const cats = await getCategories(db);
  return {
    text: ["🗂 Categories", "", cats.length ? cats.map((c) => `• ${c}`).join("\n") : "No categories yet."].join("\n"),
    keyboard: [
      [{ text: "➕ Add category", callback_data: "cat:a" }],
      ...cats.slice(0, 8).map((c, i) => [
        { text: `✏️ ${c}`.slice(0, 22), callback_data: `cat:r:${i}` },
        { text: "🗑", callback_data: `cat:d:${i}` },
      ]),
      back("sv", "‹ Services"),
    ],
  };
};

const imagesView = async (db) => {
  const slots = await imageSlots(db);
  const lines = ["🖼 Website images", "", "Pick a slot, then send me the new photo."];
  const keyboard = [];
  const row = (list) => {
    for (let i = 0; i < list.length; i += 2) keyboard.push(list.slice(i, i + 2));
  };
  row(slots.filter((s) => !s.kind).map((s) => ({ text: s.label.slice(0, 26), callback_data: `im:${s.key}` })));
  row(slots.filter((s) => s.kind === "service").slice(0, 8).map((s) => ({ text: s.label.replace("Service — ", "💇 ").slice(0, 24), callback_data: `im:${s.key}` })));
  row(slots.filter((s) => s.kind === "stylist").map((s) => ({ text: s.label.replace("Stylist — ", "👩 ").slice(0, 24), callback_data: `im:${s.key}` })));
  keyboard.push([{ text: "➕ Add a gallery photo", callback_data: "gal:a" }]);
  keyboard.push([{ text: "🗑 Manage gallery", callback_data: "gal:l" }]);
  keyboard.push(back());
  return { text: lines.join("\n"), keyboard };
};

const galleryManageView = async (db) => {
  const items = await galleryItems(db);
  return {
    text: ["🖼 Gallery", "", `${items.length} image(s). Tap one to delete it.`].join("\n"),
    keyboard: [
      ...items.slice(0, 10).map((g) => [{ text: `🗑 ${g.caption}`.slice(0, 40), callback_data: `gal:d:${g.id}` }]),
      back("im", "‹ Images"),
    ],
  };
};

/* ---------------- helpers ---------------- */

const show = async (env, chat, messageId, view) => {
  if (messageId) {
    const res = await editMessage(env, chat, messageId, view.text, view.keyboard);
    if (!res.ok) await sendMessage(env, chat, view.text, view.keyboard);
    return;
  }
  await sendMessage(env, chat, view.text, view.keyboard);
};

const parseTime = (text) => {
  const m = String(text || "").trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
};

const parseDate = (text) => {
  const s = String(text || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(`${s} 12:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

export const summaryText = async (db) => {
  const today = todayISO();
  const rows = await appointmentsOn(db, today);
  const blocks = await getBlocks(db, { date: today });
  const status = await siteStatus(db);
  const lines = [`☀️ Today · ${longDay(today)}`, ""];
  if (!rows.length && !blocks.length) lines.push("No bookings yet — the chairs are free.");
  rows.forEach((a) => lines.push(`${a.time} · ${a.client_name} — ${a.service_name}${a.stylist_name ? ` · ${a.stylist_name}` : ""} (${a.status})`));
  if (blocks.length) {
    lines.push("", "Blocked by you:");
    blocks.forEach((b) => lines.push(`${b.time} · ${b.client_name || "manual block"}`));
  }
  if (status.closed) lines.push("", `⛔ ${status.message}`);
  return lines.join("\n");
};

const finishServiceAdd = async (env, db, chat, payload) => {
  const id = await createService(db, {
    name: payload.name,
    category: payload.category,
    description: payload.description,
    short_description: payload.description,
    duration: payload.duration,
    price: payload.price,
    image: payload.image || undefined,
  });
  await clearState(db, chat);
  const s = await one(db, "SELECT * FROM services WHERE id = ?", id);
  await sendMessage(env, chat, `✅ Added “${s?.name || payload.name}” — ${money(payload.price)} · ${minutesToDuration(payload.duration)}.\nIt is live on the website now.`, [[{ text: "💇 Services", callback_data: "sv" }, { text: "‹ Menu", callback_data: "menu" }]]);
};

const saveManual = async (env, db, chat, payload) => {
  const res = await addBlock(db, {
    date: payload.date, time: payload.time,
    client_name: payload.name || "Manual booking",
    phone: payload.phone || null,
    service_id: payload.service_id || null,
    note: "Added from Telegram",
  });
  await clearState(db, chat);
  if (!res.ok) {
    return sendMessage(env, chat, `⚠️ ${res.error}`, [[{ text: "➕ Try another slot", callback_data: "mn:date" }], back()]);
  }
  return sendMessage(
    env, chat,
    `✅ ${longDay(payload.date)} at ${timeLabel(payload.time)} is now taken.\nCustomers can no longer book it.`,
    [[{ text: "➕ Add another", callback_data: "mn:date" }, { text: "🚫 Taken slots", callback_data: "um" }], back()],
  );
};

/* ---------------- message + callback handling ---------------- */

const handleText = async (env, db, chat, text) => {
  const state = await stateOf(db, chat);
  const step = state.step;

  if (!step) {
    const cmd = String(text || "").trim().toLowerCase();
    if (cmd === "/today") return show(env, chat, null, await appointmentsView(db, "today"));
    if (cmd === "/summary") return sendMessage(env, chat, await summaryText(db), [back()]);
    return show(env, chat, null, menuView(env));
  }

  const payload = state.payload;

  if (step === "mn.name") {
    payload.name = String(text).trim().slice(0, 80);
    await setState(db, chat, "mn.phone", payload);
    return sendMessage(env, chat, "Phone number? Or tap Skip.", [[{ text: "Skip", callback_data: "mn:skip" }]]);
  }

  if (step === "mn.phone") {
    payload.phone = String(text).trim().slice(0, 40);
    await setState(db, chat, "mn.service", payload);
    const services = await getServicesFull(db);
    const keyboard = [];
    for (let i = 0; i < services.length; i += 2) {
      keyboard.push(services.slice(i, i + 2).map((s) => ({ text: s.name.slice(0, 20), callback_data: `mn:sv:${s.id}` })));
    }
    keyboard.push([{ text: "Skip", callback_data: "mn:save" }]);
    return sendMessage(env, chat, "Which service? (optional)", keyboard);
  }

  if (step === "hours.open" || step === "hours.close") {
    const value = parseTime(text);
    if (!value) return sendMessage(env, chat, "Please send a time like 09:30.");
    const day = payload.day;
    const h = await hoursForDay(db, day);
    await saveHours(db, [{ ...h, [step === "hours.open" ? "open" : "close"]: value }]);
    await clearState(db, chat);
    return show(env, chat, null, await hoursDayView(db, day));
  }

  if (step === "hours.break") {
    const trimmed = String(text).trim().toLowerCase();
    if (["none", "no", "clear", "off"].includes(trimmed)) {
      await setBreak(db, "", "");
    } else {
      const m = trimmed.match(/^(\d{1,2}[:.]\d{2})\s*[-–to]+\s*(\d{1,2}[:.]\d{2})$/);
      const start = m ? parseTime(m[1]) : null;
      const end = m ? parseTime(m[2]) : null;
      if (!start || !end) return sendMessage(env, chat, "Send the break like 13:00-13:30, or “none”.");
      await setBreak(db, start, end);
    }
    await clearState(db, chat);
    return show(env, chat, null, await hoursView(db));
  }

  if (step === "closure.one") {
    const [datePart, ...rest] = String(text).split("|");
    const date = parseDate(datePart);
    if (!date) return sendMessage(env, chat, "Send a date like 2026-12-24, then an optional message after |");
    await addClosure(db, { start_date: date, end_date: date, message: rest.join("|").trim() || null });
    await clearState(db, chat);
    return show(env, chat, null, await closuresView(db));
  }

  if (step === "closure.range" || step === "closure.indef") {
    const raw = String(text);
    const [datesPart, ...rest] = raw.split("|");
    const message = rest.join("|").trim() || null;
    if (step === "closure.indef") {
      const start = parseDate(datesPart) || todayISO();
      await addClosure(db, { start_date: start, indefinite: true, message });
    } else {
      const parts = datesPart.split(/\.\.|\s+to\s+|\s+-\s+/);
      const start = parseDate(parts[0]);
      const end = parseDate(parts[1] || "");
      if (!start || !end) return sendMessage(env, chat, "Send the range like 2026-12-24..2027-01-02, then an optional message after |");
      await addClosure(db, { start_date: start, end_date: end, message });
    }
    await clearState(db, chat);
    return show(env, chat, null, await closuresView(db));
  }

  if (step.startsWith("sv.")) {
    const field = step.split(".")[1];
    const id = payload.id;
    if (field === "name") await updateService(db, id, { name: String(text).trim().slice(0, 120) });
    if (field === "description") await updateService(db, id, { description: String(text).trim().slice(0, 2000), short_description: String(text).trim().slice(0, 240) });
    if (field === "duration") {
      const mins = Number(String(text).replace(/\D/g, ""));
      if (!mins || mins < 15) return sendMessage(env, chat, "Send the duration in minutes, e.g. 90.");
      await updateService(db, id, { duration: mins });
    }
    if (field === "price") {
      const price = Number(String(text).replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(price)) return sendMessage(env, chat, "Send the price as a number, e.g. 120.");
      await updateService(db, id, { price: Math.round(price) });
    }
    await clearState(db, chat);
    return show(env, chat, null, await serviceView(db, id));
  }

  if (step === "service.name") {
    payload.name = String(text).trim().slice(0, 120);
    await setState(db, chat, "service.desc", payload);
    return sendMessage(env, chat, "Short description? (one line for the website)");
  }
  if (step === "service.desc") {
    payload.description = String(text).trim().slice(0, 400);
    await setState(db, chat, "service.duration", payload);
    return sendMessage(env, chat, "Duration in minutes? e.g. 60");
  }
  if (step === "service.duration") {
    const mins = Number(String(text).replace(/\D/g, ""));
    if (!mins || mins < 15) return sendMessage(env, chat, "Send the duration in minutes, e.g. 60.");
    payload.duration = mins;
    await setState(db, chat, "service.price", payload);
    return sendMessage(env, chat, "Price in dollars? e.g. 120");
  }
  if (step === "service.price") {
    const price = Number(String(text).replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(price)) return sendMessage(env, chat, "Send the price as a number, e.g. 120.");
    payload.price = Math.round(price);
    await setState(db, chat, "service.photo", payload);
    return sendMessage(env, chat, "Send a photo for this service, or tap Skip.", [[{ text: "Skip", callback_data: "sv:skip" }]]);
  }

  if (step === "image.slot" || step === "gallery.add" || step === "service.photo") {
    return sendMessage(env, chat, "Please send it as a photo (not a file), or tap Back.", [back("im", "‹ Images")]);
  }

  if (step === "cat.rename") {
    const to = String(text).trim().slice(0, 60);
    const res = await renameCategory(db, payload.from, to);
    await clearState(db, chat);
    if (!res.ok) return sendMessage(env, chat, `⚠️ ${res.error}`);
    return show(env, chat, null, await categoriesView(db));
  }

  if (step === "cat.new") {
    const name = String(text).trim().slice(0, 60);
    if (!name) return sendMessage(env, chat, "Send a category name.");
    await run(db, "INSERT OR IGNORE INTO service_categories (name) VALUES (?)", name);
    await clearState(db, chat);
    return show(env, chat, null, await categoriesView(db));
  }

  await clearState(db, chat);
  return show(env, chat, null, menuView(env));
};

const handlePhoto = async (env, db, chat, message) => {
  const state = await stateOf(db, chat);
  const photos = message.photo || [];
  const fileId = photos[photos.length - 1]?.file_id;
  if (!fileId) return sendMessage(env, chat, "Send the replacement as a photo, please.");

  const file = await downloadTelegramFile(env, fileId);
  if (!file.ok) return sendMessage(env, chat, `❌ ${file.error}`);
  const media = await saveMedia(db, { bytes: file.bytes, contentType: file.contentType, filename: "telegram-photo" });
  if (!media.ok) return sendMessage(env, chat, `❌ ${media.error}`);

  if (state.step === "image.slot") {
    await setImageSlot(db, state.payload.key, media.url);
    await clearState(db, chat);
    return sendMessage(env, chat, "✅ Image replaced — it is live on the website.", [[{ text: "🖼 Images", callback_data: "im" }], back()]);
  }
  if (state.step === "gallery.add") {
    await addGalleryItem(db, { image: media.url, caption: state.payload.caption || "Recent work", category: state.payload.category || "Cuts" });
    await clearState(db, chat);
    return sendMessage(env, chat, "✅ Added to the gallery.", [[{ text: "🖼 Images", callback_data: "im" }], back()]);
  }
  if (state.step === "service.photo") {
    const payload = { ...state.payload, image: media.url };
    return finishServiceAdd(env, db, chat, payload);
  }
  return sendMessage(env, chat, "Photo saved, but nothing was waiting for it. Use the Images menu.", [[{ text: "🖼 Images", callback_data: "im" }]]);
};

const handleCallback = async (env, db, chat, data, messageId) => {
  const [head, ...rest] = String(data).split(":");
  const arg = rest.join(":");

  if (head === "menu") { await clearState(db, chat); return show(env, chat, messageId, menuView(env)); }
  if (head === "help") return show(env, chat, messageId, helpView(env));

  if (head === "appts") {
    if (arg === "summary") {
      await sendMessage(env, chat, await summaryText(db), [back()]);
      return;
    }
    return show(env, chat, messageId, await appointmentsView(db, arg || "today"));
  }

  if (head === "appt") {
    const [action, id] = arg.split(":");
    const appt = await one(db, "SELECT * FROM appointments WHERE id = ?", Number(id));
    if (!appt) return sendMessage(env, chat, "That appointment no longer exists.", [back()]);
    if (action === "c") {
      await run(db, "UPDATE appointments SET status = 'confirmed', updated_at = datetime('now') WHERE id = ?", appt.id);
      await queueEmail(env, {
        to: appt.email,
        subject: `Confirmed: ${appt.ref}`,
        kind: "booking_confirmed",
        body: `<p>Good news — your appointment ${appt.ref} on ${appt.date} at ${appt.time} is confirmed.</p>`,
      });
      await sendMessage(env, chat, `✅ Confirmed ${appt.ref} — ${appt.client_name}, ${appt.date} ${appt.time}.`, [back()]);
    } else {
      await run(db, "UPDATE appointments SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?", appt.id);
      await queueEmail(env, {
        to: appt.email,
        subject: `Cancelled: ${appt.ref}`,
        kind: "booking_cancelled",
        body: `<p>Your appointment ${appt.ref} has been cancelled. Please call the salon and we will find you a new time.</p>`,
      });
      await sendMessage(env, chat, `❌ Cancelled ${appt.ref} — the slot is free again.`, [back()]);
    }
    return;
  }

  if (head === "mn") {
    if (arg === "date") return show(env, chat, messageId, await manualDatesView(db));
    if (arg.startsWith("d:")) {
      const date = arg.slice(2);
      await clearState(db, chat);
      return show(env, chat, messageId, await manualSlotsView(db, date));
    }
    if (arg.startsWith("t:")) {
      const parts = arg.split(":");
      const date = parts[1];
      const time = parts.slice(2).join(":");
      await setState(db, chat, "mn.name", { date, time });
      return show(env, chat, messageId, {
        text: `➕ Manual booking\n\n${longDay(date)} at ${timeLabel(time)}\n\nClient name? Or tap Skip.`,
        keyboard: [[{ text: "Skip", callback_data: "mn:skip" }], back("menu")],
      });
    }
    if (arg === "skip") {
      const state = await stateOf(db, chat);
      if (state.step === "mn.name" || state.step === "mn.phone") {
        await setState(db, chat, "mn.service", state.payload);
        const services = await getServicesFull(db);
        const keyboard = [];
        for (let i = 0; i < services.length; i += 2) {
          keyboard.push(services.slice(i, i + 2).map((s) => ({ text: s.name.slice(0, 20), callback_data: `mn:sv:${s.id}` })));
        }
        keyboard.push([{ text: "Skip", callback_data: "mn:save" }]);
        return show(env, chat, messageId, { text: "Which service? (optional)", keyboard });
      }
      const stateNow = await stateOf(db, chat);
      return saveManual(env, db, chat, stateNow.payload);
    }
    if (arg === "save") {
      const state = await stateOf(db, chat);
      return saveManual(env, db, chat, state.payload);
    }
    if (arg.startsWith("sv:")) {
      const state = await stateOf(db, chat);
      state.payload.service_id = Number(arg.slice(3));
      await setState(db, chat, "mn.save", state.payload);
      return saveManual(env, db, chat, state.payload);
    }
  }

  if (head === "um") {
    if (!arg) {
      const blocks = await getBlocks(db);
      const upcoming = blocks.filter((b) => b.date >= todayISO()).slice(0, 12);
      return show(env, chat, messageId, {
        text: ["🚫 Slots marked as taken", "", upcoming.length ? "Tap one to free it again." : "Nothing blocked. The website decides every slot."].join("\n"),
        keyboard: [
          ...upcoming.map((b) => [{ text: `🔓 ${b.date} ${b.time} ${b.client_name || ""}`.slice(0, 38), callback_data: `um:d:${b.id}` }]),
          back(),
        ],
      });
    }
    if (arg.startsWith("d:")) {
      await deleteBlock(db, arg.slice(2));
      await sendMessage(env, chat, "🔓 Slot freed — customers can book it again.", [back()]);
      return;
    }
  }

  if (head === "hr") {
    if (!arg) return show(env, chat, messageId, await hoursView(db));
    const [action, rawDay] = arg.split(":");
    if (action === "d") return show(env, chat, messageId, await hoursDayView(db, Number(rawDay)));
    if (action === "t") {
      await toggleDay(db, Number(rawDay));
      return show(env, chat, messageId, await hoursDayView(db, Number(rawDay)));
    }
    if (action === "o" || action === "c") {
      const label = action === "o" ? "opening" : "closing";
      await setState(db, chat, action === "o" ? "hours.open" : "hours.close", { day: Number(rawDay) });
      return show(env, chat, messageId, {
        text: `Send the ${label} time for ${DAY_NAMES[Number(rawDay)]} — e.g. ${action === "o" ? "09:30" : "19:00"}`,
        keyboard: [back(`hr:d:${rawDay}`, "‹ Cancel")],
      });
    }
    if (action === "i") {
      const settings = await getSettings(db);
      const current = Number(settings.slot_interval) || 30;
      const next = current === 30 ? 60 : current === 60 ? 15 : 30;
      await setSlotInterval(db, next);
      return show(env, chat, messageId, await hoursView(db));
    }
    if (action === "b") {
      await setState(db, chat, "hours.break", {});
      return show(env, chat, messageId, {
        text: "Send the break like 13:00-13:30, or “none” to remove it.",
        keyboard: [back("hr", "‹ Cancel")],
      });
    }
  }

  if (head === "cl") {
    if (!arg) return show(env, chat, messageId, await closuresView(db));
    if (arg === "one") {
      await setState(db, chat, "closure.one", {});
      return show(env, chat, messageId, {
        text: "Which day should be closed?\nSend the date (2026-12-24) and, if you like, a message after a bar: 2026-12-24 | Closed for the holiday",
        keyboard: [back("cl", "‹ Cancel")],
      });
    }
    if (arg === "range") {
      await setState(db, chat, "closure.range", {});
      return show(env, chat, messageId, {
        text: "Send the range like 2026-12-24..2027-01-02, with an optional message after a bar.",
        keyboard: [back("cl", "‹ Cancel")],
      });
    }
    if (arg === "indef") {
      await setState(db, chat, "closure.indef", {});
      return show(env, chat, messageId, {
        text: "Closed until further notice.\nSend the first closed date (or “today”) and an optional message after a bar.",
        keyboard: [back("cl", "‹ Cancel")],
      });
    }
    if (arg === "reopen") {
      const today = todayISO();
      const rows = await getClosures(db);
      const active = rows.filter((c) => c.start_date <= today && (c.indefinite || !c.end_date || c.end_date >= today));
      for (const c of active) await deleteClosure(db, c.id);
      await sendMessage(env, chat, "✅ Reopened — the booking page shows slots again.", [back("cl", "‹ Closed days")]);
      return;
    }
    if (arg.startsWith("del:")) {
      await deleteClosure(db, arg.slice(4));
      return show(env, chat, messageId, await closuresView(db));
    }
  }

  if (head === "sv") {
    if (arg === "cats") return show(env, chat, messageId, await categoriesView(db));
    if (arg === "skip") {
      const state = await stateOf(db, chat);
      if (state.step === "service.photo") return finishServiceAdd(env, db, chat, state.payload);
      return show(env, chat, messageId, await servicesView(db));
    }
    if (arg === "a") {
      const cats = await getCategories(db);
      const keyboard = cats.slice(0, 8).map((c, i) => [{ text: c, callback_data: `sa:${i}` }]);
      keyboard.push([{ text: "➕ New category", callback_data: "sa:n" }]);
      keyboard.push(back("sv", "‹ Services"));
      await setState(db, chat, "service.category", {});
      return show(env, chat, messageId, { text: "➕ New service\n\nWhich category?", keyboard });
    }
    if (Number(arg)) return show(env, chat, messageId, await serviceView(db, Number(arg)));
  }

  if (head === "sa") {
    const cats = await getCategories(db);
    if (arg === "n") {
      await setState(db, chat, "cat.new", {});
      return show(env, chat, messageId, { text: "Send the new category name.", keyboard: [back("sv", "‹ Cancel")] });
    }
    const category = cats[Number(arg)];
    if (!category) return show(env, chat, messageId, await servicesView(db));
    await setState(db, chat, "service.name", { category });
    return show(env, chat, messageId, {
      text: `➕ New service in ${category}\n\nName?`,
      keyboard: [back("sv", "‹ Cancel")],
    });
  }

  if (head === "svp" || head === "svd" || head === "svn" || head === "svx") {
    const id = Number(arg);
    const field = { svp: "price", svd: "duration", svn: "name", svx: "description" }[head];
    await setState(db, chat, `sv.${field}`, { id });
    const prompt = {
      price: "Send the new price in dollars, e.g. 120",
      duration: "Send the new duration in minutes, e.g. 90",
      name: "Send the new name",
      description: "Send the new description",
    }[field];
    return show(env, chat, messageId, { text: prompt, keyboard: [back(`sv:${id}`, "‹ Cancel")] });
  }

  if (head === "svt") {
    const s = await one(db, "SELECT * FROM services WHERE id = ?", Number(arg));
    if (s) await updateService(db, s.id, { active: s.active ? 0 : 1 });
    return show(env, chat, messageId, await serviceView(db, Number(arg)));
  }

  if (head === "svdl") {
    const res = await deleteService(db, Number(arg));
    await sendMessage(env, chat, res.ok ? "🗑 Service deleted." : `⚠️ ${res.error}`, [back("sv", "‹ Services")]);
    return;
  }

  if (head === "svi") {
    await setState(db, chat, "image.slot", { key: `service:${arg}` });
    return show(env, chat, messageId, { text: "Send the new photo for this service.", keyboard: [back(`sv:${arg}`, "‹ Cancel")] });
  }

  if (head === "cat") {
    if (arg === "a") {
      await setState(db, chat, "cat.new", {});
      return show(env, chat, messageId, { text: "Send the new category name.", keyboard: [back("sv:cats", "‹ Cancel")] });
    }
    const cats = await getCategories(db);
    const [action, rawIndex] = arg.split(":");
    const name = cats[Number(rawIndex)];
    if (!name) return show(env, chat, messageId, await categoriesView(db));
    if (action === "d") {
      const res = await deleteCategory(db, name);
      await sendMessage(env, chat, res.ok ? `🗑 Deleted “${name}”.` : `⚠️ ${res.error}`, [back("sv:cats", "‹ Categories")]);
      return;
    }
    if (action === "r") {
      await setState(db, chat, "cat.rename", { from: name });
      return show(env, chat, messageId, {
        text: `Send the new name for “${name}”.`,
        keyboard: [back("sv:cats", "‹ Cancel")],
      });
    }
  }

  if (head === "im") {
    if (!arg) return show(env, chat, messageId, await imagesView(db));
    await setState(db, chat, "image.slot", { key: arg });
    return show(env, chat, messageId, {
      text: "Send the new photo for this slot. I will replace it on the website immediately.",
      keyboard: [back("im", "‹ Images")],
    });
  }

  if (head === "gal") {
    if (arg === "a") {
      await setState(db, chat, "gallery.add", { caption: "Recent work", category: "Cuts" });
      return show(env, chat, messageId, { text: "Send the photo to add to the gallery.", keyboard: [back("im", "‹ Images")] });
    }
    if (arg === "l") return show(env, chat, messageId, await galleryManageView(db));
    if (arg.startsWith("d:")) {
      await deleteGalleryItem(db, arg.slice(2));
      await sendMessage(env, chat, "🗑 Removed from the gallery.", [back("gal:l", "‹ Gallery")]);
      return;
    }
  }
};

/* ---------------- entry point ---------------- */

export async function handleWebhook(request, env) {
  if (!tgConfigured(env)) return { ok: true, skipped: "not-configured" };
  let update = {};
  try { update = await request.json(); } catch { return { ok: true, skipped: "bad-json" }; }

  const db = env.DB;
  await ensureSalon(db);

  const message = update.message;
  const callback = update.callback_query;
  const chat = message?.chat?.id ?? callback?.message?.chat?.id;
  if (!chat) return { ok: true };
  if (String(chat) !== String(env.TELEGRAM_CHAT_ID)) return { ok: true, ignored: true };

  if (callback) {
    const messageId = callback.message?.message_id;
    await answerCallback(env, callback.id, "");
    try {
      await handleCallback(env, db, chat, callback.data || "", messageId);
    } catch (err) {
      console.error("[bot] callback failed", err?.stack || err);
      await sendMessage(env, chat, "⚠️ Something went wrong. Try /menu.", [back()]);
    }
    return { ok: true };
  }

  if (!message) return { ok: true };

  try {
    if (Array.isArray(message.photo) && message.photo.length) return await handlePhoto(env, db, chat, message);
    if (message.text) return await handleText(env, db, chat, message.text);
    await sendMessage(env, chat, "Send text or a photo, or use /menu.", [back()]);
  } catch (err) {
    console.error("[bot] message failed", err?.stack || err);
    await sendMessage(env, chat, "⚠️ Something went wrong. Try /menu.", [back()]);
  }
  return { ok: true };
}

export const sendDailySummary = async (env) => {
  if (!tgConfigured(env)) return { sent: false };
  const settings = await getSettings(env.DB);
  if (settings.daily_summary !== "1") return { sent: false, reason: "disabled" };
  const res = await sendMessage(env, env.TELEGRAM_CHAT_ID, await summaryText(env.DB), [back()]);
  return { sent: !!res.ok };
};
