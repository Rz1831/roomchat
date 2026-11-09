// Password hashing + cookie sessions on D1. No third-party auth provider.
import { randomToken } from "./util.js";
import { one, run } from "./db.js";

const PBKDF2_ITER = 100000;
const SESSION_DAYS = 30;
const enc = new TextEncoder();
const hex = (bytes) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

export const hashPassword = async (password, salt = randomToken(16)) => {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: PBKDF2_ITER, hash: "SHA-256" },
    key,
    256,
  );
  return { hash: hex(bits), salt };
};

export const verifyPassword = async (password, hash, salt) => {
  const { hash: candidate } = await hashPassword(password, salt);
  if (candidate.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ hash.charCodeAt(i);
  return diff === 0;
};

const cookie = (value, maxAge) =>
  `salon_session=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

export const getCookie = (request, name) => {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return "";
};

export const createSession = async (db, userId) => {
  const token = randomToken(24);
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  await run(db, "INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)", token, userId, expires);
  return { token, header: cookie(token, SESSION_DAYS * 86400) };
};

export const clearSession = async (db, token) => {
  if (token) await run(db, "DELETE FROM sessions WHERE token = ?", token);
  return cookie("", 0);
};

export const currentUser = async (request, db) => {
  const token = getCookie(request, "salon_session") || "";
  if (!token) return null;
  const row = await one(
    db,
    `SELECT u.id, u.email, u.name, u.phone, u.role, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND s.expires_at > datetime('now')`,
    token,
  );
  return row || null;
};

export const hashToken = async (value) => {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(String(value)));
  return hex(digest);
};

// The seeded admin account. Credentials come from environment vars when set;
// the defaults are documented in AGENTS.md and are meant to be changed.
let adminReady = null;
export const ensureAdmin = async (env) => {
  if (adminReady) return adminReady;
  adminReady = (async () => {
    const exists = await one(env.DB, "SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (exists) return;
    const email = (env.ADMIN_EMAIL || "admin@lumiere-salon.com").toLowerCase();
    const password = env.ADMIN_PASSWORD || "LumiereAdmin!2026";
    const { hash, salt } = await hashPassword(password);
    await run(
      env.DB,
      `INSERT INTO users (email, name, phone, password_hash, salt, role)
       VALUES (?,?,?,?,?, 'admin')
       ON CONFLICT(email) DO UPDATE SET role = 'admin', password_hash = excluded.password_hash, salt = excluded.salt`,
      email, "Amara Laurent", env.SALON_PHONE || null, hash, salt,
    );
  })();
  return adminReady;
};
