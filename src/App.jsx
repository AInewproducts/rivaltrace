import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Bell, CalendarBlank, Check, CheckCircle, CreditCard, FileText, LinkSimple, List, MagnifyingGlass, ShieldCheck, Storefront, X } from "@phosphor-icons/react";
import { changes, normalizeUrl } from "./model.js";
import { Setup, Dashboard, Report, Weekly } from "./Views.jsx";
import { Pricing, Checkout, Product } from "./Marketing.jsx";
import { AboutPage, BeautyMonitoringGuide, MethodologyPage, PrivacyPage, SnapshotTool, SummerFridaysBrand, SummerFridaysSnapshot } from "./PublicPages.jsx";

const DEPLOY_BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const assetUrl = (name) => `${DEPLOY_BASE}/assets/${name}`;
const PUBLIC_ROUTE_PATHS = {
  home: "/",
  snapshot: "/tools/competitor-snapshot",
  "brand/summer-fridays": "/beauty-brands/summer-fridays",
  "public-report/summer-fridays": "/reports/summer-fridays-competitor-snapshot",
  "guide/monitoring": "/guides/how-to-track-beauty-competitors",
  methodology: "/methodology",
  about: "/about",
  privacy: "/privacy",
};
const PUBLIC_PATHS = Object.fromEntries(Object.entries(PUBLIC_ROUTE_PATHS).map(([route, path]) => [route, path === "/" ? `${DEPLOY_BASE}/` : `${DEPLOY_BASE}${path}/`]));

function routeFromLocation() {
  const fullPath = window.location.pathname;
  const localPath = DEPLOY_BASE && fullPath.startsWith(DEPLOY_BASE) ? fullPath.slice(DEPLOY_BASE.length) || "/" : fullPath;
  const pathname = localPath.replace(/\/$/, "") || "/";
  const publicRoute = Object.entries(PUBLIC_ROUTE_PATHS).find(([, path]) => path === pathname)?.[0];
  if (publicRoute && !window.location.hash) return publicRoute;
  if (window.location.hash) return window.location.hash.slice(1);
  return publicRoute || "not-found";
}

