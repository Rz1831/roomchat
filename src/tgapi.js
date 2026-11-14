// Telegram Mini App API. Every request is authorised by the initData Telegram
// hands the WebView: HMAC-checked against the bot token, and only the owner's
// chat id is accepted. No passwords, no cookies to leak.
import { all, one, run, getHours } from "./db.js";
import {
  ensureSalon, getSettings, setSetting, setSlotInterval, setBreak, saveHours,
  getClosures, addClosure, deleteClosure, activeClosure, getBlocks, addBlock, deleteBlock,
  availableSlots, appointmentsOn, pendingAppointments, getServicesFull, createService,
  updateService, deleteService, getCategories, addCategory, renameCategory, deleteCategory,
  imageSlots, setImageSlot, setImageFit, saveMedia, galleryItems, addGalleryItem, deleteGalleryItem,
  siteStatus, appointmentsBetween, saveMapLink,
} from "./salon.js";
import { todayISO, addDays } from "./util.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const fail = (message, status = 400) => json({ ok: false, error: message }, status);

const hex = (bytes) => Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");

const hmac = async (key, message) => {
  const rawKey = typeof key === "string" ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey("raw", rawKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message)));
};

export async function verifyInitData(env, initData) {
  if (!initData || !env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");
  const checkString = Array.from(params.entries())
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join("\n");
  const secret = await hmac("WebAppData", env.TELEGRAM_BOT_TOKEN);
  const computed = hex(await hmac(secret, checkString));
  if (computed !== hash) return null;
  let user = null;
  try { user = JSON.parse(params.get("user") || "null"); } catch { user = null; }
  if (!user || String(user.id) !== String(env.TELEGRAM_CHAT_ID)) return null;
  const authDate = Number(params.get("auth_date") || 0);
  if (!authDate || Date.now() / 1000 - authDate > 60 * 60 * 24) return null;
  return { user, authDate };
}

const owner = async (request, env) =>
  verifyInitData(env, request.headers.get("x-telegram-init-data") || "");

export async function handleTgApi(request, env, url) {
  const db = env.DB;
  const method = request.method;
  const path = url.pathname.replace(/\/+$/, "");
  await ensureSalon(db);

  const session = await owner(request, env);
  if (!session) return fail("Open this from your Telegram bot — this panel is for the salon owner only.", 401);

  const route = path.slice("/api/tg".length) || "/";

  if (route === "/whoami" && method === "GET") {
    return json({ ok: true, user: session.user });
  }

  if (route === "/bootstrap" && method === "GET") {
    const today = todayISO();
    return json({
      ok: true,
      today,
      user: session.user,
      settings: await getSettings(db),
      hours: await getHours(db),
      closures: await getClosures(db),
      categories: await getCategories(db),
      services: await getServicesFull(db),
      images: await imageSlots(db),
      gallery: await galleryItems(db),
      blocks: await getBlocks(db, { date: today }),
      today: await appointmentsOn(db, today),
      pending: await pendingAppointments(db),
      status: await siteStatus(db),
    });
  }

  if (route === "/appointments" && method === "GET") {
    const date = url.searchParams.get("date") || todayISO();
    return json({ ok: true, date, appointments: await appointmentsOn(db, date), blocks: await getBlocks(db, { date }), pending: await pendingAppointments(db) });
  }

  if (route === "/week" && method === "GET") {
    const from = todayISO();
    return json({ ok: true, appointments: await appointmentsBetween(db, from, addDays(from, 6)) });
  }

  const statusMatch = route.match(/^\/appointments\/(\d+)\/status$/);
  if (statusMatch && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const status = ["pending", "confirmed", "cancelled", "completed"].includes(body.status) ? body.status : null;
    if (!status) return fail("Unknown status.");
    const appt = await one(db, "SELECT * FROM appointments WHERE id = ?", Number(statusMatch[1]));
    if (!appt) return fail("Appointment not found.", 404);
    await run(db, "UPDATE appointments SET status = ?, updated_at = datetime('now') WHERE id = ?", status, appt.id);
    return json({ ok: true });
  }

  if (route === "/availability" && method === "GET") {
    const date = url.searchParams.get("date") || todayISO();
    return json({ ok: true, ...(await availableSlots(db, { date, serviceId: url.searchParams.get("service") || null })) });
  }

  if (route === "/blocks" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const res = await addBlock(db, {
      date: body.date, time: body.time,
      client_name: body.client_name || "Manual booking",
      phone: body.phone || null,
      service_id: body.service_id || null,
      note: body.note || "Added from panel",
    });
    if (!res.ok) return fail(res.error);
    return json({ ok: true });
  }

  const blockMatch = route.match(/^\/blocks\/(\d+)$/);
  if (blockMatch && method === "DELETE") {
    await deleteBlock(db, blockMatch[1]);
    return json({ ok: true });
  }

  if (route === "/hours" && (method === "PUT" || method === "POST")) {
    const body = await request.json().catch(() => ({}));
    if (Array.isArray(body.hours)) return json({ ok: true, hours: await saveHours(db, body.hours) });
    if (!body.day && body.day !== 0) return fail("Missing day.");
    const current = (await getHours(db)).find((h) => Number(h.day) === Number(body.day));
    const [row] = await saveHours(db, [{
      ...current,
      ...body,
      day: Number(body.day),
    }]);
    return json({ ok: true, hours: await getHours(db) });
  }

  if (route === "/settings" && (method === "PUT" || method === "POST")) {
    const body = await request.json().catch(() => ({}));
    if (body.slot_interval !== undefined) await setSlotInterval(db, body.slot_interval);
    if (body.break_start !== undefined || body.break_end !== undefined) {
      const settings = await getSettings(db);
      await setBreak(db, body.break_start ?? settings.break_start, body.break_end ?? settings.break_end);
    }
    for (const key of ["salon_name", "salon_phone", "salon_email", "salon_address", "salon_tagline", "salon_message", "daily_summary"]) {
      if (body[key] !== undefined) await setSetting(db, key, String(body[key]).slice(0, 400));
    }
    if (body.map_link !== undefined) {
      const input = String(body.map_link).trim();
      if (input) {
        const address = body.salon_address ?? (await getSettings(db)).salon_address;
        const res = await saveMapLink(db, input, address);
        if (!res.ok) return fail(res.error);
      }
    }
    return json({ ok: true, settings: await getSettings(db), hours: await getHours(db) });
  }

  if (route === "/closures") {
    if (method === "GET") return json({ ok: true, closures: await getClosures(db) });
    if (method === "POST") {
      const body = await request.json().catch(() => ({}));
      const id = await addClosure(db, {
        start_date: body.start_date,
        end_date: body.end_date,
        indefinite: !!body.indefinite,
        message: body.message,
      });
      return json({ ok: true, id, closures: await getClosures(db) });
    }
  }

  if (route === "/closures/reopen" && method === "POST") {
    const today = todayISO();
    const rows = await getClosures(db);
    const active = rows.filter((c) => c.start_date <= today && (c.indefinite || !c.end_date || c.end_date >= today));
    for (const c of active) await deleteClosure(db, c.id);
    return json({ ok: true, closures: await getClosures(db) });
  }

  const closureMatch = route.match(/^\/closures\/(\d+)$/);
  if (closureMatch && method === "DELETE") {
    await deleteClosure(db, closureMatch[1]);
    return json({ ok: true, closures: await getClosures(db) });
  }

  if (route === "/services" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    if (!body.name || String(body.name).trim().length < 2) return fail("Give the service a name.");
    const id = await createService(db, body);
    return json({ ok: true, id, services: await getServicesFull(db) });
  }

  const serviceMatch = route.match(/^\/services\/(\d+)$/);
  if (serviceMatch && (method === "PUT" || method === "PATCH")) {
    const body = await request.json().catch(() => ({}));
    const res = await updateService(db, serviceMatch[1], body);
    if (!res.ok) return fail(res.error);
    return json({ ok: true, services: await getServicesFull(db) });
  }
  if (serviceMatch && method === "DELETE") {
    const res = await deleteService(db, serviceMatch[1]);
    if (!res.ok) return fail(res.error);
    return json({ ok: true, services: await getServicesFull(db) });
  }

  if (route === "/categories") {
    if (method === "GET") return json({ ok: true, categories: await getCategories(db) });
    if (method === "POST") {
      const body = await request.json().catch(() => ({}));
      if (body.from) {
        const res = await renameCategory(db, body.from, body.name);
        if (!res.ok) return fail(res.error);
      } else {
        const res = await addCategory(db, body.name);
        if (!res.ok) return fail(res.error);
      }
      return json({ ok: true, categories: await getCategories(db), services: await getServicesFull(db) });
    }
  }

  const categoryMatch = route.match(/^\/categories\/(.+)$/);
  if (categoryMatch && method === "DELETE") {
    const res = await deleteCategory(db, decodeURIComponent(categoryMatch[1]));
    if (!res.ok) return fail(res.error);
    return json({ ok: true, categories: await getCategories(db) });
  }

  if (route === "/media" && method === "POST") {
    const form = await request.formData().catch(() => null);
    if (!form) return fail("Send the image as a form upload.");
    const file = form.get("file");
    const slot = String(form.get("slot") || "");
    if (!file || typeof file === "string") return fail("No image received.");
    const media = await saveMedia(db, {
      bytes: await file.arrayBuffer(),
      contentType: file.type,
      filename: file.name,
    });
    if (!media.ok) return fail(media.error);

    if (slot === "gallery") {
      const id = await addGalleryItem(db, {
        image: media.url,
        caption: String(form.get("caption") || "Recent work"),
        category: String(form.get("category") || "Cuts"),
      });
      return json({ ok: true, url: media.url, galleryId: id, gallery: await galleryItems(db) });
    }
    if (slot) {
      const res = await setImageSlot(db, slot, media.url);
      if (!res.ok) return fail(res.error);
    }
    return json({ ok: true, url: media.url, images: await imageSlots(db), gallery: await galleryItems(db) });
  }

  // Per-slot framing: "cover" fills the frame, "contain" shows the whole photo.
  if (route === "/image-fit" && (method === "POST" || method === "PUT")) {
    const body = await request.json().catch(() => ({}));
    const res = await setImageFit(db, body.key, body.fit);
    if (!res.ok) return fail(res.error);
    return json({ ok: true, fit: res.fit, images: await imageSlots(db) });
  }

  const galleryMatch = route.match(/^\/gallery\/(\d+)$/);
  if (galleryMatch && method === "DELETE") {
    await deleteGalleryItem(db, galleryMatch[1]);
    return json({ ok: true, gallery: await galleryItems(db) });
  }

  if (route === "/status" && method === "GET") {
    return json({ ok: true, status: await siteStatus(db), closure: await activeClosure(db, todayISO()) });
  }

  return fail("Not found.", 404);
}
