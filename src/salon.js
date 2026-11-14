// Shared salon domain: settings, availability, closures, blocked slots,
// services/categories and image slots. Used by the public site, the JSON API,
// the Telegram bot and the Telegram Mini App so every surface sees one truth.
import {
  all, one, run, getHours, getStylists, getServices,
} from "./db.js";
import {
  todayISO, parseISO, addDays, timeToMinutes, minutesToTime, randomToken, DAY_NAMES,
} from "./util.js";
import { resolveMapLink, withEnglish } from "./location.js";

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
  salon_email: "hello@lumiere-salon.com",
  salon_address: "1428 Abbot Kinney Blvd, Los Angeles, CA 90291",
  salon_tagline: "A sunlit studio on Abbot Kinney — precision cuts, dimensional colour and scalp-first care, five minutes from the beach.",
  map_link: "",
  map_embed: "",
  salon_message: "",
};

let ready = null;

// Creates the setting rows, default categories and the booking grid the first
// time the app talks to this database (idempotent, safe on every cold start).
export const ensureSalon = async (db) => {
  if (!ready) {
    ready = (async () => {
      // Existing databases predate device-linked bookings; add the column once.
      try {
        await run(db, "ALTER TABLE appointments ADD COLUMN device_id TEXT");
      } catch { /* column already exists */ }
      try {
        await run(db, "CREATE INDEX IF NOT EXISTS idx_appt_device ON appointments(device_id)");
      } catch { /* table not created yet */ }
      // Media rows created before uploads recorded their dimensions.
      try {
        await run(db, "ALTER TABLE media ADD COLUMN width INTEGER NOT NULL DEFAULT 0");
      } catch { /* column already exists */ }
      try {
        await run(db, "ALTER TABLE media ADD COLUMN height INTEGER NOT NULL DEFAULT 0");
      } catch { /* column already exists */ }
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

/* ---------------- location / map ---------------- */

export const saveMapLink = async (db, input, fallbackAddress = "") => {
  const res = await resolveMapLink(input, fallbackAddress);
  if (!res.ok) return res;
  await setSetting(db, "map_link", res.link);
  await setSetting(db, "map_embed", res.embed);
  return res;
};

export const salonLocation = async (db) => {
  const s = await getSettings(db);
  return {
    name: s.salon_name || "",
    address: s.salon_address || "",
    phone: s.salon_phone || "",
    email: s.salon_email || "",
    description: s.salon_tagline || "",
    // Older databases stored embed URLs without a language; normalise on read so
    // every visitor gets English labels regardless of their browser.
    embed: String(s.map_embed || "").startsWith("https://www.google.com/maps") ? withEnglish(s.map_embed) : "",
    link: s.map_link || "",
  };
};

export const directionsUrl = (location) => {
  if (location.link && !/maps\.app\.goo\.gl/i.test(location.link)) {
    const link = withEnglish(location.link);
    if (link) return link;
  }
  const target = location.address || location.name || "";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(target)}&hl=en`;
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

// The stored bytes decide the type, so a mislabelled or missing content type can
// never end up in the media table. Each test reads the real magic bytes.
const IMAGE_MAGIC = [
  [0xff, 0xd8, 0xff, "image/jpeg"],
  [0x89, 0x50, 0x4e, 0x47, "image/png"],
  [0x47, 0x49, 0x46, 0x38, "image/gif"],
];

export const sniffImageType = (bytes) => {
  if (!bytes || bytes.length < 12) return "";
  for (const entry of IMAGE_MAGIC) {
    const type = entry[entry.length - 1];
    if (entry.slice(0, -1).every((byte, i) => bytes[i] === byte)) return type;
  }
  const ascii = (from, to) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp" && (ascii(8, 12) === "avif" || ascii(8, 12) === "avis")) return "image/avif";
  return "";
};

// Reads the pixel dimensions straight out of the file header (JPEG, PNG, GIF,
// WebP). Uploads keep their own aspect ratio — we never resize or crop here.
// Returns {width:0,height:0} when the header is not understood (e.g. AVIF).
export const imageSize = (bytes, type) => {
  if (!bytes || bytes.length < 24) return { width: 0, height: 0 };
  const be16 = (o) => (bytes[o] << 8) | bytes[o + 1];
  const be32 = (o) => ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0;
  const le16 = (o) => bytes[o] | (bytes[o + 1] << 8);
  const le24 = (o) => bytes[o] | (bytes[o + 1] << 8) | (bytes[o + 2] << 16);
  try {
    if (type === "image/png") return { width: be32(16), height: be32(20) };
    if (type === "image/gif") return { width: le16(6), height: le16(8) };
    if (type === "image/webp") {
      const chunk = String.fromCharCode(...bytes.slice(12, 16));
      if (chunk === "VP8X") return { width: le24(24) + 1, height: le24(27) + 1 };
      if (chunk === "VP8 ") return { width: le16(26) & 0x3fff, height: le16(28) & 0x3fff };
      if (chunk === "VP8L") {
        const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
        return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
      }
      return { width: 0, height: 0 };
    }
    if (type === "image/jpeg") {
      let offset = 2;
      while (offset + 9 < bytes.length) {
        if (bytes[offset] !== 0xff) { offset++; continue; }
        const marker = bytes[offset + 1];
        const length = be16(offset + 2);
        // SOF0…SOF3, SOF5…SOF7, SOF9…SOF11, SOF13…SOF15 carry the frame size.
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { width: be16(offset + 7), height: be16(offset + 5) };
        }
        if (length < 2) break;
        offset += 2 + length;
      }
    }
  } catch { /* unreadable header — dimensions stay unknown */ }
  return { width: 0, height: 0 };
};

const BASE64 = /^[A-Za-z0-9+/=\s]+$/;

const decodeBase64 = (text) => {
  try {
    const binary = atob(String(text).replace(/\s+/g, ""));
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
};

// Normalise whatever an uploader hands us into real bytes: ArrayBuffer, typed
// array, number array, base64 text or a "data:image/…;base64,…" URL.
export const toBytes = (value) => {
  if (value === null || value === undefined) return null;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  if (Array.isArray(value)) return new Uint8Array(value);
  if (typeof value === "string") {
    const text = value.trim();
    const comma = text.indexOf(",");
    const payload = /^data:/i.test(text) && comma >= 0 ? text.slice(comma + 1) : text;
    if (!BASE64.test(payload) || payload.length < 32) return null;
    return decodeBase64(payload);
  }
  return null;
};

export const saveMedia = async (db, { bytes, contentType, filename }) => {
  const raw = toBytes(bytes);
  if (!raw || !raw.byteLength) return { ok: false, error: "That image arrived empty — please try again." };
  if (raw.byteLength > MAX_UPLOAD) return { ok: false, error: "Images must be smaller than 4 MB." };
  const type = sniffImageType(raw);
  if (!type) return { ok: false, error: "Please send a JPG, PNG, WebP, GIF or AVIF image." };

  const id = randomToken(10);
  const buffer = raw.byteOffset === 0 && raw.byteLength === raw.buffer.byteLength ? raw.buffer : raw.slice().buffer;
  const { width, height } = imageSize(raw, type);
  await run(
    db,
    "INSERT INTO media (id, filename, content_type, size, width, height, data) VALUES (?,?,?,?,?,?,?)",
    id, String(filename || "upload").slice(0, 120), type, buffer.byteLength, width, height, buffer,
  );
  return { ok: true, id, url: `/media/${id}`, size: buffer.byteLength, width, height, contentType: type };
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

// Per-slot "image fit": "cover" fills the frame (default, centre focal point),
// "contain" shows the whole photo on a soft background. Gallery images are never
// framed, so they have no fit option.
export const slotFitKey = (key) => `fit.${key}`;

export const imageFit = (settings, key) =>
  String((settings || {})[slotFitKey(key)] || "") === "contain" ? "contain" : "cover";

export const imageFitClass = (settings, key) => (imageFit(settings, key) === "contain" ? " img--contain" : "");

export const setImageFit = async (db, key, fit) => {
  const slot = String(key || "");
  const known = IMAGE_SLOT_LABELS[slot] || /^(service|stylist):\d+$/.test(slot);
  if (!known) return { ok: false, error: "Unknown image slot." };
  const value = String(fit) === "contain" ? "contain" : "cover";
  await setSetting(db, slotFitKey(slot), value);
  return { ok: true, fit: value };
};

export const imageSlots = async (db) => {
  const settings = await getSettings(db);
  const slots = Object.entries(IMAGE_SLOT_LABELS).map(([key, label]) => ({ key, label, url: settings[key] || "", fit: imageFit(settings, key) }));
  const services = await getServicesFull(db);
  for (const s of services) slots.push({ key: `service:${s.id}`, label: `Service — ${s.name}`, url: s.image, kind: "service", id: s.id, fit: imageFit(settings, `service:${s.id}`) });
  const stylists = await all(db, "SELECT * FROM stylists ORDER BY sort_order, id");
  for (const s of stylists) slots.push({ key: `stylist:${s.id}`, label: `Stylist — ${s.name}`, url: s.photo, kind: "stylist", id: s.id, fit: imageFit(settings, `stylist:${s.id}`) });
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

// Gallery images keep their own aspect ratio, so each row carries the stored
// pixel size of its uploaded file (0 when the image is an external URL).
export const galleryItems = (db) =>
  all(
    db,
    `SELECT g.*, COALESCE(m.width, 0) AS width, COALESCE(m.height, 0) AS height
       FROM gallery_items g
       LEFT JOIN media m ON g.image = '/media/' || m.id
      ORDER BY g.sort_order, g.id`,
  );

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
