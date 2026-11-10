// Google Maps links for the "Find Us" section. The owner can paste a share
// link, a full Maps URL or the "Embed a map" iframe code; we validate the host,
// resolve short links and always store a plain google.com/maps embed URL so no
// HTML, attribute or script from the pasted value can reach a page.

const MAPS_EMBED = "https://www.google.com/maps";

export const cleanQuery = (value) => {
  const text = String(value ?? "")
    .replace(/\+/g, " ")
    .replace(/[\u0000-\u001f\u007f<>"'`\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 200);
};

// Pull the src out of a "<iframe src=...>" embed snippet; otherwise the value
// itself is the link to inspect.
export const extractMapUrl = (input) => {
  const raw = String(input ?? "").trim();
  if (!raw) return "";
  const iframe = raw.match(/<iframe[\s\S]*?src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  if (iframe) return String(iframe[1] || iframe[2] || iframe[3] || "").trim();
  return raw;
};

export const parseMapUrl = (raw) => {
  let url;
  try {
    url = new URL(String(raw || "").trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  if (host === "maps.app.goo.gl") return { url, short: true };
  const google = host === "google.com" || host.endsWith(".google.com");
  if (google && url.pathname.startsWith("/maps")) return { url, short: false };
  return null;
};

const pinnedCoords = (url) => {
  const haystack = `${url.pathname}${url.search}`;
  const at = haystack.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) return `${at[1]},${at[2]}`;
  // Google's "Embed a map" payload carries the point as !2d<lng>!3d<lat>.
  const embed = haystack.match(/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/);
  if (embed) return `${embed[2]},${embed[1]}`;
  const latLng = haystack.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (latLng) return `${latLng[1]},${latLng[2]}`;
  return "";
};

export const placeQuery = (url) => {
  for (const key of ["q", "query", "destination", "ll", "center"]) {
    const value = cleanQuery(url.searchParams.get(key));
    if (value) return value === "0,0" ? "" : value;
  }
  const pinned = pinnedCoords(url);
  if (pinned) return pinned;
  const place = url.pathname.match(/\/place\/([^/]+)/);
  if (place) return cleanQuery(decodeURIComponent(place[1]));
  return "";
};

export const embedUrl = (query) => `${MAPS_EMBED}?q=${encodeURIComponent(query)}&output=embed`;

const resolveShortLink = async (url) => {
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; LumiereSalonPanel/1.0)" },
    });
    try { await res.body?.cancel(); } catch { /* body unused */ }
    return res.url || "";
  } catch {
    return "";
  }
};

// Returns { ok: true, link, embed } or { ok: false, error }.
export async function resolveMapLink(input, fallbackAddress = "") {
  const raw = extractMapUrl(input);
  if (!raw) return { ok: false, error: "Paste a Google Maps link or the embed code." };
  const parsed = parseMapUrl(raw);
  if (!parsed) {
    return { ok: false, error: "Only Google Maps links work — a maps.app.goo.gl share link or a google.com/maps URL." };
  }

  let target = parsed.url;
  if (parsed.short) {
    const resolved = await resolveShortLink(parsed.url);
    const followed = resolved ? parseMapUrl(resolved) : null;
    if (followed && !followed.short) target = followed.url;
  }

  const query = placeQuery(target) || cleanQuery(fallbackAddress);
  if (!query) {
    return { ok: false, error: "Could not find a location in that link. Try the “Embed a map” code from Google Maps." };
  }
  return { ok: true, link: raw.slice(0, 600), embed: embedUrl(query), query };
}
