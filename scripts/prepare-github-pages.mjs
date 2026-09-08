import { copyFile, readFile, writeFile } from "node:fs/promises";

const output = new URL("../dist/client/", import.meta.url);
const siteOrigin = "https://ainewproducts.github.io/rivaltrace";
const modified = "2026-09-08";
const routes = [
  { path: "/", file: "index.html", title: "Beauty Competitor Monitoring", description: "Track public beauty competitor prices, product launches and promotion changes with timestamped evidence.", heading: "Beauty moves fast. Stay in the know.", summary: "RivalTrace helps beauty brands record public price, product and promotion signals with an evidence-first workflow.", type: "WebSite" },
  { path: "/tools/competitor-snapshot/", file: "tools/competitor-snapshot/index.html", title: "Free Competitor Snapshot", description: "Prepare an evidence-first baseline for a public beauty storefront. No account or external data API required.", heading: "Start with what is visible today.", summary: "Save a manual local baseline, then compare the same public page and context later.", type: "WebApplication" },
  { path: "/beauty-brands/summer-fridays/", file: "beauty-brands/summer-fridays/index.html", title: "Summer Fridays Competitor Intelligence", description: "A cited Summer Fridays brand monitoring example covering public products, offers and pages to watch.", heading: "Summer Fridays competitor intelligence example", summary: "A source-linked profile showing what RivalTrace can verify on public storefront pages and where interpretation must stop.", type: "ProfilePage" },
  { path: "/reports/summer-fridays-competitor-snapshot/", file: "reports/summer-fridays-competitor-snapshot/index.html", title: "Summer Fridays Public Snapshot", description: "A dated, source-linked baseline of the Summer Fridays Jet Lag Mask product page.", heading: "Jet Lag Mask product-page baseline", summary: "A current-page evidence record from August 28, 2026. It does not claim a historical change.", type: "WebPage" },
  { path: "/guides/how-to-track-beauty-competitors/", file: "guides/how-to-track-beauty-competitors/index.html", title: "How to Track Beauty Competitors", description: "A practical evidence-first guide to monitoring beauty competitor price, product and promotion changes.", heading: "How to track beauty competitors without inventing the story", summary: "Save a dated baseline, compare the same page and variant later, and keep interpretation separate from evidence.", type: "Article" },
  { path: "/methodology/", file: "methodology/index.html", title: "Competitor Monitoring Methodology", description: "How RivalTrace records public beauty storefront facts, validates comparisons and separates evidence from interpretation.", heading: "Evidence before interpretation", summary: "RivalTrace records observable storefront facts and calls something a change only after a valid like-for-like comparison.", type: "WebPage" },
  { path: "/about/", file: "about/index.html", title: "About RivalTrace", description: "RivalTrace is an evidence-first beauty competitor monitoring product for independent brands and lean teams.", heading: "A clearer view of the beauty market", summary: "Learn what RivalTrace does, what it cannot establish from public pages, and why the product starts with beauty.", type: "AboutPage" },
  { path: "/privacy/", file: "privacy/index.html", title: "Privacy & Analytics", description: "How RivalTrace handles local captures, optional website analytics and your privacy choices.", heading: "Your research stays yours", summary: "Local snapshot details stay on your device. Optional usage analytics loads only after consent and never includes form contents or payment details.", type: "WebPage" },
];

const coreLinks = [
  ["Free competitor snapshot", "/tools/competitor-snapshot/"],
  ["Beauty competitor monitoring guide", "/guides/how-to-track-beauty-competitors/"],
  ["RivalTrace methodology", "/methodology/"],
  ["About RivalTrace", "/about/"],
  ["Privacy and analytics", "/privacy/"],
];

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function structuredData(route, canonical, image) {
  const page = {
    "@type": route.type,
    "@id": `${canonical}#page`,
    url: canonical,
    name: route.title,
    headline: route.heading,
    description: route.description,
    image,
    dateModified: modified,
    isPartOf: { "@id": `${siteOrigin}/#website` },
    publisher: { "@id": `${siteOrigin}/#organization` },
    ...(route.type === "WebApplication" ? { applicationCategory: "BusinessApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } } : {}),
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${siteOrigin}/#organization`, name: "RivalTrace", url: `${siteOrigin}/`, description: "Evidence-first beauty competitor monitoring for independent brands and lean teams." },
      { "@type": "WebSite", "@id": `${siteOrigin}/#website`, url: `${siteOrigin}/`, name: "RivalTrace", publisher: { "@id": `${siteOrigin}/#organization` }, inLanguage: "en" },
      page,
      ...(route.path === "/" ? [] : [{ "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "RivalTrace", item: `${siteOrigin}/` }, { "@type": "ListItem", position: 2, name: route.title, item: canonical }] }]),
    ],
  };
}

for (const route of routes) {
  const fileUrl = new URL(route.file, output);
  const canonical = `${siteOrigin}${route.path}`;
  const image = `${siteOrigin}/og.png`;
  let html = await readFile(fileUrl, "utf8");
  const seed = `<main class="seo-seed" aria-label="RivalTrace page summary"><p>RivalTrace · Beauty competitor monitoring</p><h1>${escapeHtml(route.heading)}</h1><p>${escapeHtml(route.summary)}</p><nav aria-label="Key RivalTrace pages">${coreLinks.map(([label, path]) => `<a href="${siteOrigin}${path}">${escapeHtml(label)}</a>`).join("")}</nav></main>`;
  const head = [
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:title" content="${escapeHtml(route.title)} — RivalTrace" />`,
    `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<script id="rivaltrace-structured-data" type="application/ld+json">${JSON.stringify(structuredData(route, canonical, image)).replaceAll("<", "\\u003c")}</script>`,
  ].join("\n    ");
  html = html.replace("</head>", `    ${head}\n  </head>`).replace('<div id="root"></div>', `<div id="root">${seed}</div>`);
  await writeFile(fileUrl, html);
}

await copyFile(new URL("index.html", output), new URL("404.html", output));
let notFound = await readFile(new URL("404.html", output), "utf8");
notFound = notFound
  .replace('content="index, follow, max-image-preview:large"', 'content="noindex, follow"')
  .replace(/\s*<link rel="canonical"[^>]+>/, "")
  .replace(/<title>[^<]+<\/title>/, "<title>Page Not Found — RivalTrace</title>")
  .replace(/<main class="seo-seed"[\s\S]*?<\/main>/, '<main class="seo-seed"><h1>Page not found</h1><p>Return to the RivalTrace beauty competitor monitoring homepage.</p><a href="https://ainewproducts.github.io/rivaltrace/">Open RivalTrace</a></main>');
await writeFile(new URL("404.html", output), notFound);

await writeFile(new URL("robots.txt", output), `User-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`);
await writeFile(new URL("sitemap.xml", output), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((route) => `<url><loc>${siteOrigin}${route.path}</loc><lastmod>${modified}</lastmod></url>`).join("")}</urlset>\n`);
