import { DurableObject } from "cloudflare:workers";
import html from "./index.html";

const MAX_HISTORY = 100;
const MAX_TEXT = 500;
const MAX_RAW = 2000;          // biggest accepted WebSocket frame (characters)
const MAX_PER_IP = 5;          // simultaneous connections from one IP
const MAX_PER_USER = 5;        // simultaneous connections for one account
const MAX_SOCKETS = 400;       // simultaneous connections in the whole room
const SESSION_TTL = 30 * 24 * 3600; // seconds a login stays valid (30 days)
const PBKDF2_ITER = 100000;    // the maximum Cloudflare Workers allows
const KICK_MS = 5 * 60 * 1000; // how long a kicked user is blocked
const USERNAME_RE = /^[\p{L}\p{N}_.\-]{3,20}$/u;
const RESERVED = new Set(["admin", "administrator", "owner", "system", "moderator", "mod", "root", "support"]);

// ───────────── helpers ─────────────
const enc = new TextEncoder();

const b64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hex = (bytes) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
const randomHex = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));

async function sha256hex(str) {
  return hex(await crypto.subtle.digest("SHA-256", enc.encode(str)));
}

async function pbkdf2(password, salt, iterations = PBKDF2_ITER) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256);
}

function timingEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function sameSecret(a, b) {
  return timingEqual(await sha256hex(a), await sha256hex(b));
}

const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...extra },
  });

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return "";
}

const authCookie = (value, maxAge) =>
  "auth=" + value + "; Path=/; Max-Age=" + maxAge + "; HttpOnly; Secure; SameSite=Lax";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();
const pub = (u) => ({ name: u.name, role: u.role });

// ───────────── Chat room + accounts (Durable Object) ─────────────
export class ChatRoom extends DurableObject {
  lastSent = new WeakMap();
  fails = new Map();   // "ip|user" -> failed login times
  ipFails = new Map(); // ip -> failed login times
  regs = new Map();    // ip -> sign-up times
  kicked = new Map();  // user -> blocked until (ms)

  // ── tiny in-memory rate limiter ──
  tooMany(map, key, windowMs, limit) {
    const now = Date.now();
    const arr = (map.get(key) || []).filter((t) => now - t < windowMs);
    map.set(key, arr);
    return arr.length >= limit;
  }
  note(map, key) {
    if (map.size > 5000) map.clear();
    const arr = map.get(key) || [];
    arr.push(Date.now());
    map.set(key, arr);
  }

  ownerLower() {
    return String(this.env.OWNER_USERNAME || "").trim().toLowerCase();
  }

