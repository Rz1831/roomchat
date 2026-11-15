// Regression tests for the things the owner panel, edit mode and uploads must
// never be able to break: the menu markup and its icons, the image rules, the
// asset cache-busting, the English map links and the before/after data.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { header, page, assetUrl, ASSET_VERSION } from "../src/layout.js";
import { STYLES } from "../src/styles.js";
import { beforeAfter, beforeAfterShowcase } from "../src/components.js";
import { galleryPage } from "../src/pages/gallery.js";
import { withEnglish, embedUrl, resolveMapLink } from "../src/location.js";
import { esc } from "../src/util.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("mobile menu renders every entry with an inline, explicitly sized icon", () => {
  const markup = header("/");
  const mobile = markup.split('<div class="mobile-nav" id="mobile-nav"')[1];
  assert.ok(mobile, "mobile menu markup is present");

  const labels = mobile.match(/class="mobile-nav__label"/g) || [];
  assert.equal(labels.length, 6, "Home, Services, About, Gallery, Book, Contact");

  // Home, Services, About, Gallery, Book, Contact + phone + Instagram/Facebook/
  // Pinterest/WhatsApp + the arrow on each link and on the CTA.
  const svgs = mobile.match(/<svg[^>]*>/g) || [];
  assert.ok(svgs.length >= 11, `expected at least 11 icons, found ${svgs.length}`);
  for (const tag of svgs) {
    assert.match(tag, /width="24"/);
    assert.match(tag, /height="24"/);
    assert.match(tag, /viewBox="0 0 24 24"/);
  }
  assert.match(mobile, /Book Appointment/);
  assert.match(mobile, /tel:\+13235550184/);
  assert.match(mobile, /wa\.me\/13235550184/);
});

