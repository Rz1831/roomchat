// Shared salon domain: settings, availability, closures, blocked slots,
// services/categories and image slots. Used by the public site, the JSON API,
// the Telegram bot and the Telegram Mini App so every surface sees one truth.
import {
  all, one, run, getHours, getStylists, getServices, getGallery,
} from "./db.js";
import {
  todayISO, parseISO, addDays, timeToMinutes, minutesToTime, randomToken, DAY_NAMES,
} from "./util.js";

/* ---------------- settings ---------------- */

export const DEFAULT_SETTINGS = {
  "image.hero": "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1100&q=85",
  "image.about": "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=1000&q=80",
  "image.about2": "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1000&q=80",
  "image.about3": "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=80",
  "image.story": "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1000&q=80",
  "image.cta": "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80",
  "image.banner": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
  slot_interval: "30",
  break_start: "",
  break_end: "",
  daily_summary: "1",
  salon_name: "LUMIÈRE Hair Salon",
  salon_phone: "+1 (323) 555-0184",
  salon_address: "1428 Abbot Kinney Blvd, Los Angeles, CA 90291",
  salon_message: "",
};

let ready = null;

// Creates the setting rows, default categories and the booking grid the first
// time the app talks to this database (idempotent, safe on every cold start).
export const ensureSalon = async (db) => {
  if (!ready) {
    ready = (async () => {
      for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        await run(db, "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", key, value);
      }
      const cats = await all(db, "SELECT DISTINCT category FROM services");
      for (const row of cats) {
        if (row.category) await run(db, "INSERT OR IGNORE INTO service_categories (name) VALUES (?)", row.category);
      }
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
};

export const getSettings = async (db) => {
  const rows = await all(db, "SELECT key, value FROM settings");
  const map = { ...DEFAULT_SETTINGS };
  for (const row of rows) map[row.key] = row.value;
  return map;
};

export const setSetting = (db, key, value) =>
  run(db, "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", key, String(value ?? ""));

const INTERVALS = [15, 30, 60];

export const setSlotInterval = async (db, minutes) => {
  const value = INTERVALS.includes(Number(minutes)) ? Number(minutes) : 30;
  await setSetting(db, "slot_interval", String(value));
  return value;
};

export const setBreak = async (db, start, end) => {
  const clean = (v) => (/^\d{2}:\d{2}$/.test(String(v || "")) ? String(v) : "");
  await setSetting(db, "break_start", clean(start));
  await setSetting(db, "break_end", clean(end));
};

/* ---------------- opening hours ---------------- */

export const hoursForDay = async (db, day) => (await getHours(db)).find((h) => Number(h.day) === Number(day)) || null;

export const saveHours = async (db, rows) => {
  for (const h of rows) {
    await run(
      db,
      "UPDATE opening_hours SET open = ?, close = ?, closed = ? WHERE day = ?",
      String(h.open || "10:00"), String(h.close || "19:00"), h.closed ? 1 : 0, Number(h.day),
    );
  }
  return getHours(db);
};

export const toggleDay = async (db, day) => {
  const row = await hoursForDay(db, day);
  if (!row) return null;
  await run(db, "UPDATE opening_hours SET closed = ? WHERE day = ?", row.closed ? 0 : 1, Number(day));
  return hoursForDay(db, day);
};

/* ---------------- closures ---------------- */

export const getClosures = (db) => all(db, "SELECT * FROM closures ORDER BY start_date, id");

export const activeClosure = (db, date) =>
  one(
    db,
    `SELECT * FROM closures
      WHERE start_date <= ? AND (indefinite = 1 OR end_date IS NULL OR end_date >= ?)
      ORDER BY indefinite DESC, start_date LIMIT 1`,
    date, date,
  );

export const addClosure = async (db, { start_date, end_date = null, indefinite = false, message = null }) => {
  const start = /^\d{4}-\d{2}-\d{2}$/.test(String(start_date)) ? String(start_date) : todayISO();
  const end = indefinite || !/^\d{4}-\d{2}-\d{2}$/.test(String(end_date || "")) ? null : String(end_date);
  const res = await run(
    db,
    "INSERT INTO closures (start_date, end_date, indefinite, message) VALUES (?,?,?,?)",
    start, end, indefinite ? 1 : 0, message ? String(message).slice(0, 300) : null,
  );
  return res.meta?.last_row_id || null;
};

export const deleteClosure = (db, id) => run(db, "DELETE FROM closures WHERE id = ?", Number(id));

export const closureLabel = (c) => {
  if (c.indefinite) return `Closed from ${c.start_date} until further notice`;
  if (!c.end_date) return `Closed ${c.start_date}`;
  if (c.end_date === c.start_date) return `Closed ${c.start_date}`;
  return `Closed ${c.start_date} → ${c.end_date}`;
};

/* ---------------- blocked slots (manual bookings) ---------------- */

export const getBlocks = (db, { date = null } = {}) =>
  date
    ? all(db, "SELECT b.*, s.name AS service_name FROM blocked_slots b LEFT JOIN services s ON s.id = b.service_id WHERE b.date = ? ORDER BY b.time", date)
    : all(db, "SELECT b.*, s.name AS service_name FROM blocked_slots b LEFT JOIN services s ON s.id = b.service_id ORDER BY b.date, b.time");

export const addBlock = async (db, { date, time, client_name = null, phone = null, service_id = null, note = null }) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !/^\d{2}:\d{2}$/.test(String(time))) {
    return { ok: false, error: "Pick a valid date and time." };
  }
  const taken = await one(
    db,
    "SELECT id FROM appointments WHERE date = ? AND time = ? AND status != 'cancelled'",
    date, time,
  );
  if (taken) return { ok: false, error: "That slot already has a website booking." };
  const existing = await one(db, "SELECT id FROM blocked_slots WHERE date = ? AND time = ?", date, time);
  if (existing) return { ok: false, error: "That slot is already marked as taken." };
  await run(
    db,
    "INSERT INTO blocked_slots (date, time, client_name, phone, service_id, note) VALUES (?,?,?,?,?,?)",
    date, time, client_name || null, phone || null, service_id ? Number(service_id) : null, note ? String(note).slice(0, 300) : null,
  );
  return { ok: true };
};

