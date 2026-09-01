import { copyFile, writeFile } from "node:fs/promises";

const output = new URL("../dist/client/", import.meta.url);
const origin = "https://ainewproducts.github.io/rivaltrace";
const routes = [
  "/",
  "/tools/competitor-snapshot/",
  "/beauty-brands/summer-fridays/",
  "/reports/summer-fridays-competitor-snapshot/",
  "/guides/how-to-track-beauty-competitors/",
];

await copyFile(new URL("index.html", output), new URL("404.html", output));
await writeFile(new URL("robots.txt", output), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile(
  new URL("sitemap.xml", output),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((route) => `<url><loc>${origin}${route}</loc></url>`).join("")}</urlset>\n`,
);
