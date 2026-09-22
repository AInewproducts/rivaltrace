import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { libraryEntries } from "../src/seoLibrary.js";

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
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.equal(libraryEntries.length, 90, "expected 90 editorial resources");
assert.equal(sitemapUrls.length, 100, "expected exactly 100 public sitemap URLs");
assert.equal(new Set(sitemapUrls).size, 100, "duplicate sitemap URL");
const hub = await readFile(new URL("../dist/client/library/index.html", import.meta.url), "utf8");
assert.match(hub, /<h1>Research a beauty market with evidence, not guesses\.<\/h1>/);
const uniqueTitles = new Set();
for (const entry of libraryEntries) {
  const html = await readFile(new URL(`../dist/client/${entry.route}/index.html`, import.meta.url), "utf8");
  const decoded = html.replaceAll("&amp;", "&").replaceAll("&#x27;", "'").replaceAll("&quot;", '"').replaceAll("&lt;", "<").replaceAll("&gt;", ">");
  const canonical = `https://ainewproducts.github.io/rivaltrace${entry.path}`;
  assert.ok(sitemapUrls.includes(canonical), `${entry.route}: missing from sitemap`);
  assert.ok(hub.includes(`href="/rivaltrace${entry.path}"`), `${entry.route}: missing hub link`);
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}" />`), `${entry.route}: wrong canonical`);
  assert.ok(decoded.includes(`<h1>${entry.title}</h1>`), `${entry.route}: wrong heading`);
  assert.ok(decoded.includes(entry.summary), `${entry.route}: missing summary`);
  assert.ok(decoded.includes(entry.observe), `${entry.route}: missing task-specific observation`);
  assert.ok(decoded.includes(entry.decide), `${entry.route}: missing task-specific decision`);
  assert.ok(decoded.includes(entry.limit), `${entry.route}: missing evidence boundary`);
  assert.ok(decoded.includes(`content="${entry.summary}"`), `${entry.route}: missing description`);
  assert.doesNotMatch(html, /class="seo-seed"/, `${entry.route}: summary-only seed`);
  assert.ok(!uniqueTitles.has(entry.title), `${entry.route}: duplicate title`);
  uniqueTitles.add(entry.title);
}
console.log(`Verified ${pages.length + 1 + libraryEntries.length} prerendered public pages, unique sitemap URLs, and noindex 404.`);
