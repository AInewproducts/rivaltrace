import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pages = [
  ["index.html", "Your beauty watchlist"],
  ["tools/competitor-snapshot/index.html", "no page fetch, account sync or external API"],
  ["beauty-brands/summer-fridays/index.html", "Three comparable surfaces"],
  ["reports/summer-fridays-competitor-snapshot/index.html", "Observable facts"],
  ["guides/how-to-track-beauty-competitors/index.html", "A repeatable five-step workflow"],
  ["guides/beauty-competitor-price-tracking-template/index.html", "Four field groups that make a price log trustworthy"],
  ["methodology/index.html", "Valid comparison"],
  ["about/index.html", "Current product state"],
  ["privacy/index.html", "Optional usage data"],
];

for (const [file, expectedBody] of pages) {
  const html = await readFile(new URL(`../dist/client/${file}`, import.meta.url), "utf8");
  assert.match(html, /<div id="root">[\s\S]*<main class=/, `${file}: missing server-rendered page`);
  assert.ok(html.includes(expectedBody), `${file}: missing substantive page content`);
  assert.match(html, /<link rel="canonical" href="https:\/\/ainewproducts\.github\.io\/rivaltrace\//, `${file}: missing canonical URL`);
  assert.doesNotMatch(html, /class="seo-seed"/, `${file}: old summary-only seed remains`);
}

const notFound = await readFile(new URL("../dist/client/404.html", import.meta.url), "utf8");
assert.match(notFound, /content="noindex, follow"/);
assert.doesNotMatch(notFound, /<script type="module"/);
const csv = await readFile(new URL("../dist/client/beauty-competitor-price-tracking-template.csv", import.meta.url), "utf8");
assert.match(csv, /^captured_at_utc,brand,source_url,market,currency,/);
const template = await readFile(new URL("../dist/client/guides/beauty-competitor-price-tracking-template/index.html", import.meta.url), "utf8");
assert.match(template, /href="\/rivaltrace\/beauty-competitor-price-tracking-template\.csv"/);
const sitemap = await readFile(new URL("../dist/client/sitemap.xml", import.meta.url), "utf8");
assert.match(sitemap, /guides\/beauty-competitor-price-tracking-template\//);
console.log(`Verified ${pages.length} prerendered public pages and noindex 404.`);