  // ── entry ──
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") return this.handleWs(request);
    if (url.pathname.startsWith("/api/")) return this.handleApi(request, url);
    return new Response("Not found", { status: 404 });
  }

  // ── sessions ──
  async authenticate(request) {
    const raw = getCookie(request, "auth");
    const i = raw.lastIndexOf(".");
    if (i < 1) return null;
    let lower;
    try { lower = decodeURIComponent(raw.slice(0, i)); } catch { return null; }
    const rand = raw.slice(i + 1);
    if (!/^[a-f0-9]{64}$/.test(rand)) return null;

    const sh = await sha256hex(rand);
    const key = "s:" + lower + ":" + sh;
    const sess = await this.ctx.storage.get(key);
    if (!sess) return null;
    if (sess.exp < Date.now() / 1000) {
      await this.ctx.storage.delete(key);
      return null;
    }
    const user = await this.ctx.storage.get("u:" + lower);
    if (!user || user.banned) return null;
    return { user, key, sh, sess, raw };
  }

  async newSession(user) {
    const rand = randomHex(32);
    const sh = await sha256hex(rand);
    await this.ctx.storage.put("s:" + user.lower + ":" + sh, {
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL,
    });
    return { cookie: encodeURIComponent(user.lower) + "." + rand, sh };
  }

  async dropSessions(lower, exceptKey) {
    const list = await this.ctx.storage.list({ prefix: "s:" + lower + ":" });
    for (const key of list.keys()) {
      if (key !== exceptKey) await this.ctx.storage.delete(key);
    }
  }

  closeSockets(lower, predicate, payload, code, reason) {
    for (const w of this.live()) {
      const a = this.att(w);
      if (a.lower === lower && (!predicate || predicate(a))) {
        if (payload) this.send(w, payload);
        try { w.close(code, reason); } catch {}
      }
    }
  }

  // ── accounts ──
  async createUser(name, password, role) {
    const lower = name.toLowerCase();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await pbkdf2(password, salt);
    // check + write with no await between (storage ops are serialized)
    if (await this.ctx.storage.get("u:" + lower)) return null;
    const user = {
      name, lower, role,
      salt: b64(salt), hash: b64(hash), iter: PBKDF2_ITER,
      created: Date.now(), banned: false,
    };
    await this.ctx.storage.put("u:" + lower, user);
    return user;
  }

  async verifyPassword(user, password) {
    const h = await pbkdf2(password, fromB64(user.salt), user.iter || PBKDF2_ITER);
    return timingEqual(b64(h), user.hash);
  }

  // ── HTTP API ──
  async handleApi(request, url) {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const path = url.pathname;

    if (path === "/api/me" && request.method === "GET") {
      const a = await this.authenticate(request);
      if (!a) return json({ ok: false }, 401, { "Set-Cookie": authCookie("", 0) });
      const headers = {};
      const left = a.sess.exp - Date.now() / 1000;
      if (left < SESSION_TTL - 86400) { // keep the login alive: renew about once a day
        await this.ctx.storage.put(a.key, { exp: Math.floor(Date.now() / 1000) + SESSION_TTL });
        headers["Set-Cookie"] = authCookie(a.raw, SESSION_TTL);
      }
      return json({ ok: true, user: pub(a.user) }, 200, headers);
    }

    if (request.method !== "POST") return json({ ok: false, error: "bad_request" }, 405);
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, error: "bad_request" }, 400); }
    if (!body || typeof body !== "object") return json({ ok: false, error: "bad_request" }, 400);

    if (path === "/api/register") return this.register(body, ip);
    if (path === "/api/login") return this.login(body, ip);
    if (path === "/api/logout") return this.logout(request);
    if (path === "/api/password") return this.changePassword(request, body, ip);
    return json({ ok: false, error: "not_found" }, 404);
  }

  async register(body, ip) {
    if (this.tooMany(this.regs, ip, 3600000, 5)) return json({ ok: false, error: "rate_limited" }, 429);

    const name = String(body.username || "").trim();
    const password = String(body.password || "");
    if (!USERNAME_RE.test(name)) return json({ ok: false, error: "invalid_username" }, 400);
    const lower = name.toLowerCase();
    if (RESERVED.has(lower) || lower === this.ownerLower()) {
      return json({ ok: false, error: "username_reserved" }, 403);
    }
    if (password.length < 8 || password.length > 128) {
      return json({ ok: false, error: "weak_password" }, 400);
    }
    this.note(this.regs, ip);

    const user = await this.createUser(name, password, "user");
    if (!user) return json({ ok: false, error: "username_taken" }, 409);

    const s = await this.newSession(user);
    return json({ ok: true, user: pub(user) }, 200, { "Set-Cookie": authCookie(s.cookie, SESSION_TTL) });
  }

  async login(body, ip) {
    const name = String(body.username || "").trim();
    const password = String(body.password || "");
    if (!name || !password || name.length > 40 || password.length > 128) {
      return json({ ok: false, error: "invalid_credentials" }, 401);
    }
    const lower = name.toLowerCase();
    const fk = ip + "|" + lower;
    if (this.tooMany(this.fails, fk, 600000, 5) || this.tooMany(this.ipFails, ip, 600000, 20)) {
      return json({ ok: false, error: "too_many_attempts" }, 429);
    }

    let user = await this.ctx.storage.get("u:" + lower);
    let ok = false;
    if (!user) {
      // First ever login of the owner: create the account from the OWNER_PASSWORD secret
      if (lower === this.ownerLower() && this.env.OWNER_PASSWORD) {
        if (await sameSecret(password, String(this.env.OWNER_PASSWORD))) {
          user = await this.createUser(String(this.env.OWNER_USERNAME).trim(), password, "owner");
          ok = !!user;
        }
      }
    } else {
      ok = await this.verifyPassword(user, password);
    }

    if (!ok) {
      this.note(this.fails, fk);
      this.note(this.ipFails, ip);
      return json({ ok: false, error: "invalid_credentials" }, 401);
    }
    if (user.banned) return json({ ok: false, error: "banned" }, 403);

    this.fails.delete(fk);
    const s = await this.newSession(user);
    return json({ ok: true, user: pub(user) }, 200, { "Set-Cookie": authCookie(s.cookie, SESSION_TTL) });
  }

  async logout(request) {
    const a = await this.authenticate(request);
    if (a) {
      await this.ctx.storage.delete(a.key);
      this.closeSockets(a.user.lower, (x) => x.sh === a.sh, null, 4002, "logout");
      this.broadcastUsers();
    }
    return json({ ok: true }, 200, { "Set-Cookie": authCookie("", 0) });
  }

  async changePassword(request, body, ip) {
    const a = await this.authenticate(request);
    if (!a) return json({ ok: false, error: "unauthorized" }, 401);

    const oldPw = String(body.oldPassword || "");
    const newPw = String(body.newPassword || "");
    const fk = ip + "|" + a.user.lower;
    if (this.tooMany(this.fails, fk, 600000, 5)) return json({ ok: false, error: "too_many_attempts" }, 429);

    if (!oldPw || oldPw.length > 128 || !(await this.verifyPassword(a.user, oldPw))) {
      this.note(this.fails, fk);
      return json({ ok: false, error: "invalid_credentials" }, 401);
    }
    if (newPw.length < 8 || newPw.length > 128) return json({ ok: false, error: "weak_password" }, 400);

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await pbkdf2(newPw, salt);
    const fresh = await this.ctx.storage.get("u:" + a.user.lower);
    await this.ctx.storage.put("u:" + a.user.lower, {
      ...fresh, salt: b64(salt), hash: b64(hash), iter: PBKDF2_ITER,
    });
    // every other device is signed out; this one stays
    await this.dropSessions(a.user.lower, a.key);
    this.closeSockets(a.user.lower, (x) => x.sh !== a.sh, null, 4002, "password changed");
    this.fails.delete(fk);
    this.broadcastUsers();
    return json({ ok: true });
  }

  // ── WebSocket ──
  att(ws) {
    return ws.deserializeAttachment() || {};
  }

  live(exclude) {
    return this.ctx.getWebSockets().filter((w) => w.readyState === 1 && w !== exclude);
  }

  byLower(lower, exclude) {
    return this.live(exclude).filter((w) => this.att(w).lower === lower);
  }

  users(exclude) {
    const m = new Map();
    for (const w of this.live(exclude)) {
      const a = this.att(w);
      if (a.lower && !m.has(a.lower)) m.set(a.lower, { name: a.name, role: a.role });
    }
    return [...m.values()].sort((x, y) => x.name.localeCompare(y.name));
  }

  send(ws, obj) {
    try { ws.send(JSON.stringify(obj)); } catch {}
  }

  broadcast(obj, exclude) {
    const s = JSON.stringify(obj);
    for (const w of this.live(exclude)) {
      if (!this.att(w).lower) continue;
      try { w.send(s); } catch {}
    }
  }

  broadcastUsers(exclude) {
    this.broadcast({ type: "users", users: this.users(exclude) }, exclude);
  }

  async handleWs(request) {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const a = await this.authenticate(request);
    if (!a) return new Response("Unauthorized", { status: 401 });
    const u = a.user;

    if ((this.kicked.get(u.lower) || 0) > Date.now()) {
      return new Response("Removed by the owner", { status: 403 });
    }

    const open = this.live();
    if (open.length >= MAX_SOCKETS) return new Response("Room is full", { status: 503 });
    if (open.filter((w) => this.att(w).ip === ip).length >= MAX_PER_IP) {
      return new Response("Too many connections", { status: 429 });
    }
    if (this.byLower(u.lower).length >= MAX_PER_USER) {
      return new Response("Too many connections for this account", { status: 429 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ ip, name: u.name, lower: u.lower, role: u.role, sh: a.sh });

    const history = (await this.ctx.storage.get("history")) || [];
    this.send(server, { type: "joined", name: u.name, role: u.role, history });
    this.broadcastUsers();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, raw) {
    if (typeof raw !== "string" || raw.length > MAX_RAW) return;
    let data;
    try { data = JSON.parse(raw); } catch { return; }

    const a = this.att(ws);
    if (!a.lower) return;

    if (data.type === "mod") return this.handleMod(ws, a, data);

    // rate limit: one message per 0.5s
    const now = Date.now();
    if (now - (this.lastSent.get(ws) || 0) < 500) return;

    const text = String(data.text || "").trim().slice(0, MAX_TEXT);
    if (!text) return;

    // ── public message ──
    if (data.type === "msg") {
      this.lastSent.set(ws, now);
      const msg = { id: crypto.randomUUID(), name: a.name, role: a.role, text, ts: now };
      const history = (await this.ctx.storage.get("history")) || [];
      history.push(msg);
      while (history.length > MAX_HISTORY) history.shift();
      await this.ctx.storage.put("history", history);
      this.broadcast({ type: "message", message: msg });
      return;
    }

    // ── private message (delivered live, never stored on the server) ──
    if (data.type === "dm") {
      this.lastSent.set(ws, now);
      const to = String(data.to || "").trim().toLowerCase();
      if (!to || to === a.lower) return;

      const targets = this.byLower(to, ws);
      if (!targets.length) {
        this.send(ws, { type: "dm_failed", to: String(data.to || "").trim() });
        return;
      }
      const payload = {
        type: "dm",
        id: crypto.randomUUID(),
        from: a.name,
        fromRole: a.role,
        to: this.att(targets[0]).name,
        text,
        ts: now,
      };
      for (const t of targets) this.send(t, payload);
      this.send(ws, payload);
    }
  }

  // ── owner moderation ──
  async handleMod(ws, a, data) {
    const caller = await this.ctx.storage.get("u:" + a.lower);
    if (!caller || caller.role !== "owner" || caller.banned) {
      this.send(ws, { type: "error", code: "forbidden" });
      return;
    }
    const action = String(data.action || "");

    if (action === "delete") {
      const id = String(data.id || "");
      const history = (await this.ctx.storage.get("history")) || [];
      const next = history.filter((m) => m.id !== id);
      if (next.length !== history.length) {
        await this.ctx.storage.put("history", next);
        this.broadcast({ type: "deleted", id });
      }
      return;
    }

    if (action === "clear") {
      await this.ctx.storage.put("history", []);
      this.broadcast({ type: "cleared" });
      return;
    }

    if (action === "banlist") {
      const all = await this.ctx.storage.list({ prefix: "u:" });
      const names = [];
      for (const u of all.values()) if (u.banned) names.push(u.name);
      this.send(ws, { type: "mod_result", action, ok: true, names });
      return;
    }

    if (action === "kick" || action === "ban" || action === "unban") {
      const target = String(data.name || "").trim().toLowerCase();
      const rec = target ? await this.ctx.storage.get("u:" + target) : null;
      const result = (ok, code) =>
        this.send(ws, { type: "mod_result", action, ok, code, name: rec ? rec.name : String(data.name || "") });

      if (!rec) return result(false, "notfound");
      if (rec.role === "owner") return result(false, "forbidden");

      if (action === "kick") {
        const sockets = this.byLower(target);
        if (!sockets.length) return result(false, "notfound");
        this.kicked.set(target, Date.now() + KICK_MS);
        this.closeSockets(target, null, { type: "kicked" }, 4001, "kicked");
        this.broadcastUsers();
        return result(true);
      }
      if (action === "ban") {
        await this.ctx.storage.put("u:" + target, { ...rec, banned: true });
        await this.dropSessions(target);
        this.closeSockets(target, null, { type: "banned" }, 4003, "banned");
        this.broadcastUsers();
        return result(true);
      }
      // unban
      if (!rec.banned) return result(false, "notfound");
      await this.ctx.storage.put("u:" + target, { ...rec, banned: false });
      return result(true);
    }
  }

  async webSocketClose(ws, code) {
    try { ws.close(code); } catch {}
    this.broadcastUsers(ws);
  }

  async webSocketError(ws) {
    this.broadcastUsers(ws);
  }
}