export const deleteBlock = (db, id) => run(db, "DELETE FROM blocked_slots WHERE id = ?", Number(id));

/* ---------------- availability ---------------- */

const salonNow = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const pick = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
  return pick("hour") * 60 + pick("minute");
};

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

export const availableSlots = async (db, { date, stylistId = null, serviceId = null } = {}) => {
  await ensureSalon(db);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return { slots: [], reason: "invalid-date" };

  const closure = await activeClosure(db, date);
  if (closure) {
    return {
      slots: [],
      reason: "closure",
      note: closure.message || "",
      closure: {
        id: closure.id,
        indefinite: !!closure.indefinite,
        start_date: closure.start_date,
        end_date: closure.end_date,
        message: closure.message || "",
      },
    };
  }

  const holiday = await one(db, "SELECT reason FROM holidays WHERE date = ?", date);
  if (holiday) return { slots: [], reason: "holiday", note: holiday.reason };

  const settings = await getSettings(db);
  const dow = parseISO(date).getUTCDay();
  const hours = await one(db, "SELECT * FROM opening_hours WHERE day = ?", dow);
  if (!hours || hours.closed) return { slots: [], reason: "closed" };

  const interval = INTERVALS.includes(Number(settings.slot_interval)) ? Number(settings.slot_interval) : 30;
  const breakStart = settings.break_start ? timeToMinutes(settings.break_start) : null;
  const breakEnd = settings.break_end ? timeToMinutes(settings.break_end) : null;
  const hasBreak = breakStart !== null && breakEnd !== null && breakEnd > breakStart;

  const stylists = await getStylists(db);
  let pool = stylists.filter((s) => String(s.working_days).split(",").includes(String(dow)));
  if (stylistId) {
    pool = pool.filter((s) => String(s.id) === String(stylistId));
    if (!pool.length) return { slots: [], reason: "stylist-off" };
  }

  let start = timeToMinutes(hours.open);
  let end = timeToMinutes(hours.close);
  if (stylistId && pool[0]) {
    start = Math.max(start, timeToMinutes(pool[0].start_time));
    end = Math.min(end, timeToMinutes(pool[0].end_time));
  }

  let duration = Math.max(15, Number(settings.slot_interval) || 30);
  if (serviceId) {
    const service = await one(db, "SELECT duration FROM services WHERE id = ?", serviceId);
    duration = Math.max(15, Number(service?.duration || 60));
  }

  const booked = await all(
    db,
    `SELECT a.time, a.stylist_id, COALESCE(s.duration, 30) AS duration
       FROM appointments a LEFT JOIN services s ON s.id = a.service_id
      WHERE a.date = ? AND a.status != 'cancelled'`,
    date,
  );
  const blocks = await all(
    db,
    `SELECT b.time, COALESCE(s.duration, ?) AS duration
       FROM blocked_slots b LEFT JOIN services s ON s.id = b.service_id
      WHERE b.date = ?`,
    interval, date,
  );

  const rangesFor = (sel) =>
    booked
      .filter((b) => !sel || String(b.stylist_id) === String(sel))
      .map((b) => [timeToMinutes(b.time), timeToMinutes(b.time) + Number(b.duration || duration)]);

  const blockRanges = blocks.map((b) => [timeToMinutes(b.time), timeToMinutes(b.time) + Number(b.duration || interval)]);
  const isToday = date === todayISO();
  const now = salonNow();
  const slots = [];

  for (let t = start; t + duration <= end; t += interval) {
    const slotEnd = t + duration;
    if (isToday && t <= now + 30) continue;
    if (hasBreak && overlaps(t, slotEnd, breakStart, breakEnd)) continue;
    if (blockRanges.some(([bs, be]) => overlaps(t, slotEnd, bs, be))) continue;
    if (stylistId) {
      if (rangesFor(stylistId).some(([bs, be]) => overlaps(t, slotEnd, bs, be))) continue;
    } else {
      const free = pool.filter((s) => !rangesFor(s.id).some(([bs, be]) => overlaps(t, slotEnd, bs, be))).length;
      if (!free) continue;
    }
    slots.push(minutesToTime(t));
  }

  return { slots, reason: slots.length ? "ok" : "full", capacity: Math.max(1, pool.length), interval, duration };
};

