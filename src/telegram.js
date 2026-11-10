// Thin Telegram Bot API client. Every call is best-effort: the salon's site must
// keep working when Telegram is unreachable or not configured yet.
const API = "https://api.telegram.org";

const clip = (text, max = 3900) => {
  const s = String(text ?? "");
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

export const tgConfigured = (env) => Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);

export const tgCall = async (env, method, payload) => {
  if (!env.TELEGRAM_BOT_TOKEN) return { ok: false, description: "TELEGRAM_BOT_TOKEN is not configured." };
  try {
    const res = await fetch(`${API}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) console.error(`[telegram] ${method} failed: ${data.description || res.status}`);
    return data;
  } catch (err) {
    const reason = String(err?.message || err);
    console.error(`[telegram] ${method} threw: ${reason}`);
    return { ok: false, description: reason };
  }
};

export const sendMessage = (env, chatId, text, keyboard = null, extra = {}) =>
  tgCall(env, "sendMessage", {
    chat_id: String(chatId),
    text: clip(text),
    disable_web_page_preview: true,
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
    ...extra,
  });

export const editMessage = (env, chatId, messageId, text, keyboard = null) =>
  tgCall(env, "editMessageText", {
    chat_id: String(chatId),
    message_id: messageId,
    text: clip(text),
    disable_web_page_preview: true,
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
  });

export const answerCallback = (env, callbackId, text = "") =>
  tgCall(env, "answerCallbackQuery", { callback_query_id: callbackId, ...(text ? { text } : {}) });

const IMAGE_TYPES = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", gif: "image/gif", avif: "image/avif",
};

export const downloadTelegramFile = async (env, fileId) => {
  const info = await tgCall(env, "getFile", { file_id: fileId });
  const filePath = info?.result?.file_path;
  if (!filePath) return { ok: false, error: "Telegram did not return that file." };
  try {
    const res = await fetch(`${API}/file/bot${env.TELEGRAM_BOT_TOKEN}/${filePath}`);
    if (!res.ok) return { ok: false, error: `Download failed (${res.status}).` };
    const bytes = await res.arrayBuffer();
    const header = res.headers.get("content-type") || "";
    const ext = String(filePath).split(".").pop().toLowerCase();
    const contentType = header.startsWith("image/") ? header.split(";")[0] : (IMAGE_TYPES[ext] || "image/jpeg");
    return { ok: true, bytes, contentType };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
};

// Plain notification (kept for any non-bot caller).
export async function notifyTelegram(env, text, keyboard = null) {
  if (!tgConfigured(env)) return { sent: false, reason: "Telegram is not configured." };
  const res = await sendMessage(env, env.TELEGRAM_CHAT_ID, text, keyboard);
  return res.ok ? { sent: true } : { sent: false, reason: res.description || "unknown error" };
}

export function bookingMessage(appt) {
  const lines = [
    "✂️ New booking — LUMIÈRE",
    `Ref ${appt.ref}`,
    `${appt.dateLabel} · ${appt.timeLabel}`,
    `${appt.service_name}${appt.stylist_name ? ` with ${appt.stylist_name}` : ""}`,
    "",
    appt.client_name,
    appt.phone ? String(appt.phone) : "",
    appt.email ? String(appt.email) : "",
  ];
  const back = appt.returning || null;
  if (back && back.visits) {
    lines.push("", `🔁 Returning client — ${back.visits} previous visit${back.visits === 1 ? "" : "s"}`);
    if (back.last_service) lines.push(`Last: ${back.last_service}${back.last_date ? ` on ${back.last_date}` : ""}`);
    if (back.notes) lines.push(`Earlier notes: ${back.notes}`);
  }
  if (appt.notes) lines.push("", `Notes: ${appt.notes}`);
  return lines.filter((l) => l !== "").join("\n");
}

export const bookingConfirmationKeyboard = (id, panelUrl) => [
  [{ text: "✅ Confirm", callback_data: `appt:c:${id}` }, { text: "❌ Cancel", callback_data: `appt:x:${id}` }],
  ...(panelUrl ? [[{ text: "🌐 Open panel", web_app: { url: panelUrl } }]] : []),
];
