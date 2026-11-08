import {
  all, one, run, getServices, getStylists, getTestimonials, getGallery, availableSlots, queueEmail, getHours,
} from "./db.js";
import { hashPassword, verifyPassword, createSession, clearSession, currentUser, ensureAdmin } from "./auth.js";
import {
  esc, isEmail, todayISO, addDays, longDay, timeLabel, money, bookingRef, giftCode, randomToken,
} from "./util.js";

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });

const bad = (message, status = 400) => json({ ok: false, error: message }, status);

async function body(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

const appointmentView = (a) => ({
  ...a,
  service_name: a.service_name,
  stylist_name: a.stylist_name,
  price: a.price,
  duration: a.duration,
});

const appointmentSelect = `
  SELECT a.*, s.name AS service_name, s.slug AS service_slug, s.price AS price, s.duration AS duration,
         st.name AS stylist_name
    FROM appointments a
    JOIN services s ON s.id = a.service_id
    LEFT JOIN stylists st ON st.id = a.stylist_id`;

const sendBookingEmail = async (env, appt) => {
  const manageUrl = `${env.PUBLIC_ORIGIN || ""}/manage?ref=${encodeURIComponent(appt.ref)}&token=${encodeURIComponent(appt.manage_token)}`;
  const when = `${longDay(appt.date)} at ${timeLabel(appt.time)}`;
  await queueEmail(env, {
    to: appt.email,
    subject: `Your LUMIÈRE appointment — ${appt.ref}`,
    kind: "booking_confirmation",
    body: `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#2B2220">
      <h1 style="font-family:Georgia,serif;font-weight:400">You're booked.</h1>
      <p>Dear ${esc(appt.client_name)},</p>
      <p>Your appointment at LUMIÈRE Hair Salon is ${appt.status === "confirmed" ? "confirmed" : "requested"} for <strong>${esc(when)}</strong>.</p>
      <p>Reference: <strong>${esc(appt.ref)}</strong><br>Service: ${esc(appt.service_name)}<br>Stylist: ${esc(appt.stylist_name || "any available stylist")}</p>
      <p><a href="${manageUrl}" style="background:#C0643F;color:#fff;padding:12px 20px;border-radius:30px;text-decoration:none">Manage or cancel</a></p>
      <p style="font-size:13px;color:#6F625C">Free changes up to 24 hours before your appointment. 1428 Abbot Kinney Blvd, Los Angeles.</p>
    </div>`,
  });
};

// ---------------- public + client API ----------------
export async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "");
  const method = request.method;
  const db = env.DB;
  await ensureAdmin(env);
  const user = await currentUser(request, db);

  // --- catalogue ---
  if (path === "/api/services" && method === "GET") return json({ services: await getServices(db) });
  if (path === "/api/stylists" && method === "GET") return json({ stylists: await getStylists(db) });
  if (path === "/api/testimonials" && method === "GET") return json({ testimonials: await getTestimonials(db) });
  if (path === "/api/gallery" && method === "GET") return json({ gallery: await getGallery(db) });

  if (path === "/api/availability" && method === "GET") {
    const date = url.searchParams.get("date") || "";
    const stylistId = url.searchParams.get("stylist") || null;
    const serviceId = url.searchParams.get("service") || null;
    const result = await availableSlots(db, { date, stylistId, serviceId });
    return json(result);
  }

  // --- booking ---
  if (path === "/api/book" && method === "POST") {
    const b = await body(request);
    const errors = [];
    if (!b.service_id) errors.push("Choose a service.");
    if (!b.client_name || String(b.client_name).trim().length < 2) errors.push("Enter your name.");
    if (!isEmail(b.email)) errors.push("Enter a valid email address.");
    if (!b.phone || String(b.phone).replace(/\D/g, "").length < 7) errors.push("Enter a phone number.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || "")) errors.push("Choose a date.");
    if (!/^\d{2}:\d{2}$/.test(b.time || "")) errors.push("Choose a time.");
    if (b.date && b.date < todayISO()) errors.push("That date has passed.");
    if (!b.consent) errors.push("Please accept the cancellation policy.");
    if (errors.length) return bad(errors[0]);

    const service = await one(db, "SELECT * FROM services WHERE id = ? AND active = 1", b.service_id);
    if (!service) return bad("That service is not available.");

    const stylistId = b.stylist_id ? Number(b.stylist_id) : null;
    if (stylistId) {
      const stylist = await one(db, "SELECT id FROM stylists WHERE id = ? AND active = 1", stylistId);
      if (!stylist) return bad("That stylist is not available.");
    }

    const { slots } = await availableSlots(db, { date: b.date, stylistId, serviceId: service.id });
    if (!slots.includes(b.time)) return bad("That time was just taken. Please choose another slot.", 409);

    const ref = bookingRef();
    const token = randomToken(16);
    let finalStatus = "pending";
    if (stylistId) {
      const clash = await one(
        db,
        "SELECT id FROM appointments WHERE date = ? AND time = ? AND stylist_id = ? AND status != 'cancelled'",
        b.date, b.time, stylistId,
      );
      if (clash) return bad("That time was just taken. Please choose another slot.", 409);
    }

    await run(
      db,
      `INSERT INTO appointments (ref, user_id, client_name, email, phone, service_id, stylist_id, date, time, status, notes, manage_token)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      ref, user?.id || null, String(b.client_name).trim(), String(b.email).trim().toLowerCase(),
      String(b.phone).trim(), service.id, stylistId, b.date, b.time, finalStatus,
      b.notes ? String(b.notes).slice(0, 800) : null, token,
    );

    const appt = { ref, client_name: b.client_name, email: b.email, date: b.date, time: b.time, status: finalStatus, service_name: service.name, stylist_name: stylistId ? (await one(db, "SELECT name FROM stylists WHERE id = ?", stylistId))?.name : null, manage_token: token };
    await sendBookingEmail(env, appt);
    return json({ ok: true, ref, status: finalStatus, manage_url: `/manage?ref=${encodeURIComponent(ref)}&token=${encodeURIComponent(token)}`, message: "Your appointment is booked." });
  }

  // --- contact + newsletter ---
  if (path === "/api/contact" && method === "POST") {
    const b = await body(request);
    if (!b.name || String(b.name).trim().length < 2) return bad("Please enter your name.");
    if (!isEmail(b.email)) return bad("Please enter a valid email.");
    if (!b.message || String(b.message).trim().length < 10) return bad("Please add a little more detail to your message.");
    await run(
      db,
      "INSERT INTO contact_messages (name, email, phone, message) VALUES (?,?,?,?)",
      String(b.name).trim().slice(0, 120), String(b.email).trim().toLowerCase(),
      b.phone ? String(b.phone).trim().slice(0, 40) : null, String(b.message).trim().slice(0, 4000),
    );
    await queueEmail(env, {
      to: env.SALON_EMAIL || "hello@lumiere-salon.com",
      subject: `New website message from ${String(b.name).trim()}`,
      kind: "contact_notification",
      body: `<p>${esc(b.message)}</p><p>Reply to: ${esc(b.email)}${b.phone ? ` · ${esc(b.phone)}` : ""}</p>`,
    });
    return json({ ok: true, message: "Thank you — we will reply within one business day." });
  }

  if (path === "/api/newsletter" && method === "POST") {
    const b = await body(request);
    if (!isEmail(b.email)) return bad("Please enter a valid email address.");
    await run(db, "INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)", String(b.email).trim().toLowerCase());
    return json({ ok: true, message: "You're on the list. Welcome to the good-hair club." });
  }

  // --- gift cards ---
  if (path === "/api/gift-cards" && method === "POST") {
    const b = await body(request);
    const amount = Number(b.amount);
    if (!Number.isFinite(amount) || amount < 25 || amount > 2000) return bad("Choose an amount between $25 and $2,000.");
    if (!b.recipient || String(b.recipient).trim().length < 2) return bad("Please add the recipient's name.");
    if (!isEmail(b.recipient_email)) return bad("Please add a valid recipient email.");
    if (!b.sender || String(b.sender).trim().length < 2) return bad("Please add your name.");
    if (!b.terms) return bad("Please confirm you understand how the gift card is delivered.");
    const code = giftCode();
    await run(
      db,
      `INSERT INTO gift_cards (amount, code, recipient, recipient_email, sender, message, status)
       VALUES (?,?,?,?,?,?, 'active')`,
      Math.round(amount), code, String(b.recipient).trim().slice(0, 80),
      String(b.recipient_email).trim().toLowerCase(), String(b.sender).trim().slice(0, 80),
      b.message ? String(b.message).slice(0, 300) : null,
    );
    await queueEmail(env, {
      to: String(b.recipient_email).trim().toLowerCase(),
      subject: `${String(b.sender).trim()} sent you a LUMIÈRE gift card`,
      kind: "gift_card",
      body: `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#2B2220">
        <h1 style="font-weight:400">A gift of good hair.</h1>
        <p>Dear ${esc(b.recipient)},</p>
        <p>${esc(b.sender)} has sent you a LUMIÈRE Hair Salon gift card worth <strong>${money(amount)}</strong>.</p>
        ${b.message ? `<p style="font-style:italic">“${esc(b.message)}”</p>` : ""}
        <p>Your code: <strong style="letter-spacing:2px">${code}</strong></p>
        <p style="font-size:13px;color:#6F625C">Redeem online or at the desk. Never expires.</p>
      </div>`,
    });
    return json({ ok: true, code, amount, message: "Gift card created and emailed." });
  }

  // --- auth ---
  if (path === "/api/auth/signup" && method === "POST") {
    const b = await body(request);
    if (!b.name || String(b.name).trim().length < 2) return bad("Please enter your name.");
    if (!isEmail(b.email)) return bad("Please enter a valid email address.");
    if (!b.password || String(b.password).length < 8) return bad("Choose a password of at least 8 characters.");
    const email = String(b.email).trim().toLowerCase();
    const exists = await one(db, "SELECT id FROM users WHERE email = ?", email);
    if (exists) return bad("An account with that email already exists. Try signing in.", 409);
    const { hash, salt } = await hashPassword(String(b.password));
    const res = await run(
      db,
      "INSERT INTO users (email, name, phone, password_hash, salt, role) VALUES (?,?,?,?,?,'client')",
      email, String(b.name).trim().slice(0, 120), b.phone ? String(b.phone).trim().slice(0, 40) : null, hash, salt,
    );
    const id = res.meta?.last_row_id;
    const session = await createSession(db, id);
    return json({ ok: true, user: { id, name: b.name, email, role: "client" } }, 200, { "set-cookie": session.header });
  }

  if (path === "/api/auth/login" && method === "POST") {
    const b = await body(request);
    const email = String(b.email || "").trim().toLowerCase();
    const row = await one(db, "SELECT * FROM users WHERE email = ?", email);
    if (!row || !(await verifyPassword(String(b.password || ""), row.password_hash, row.salt))) {
      return bad("Email or password is incorrect.", 401);
    }
    const session = await createSession(db, row.id);
    return json({ ok: true, user: { id: row.id, name: row.name, email: row.email, role: row.role } }, 200, { "set-cookie": session.header });
  }

  if (path === "/api/auth/logout" && method === "POST") {
    const raw = request.headers.get("Cookie") || "";
    const match = raw.match(/salon_session=([^;]+)/);
    if (match) await clearSession(db, match[1]);
    return json({ ok: true }, 200, { "set-cookie": clearSession(db, "") });
  }

  if (path === "/api/me" && method === "GET") return json({ user });

  if (path === "/api/me/appointments" && method === "GET") {
    if (!user) return bad("Sign in to see your appointments.", 401);
    const rows = await all(db, `${appointmentSelect} WHERE a.user_id = ? ORDER BY a.date DESC, a.time DESC`, user.id);
    return json({ appointments: rows.map(appointmentView) });
  }

  const meCancel = path.match(/^\/api\/me\/appointments\/(\d+)\/cancel$/);
  if (meCancel && method === "POST") {
    if (!user) return bad("Sign in first.", 401);
    const appt = await one(db, "SELECT * FROM appointments WHERE id = ? AND user_id = ?", meCancel[1], user.id);
    if (!appt) return bad("Appointment not found.", 404);
    await run(db, "UPDATE appointments SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?", appt.id);
    await queueEmail(env, { to: appt.email, subject: `Cancelled: ${appt.ref}`, kind: "booking_cancelled", body: `<p>Your appointment ${esc(appt.ref)} has been cancelled as requested.</p>` });
    return json({ ok: true, message: "Appointment cancelled." });
  }

  // --- manage by private link ---
  if (path === "/api/manage" && method === "GET") {
    const ref = url.searchParams.get("ref") || "";
    const token = url.searchParams.get("token") || "";
    const appt = await one(db, `${appointmentSelect} WHERE a.ref = ? AND a.manage_token = ?`, ref, token);
    if (!appt) return bad("That booking link is not valid.", 404);
    return json({ appointment: appt });
  }

  if (path === "/api/manage/cancel" && method === "POST") {
    const b = await body(request);
    const appt = await one(db, "SELECT * FROM appointments WHERE ref = ? AND manage_token = ?", b.ref || "", b.token || "");
    if (!appt) return bad("That booking link is not valid.", 404);
    if (appt.status === "completed") return bad("Completed appointments cannot be cancelled.");
    await run(db, "UPDATE appointments SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?", appt.id);
    await queueEmail(env, { to: appt.email, subject: `Cancelled: ${appt.ref}`, kind: "booking_cancelled", body: `<p>Your appointment on ${esc(longDay(appt.date))} at ${esc(timeLabel(appt.time))} has been cancelled. We hope to see you soon.</p>` });
    return json({ ok: true, message: "Your appointment has been cancelled." });
  }

  if (path === "/api/manage/reschedule" && method === "POST") {
    const b = await body(request);
    const appt = await one(db, "SELECT * FROM appointments WHERE ref = ? AND manage_token = ?", b.ref || "", b.token || "");
    if (!appt) return bad("That booking link is not valid.", 404);
    if (appt.status === "cancelled") return bad("This appointment was cancelled — please book a new one.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || "") || b.date < todayISO()) return bad("Choose a date in the future.");
    const { slots } = await availableSlots(db, { date: b.date, stylistId: appt.stylist_id || null, serviceId: appt.service_id });
    if (!slots.includes(b.time)) return bad("That time is not available. Choose another slot.", 409);
    await run(db, "UPDATE appointments SET date = ?, time = ?, status = 'pending', updated_at = datetime('now') WHERE id = ?", b.date, b.time, appt.id);
    await queueEmail(env, {
      to: appt.email,
      subject: `Rescheduled: ${appt.ref}`,
      kind: "booking_rescheduled",
      body: `<p>Your appointment ${esc(appt.ref)} is now ${esc(longDay(b.date))} at ${esc(timeLabel(b.time))}. We will confirm shortly.</p>`,
    });
    return json({ ok: true, message: `Moved to ${longDay(b.date)} at ${timeLabel(b.time)}.` });
  }

  // ---------------- admin ----------------
  if (path.startsWith("/api/admin")) {
    if (!user || user.role !== "admin") return bad("Staff access required.", 403);

    if (path === "/api/admin/summary") {
      const today = todayISO();
      const weekEnd = addDays(today, 6);
      const todayRows = await all(db, `${appointmentSelect} WHERE a.date = ? ORDER BY a.time`, today);
      const stats = await one(
        db,
        `SELECT
          (SELECT COUNT(*) FROM appointments WHERE date = ?) AS today,
          (SELECT COUNT(*) FROM appointments WHERE status = 'pending' AND date >= ?) AS pending,
          (SELECT COALESCE(SUM(s.price),0) FROM appointments a JOIN services s ON s.id = a.service_id
             WHERE a.status IN ('confirmed','completed') AND a.date BETWEEN ? AND ?) AS revenue,
          (SELECT COUNT(*) FROM users WHERE role = 'client' AND created_at >= datetime('now','-30 day')) AS new_clients,
          (SELECT COUNT(*) FROM appointments WHERE status = 'pending' AND date < ?) AS overdue`,
        today, today, today, weekEnd, today,
      );
      const emailMode = env.RESEND_API_KEY ? "Resend is connected — confirmations are emailed automatically." : "No email provider connected. Confirmations are recorded in the outbox and shown in the dashboard.";
      return json({ stats, today: todayRows.map(appointmentView), email_mode: emailMode });
    }

    if (path === "/api/admin/appointments" && method === "GET") {
      const date = url.searchParams.get("date");
      const rows = date
        ? await all(db, `${appointmentSelect} WHERE a.date = ? ORDER BY a.time`, date)
        : await all(db, `${appointmentSelect} ORDER BY a.date DESC, a.time DESC LIMIT 200`);
      return json({ appointments: rows.map(appointmentView) });
    }

    const apptPatch = path.match(/^\/api\/admin\/appointments\/(\d+)$/);
    if (apptPatch && (method === "PATCH" || method === "PUT")) {
      const b = await body(request);
      const appt = await one(db, "SELECT * FROM appointments WHERE id = ?", apptPatch[1]);
      if (!appt) return bad("Appointment not found.", 404);
      const status = b.status && ["pending", "confirmed", "cancelled", "completed"].includes(b.status) ? b.status : appt.status;
      const date = /^\d{4}-\d{2}-\d{2}$/.test(b.date || "") ? b.date : appt.date;
      const time = /^\d{2}:\d{2}$/.test(b.time || "") ? b.time : appt.time;
      await run(db, "UPDATE appointments SET status = ?, date = ?, time = ?, updated_at = datetime('now') WHERE id = ?", status, date, time, appt.id);
      if (status === "confirmed" && appt.status !== "confirmed") {
        await queueEmail(env, { to: appt.email, subject: `Confirmed: ${appt.ref}`, kind: "booking_confirmed", body: `<p>Good news — your appointment ${esc(appt.ref)} on ${esc(longDay(date))} at ${esc(timeLabel(time))} is confirmed.</p>` });
      }
      if (status === "cancelled" && appt.status !== "cancelled") {
        await queueEmail(env, { to: appt.email, subject: `Cancelled: ${appt.ref}`, kind: "booking_cancelled", body: `<p>Your appointment ${esc(appt.ref)} has been cancelled by the salon. Please call us and we will find you a new time.</p>` });
      }
      return json({ ok: true });
    }

    if (path === "/api/admin/hours" && method === "GET") return json({ hours: await getHours(db) });
    if (path === "/api/admin/hours" && method === "PUT") {
      const b = await body(request);
      if (!Array.isArray(b.hours)) return bad("Invalid hours payload.");
      for (const h of b.hours) {
        await run(db, "UPDATE opening_hours SET open = ?, close = ?, closed = ? WHERE day = ?",
          String(h.open || "10:00"), String(h.close || "19:00"), h.closed ? 1 : 0, Number(h.day));
      }
      return json({ ok: true, hours: await getHours(db) });
    }

    if (path === "/api/admin/subscribers.csv") {
      const rows = await all(db, "SELECT email, created_at FROM newsletter_subscribers ORDER BY created_at DESC");
      const csv = ["email,joined_at", ...rows.map((r) => `${r.email},${r.created_at}`)].join("\n");
      return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="lumiere-subscribers.csv"' } });
    }

    if (path === "/api/admin/messages" && method === "GET") {
      return json({ messages: await all(db, "SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 200") });
    }
    const messagePatch = path.match(/^\/api\/admin\/messages\/(\d+)$/);
    if (messagePatch) {
      if (method === "PATCH" || method === "PUT") {
        const b = await body(request);
        const status = ["new", "read", "archived"].includes(b.status) ? b.status : "read";
        await run(db, "UPDATE contact_messages SET status = ? WHERE id = ?", status, messagePatch[1]);
        return json({ ok: true });
      }
      if (method === "DELETE") {
        await run(db, "DELETE FROM contact_messages WHERE id = ?", messagePatch[1]);
        return json({ ok: true, message: "Deleted." });
      }
    }

    if (path === "/api/admin/subscribers" && method === "GET") {
      return json({ subscribers: await all(db, "SELECT * FROM newsletter_subscribers ORDER BY created_at DESC") });
    }
    const subscriberDelete = path.match(/^\/api\/admin\/subscribers\/(\d+)$/);
    if (subscriberDelete && method === "DELETE") {
      await run(db, "DELETE FROM newsletter_subscribers WHERE id = ?", subscriberDelete[1]);
      return json({ ok: true, message: "Removed." });
    }

    const entityMatch = path.match(/^\/api\/admin\/([a-z_-]+)(?:\/([^/]+))?$/);
    if (entityMatch) {
      const entityRaw = entityMatch[1];
      const rawId = entityMatch[2];
      const entity = entityRaw === "giftcards" ? "gift_cards" : entityRaw;
      const config = {
        services: { table: "services", pk: "id", order: "sort_order, id",
          fields: ["name", "slug", "category", "short_description", "description", "price", "duration", "image", "featured", "active", "sort_order"] },
        stylists: { table: "stylists", pk: "id", order: "sort_order, id",
          fields: ["name", "role", "bio", "photo", "specialties", "working_days", "start_time", "end_time", "active", "sort_order"] },
        gallery: { table: "gallery_items", pk: "id", order: "sort_order, id",
          fields: ["image", "category", "caption", "sort_order"] },
        blog: { table: "blog_posts", pk: "id", order: "published_at DESC",
          fields: ["title", "slug", "excerpt", "content", "cover_image", "category", "published_at"] },
        testimonials: { table: "testimonials", pk: "id", order: "id DESC",
          fields: ["name", "rating", "text", "photo", "approved"] },
        gift_cards: { table: "gift_cards", pk: "id", order: "id DESC",
          fields: ["amount", "recipient", "recipient_email", "sender", "message", "status"] },
        holidays: { table: "holidays", pk: "date", order: "date",
          fields: ["date", "reason"] },
      }[entity];
      if (!config) return bad("Unknown resource.", 404);

      if (method === "GET") {
        return json({ items: await all(db, `SELECT * FROM ${config.table} ORDER BY ${config.order}`) });
      }

      if (method === "POST") {
        const b = await body(request);
        const toInsert = config.fields.filter((f) => !(config.pk === "id" && f === "id"));
        const values = toInsert.map((f) => normalise(f, b[f]));
        if (entity === "gift_cards") {
          const code = String(b.code || "").trim() || giftCode();
          await run(db, `INSERT INTO ${config.table} (${toInsert.join(",")}, code) VALUES (${toInsert.map(() => "?").join(",")}, ?)`, ...values, code);
          return json({ ok: true, message: "Gift card created.", code }, 201);
        }
        await run(db, `INSERT INTO ${config.table} (${toInsert.join(",")}) VALUES (${toInsert.map(() => "?").join(",")})`, ...values);
        return json({ ok: true, message: "Created." }, 201);
      }

      if ((method === "PATCH" || method === "PUT") && rawId) {
        const b = await body(request);
        const fields = config.fields.filter((f) => f !== config.pk);
        await run(
          db,
          `UPDATE ${config.table} SET ${fields.map((f) => `${f} = ?`).join(", ")} WHERE ${config.pk} = ?`,
          ...fields.map((f) => normalise(f, b[f])),
          config.pk === "id" ? Number(rawId) : rawId,
        );
        return json({ ok: true, message: "Saved." });
      }

      if (method === "DELETE" && rawId) {
        await run(db, `DELETE FROM ${config.table} WHERE ${config.pk} = ?`, config.pk === "id" ? Number(rawId) : rawId);
        return json({ ok: true, message: "Deleted." });
      }
    }
  }

  return bad("Not found.", 404);
}

function normalise(field, value) {
  if (value === undefined || value === null || value === "") {
    if (["active", "approved", "featured", "closed"].includes(field)) return 1;
    if (["sort_order", "rating"].includes(field)) return 0;
    return "";
  }
  if (["active", "approved", "featured", "closed"].includes(field)) return value === "0" || value === 0 || value === false ? 0 : 1;
  if (["price", "duration", "sort_order", "rating", "amount"].includes(field)) return Number(value) || 0;
  return typeof value === "string" ? value.trim() : value;
}