export const isSlotFree = async (db, opts) => {
  const { slots } = await availableSlots(db, opts);
  return slots.includes(opts.time);
};

/* ---------------- appointments read helpers ---------------- */

export const APPOINTMENT_SELECT = `
  SELECT a.*, s.name AS service_name, s.slug AS service_slug, s.price AS price, s.duration AS duration,
         st.name AS stylist_name
    FROM appointments a
    JOIN services s ON s.id = a.service_id
    LEFT JOIN stylists st ON st.id = a.stylist_id`;

export const appointmentsOn = (db, date) =>
  all(db, `${APPOINTMENT_SELECT} WHERE a.date = ? AND a.status != 'cancelled' ORDER BY a.time`, date);

export const appointmentsBetween = (db, from, to) =>
  all(db, `${APPOINTMENT_SELECT} WHERE a.date BETWEEN ? AND ? AND a.status != 'cancelled' ORDER BY a.date, a.time`, from, to);

export const pendingAppointments = (db) =>
  all(db, `${APPOINTMENT_SELECT} WHERE a.status = 'pending' AND a.date >= ? ORDER BY a.date, a.time`, todayISO());

/* ---------------- services + categories ---------------- */

export const getCategories = async (db) => {
  await ensureSalon(db);
  const rows = await all(db, "SELECT * FROM service_categories ORDER BY sort_order, name");
  return rows.map((r) => r.name);
};

export const addCategory = async (db, name) => {
  const clean = String(name || "").trim().slice(0, 60);
  if (!clean) return { ok: false, error: "Category name is empty." };
  await run(db, "INSERT OR IGNORE INTO service_categories (name) VALUES (?)", clean);
  return { ok: true, name: clean };
};

export const renameCategory = async (db, from, to) => {
  const clean = String(to || "").trim().slice(0, 60);
  if (!clean) return { ok: false, error: "Category name is empty." };
  await run(db, "UPDATE service_categories SET name = ? WHERE name = ?", clean, from);
  await run(db, "UPDATE services SET category = ? WHERE category = ?", clean, from);
  return { ok: true, name: clean };
};

export const deleteCategory = async (db, name) => {
  const used = await one(db, "SELECT COUNT(*) AS n FROM services WHERE category = ?", name);
  if (used && Number(used.n) > 0) return { ok: false, error: `“${name}” still has ${used.n} service(s). Move or delete them first.` };
  await run(db, "DELETE FROM service_categories WHERE name = ?", name);
  return { ok: true };
};

export const getServicesFull = (db) => getServices(db, { activeOnly: false });