test("menu sits above the page, locks scrolling and animates to a cross", () => {
  assert.match(STYLES, /\.mobile-nav\{position:fixed;inset:var\(--header-h\)/);
  assert.match(STYLES, /\.mobile-nav\{[^}]*z-index:150/);
  // Nothing else paints over the menu: it sits above floating shortcuts and the
  // cookie prompt, which both step aside while it is open.
  assert.match(STYLES, /body\.nav-open \.floating-call,body\.nav-open \.cookie-banner\{display:none\}/);
  assert.match(STYLES, /body\.nav-open\{overflow:hidden\}/);
  assert.match(
    STYLES,
    /\.nav-toggle\[aria-expanded="true"\] span::before\{transform:translateY\(6px\) rotate\(45deg\)\}/,
  );
  assert.match(
    STYLES,
    /\.nav-toggle\[aria-expanded="true"\] span::after\{transform:translateY\(-6px\) rotate\(-45deg\)\}/,
  );
});

test("no stylesheet rule can collapse every icon", () => {
  // A bare `svg { width/height }` rule (or an edit-mode rule) must never exist:
  // that is what shrinks or stretches the menu glyphs into a single line.
  assert.ok(!/(^|[}\n])\s*svg\s*\{/.test(STYLES), "no global svg sizing rule");
  assert.match(STYLES, /\.mobile-nav__label svg\{width:20px;height:20px;flex:none;color:var\(--terracotta\)\}/);
});

test("edit-mode chrome is scoped to the owner's own elements", () => {
  assert.ok(!/\.edit-bar\s*\{/.test(STYLES), "edit bar is not a bare class rule");
  assert.match(STYLES, /#lumiere-edit-bar\{/);
  assert.match(STYLES, /body\.is-editing \[data-slot\]/);
  assert.match(STYLES, /body\.is-editing \.edit-delete\{display:grid\}/);
  // Nothing in edit mode can restyle the header, nav, burger or icons.
  assert.ok(!/body\.is-editing[^{}]*(site-header|mobile-nav|nav-toggle|svg)/.test(STYLES));
});

test("asset URLs carry a content hash so a stale script can never pair with new markup", () => {
  assert.equal(typeof ASSET_VERSION.app, "string");
  const html = page({ title: "Test", path: "/", body: "<p>hi</p>" });
  const srcs = html.match(/<script src="\/assets\/[^"]+"/g) || [];
  assert.ok(srcs.length >= 1);
  for (const tag of srcs) {
    assert.match(tag, /\/assets\/[a-z]+\.js\?v=[a-z0-9]+"/);
  }
  assert.equal(assetUrl("app"), `/assets/app.js?v=${ASSET_VERSION.app}`);
});

test("owner-written text cannot break the header markup", () => {
  assert.equal(esc('</header><img src=x onerror="alert(1)">').includes("<"), false);
  const markup = header("/");
  assert.match(markup, /id="nav-toggle"/);
  assert.match(markup, /id="mobile-nav"/);
});

test("no image is ever stretched: every frame crops or keeps its own ratio", () => {
  assert.match(STYLES, /img\{max-width:100%;height:auto;display:block;/);
  assert.ok(!/object-fit:\s*fill/.test(STYLES), "object-fit: fill must never appear");
  assert.match(STYLES, /\.masonry__item img\{width:100%;height:100%;object-fit:contain/);
  assert.match(STYLES, /\.lightbox img\{[^}]*object-fit:contain/);
  assert.match(STYLES, /\.ba img\{[^}]*object-fit:cover/);
  assert.match(STYLES, /\.img--contain\{object-fit:contain;background:var\(--beige\)\}/);
  // A framed single image is capped so it cannot run off the screen.
  assert.match(STYLES, /\.story__media img\{[^}]*max-height:80vh/);
  assert.match(STYLES, /\.hero__media img\{[^}]*max-height:min\(80vh,760px\)/);
});

test("before/after slider uses the photo's own ratio and keeps both sides labelled", () => {
  const item = {
    id: 4,
    title: "Copper gloss",
    caption: "Same light, same hair",
    before_image: "/media/before",
    after_image: "/media/after",
    before_width: 1000,
    before_height: 1250,
    after_width: 1000,
    after_height: 1250,
  };
  const html = beforeAfter(item);
  assert.match(html, /class="ba" data-ba style="aspect-ratio:1000 \/ 1250"/);
  assert.match(html, /data-slot="ba:4:before"/);
  assert.match(html, /data-slot="ba:4:after"/);
  assert.match(html, /width="1000" height="1250"/);
  assert.match(html, />Before</);
  assert.match(html, />After</);
  assert.match(html, /type="range"/);
  assert.match(html, /arrow keys/);

  const many = beforeAfterShowcase([item, { ...item, id: 5 }], { id: "ba-track-home" });
  assert.match(many, /data-ba-nav="ba-track-home" data-dir="-1"/);
  const single = beforeAfterShowcase([item], { id: "ba-track-home" });
  assert.match(single, /ba-track ba-track--single/);
  assert.equal(beforeAfterShowcase([], {}), "");
});

test("every map URL we store or render forces hl=en", () => {
  assert.equal(withEnglish("https://www.google.com/maps?q=Salon&hl=fa").endsWith("hl=en"), true);
  assert.match(embedUrl("Some Place"), /&hl=en&output=embed$/);
});

test("a pasted Google Maps link keeps host validation and gains English", async () => {
  const iframe = '<iframe src="https://www.google.com/maps?q=Abbot+Kinney&hl=fa&output=embed"></iframe>';
  const res = await resolveMapLink(iframe, "");
  assert.equal(res.ok, true);
  assert.match(res.embed, /^https:\/\/www\.google\.com\/maps\?/);
  assert.match(res.embed, /[?&]hl=en(&|$)/);

  const evil = await resolveMapLink("https://example.com/maps?q=x", "");
  assert.equal(evil.ok, false);
});

test("gallery lightbox never requests the page itself as an image", () => {
  const html = galleryPage({
    gallery: [{ id: 1, image: "/media/x", category: "Cuts", caption: "Cut", width: 900, height: 1200 }],
    comparisons: [],
    user: null,
  });
  assert.ok(!/src=""/.test(html), "no empty img src");
  assert.match(html, /<img id="lightbox-img" alt=""/);
});

test("before/after pairs exist in the schema and are seeded", () => {
  const schema = readFileSync(join(root, "schema.sql"), "utf8");
  for (const column of ["id", "title", "caption", "before_image", "after_image", "category", "sort_order", "active"]) {
    assert.match(schema, new RegExp(`\\b${column}\\b`), `schema has ${column}`);
  }
  assert.match(schema, /CREATE TABLE IF NOT EXISTS before_after_items/);
  const seed = readFileSync(join(root, "seed.sql"), "utf8");
  assert.match(seed, /INSERT OR IGNORE INTO before_after_items/);
});
