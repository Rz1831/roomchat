// Shared formatting + date helpers used by pages, APIs and the client.
export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const money = (cents) => "$" + Number(cents || 0).toLocaleString("en-US");

export const todayISO = (tz = "America/Los_Angeles") => {
  // en-CA renders YYYY-MM-DD, which is what D1/Lexicographic comparisons want.
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
};

export const parseISO = (iso) => {
  const [y, m, d] = String(iso).split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
};

export const toISO = (date) => date.toISOString().slice(0, 10);

export const addDays = (iso, days) => {
  const d = parseISO(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
};

export const formatDate = (iso, opts = {}) => {
  const d = parseISO(iso);
  const base = { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" };
  return new Intl.DateTimeFormat("en-US", { ...base, ...opts }).format(d);
};

export const formatDateShort = (iso) => formatDate(iso, { month: "short" });
export const weekday = (iso) => DAY_NAMES[parseISO(iso).getUTCDay()];
export const longDay = (iso) => formatDate(iso, { weekday: "long", month: "long", day: "numeric" });

export const timeLabel = (t) => {
  const [h, m] = String(t).split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

export const minutesToDuration = (mins) => {
  if (!mins) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return [h ? `${h} hr` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
};

export const timeToMinutes = (t) => {
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + (m || 0);
};

export const minutesToTime = (mins) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

export const initials = (name) =>
  String(name || "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] || "")
    .join("")
    .toUpperCase();

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v || "").trim());

export const randomToken = (bytes = 16) => {
  const arr = crypto.getRandomValues(new Uint8Array(bytes));
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const bookingRef = () => "LUM-" + randomToken(3).toUpperCase().slice(0, 4);

export const giftCode = () => {
  const raw = randomToken(6).toUpperCase();
  return `LUM-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
};