function useRoute() {
  const [route, setRoute] = useState(routeFromLocation);
  useEffect(() => {
    const sync = () => setRoute(routeFromLocation());
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);
  function go(next) {
    const publicPath = PUBLIC_PATHS[next];
    if (publicPath) {
      window.history.pushState({}, "", publicPath);
      setRoute(next);
    } else {
      if (window.location.pathname !== PUBLIC_PATHS.home) window.history.pushState({}, "", PUBLIC_PATHS.home);
      window.location.hash = next;
      setRoute(next);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  return [route, go];
}

function Brand({ go }) { return <a href={PUBLIC_PATHS.home} className="brand" onClick={(e) => { e.preventDefault(); go("home"); }}>RivalTrace</a>; }
function Badge({ type = "demo", children }) { return <span className={"badge badge-" + type}>{children}</span>; }
function DemoNote({ children }) { return <p className="demo-note"><ShieldCheck size={18} />{children || "Interactive demo · Sample data, no live monitoring or payment."}</p>; }

function MarketingNav({ go }) {
  const [open, setOpen] = useState(false);
  return <header className="marketing-nav"><Brand go={go} /><button className="menu-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="marketing-menu" onClick={() => setOpen(!open)}>{open ? <X size={24} /> : <List size={24} />}</button><nav id="marketing-menu" className={open ? "is-open" : ""} aria-label="Primary navigation">{[["snapshot", "Free snapshot"], ["brand/summer-fridays", "Brand example"], ["guide/monitoring", "Guide"], ["methodology", "Method"], ["app", "Open demo"]].map(([id, label]) => <a key={id} href={PUBLIC_PATHS[id] || "#" + id} onClick={(e) => { e.preventDefault(); setOpen(false); go(id); }}>{label}</a>)}</nav></header>;
}

function Footer({ go }) {
  return <footer className="site-footer"><div><Brand go={go} /><p>A clearer view of your beauty market.</p></div><nav aria-label="Footer navigation">{[["snapshot", "Free snapshot"], ["brand/summer-fridays", "Brand example"], ["guide/monitoring", "Guide"], ["methodology", "Methodology"], ["about", "About"], ["privacy", "Privacy"]].map(([id, label]) => <a key={id} href={PUBLIC_PATHS[id]} onClick={(e) => { e.preventDefault(); go(id); }}>{label}</a>)}</nav><small>© 2026 RivalTrace · Public brand references are cited. Sample changes remain clearly labeled.</small></footer>;
}

function UrlForm({ value, setValue, onSubmit, id = "competitor-url", button = "Start tracking", disabled = false }) {
  const [error, setError] = useState("");
  return <div className="url-entry"><form className="trace-form" noValidate onSubmit={(e) => { e.preventDefault(); const normalized = normalizeUrl(value); if (!normalized) { setError("Enter a public website address, for example summerfridays.com."); return; } setError(""); setValue(normalized); onSubmit(); }}><LinkSimple size={29} className="input-icon" /><label htmlFor={id} className="sr-only">Competitor URL</label><input id={id} type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck="false" placeholder="Paste a competitor URL" value={value} disabled={disabled} aria-invalid={!!error} aria-describedby={error ? id + "-error" : undefined} onChange={(e) => { setValue(e.target.value); if (error) setError(""); }} /><button className="primary-button" type="submit" disabled={disabled}>{button}<ArrowRight size={21} /></button></form>{error && <p className="form-error" id={id + "-error"} role="alert">{error}</p>}</div>;
}

function Watchlist({ openReport, rows = changes }) {
  return <div className="watchlist-table" role="table" aria-label="Example beauty competitor changes"><div className="watchlist-head" role="row"><span role="columnheader">Page</span><span role="columnheader">Change</span><span role="columnheader">Last checked</span><span role="columnheader">Evidence</span></div>{rows.map((item) => <div className="watchlist-row" role="row" key={item.id}><div className="watch-product" role="cell"><img src={item.image} alt={"Pink Marae Skin " + item.product + " packaging"} width="110" height="74" /><span><small>Marae Skin</small><strong>{item.product}</strong></span></div><div className="watch-change" role="cell"><Badge type={item.type.toLowerCase()}>{item.type}</Badge><span>{item.short}</span></div><time role="cell" dateTime="2026-08-28">Aug 28, 2026</time><div className="watch-action" role="cell"><button className="icon-button" aria-label={"View " + item.product + " evidence"} onClick={() => openReport(item.id)}><ArrowRight size={21} /></button></div></div>)}</div>;
}

function Steps() {
  return <section className="steps-section" aria-label="How monitoring works">{[[LinkSimple, "pink", "1. Add a page", "Paste a public beauty page you want to watch."], [CalendarBlank, "purple", "2. Save a baseline", "Capture how it looks today for future reference."], [Bell, "mint", "3. See what changes", "Review alerts and evidence when something updates."]].map(([Icon, color, title, body]) => <article key={title}><span className={"step-icon " + color}><Icon size={29} /></span><div><h3>{title}</h3><p>{body}</p></div></article>)}</section>;
}

const guides = [
  { title: "What should a beauty brand monitor?", category: "THE BASICS", body: "Start with a small set of comparable products. Record listed price, pack size, availability, launch dates and promotional wording. Compare the same currency and variant each time; a new pack size is not necessarily a price increase." },
  { title: "How to read a competitor price change", category: "PRICING", body: "Check the old and new price against dated captures. Confirm the currency, variant and whether either price was a temporary offer. A $48 to $52 change is an 8.33% increase in listed price; it does not reveal sales, demand or profit." },
  { title: "Your weekly competitor check-in", category: "WORKFLOW", body: "Review new observations, open the original evidence, and separate temporary promotions from lasting changes. Assign each item a decision: adopt, review later or ignore. Record your own reasoning; a competitor change alone is not a reason to copy it." },
];

function Home({ go, shopUrl, setShopUrl, openReport, section }) {
  useEffect(() => { if (section === "guides") document.getElementById("guides")?.scrollIntoView(); }, [section]);
  return <main className="home-page">
    <section className="beauty-hero" aria-labelledby="hero-title">
      <MarketingNav go={go} />
      <div className="hero-copy"><p className="eyebrow">Competitor monitoring for beauty brands</p><h1 id="hero-title">Beauty moves fast.<br />Stay in the know.</h1><p className="hero-subtitle">Follow price changes, new products, and promotions.<br className="desktop-break" /> A simple record of what changed, and when.</p></div>
      <UrlForm value={shopUrl} setValue={setShopUrl} onSubmit={() => go("snapshot")} button="Get a free snapshot" />
      <p className="baseline-note">No account required. Your first scan establishes a baseline. <span>Changes require a later capture.</span></p>
      <button className="text-link hero-link" onClick={() => openReport("price")}>View a sample report</button>
      <div className="watchlist-stage"><img className="hero-product hero-product-left" src={assetUrl("beauty-cleanser-cutout.webp")} alt="" aria-hidden="true" /><article className="watchlist-card"><div className="watchlist-title"><h2>Your beauty watchlist</h2><Badge>Demo preview</Badge></div><Watchlist openReport={openReport} /></article><img className="hero-product hero-product-right" src={assetUrl("beauty-serum-cutout.webp")} alt="" aria-hidden="true" /></div>
      <p className="evidence-promise"><ShieldCheck size={25} />Public pages. Timestamped evidence.</p>
    </section>
    <Steps /><div className="basics-link"><a className="text-link" href="#product">Learn the beauty monitoring basics <ArrowRight size={18} /></a></div>
    <section className="home-detail section-container"><div className="section-heading"><p className="eyebrow">A change is only the beginning</p><h2>The detail behind<br />every difference.</h2><p>See the before, the after, and the context.<br />Keep the decision in your hands.</p><button className="text-link" onClick={() => openReport("price")}>Explore sample evidence <ArrowRight size={19} /></button></div><div className="mini-evidence"><div className="mini-evidence-top"><Badge type="price">Price change</Badge><span>Illustrative example</span></div><h3>Barrier Serum · 30 ml</h3><div className="price-comparison"><div><small>Aug 27, 2026</small><strong>$48</strong><span>Before</span></div><ArrowRight size={26} /><div><small>Aug 28, 2026</small><strong>$52</strong><span>After</span></div></div><p><ShieldCheck size={18} />Same product. Same size. +8.33% listed price.</p></div></section>
    <section id="guides" className="guides-section section-container"><div className="section-heading"><p className="eyebrow">The beauty monitoring edit</p><h2>A little context.<br />A clearer next step.</h2></div><div className="guide-grid">{guides.map((guide) => <details className="guide" key={guide.title}><summary><span className="eyebrow">{guide.category}</span><h3>{guide.title}</h3><span className="guide-read">Read the guide <ArrowRight size={19} /></span></summary><p>{guide.body}</p></details>)}</div></section>
    <section className="real-example section-container"><div><p className="eyebrow">Real public source · August 28, 2026</p><h2>See the method on<br />Summer Fridays.</h2><p>Review a cited brand profile and a current product-page baseline. Facts are separated from interpretation, and no historical change is invented.</p><div className="example-actions"><button className="primary-button" onClick={() => go("brand/summer-fridays")}>Open brand example <ArrowRight size={19} /></button><button className="outline-button" onClick={() => go("public-report/summer-fridays")}>View cited snapshot</button></div></div><div className="example-proof"><Badge type="copy">Baseline only</Badge><h3>Jet Lag Mask® + Moisturizer</h3><dl><div><dt>Source</dt><dd>summerfridays.com</dd></div><div><dt>Visible offer</dt><dd>Subscribe & Save 15%</dd></div><div><dt>Evidence state</dt><dd>Current page snapshot</dd></div><div><dt>Change claim</dt><dd>None</dd></div></dl></div></section>
    <section className="faq-section section-container"><div><p className="eyebrow">Good questions</p><h2>Before you<br />start watching.</h2></div><div className="faq-list">{[["What does RivalTrace monitor?", "The free snapshot lets you record publicly visible price, availability and promotional wording, then compare a later manual capture on the same device."], ["Will my first scan show historical changes?", "No. Your first capture establishes a baseline. A real change can only be shown after a later comparable capture. The sample dashboard reports remain clearly labeled illustrations."], ["Does this version use AI or third-party data APIs?", "No. The snapshot tool stores your entries in this browser and compares them with rules. It does not fetch the competitor page, call an external API or sync to an account."], ["Can I pay or start background monitoring here?", "Not yet. Plan selection and checkout are simulations. No payment is processed and no background monitoring starts in this version."]].map(([question, answer]) => <details key={question}><summary>{question}<ArrowRight size={19} /></summary><p>{answer}</p></details>)}</div></section>
    <section className="conversion-band"><p className="eyebrow">Start with one competitor</p><h2>Your next insight starts<br />with a closer look.</h2><button className="primary-button" onClick={() => document.getElementById("competitor-url")?.focus()}>Try a competitor URL <ArrowRight size={20} /></button><small>Explore the demo. No account or card required.</small></section><Footer go={go} />
  </main>;
}

export { Brand, Badge, DemoNote, UrlForm, Watchlist, Steps, Footer, MarketingNav };

export function App() {
  const [route, go] = useRoute();
  const [shopUrl, setShopUrl] = useState("");
  const [baseline, setBaseline] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("Growth");
  const [annual, setAnnual] = useState(false);
  const [reportId, setReportId] = useState("price");
  const [decisions, setDecisions] = useState({});
  const openReport = (id) => { setReportId(id); go("report/" + id); };
  const page = route.split("/")[0];
  useEffect(() => {
    const metadata = {
      home: ["Beauty Competitor Monitoring", "Track public beauty competitor prices, product launches and promotion changes with timestamped evidence."],
      snapshot: ["Free Competitor Snapshot", "Prepare an evidence-first baseline for a public beauty storefront. No account or external data API required."],
      brand: ["Summer Fridays Competitor Intelligence", "A cited Summer Fridays brand monitoring example covering public products, offers and pages to watch."],
      "public-report": ["Summer Fridays Public Snapshot", "A dated, source-linked baseline of the Summer Fridays Jet Lag Mask product page."],
      guide: ["How to Track Beauty Competitors", "A practical evidence-first guide to monitoring beauty competitor price, product and promotion changes."],
      methodology: ["Competitor Monitoring Methodology", "How RivalTrace records public beauty storefront facts, validates comparisons and separates evidence from interpretation."],
      about: ["About RivalTrace", "RivalTrace is an evidence-first beauty competitor monitoring product for independent brands and lean teams."],
      privacy: ["Privacy & Analytics", "How RivalTrace handles local captures, optional website analytics and your privacy choices."],
      app: ["Your Watchlist", "RivalTrace sample beauty competitor watchlist."],
      report: ["Sample Evidence", "RivalTrace sample evidence report."],
      weekly: ["Weekly Brief", "RivalTrace sample weekly brief."],
      setup: ["Add a Page", "Prepare a beauty competitor page baseline."],
      pricing: ["Plans", "Preview proposed RivalTrace plans."],
      checkout: ["Demo Checkout", "RivalTrace non-production checkout simulation."],
      product: ["How It Works", "Learn the evidence-first RivalTrace competitor monitoring method."],
    };
    const [title, description] = metadata[page] || ["Page Not Found", "The requested RivalTrace page was not found."];
    document.title = title + " — RivalTrace";
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    const ensureMeta = (selector, attribute, value) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        const [name, key] = attribute;
        element.setAttribute(name, key);
        document.head.appendChild(element);
      }
      element.setAttribute("content", value);
    };
    ensureMeta('meta[property="og:title"]', ["property", "og:title"], title + " — RivalTrace");
    ensureMeta('meta[property="og:description"]', ["property", "og:description"], description);
    ensureMeta('meta[property="og:image"]', ["property", "og:image"], window.location.origin + DEPLOY_BASE + "/og.png");
    const canonicalPath = PUBLIC_PATHS[route] || window.location.pathname;
    ensureMeta('meta[property="og:url"]', ["property", "og:url"], window.location.origin + canonicalPath);
    ensureMeta('meta[name="twitter:card"]', ["name", "twitter:card"], "summary_large_image");
    ensureMeta('meta[name="twitter:title"]', ["name", "twitter:title"], title + " — RivalTrace");
    ensureMeta('meta[name="twitter:description"]', ["name", "twitter:description"], description);
    ensureMeta('meta[name="twitter:image"]', ["name", "twitter:image"], window.location.origin + DEPLOY_BASE + "/og.png");
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + canonicalPath;
    const siteUrl = window.location.origin + PUBLIC_PATHS.home;
    const schemaType = page === "guide" ? "Article" : page === "snapshot" ? "WebApplication" : page === "brand" ? "ProfilePage" : page === "about" ? "AboutPage" : page === "home" ? "WebSite" : "WebPage";
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "Organization", "@id": siteUrl + "#organization", name: "RivalTrace", url: siteUrl, description: "Evidence-first beauty competitor monitoring for independent brands and lean teams." },
        { "@type": "WebSite", "@id": siteUrl + "#website", name: "RivalTrace", url: siteUrl, publisher: { "@id": siteUrl + "#organization" }, inLanguage: "en" },
        { "@type": schemaType, "@id": canonical.href + "#page", name: title, headline: title, description, url: canonical.href, image: window.location.origin + DEPLOY_BASE + "/og.png", dateModified: "2026-09-01", isPartOf: { "@id": siteUrl + "#website" }, publisher: { "@id": siteUrl + "#organization" }, ...(page === "snapshot" ? { applicationCategory: "BusinessApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } } : {}) },
        ...(page === "home" ? [] : [{ "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "RivalTrace", item: siteUrl }, { "@type": "ListItem", position: 2, name: title, item: canonical.href }] }]),
      ],
    };
    let structuredData = document.getElementById("rivaltrace-structured-data");
    if (!structuredData) {
      structuredData = document.createElement("script");
      structuredData.id = "rivaltrace-structured-data";
      structuredData.type = "application/ld+json";
      document.head.appendChild(structuredData);
    }
    structuredData.textContent = JSON.stringify(schema);
  }, [page, route]);
  let content;
  if (page === "snapshot") content = <SnapshotTool go={go} shopUrl={shopUrl} setShopUrl={setShopUrl} />;
  else if (page === "brand") content = <SummerFridaysBrand go={go} />;
  else if (page === "public-report") content = <SummerFridaysSnapshot go={go} />;
  else if (page === "guide") content = <BeautyMonitoringGuide go={go} />;
  else if (page === "methodology") content = <MethodologyPage go={go} />;
  else if (page === "about") content = <AboutPage go={go} />;
  else if (page === "privacy") content = <PrivacyPage go={go} />;
  else if (page === "setup") content = <Setup go={go} shopUrl={shopUrl} setShopUrl={setShopUrl} onBaseline={setBaseline} />;
  else if (page === "app") content = <Dashboard go={go} openReport={openReport} baseline={baseline} decisions={decisions} />;
  else if (page === "weekly") content = <Weekly go={go} openReport={openReport} decisions={decisions} />;
  else if (page === "report") { const item = changes.find((x) => x.id === (route.split("/")[1] || reportId)) || changes[0]; content = <Report go={go} item={item} decision={decisions[item.id] || "Undecided"} setDecision={(value) => setDecisions((current) => ({ ...current, [item.id]: value }))} />; }
  else if (page === "pricing") content = <Pricing go={go} annual={annual} setAnnual={setAnnual} setPlan={setSelectedPlan} />;
  else if (page === "checkout") content = <Checkout go={go} selectedPlan={selectedPlan} annual={annual} />;
  else if (page === "product") content = <Product go={go} />;
  else if (page === "home") content = <Home go={go} shopUrl={shopUrl} setShopUrl={setShopUrl} openReport={openReport} section={route.split("/")[1]} />;
  else content = <main className="empty-state"><h1>This page is not here.</h1><a href="#home" className="primary-button">Back to RivalTrace</a></main>;
  return <><a className="skip-link" href="#main-content" onClick={(e) => { e.preventDefault(); document.getElementById("main-content")?.focus(); }}>Skip to content</a><div id="main-content" tabIndex={-1}>{content}</div></>;
}
