import { ArrowRight, ArrowSquareOut, CheckCircle, Clock, LinkSimple, ShieldCheck, Storefront } from "@phosphor-icons/react";
import { Badge, DemoNote, Footer, MarketingNav, UrlForm } from "./App.jsx";

export function SnapshotTool({ go, shopUrl, setShopUrl }) {
  const hostname = (() => {
    try { return new URL(shopUrl).hostname.replace(/^www\./, ""); }
    catch { return "your competitor"; }
  })();

  return <main className="snapshot-page">
    <MarketingNav go={go} />
    <section className="snapshot-hero section-container">
      <div>
        <p className="eyebrow">Free competitor snapshot</p>
        <h1>Start with what is<br />visible today.</h1>
        <p>Enter a public beauty storefront. RivalTrace prepares the evidence fields for a first baseline—without pretending a historical change already exists.</p>
      </div>
      <div className="snapshot-tool-card">
        <label className="field-label" htmlFor="snapshot-url">Competitor website</label>
        <UrlForm id="snapshot-url" value={shopUrl} setValue={setShopUrl} button="Prepare baseline" onSubmit={() => {}} />
        <DemoNote>This launch preview validates the URL locally. It does not fetch the website or call an external API.</DemoNote>
      </div>
    </section>
    {shopUrl ? <section className="snapshot-result section-container" aria-live="polite">
      <div className="snapshot-result-head">
        <div><p className="eyebrow">Baseline preview</p><h2>{hostname}</h2></div>
        <Badge type="copy">Baseline only</Badge>
      </div>
      <div className="snapshot-facts">
        <article><LinkSimple size={24} /><span>Public source</span><strong>{shopUrl}</strong></article>
        <article><Clock size={24} /><span>Capture state</span><strong>Not captured in this preview</strong></article>
        <article><CheckCircle size={24} /><span>Observed changes</span><strong>0 · waiting for a later capture</strong></article>
        <article><ShieldCheck size={24} /><span>Confidence</span><strong>Not evaluated</strong></article>
      </div>
      <div className="snapshot-next"><div><h3>What happens next?</h3><p>A production capture would record the source URL, timestamp, visible price, product variant and promotion copy. Only a later successful capture can create a before-and-after Trace.</p></div><button className="primary-button" onClick={() => go("setup")}>Preview monitoring setup <ArrowRight size={19} /></button></div>
      <button className="text-link snapshot-example-link" onClick={() => go("public-report/summer-fridays")}>Prefer a completed example? Open the cited Summer Fridays snapshot <ArrowRight size={18} /></button>
    </section> : <section className="snapshot-empty section-container"><p>Paste a URL above to see the exact baseline record RivalTrace would prepare.</p></section>}
    <Footer go={go} />
  </main>;
}

const capturedLabel = "August 28, 2026";
const sources = {
  home: "https://summerfridays.com/",
  product: "https://summerfridays.com/collections/all-products/products/jet-lag-mask?pp=1",
  collection: "https://summerfridays.com/collections/jet-lag-collection",
};

function Breadcrumbs({ items }) {
  return <nav className="breadcrumbs section-container" aria-label="Breadcrumb">{items.map(([label, action], index) => <span key={label}>{index > 0 && <span aria-hidden="true">/</span>}{action ? <button onClick={action}>{label}</button> : <strong aria-current="page">{label}</strong>}</span>)}</nav>;
}

function SourceLink({ href, children = "Open public source" }) {
  return <a className="source-link" href={href} target="_blank" rel="noreferrer">{children}<ArrowSquareOut size={16} /></a>;
}

