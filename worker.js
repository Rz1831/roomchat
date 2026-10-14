import { DurableObject } from "cloudflare:workers";
import html from "./index.html";

const MAX_HISTORY = 100;
const MAX_TEXT = 500;
const MAX_NAME = 20;
const MAX_RAW = 2000;        // biggest accepted WebSocket frame (characters)
const MAX_PER_IP = 5;        // simultaneous connections from one IP
const MAX_SOCKETS = 400;     // simultaneous connections in the whole room
const SESSION_TTL = 12 * 3600; // seconds a verified visitor stays verified

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

// ───────────── Session cookie helpers (HMAC-signed) ─────────────
const enc = new TextEncoder();

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function makeSession(secret) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL;
  return exp + "." + (await hmac(secret, String(exp)));
}

async function checkSession(request, secret) {
  const m = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)sess=([^;]+)/);
  if (!m) return false;
  const [exp, sig] = m[1].split(".");
  if (!exp || !sig) return false;
  if (Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, await hmac(secret, exp));
}

const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...extra },
  });

// ───────────── Chat room (Durable Object) ─────────────
export class ChatRoom extends DurableObject {
  lastSent = new WeakMap();

  async fetch(request) {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const open = this.ctx.getWebSockets().filter((w) => w.readyState === 1);

    if (open.length >= MAX_SOCKETS) {
      return new Response("Room is full", { status: 503 });
    }
    const fromIp = open.filter((w) => {
      const a = w.deserializeAttachment();
      return a && a.ip === ip;
    }).length;
    if (fromIp >= MAX_PER_IP) {
      return new Response("Too many connections", { status: 429 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ ip });
    return new Response(null, { status: 101, webSocket: client });
  }

  nameOf(ws) {
    const a = ws.deserializeAttachment();
    return (a && a.name) || null;
  }

  live(exclude) {
    return this.ctx
      .getWebSockets()
      .filter((w) => w.readyState === 1 && w !== exclude);
  }

  findByName(name, exclude) {
    return this.live(exclude).filter((w) => {
      const n = this.nameOf(w);
      return n && same(n, name);
    });
  }

  users(exclude) {
    const names = this.live(exclude).map((w) => this.nameOf(w)).filter(Boolean);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }

  send(ws, obj) {
    try { ws.send(JSON.stringify(obj)); } catch {}
  }

  broadcast(obj, exclude) {
    const s = JSON.stringify(obj);
    for (const w of this.live(exclude)) {
      if (!this.nameOf(w)) continue; // not joined yet
      try { w.send(s); } catch {}
    }
  }

  broadcastUsers(exclude) {
    this.broadcast({ type: "users", users: this.users(exclude) }, exclude);
  }

  async webSocketMessage(ws, raw) {
    if (typeof raw !== "string" || raw.length > MAX_RAW) return;
    let data;
    try { data = JSON.parse(raw); } catch { return; }

    // ── join ──
    if (data.type === "join") {
      if (this.nameOf(ws)) return;
      const name = String(data.name || "")
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_NAME);
      if (!name) {
        this.send(ws, { type: "error", code: "invalid_name" });
        return;
      }
      if (this.findByName(name, ws).length) {
        this.send(ws, { type: "error", code: "name_taken" });
        return;
      }
      ws.serializeAttachment({ ...(ws.deserializeAttachment() || {}), name });
      const history = (await this.ctx.storage.get("history")) || [];
      this.send(ws, { type: "joined", name, history });
      this.broadcastUsers();
      return;
    }

    const me = this.nameOf(ws);
    if (!me) return;

    // rate limit: one message per 0.5s
    const now = Date.now();
    if (now - (this.lastSent.get(ws) || 0) < 500) return;

    const text = String(data.text || "").trim().slice(0, MAX_TEXT);
    if (!text) return;

    // ── public message ──
    if (data.type === "msg") {
      this.lastSent.set(ws, now);
      const msg = { id: crypto.randomUUID(), name: me, text, ts: now };
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
      const to = String(data.to || "").trim();
      if (!to || same(to, me)) return;

      const targets = this.findByName(to, ws);
      if (!targets.length) {
        this.send(ws, { type: "dm_failed", to });
        return;
      }
      const payload = {
        type: "dm",
        id: crypto.randomUUID(),
        from: me,
        to: this.nameOf(targets[0]),
        text,
        ts: now,
      };
      for (const t of targets) this.send(t, payload);
      this.send(ws, payload);
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
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Protection is ON only when both secrets exist (see setup steps)
    const protectedMode = !!(env.TURNSTILE_SECRET && env.SESSION_SECRET);

    // Is this visitor already verified?
    if (url.pathname === "/session") {
      const ok = !protectedMode || (await checkSession(request, env.SESSION_SECRET));
      return json({ ok });
    }

    // Verify the Turnstile token, then hand out a signed cookie
    if (url.pathname === "/verify" && request.method === "POST") {
      if (!protectedMode) return json({ ok: true });

      let token = "";
      try { token = String((await request.json()).token || ""); } catch {}
      if (!token) return json({ ok: false }, 400);

      const form = new FormData();
      form.append("secret", env.TURNSTILE_SECRET);
      form.append("response", token);
      const ip = request.headers.get("CF-Connecting-IP");
      if (ip) form.append("remoteip", ip);

      let result;
      try {
        const r = await fetch(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          { method: "POST", body: form }
        );
        result = await r.json();
      } catch {
        return json({ ok: false }, 502);
      }
      if (!result.success) return json({ ok: false }, 403);

      const cookie = await makeSession(env.SESSION_SECRET);
      return json({ ok: true }, 200, {
        "Set-Cookie":
          "sess=" + cookie + "; Path=/; Max-Age=" + SESSION_TTL + "; HttpOnly; Secure; SameSite=Lax",
      });
    }

    // WebSocket
    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket", { status: 426 });
      }
      // Only accept connections coming from our own page
      const origin = request.headers.get("Origin");
      if (origin) {
        let originHost = "";
        try { originHost = new URL(origin).host; } catch {}
        if (originHost !== url.host) return new Response("Forbidden", { status: 403 });
      }
      if (protectedMode && !(await checkSession(request, env.SESSION_SECRET))) {
        return new Response("Verification required", { status: 401 });
      }
      const stub = env.CHAT.get(env.CHAT.idFromName("main"));
      return stub.fetch(request);
    }

    // The page itself
    return new Response(
      html.replace("__TURNSTILE_SITEKEY__", protectedMode ? env.TURNSTILE_SITEKEY || "" : ""),
      { headers: { "content-type": "text/html; charset=utf-8" } }
    );
  },
};
