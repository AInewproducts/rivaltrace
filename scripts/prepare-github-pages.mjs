import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { libraryEntries, libraryHubRoute } from "../src/seoLibrary.js";
import { researchToolHub, researchTools } from "../src/researchToolCatalog.js";
import { homeFaq } from "../src/seoContent.js";

const output = new URL("../dist/client/", import.meta.url);
const siteOrigin = "https://ainewproducts.github.io/rivaltrace";
const modified = "2026-09-08";
const routes = [
  { route: "home", path: "/", file: "index.html", title: "Beauty Competitor Monitoring Tool", description: "Use a free manual beauty competitor monitoring tool to record public prices, availability, launches, and promotions with timestamped evidence.", heading: "Beauty moves fast. Stay in the know.", modified: "2026-10-29", type: "WebSite", faq: homeFaq },
  { route: "snapshot", path: "/tools/competitor-snapshot/", file: "tools/competitor-snapshot/index.html", title: "Free Competitor Snapshot", description: "Prepare an evidence-first baseline for a public beauty storefront. No account or external data API required.", heading: "Start with what is visible today.", type: "WebApplication" },
  { route: "brand/summer-fridays", path: "/beauty-brands/summer-fridays/", file: "beauty-brands/summer-fridays/index.html", title: "Summer Fridays Competitor Intelligence", description: "A dated Summer Fridays brand monitoring example covering public products, offers and pages to watch.", heading: "Summer Fridays", modified: "2026-09-22", type: "ProfilePage" },
  { route: "public-report/summer-fridays", path: "/reports/summer-fridays-competitor-snapshot/", file: "reports/summer-fridays-competitor-snapshot/index.html", title: "Summer Fridays Public Snapshot", description: "A dated, source-linked baseline of the Summer Fridays Jet Lag Mask product page.", heading: "Jet Lag Mask + Moisturizer", modified: "2026-09-22", type: "WebPage" },
  { route: "guide/monitoring", path: "/guides/how-to-track-beauty-competitors/", file: "guides/how-to-track-beauty-competitors/index.html", title: "How to Track Beauty Competitors", description: "A practical evidence-first guide to monitoring beauty competitor price, product and promotion changes.", heading: "How to track beauty competitors without inventing the story", modified: "2026-09-22", type: "Article" },
  { route: "guide/price-template", path: "/guides/beauty-competitor-price-tracking-template/", file: "guides/beauty-competitor-price-tracking-template/index.html", title: "Beauty Competitor Price Tracking Template", description: "Download a free beauty competitor price tracking CSV and compare like-for-like public offers without inventing changes.", heading: "Beauty competitor price tracking template", modified: "2026-09-22", type: "Article" },
  { route: "methodology", path: "/methodology/", file: "methodology/index.html", title: "Competitor Monitoring Methodology", description: "How RivalTrace records public beauty storefront facts, validates comparisons and separates evidence from interpretation.", heading: "Evidence before interpretation", modified: "2026-09-01", type: "WebPage" },
  { route: "about", path: "/about/", file: "about/index.html", title: "About RivalTrace", description: "RivalTrace is an evidence-first beauty competitor monitoring product for independent brands and lean teams.", heading: "A clearer view of the beauty market", modified: "2026-09-22", type: "AboutPage" },
  { route: "privacy", path: "/privacy/", file: "privacy/index.html", title: "Privacy & Analytics", description: "How RivalTrace handles local captures, optional website analytics and your privacy choices.", heading: "Your research stays yours", type: "WebPage" },
  { route: "pricing", path: "/pricing/", file: "pricing/index.html", title: "RivalTrace Pricing", description: "Review RivalTrace recurring supporter plans, PayPal billing, and the current limits of the manual local beauty competitor monitoring workflow.", heading: "Explore the workflow first. Subscribe with clear expectations.", modified: "2026-10-29", type: "WebPage", generated: true },
  { ...libraryHubRoute, file: "library/index.html", heading: libraryHubRoute.title, type: "CollectionPage", modified: "2026-10-29", generated: true },
  ...libraryEntries.map((entry) => ({ route: entry.route, path: entry.path, file: `${entry.route}/index.html`, title: entry.title, description: entry.summary, heading: entry.title, type: entry.category === "worksheets" ? "CreativeWork" : "Article", modified: "2026-10-29", generated: true })),
  { ...researchToolHub, file: "tools/index.html", heading: researchToolHub.title, type: "CollectionPage", modified: "2026-10-29", generated: true },
  ...researchTools.map((tool) => ({ route: tool.route, path: tool.path, file: `tools/${tool.slug}/index.html`, title: tool.title, description: tool.description, heading: tool.title, type: "WebApplication", modified: "2026-10-29", faq: tool.faq, generated: true })),
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
    dateModified: route.modified || modified,
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
      ...(route.faq?.length ? [{ "@type": "FAQPage", mainEntity: route.faq.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }] : []),
    ],
  };
}

