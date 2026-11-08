import { page } from "./src/layout.js";
import { APP_JS } from "./src/client.js";
import { ADMIN_JS } from "./src/admin.js";
import { handleApi } from "./src/api.js";
import { currentUser, ensureAdmin } from "./src/auth.js";
import {
  all, one, getServices, getStylists, getTestimonials, getGallery, getPosts, getFaqs, getHours,
} from "./src/db.js";
import { todayISO, esc } from "./src/util.js";
import { homePage } from "./src/pages/home.js";
import { servicesPage } from "./src/pages/services.js";
import { aboutPageWrapped } from "./src/pages/about.js";
import { galleryPageHtml } from "./src/pages/gallery.js";
import { bookingPage } from "./src/pages/booking.js";
import { contactPageHtml } from "./src/pages/contact.js";
import { blogPageHtml, postPage } from "./src/pages/blog.js";
import { giftPageHtml } from "./src/pages/giftcards.js";
import { faqPage, privacyPage, notFoundPage } from "./src/pages/static.js";
import { authPage, accountPage } from "./src/pages/account.js";
import { adminPage } from "./src/pages/admin.js";
import { managePage } from "./src/pages/manage.js";

const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "SAMEORIGIN",
};

const html = (body, status = 200) =>
  new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", ...SECURITY_HEADERS } });

const redirect = (location, status = 302) => new Response(null, { status, headers: { location } });

const asset = (body, type = "text/javascript; charset=utf-8") =>
  new Response(body, { headers: { "content-type": type, "cache-control": "no-store", ...SECURITY_HEADERS } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") return new Response(null, { status: 204 });

    try {
      await ensureAdmin(env);

      if (path.startsWith("/api/")) return await handleApi(request, env);
      if (path === "/assets/app.js") return asset(APP_JS);
      if (path === "/assets/admin.js") return asset(ADMIN_JS);
      if (path === "/health") return new Response("ok", { headers: { "content-type": "text/plain" } });
      if (path === "/robots.txt") {
        return new Response("User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nSitemap: https://lumiere-salon.com/sitemap.xml\n", {
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
      if (path === "/sitemap.xml") return sitemap(env);

      if (request.method !== "GET" && request.method !== "HEAD") {
        return html(notFoundPage({ user: null, path }), 405);
      }

      const user = await currentUser(request, env.DB);
      const db = env.DB;

      switch (path) {
        case "/": {
          const [services, stylists, testimonials, gallery] = await Promise.all([
            getServices(db), getStylists(db), getTestimonials(db), getGallery(db),
          ]);
          return html(homePage({ services, stylists, testimonials, gallery, faqs: getFaqs(), user }));
        }
        case "/services": {
          const services = await getServices(db);
          return html(servicesPage({ services, faqs: getFaqs(), user }));
        }
        case "/about": {
          const stylists = await getStylists(db);
          return html(aboutPageWrapped({ stylists, user }));
        }
        case "/gallery": {
          const gallery = await getGallery(db);
          return html(galleryPageHtml({ gallery, user }));
        }
        case "/book": {
          const [services, stylists] = await Promise.all([getServices(db), getStylists(db)]);
          return html(bookingPage({ services, stylists, user, preselect: url.searchParams.get("service") || "", today: todayISO() }));
        }
        case "/contact": {
          const hours = await getHours(db);
          return html(contactPageHtml({ hours, user }));
        }
        case "/blog": {
          const posts = await getPosts(db);
          return html(blogPageHtml({ posts, user }));
        }
        case "/gift-cards": return html(giftPageHtml({ faqs: getFaqs(), user }));
        case "/faq": return html(faqPage({ faqs: getFaqs(), user }));
        case "/privacy": return html(privacyPage({ user }));

        case "/login":
        case "/signup": {
          if (user) return redirect(user.role === "admin" ? "/admin" : "/account");
          return html(authPage({ mode: path === "/login" ? "login" : "signup", user }));
        }

        case "/account": {
          if (!user) return redirect("/login");
          const rows = await all(
            db,
            `SELECT a.*, s.name AS service_name, s.slug AS service_slug, st.name AS stylist_name
               FROM appointments a JOIN services s ON s.id = a.service_id
               LEFT JOIN stylists st ON st.id = a.stylist_id
              WHERE a.user_id = ? ORDER BY a.date DESC, a.time DESC`,
            user.id,
          );
          const today = todayISO();
          const upcoming = rows.filter((a) => a.date >= today && ["pending", "confirmed"].includes(a.status)).reverse();
          const past = rows.filter((a) => a.date < today || !["pending", "confirmed"].includes(a.status));
          return html(accountPage({ user, upcoming, past }));
        }

        case "/admin": {
          if (!user) return redirect("/login?next=%2Fadmin");
          if (user.role !== "admin") return redirect("/account");
          return html(adminPage({ user }));
        }

        case "/manage": {
          const ref = url.searchParams.get("ref") || "";
          const token = url.searchParams.get("token") || "";
          const appointment = ref && token
            ? await one(
                db,
                `SELECT a.*, s.name AS service_name, s.price AS price, s.duration AS duration, st.name AS stylist_name
                   FROM appointments a JOIN services s ON s.id = a.service_id
                   LEFT JOIN stylists st ON st.id = a.stylist_id
                  WHERE a.ref = ? AND a.manage_token = ?`,
                ref, token,
              )
            : null;
          if (!appointment) return html(notFoundPage({ user, path }), 404);
          return html(managePage({ appointment, user }));
        }
        default:
          break;
      }

      if (path.startsWith("/blog/")) {
        const slug = decodeURIComponent(path.slice(6));
        const posts = await getPosts(db);
        const post = posts.find((p) => p.slug === slug);
        if (!post) return html(notFoundPage({ user, path }), 404);
        return html(postPage({ post, others: posts.filter((p) => p.slug !== slug), user }));
      }

      return html(notFoundPage({ user, path }), 404);
    } catch (err) {
      console.error("Unhandled error", path, err && err.stack ? err.stack : err);
      return html(
        page({
          title: "Something went wrong",
          path,
          noindex: true,
          body: `<section class="section"><div class="wrap error-page"><div class="code" aria-hidden="true">500</div><h1>We Dropped a Comb</h1><p class="lede" style="margin-inline:auto">Something went wrong on our side. Please refresh, or call the salon on +1 (323) 555-0184 and we will sort it out.</p><a class="btn" href="/" style="margin-top:20px">Back to home</a></div></section>`,
        }),
        500,
      );
    }
  },
};

async function sitemap(env) {
  const posts = await getPosts(env.DB);
  const today = todayISO();
  const pages = [
    ["/", "1.0"], ["/services", "0.9"], ["/book", "0.9"], ["/about", "0.7"],
    ["/gallery", "0.7"], ["/contact", "0.6"], ["/blog", "0.7"], ["/gift-cards", "0.6"],
    ["/faq", "0.5"], ["/privacy", "0.3"],
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(([p, pri]) => `  <url><loc>https://lumiere-salon.com${p}</loc><lastmod>${today}</lastmod><priority>${pri}</priority></url>`).join("\n")}
${posts.map((p) => `  <url><loc>https://lumiere-salon.com/blog/${encodeURIComponent(p.slug)}</loc><lastmod>${esc(p.published_at)}</lastmod><priority>0.5</priority></url>`).join("\n")}
</urlset>`;
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