const slugify = (name) =>
  String(name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "service";

export const createService = async (db, data) => {
  let slug = slugify(data.name);
  const clash = await one(db, "SELECT id FROM services WHERE slug = ?", slug);
  if (clash) slug = `${slug}-${randomToken(2)}`;
  const sort = await one(db, "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM services");
  const res = await run(
    db,
    `INSERT INTO services (slug, name, category, short_description, description, price, duration, image, featured, active, sort_order)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    slug,
    String(data.name || "New service").slice(0, 120),
    String(data.category || "Services").slice(0, 60),
    String(data.short_description || data.description || "").slice(0, 240),
    String(data.description || "").slice(0, 2000),
    Math.max(0, Number(data.price) || 0),
    Math.max(15, Number(data.duration) || 60),
    String(data.image || DEFAULT_SETTINGS["image.cta"]),
    data.featured ? 1 : 0,
    1,
    Number(sort?.next || 1),
  );
  return res.meta?.last_row_id || null;
};

export const updateService = async (db, id, fields) => {
  const allowed = ["name", "category", "short_description", "description", "price", "duration", "image", "active", "featured"];
  const keys = Object.keys(fields).filter((k) => allowed.includes(k));
  if (!keys.length) return { ok: false, error: "Nothing to update." };
  await run(
    db,
    `UPDATE services SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`,
    ...keys.map((k) => {
      if (["price", "duration"].includes(k)) return Math.max(k === "price" ? 0 : 15, Number(fields[k]) || 0);
      if (["active", "featured"].includes(k)) return fields[k] ? 1 : 0;
      return String(fields[k]).slice(0, 2000);
    }),
    Number(id),
  );
  return { ok: true };
};

export const deleteService = async (db, id) => {
  const used = await one(db, "SELECT COUNT(*) AS n FROM appointments WHERE service_id = ?", Number(id));
  if (used && Number(used.n) > 0) return { ok: false, error: "This service has appointments. Deactivate it instead of deleting." };
  await run(db, "DELETE FROM services WHERE id = ?", Number(id));
  return { ok: true };
};

/* ---------------- media + image slots ---------------- */

export const MAX_UPLOAD = 4 * 1024 * 1024;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export const saveMedia = async (db, { bytes, contentType, filename }) => {
  const type = String(contentType || "").split(";")[0].trim().toLowerCase();
  if (!OK_TYPES.includes(type)) return { ok: false, error: "Please send a JPG, PNG, WebP, GIF or AVIF image." };
  if (!bytes || bytes.byteLength > MAX_UPLOAD) return { ok: false, error: "Images must be smaller than 4 MB." };
  const id = randomToken(10);
  await run(
    db,
    "INSERT INTO media (id, filename, content_type, size, data) VALUES (?,?,?,?,?)",
    id, String(filename || "upload").slice(0, 120), type, bytes.byteLength, bytes,
  );
  return { ok: true, id, url: `/media/${id}` };
};

export const IMAGE_SLOT_LABELS = {
  "image.hero": "Home — hero",
  "image.about": "About — salon interior",
  "image.about2": "About — in the chair",
  "image.about3": "About — closing image",
  "image.story": "Home — story image",
  "image.cta": "Home — call to action",
  "image.banner": "Banner / social share",
};

export const imageSlots = async (db) => {
  const settings = await getSettings(db);
  const slots = Object.entries(IMAGE_SLOT_LABELS).map(([key, label]) => ({ key, label, url: settings[key] || "" }));
  const services = await getServicesFull(db);
  for (const s of services) slots.push({ key: `service:${s.id}`, label: `Service — ${s.name}`, url: s.image, kind: "service", id: s.id });
  const stylists = await all(db, "SELECT * FROM stylists ORDER BY sort_order, id");
  for (const s of stylists) slots.push({ key: `stylist:${s.id}`, label: `Stylist — ${s.name}`, url: s.photo, kind: "stylist", id: s.id });
  return slots;
};

export const setImageSlot = async (db, key, url) => {
  const clean = String(key || "");
  if (IMAGE_SLOT_LABELS[clean]) {
    await setSetting(db, clean, url);
    return { ok: true };
  }
  const [kind, rawId] = clean.split(":");
  const id = Number(rawId);
  if (!id) return { ok: false, error: "Unknown image slot." };
  if (kind === "service") {
    await run(db, "UPDATE services SET image = ? WHERE id = ?", url, id);
    return { ok: true };
  }
  if (kind === "stylist") {
    await run(db, "UPDATE stylists SET photo = ? WHERE id = ?", url, id);
    return { ok: true };
  }
  if (kind === "gallery") {
    await run(db, "UPDATE gallery_items SET image = ? WHERE id = ?", url, id);
    return { ok: true };
  }
  return { ok: false, error: "Unknown image slot." };
};

export const galleryItems = (db) => getGallery(db);

export const addGalleryItem = async (db, { image, caption = "New work", category = "Cuts" }) => {
  const sort = await one(db, "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM gallery_items");
  const res = await run(
    db,
    "INSERT INTO gallery_items (image, category, caption, sort_order) VALUES (?,?,?,?)",
    image, String(category || "Cuts").slice(0, 40), String(caption || "New work").slice(0, 120), Number(sort?.next || 1),
  );
  return res.meta?.last_row_id || null;
};

export const deleteGalleryItem = async (db, id) => {
  await run(db, "DELETE FROM gallery_items WHERE id = ?", Number(id));
  return { ok: true };
};

/* ---------------- site status ---------------- */

export const siteStatus = async (db) => {
  const today = todayISO();
  const closure = await activeClosure(db, today);
  if (closure) {
    return {
      closed: true,
      message: closure.message || "We are closed until further notice.",
      closure: { id: closure.id, indefinite: !!closure.indefinite, start_date: closure.start_date, end_date: closure.end_date },
    };
  }
  return { closed: false, message: "" };
};

export { DAY_NAMES, addDays, todayISO };