const vite = await createServer({ configFile: false, plugins: [react()], mode: "github", base: "/rivaltrace/", server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: "custom", logLevel: "error" });
try {
  const { App } = await vite.ssrLoadModule("/src/App.jsx");
  const indexTemplate = await readFile(new URL("index.html", output), "utf8");
  for (const route of routes) {
    const fileUrl = new URL(route.file, output);
    const canonical = `${siteOrigin}${route.path}`;
    const image = `${siteOrigin}/og.png`;
    let html = route.generated ? indexTemplate : await readFile(fileUrl, "utf8");
    if (route.generated) {
      html = html
        .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(route.title)} — RivalTrace</title>`)
        .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(route.description)}" />`)
        .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(route.title)} — RivalTrace" />`)
        .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeHtml(route.description)}" />`)
        .replace(/<meta property="og:type" content="[^"]*" \/>/, `<meta property="og:type" content="${route.type === "Article" ? "article" : "website"}" />`);
    }
    const page = renderToString(createElement(App, { initialRoute: route.route }));
    if (!page.includes("<main ") || !page.includes("</main>")) throw new Error(`Missing rendered page content for ${route.path}`);
    const head = [
      `<link rel="canonical" href="${canonical}" />`,
      `<meta property="og:url" content="${canonical}" />`,
      `<meta property="og:image" content="${image}" />`,
      `<meta name="twitter:title" content="${escapeHtml(route.title)} — RivalTrace" />`,
      `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`,
      `<meta name="twitter:image" content="${image}" />`,
      `<script id="rivaltrace-structured-data" type="application/ld+json">${JSON.stringify(structuredData(route, canonical, image)).replaceAll("<", "\\u003c")}</script>`,
    ].join("\n    ");
    html = html.replace("</head>", `    ${head}\n  </head>`).replace('<div id="root"></div>', `<div id="root">${page}</div>`);
    if (route.generated) await mkdir(new URL("./", fileUrl), { recursive: true });
    await writeFile(fileUrl, html);
  }
} finally {
  await vite.close();
}

await copyFile(new URL("index.html", output), new URL("404.html", output));
let notFound = await readFile(new URL("404.html", output), "utf8");
notFound = notFound
  .replace('content="index, follow, max-image-preview:large"', 'content="noindex, follow"')
  .replace(/\s*<link rel="canonical"[^>]+>/, "")
  .replace(/<title>[^<]+<\/title>/, "<title>Page Not Found — RivalTrace</title>")
  .replace(/<script id="rivaltrace-structured-data"[\s\S]*?<\/script>/, "")
  .replace(/<script type="module"[^>]*><\/script>/, "")
  .replace(/<div id="root">[\s\S]*<\/body>/, '<main class="empty-state"><h1>Page not found</h1><p>Return to the RivalTrace beauty competitor monitoring homepage.</p><a href="https://ainewproducts.github.io/rivaltrace/">Open RivalTrace</a></main></body>');
await writeFile(new URL("404.html", output), notFound);

await writeFile(new URL("robots.txt", output), `User-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`);
await writeFile(new URL("sitemap.xml", output), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((route) => `<url><loc>${siteOrigin}${route.path}</loc><lastmod>${route.modified || modified}</lastmod></url>`).join("")}</urlset>\n`);