export function SummerFridaysBrand({ go }) {
  const signals = [
    ["Homepage focus", "The homepage currently leads with body essentials and also surfaces skincare and hybrid makeup.", sources.home],
    ["Retention offer", "The public site states 15% off and free shipping for Subscribe & Save.", sources.home],
    ["Circularity incentive", "The recycling program offers a $25 e-gift card after five or more empties are returned.", sources.home],
  ];
  return <main className="brand-page">
    <MarketingNav go={go} />
    <Breadcrumbs items={[["Home", () => go("home")], ["Beauty brands", null], ["Summer Fridays", null]]} />
    <section className="brand-hero section-container">
      <div><p className="eyebrow">Beauty brand intelligence example</p><h1>Summer Fridays</h1><p>A source-linked monitoring profile showing what RivalTrace can verify on public storefront pages—and where interpretation must stop.</p><div className="example-actions"><button className="primary-button" onClick={() => go("public-report/summer-fridays")}>View current snapshot <ArrowRight size={19} /></button><button className="outline-button" onClick={() => go("snapshot")}>Check another brand</button></div></div>
      <aside className="brand-summary"><span className="step-icon pink"><Storefront size={28} /></span><div><span>Public website</span><strong>summerfridays.com</strong></div><div><span>Category</span><strong>Skincare + hybrid makeup</strong></div><div><span>Evidence checked</span><strong>{capturedLabel}</strong></div><SourceLink href={sources.home}>Visit official website</SourceLink></aside>
    </section>
    <section className="signal-section section-container"><div className="public-heading"><div><p className="eyebrow">Current public signals</p><h2>What is visible today.</h2></div><p>These are dated observations, not claims about revenue, demand or internal strategy.</p></div><div className="signal-cards">{signals.map(([title, body, href]) => <article key={title}><Badge type="copy">Observed fact</Badge><h3>{title}</h3><p>{body}</p><small>Checked {capturedLabel}</small><SourceLink href={href} /></article>)}</div></section>
    <section className="watch-surfaces section-container"><div><p className="eyebrow">Suggested monitor set</p><h2>Three comparable surfaces.</h2><p>Start narrow. Capture the same page and variant on a repeatable schedule.</p></div><ol><li><span>01</span><div><h3>Homepage</h3><p>Hero campaign, featured categories and retention messages.</p><SourceLink href={sources.home} /></div></li><li><span>02</span><div><h3>Jet Lag Mask product page</h3><p>Selected size, buy-once price, subscription offer and availability.</p><SourceLink href={sources.product} /></div></li><li><span>03</span><div><h3>Jet Lag collection</h3><p>Collection composition, product additions and merchandising order.</p><SourceLink href={sources.collection} /></div></li></ol></section>
    <section className="method-boundary section-container"><ShieldCheck size={31} /><div><p className="eyebrow">Evidence boundary</p><h2>Visible does not mean explained.</h2><p>RivalTrace can document that an offer or product is visible on a dated public page. It cannot infer sales impact, campaign performance or strategy without additional evidence.</p></div></section>
    <Footer go={go} />
  </main>;
}

export function SummerFridaysSnapshot({ go }) {
  return <main className="public-report-page">
    <MarketingNav go={go} />
    <Breadcrumbs items={[["Home", () => go("home")], ["Summer Fridays", () => go("brand/summer-fridays")], ["Current snapshot", null]]} />
    <section className="public-report-hero section-container"><div><div className="report-badges"><Badge type="copy">Baseline only</Badge><Badge>High source confidence</Badge></div><p className="eyebrow">Cited public snapshot · {capturedLabel}</p><h1>Jet Lag Mask®<br />+ Moisturizer</h1><p>A current-page evidence record. It establishes what was visible at capture time; it does not claim a price or promotion change.</p></div><aside><div><span>Brand</span><strong>Summer Fridays</strong></div><div><span>Source type</span><strong>Official product page</strong></div><div><span>Change status</span><strong>Not established</strong></div><SourceLink href={sources.product}>Open captured source</SourceLink></aside></section>
    <section className="evidence-record section-container"><div className="record-heading"><div><p className="eyebrow">Observable facts</p><h2>What the page displayed.</h2></div><time dateTime="2026-08-28">Captured {capturedLabel}</time></div><div className="record-grid"><article><span>Product</span><strong>Jet Lag Mask® + Moisturizer</strong><p>Multitasking moisturizer and mask.</p></article><article><span>Visible sizes</span><strong>28g and 64g</strong><p>1.0 oz and 2.25 oz options are listed.</p></article><article><span>Selected buy-once price</span><strong>$49 USD</strong><p>Visible for the selected product option at capture time.</p></article><article><span>Subscription offer</span><strong>Save 15%</strong><p>The page displays Subscribe & Save with adjustable delivery cadence.</p></article></div><div className="record-source"><ShieldCheck size={22} /><p><strong>Source note:</strong> Values above were read from the public Summer Fridays product page on {capturedLabel}. Availability, selected size and price may change. Verify the original page before acting.</p></div></section>
    <section className="interpretation-grid section-container"><article><p className="eyebrow">What can be said</p><h2>A subscription offer is currently visible.</h2><p>The evidence supports a factual statement about the page at the captured time.</p></article><article><p className="eyebrow">What cannot be said</p><h2>The offer improved conversion or retention.</h2><p>That would require internal performance data or another reliable source. RivalTrace does not infer it from storefront copy.</p></article></section>
    <section className="report-next section-container"><div><p className="eyebrow">Next valid comparison</p><h2>Capture the same option later.</h2><p>Keep currency, size and purchase mode constant. A later successful capture can then establish a genuine before-and-after Trace.</p></div><button className="primary-button" onClick={() => go("snapshot")}>Start your snapshot <ArrowRight size={19} /></button></section>
    <Footer go={go} />
  </main>;
}