// ───────────── Worker entry ─────────────
async function verifyTurnstile(token, env, ip) {
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const out = await r.json();
    return !!out.success;
  } catch {
    return false;
  }
}

function sameOrigin(request, url) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try { return new URL(origin).host === url.host; } catch { return false; }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ip = request.headers.get("CF-Connecting-IP") || "";
    const protectedMode = !!env.TURNSTILE_SECRET; // Turnstile check on sign-in / sign-up
    const room = () => env.CHAT.get(env.CHAT.idFromName("main"));

    // WebSocket (the room checks the login cookie)
    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket", { status: 426 });
      }
      if (!sameOrigin(request, url)) return new Response("Forbidden", { status: 403 });
      return room().fetch(request);
    }

    // Accounts API
    if (url.pathname.startsWith("/api/")) {
      if (!sameOrigin(request, url)) return json({ ok: false, error: "forbidden" }, 403);

      if (request.method === "POST") {
        const bodyText = await request.text();
        if (bodyText.length > 4000) return json({ ok: false, error: "bad_request" }, 413);

        if (protectedMode && (url.pathname === "/api/login" || url.pathname === "/api/register")) {
          let token = "";
          try { token = String(JSON.parse(bodyText).token || ""); } catch {}
          if (!token) return json({ ok: false, error: "captcha_required" }, 400);
          if (!(await verifyTurnstile(token, env, ip))) return json({ ok: false, error: "captcha_failed" }, 403);
        }
        return room().fetch(new Request(request.url, {
          method: "POST",
          headers: request.headers,
          body: bodyText,
        }));
      }
      return room().fetch(request);
    }

    // The page itself
    return new Response(
      html.replace("__TURNSTILE_SITEKEY__", protectedMode ? env.TURNSTILE_SITEKEY || "" : ""),
      {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "x-content-type-options": "nosniff",
          "referrer-policy": "same-origin",
        },
      }
    );
  },
};
