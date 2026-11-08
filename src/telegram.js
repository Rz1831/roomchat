import { longDay, timeLabel } from "./util.js";

const API = "https://api.telegram.org";

// Sends a plain-text message to the salon's Telegram chat.
// Returns { sent: true } or { sent: false, reason } — never throws.
export async function notifyTelegram(env, text) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { sent: false, reason: "Telegram is not configured." };

  try {
    const res = await fetch(`${API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: String(chatId),
        text: String(text).slice(0, 3900),
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      const reason = data.description || `HTTP ${res.status}`;
      console.error(`[telegram] send failed: ${reason}`);
      return { sent: false, reason };
    }
    console.log("[telegram] notification sent");
    return { sent: true };
  } catch (err) {
    const reason = String(err?.message || err);
    console.error(`[telegram] send threw: ${reason}`);
    return { sent: false, reason };
  }
}

export function bookingMessage(appt) {
  const when = `${longDay(appt.date)} · ${timeLabel(appt.time)}`;
  const lines = [
    "✂️ New booking — LUMIÈRE",
    `Ref ${appt.ref}`,
    when,
    `${appt.service_name}${appt.stylist_name ? ` with ${appt.stylist_name}` : ""}`,
    "",
    appt.client_name,
    appt.phone ? String(appt.phone) : "",
    appt.email ? String(appt.email) : "",
  ];
  if (appt.notes) lines.push("", `Notes: ${appt.notes}`);
  lines.push("", appt.status === "confirmed" ? "Status: confirmed" : "Status: awaiting confirmation");
  return lines.filter((line) => line !== "").join("\n");
}
