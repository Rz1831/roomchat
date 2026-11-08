import { todayISO, parseISO, timeToMinutes, minutesToTime, DAY_NAMES } from "./util.js";

export const one = async (db, sql, ...params) => (await db.prepare(sql).bind(...params).first()) || null;
export const all = async (db, sql, ...params) => ((await db.prepare(sql).bind(...params).all()).results) || [];
export const run = (db, sql, ...params) => db.prepare(sql).bind(...params).run();

export const getServices = (db, { activeOnly = true } = {}) =>
  all(db, `SELECT * FROM services ${activeOnly ? "WHERE active = 1" : ""} ORDER BY sort_order, id`);

export const getStylists = (db, { activeOnly = true } = {}) =>
  all(db, `SELECT * FROM stylists ${activeOnly ? "WHERE active = 1" : ""} ORDER BY sort_order, id`);

export const getHours = (db) => all(db, "SELECT * FROM opening_hours ORDER BY day");

export const getTestimonials = (db, { approvedOnly = true } = {}) =>
  all(db, `SELECT * FROM testimonials ${approvedOnly ? "WHERE approved = 1" : ""} ORDER BY id DESC`);

export const getGallery = (db) => all(db, "SELECT * FROM gallery_items ORDER BY sort_order, id");

export const getPosts = (db) => all(db, "SELECT * FROM blog_posts ORDER BY published_at DESC");

export const getFaqs = () => [
  {
    q: "Do I need a consultation before a color appointment?",
    a: "Not always. New color clients booking a full lightening or correction get a complimentary 15-minute consultation at the start of the appointment. If you are unsure which service to choose, book a Gloss & Go or call us and we will guide you.",
  },
  {
    q: "What is your cancellation policy?",
    a: "Plans change — we get it. Cancel or reschedule free of charge up to 24 hours before your appointment using the link in your confirmation email. Inside 24 hours we ask for 50% of the service price, and no-shows are charged in full.",
  },
  {
    q: "Can I bring a photo of what I want?",
    a: "Please do. Bring two if you can: one for the shape and one for the feeling. We will always tell you honestly how a reference will translate to your hair texture and density.",
  },
  {
    q: "Do you work with curly and textured hair?",
    a: "Yes. Sofia is our curl specialist and cuts dry, curl by curl. Every stylist on the team is trained in textured hair, and we keep a separate product shelf for curls and coils.",
  },
  {
    q: "Is parking available?",
    a: "There is metered street parking on Abbot Kinney and a public lot two blocks away on Venice Boulevard. Weekends are busy — we recommend arriving ten minutes early.",
  },
  {
    q: "What products do you use?",
    a: "We use a small, mostly plant-derived range chosen for scalp tolerance and colour safety: sulfate-free cleansers, cold-pressed oils, bond-repair additives and ammonia-free colour lines. Everything we use is available at the front desk.",
  },
  {
    q: "How do gift cards work?",
    a: "Choose an amount, add the recipient's name and a note, and we will email a code instantly. Gift cards never expire and can be used toward any service or product in the salon.",
  },
  {
    q: "Do you offer bridal parties?",
    a: "We do. Ines leads bridal, and we can host up to six people before opening hours. Email hello@lumiere-salon.com with your date and party size and we will send a proposal.",
  },
];

// ---------- availability ----------
const salonNow = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t) => Number(parts.find((p) => p.type === t)?.value || 0);
  return get("hour") * 60 + get("minute");
};

export const availableSlots = async (db, { date, stylistId = null, serviceId = null }) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return { slots: [], reason: "invalid-date" };

  const holiday = await one(db, "SELECT reason FROM holidays WHERE date = ?", date);
  if (holiday) return { slots: [], reason: "holiday", note: holiday.reason };

  const dow = parseISO(date).getUTCDay();
  const hours = await one(db, "SELECT * FROM opening_hours WHERE day = ?", dow);
  if (!hours || hours.closed) return { slots: [], reason: "closed" };

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
  let service = null;
  if (serviceId) service = await one(db, "SELECT duration FROM services WHERE id = ?", serviceId);
  const duration = Math.max(30, Number(service?.duration || 60));

  const booked = await all(
    db,
    "SELECT stylist_id, time FROM appointments WHERE date = ? AND status != 'cancelled'",
    date,
  );

  const isToday = date === todayISO();
  const now = salonNow();
  const slots = [];
  for (let t = start; t + duration <= end; t += 30) {
    const time = minutesToTime(t);
    if (isToday && t <= now + 30) continue;
    const atTime = booked.filter((b) => b.time === time);
    const free = stylistId ? !atTime.some((b) => String(b.stylist_id) === String(stylistId)) : atTime.length < Math.max(1, pool.length);
    if (free) slots.push(time);
  }
  return { slots, reason: slots.length ? "ok" : "full", capacity: Math.max(1, pool.length) };
};

// Best-effort email: always recorded in the outbox so nothing is lost, and sent
// through Resend when a key is configured. Without a key the salon can read the
// outbox from the admin dashboard.
export const queueEmail = async (env, { to, subject, body, kind = "transactional" }) => {
  await run(
    env.DB,
    "INSERT INTO email_outbox (to_email, subject, body, kind, provider) VALUES (?,?,?,?,?)",
    to, subject, body, kind, env.RESEND_API_KEY ? "resend" : "outbox",
  );
  if (!env.RESEND_API_KEY) return { sent: false, reason: "no-provider" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: env.EMAIL_FROM || "LUMIÈRE Hair Salon <hello@lumiere-salon.com>",
        to: [to],
        subject,
        html: body,
      }),
    });
    return { sent: res.ok, status: res.status };
  } catch (err) {
    return { sent: false, reason: String(err) };
  }
};

export const openingLabel = (hours) => {
  const h = hours[new Date().getDay()];
  if (!h || h.closed) return "Closed today";
  return `Open today ${h.open} – ${h.close}`;
};

export { DAY_NAMES };