export function BeautyMonitoringGuide({ go }) {
  const steps = [
    ["01", "Choose the exact page", "Track a product, collection or promotion page—not an entire brand in the abstract."],
    ["02", "Save a dated baseline", "Record the public URL, timestamp, currency, product variant and visible offer."],
    ["03", "Compare like with like", "Keep size, region and purchase mode constant before calling something a change."],
    ["04", "Separate fact from meaning", "Describe the observable difference first. Treat business impact as an unproven hypothesis."],
    ["05", "Record the decision", "Adopt, review later or ignore—and keep the reason alongside the evidence."],
  ];
  return <main className="guide-page">
    <MarketingNav go={go} />
    <Breadcrumbs items={[["Home", () => go("home")], ["Guides", null], ["Track beauty competitors", null]]} />
    <article className="guide-article section-container"><header><p className="eyebrow">Evidence-first guide · Updated {capturedLabel}</p><h1>How to track beauty competitors without inventing the story.</h1><p className="guide-lede"><strong>Short answer:</strong> save a dated baseline, compare the same page and variant later, document only visible differences, and keep interpretation separate from evidence.</p><div className="example-actions"><button className="primary-button" onClick={() => go("snapshot")}>Prepare a free baseline <ArrowRight size={19} /></button><button className="outline-button" onClick={() => go("brand/summer-fridays")}>See the brand example</button></div></header>
      <section className="guide-steps"><h2>A repeatable five-step workflow</h2>{steps.map(([n, title, body]) => <div key={n}><span>{n}</span><div><h3>{title}</h3><p>{body}</p></div></div>)}</section>
      <section className="guide-checklist"><div><p className="eyebrow">Capture checklist</p><h2>Store enough context to trust the comparison.</h2></div><ul>{["Canonical public source URL", "UTC capture timestamp", "Market and currency", "Product size or variant", "Buy-once or subscription state", "Visible promotion terms", "Screenshot or preserved page evidence"].map((item) => <li key={item}><CheckCircle size={19} />{item}</li>)}</ul></section>
      <section className="guide-faq"><p className="eyebrow">Frequently asked</p><h2>Where teams usually go wrong.</h2>{[["Can the first scan show a change?", "No. It can only establish a baseline unless a valid earlier capture already exists."], ["Does a lower price prove a promotion worked?", "No. The price is observable; performance requires separate evidence."], ["Should every brand have an SEO page?", "Only publish pages with distinct, useful and source-backed information. Empty template pages should stay unindexed."], ["Does RivalTrace require a third-party data API?", "The initial workflow is designed around public-page evidence and rule-based comparisons. This preview does not call external APIs."]].map(([q, a]) => <details key={q}><summary>{q}<ArrowRight size={18} /></summary><p>{a}</p></details>)}</section>
    </article>
    <Footer go={go} />
  </main>;
}
