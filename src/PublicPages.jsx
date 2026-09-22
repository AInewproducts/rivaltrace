import { useState } from "react";
import { ArrowRight, ArrowSquareOut, CheckCircle, Clock, ShieldCheck, Storefront } from "@phosphor-icons/react";
import { Badge, DemoNote, Footer, MarketingNav, UrlForm } from "./App.jsx";
import { trackEvent } from "./analytics.js";
import { getSnapshotRecord, saveCapture } from "./snapshots.js";

export function SnapshotTool({ go, shopUrl, setShopUrl }) {
  const [prepared, setPrepared] = useState(false);
  const [hasSavedBaseline, setHasSavedBaseline] = useState(false);
  const [form, setForm] = useState({ pageLabel: "", price: "", currency: "USD", availability: "Not shown", promotion: "", notes: "" });
  const [result, setResult] = useState(null);
  const [captureError, setCaptureError] = useState("");
  const hostname = (() => {
    try { return new URL(shopUrl).hostname.replace(/^www\./, ""); }
    catch { return "your competitor"; }
  })();

  const prepare = () => {
    const saved = getSnapshotRecord(shopUrl);
    setPrepared(true);
    setResult(null);
    setCaptureError("");
    setHasSavedBaseline(Boolean(saved));
    setForm({
      pageLabel: saved?.latest?.pageLabel || "",
      price: "",
      currency: saved?.latest?.currency || "USD",
      availability: "Not shown",
      promotion: "",
      notes: "",
    });
  };
  const updateUrl = (value) => {
    setShopUrl(value);
    setPrepared(false);
    setResult(null);
    setCaptureError("");
  };
  const updateField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const save = (event) => {
    event.preventDefault();
    try {
      const next = saveCapture({ ...form, url: shopUrl });
      setResult(next);
      setHasSavedBaseline(true);
      setCaptureError("");
      trackEvent("snapshot_capture_success", { capture_status: next.status });
    } catch (error) {
      setCaptureError(error.message);
    }
  };

  const fieldLabels = { currency: "Currency", price: "Listed price", availability: "Availability", promotion: "Promotion text" };
  const formatValue = (change, value, capture) => {
    if (value === null || value === "") return "Not recorded";
    if (change.field === "price") return `${capture.currency} ${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    return String(value);
  };

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
        <UrlForm id="snapshot-url" value={shopUrl} setValue={updateUrl} button="Prepare baseline" onSubmit={prepare} />
        <DemoNote>You enter the visible facts. They stay in this browser—no page fetch, account sync or external API.</DemoNote>
      </div>
    </section>
    {prepared ? <section className="snapshot-result section-container" aria-live="polite">
      <div className="snapshot-result-head">
        <div><p className="eyebrow">Manual evidence capture</p><h2>{hostname}</h2></div>
        <Badge type="copy">{hasSavedBaseline ? "Baseline found" : "First baseline"}</Badge>
      </div>
      <form className="manual-capture-form" onSubmit={save} noValidate>
        <div className="manual-grid">
          <label className="manual-field manual-field-wide"><span>Page or product label <strong>Required</strong></span><input value={form.pageLabel} onChange={updateField("pageLabel")} placeholder="Jet Lag Mask · 64g" /></label>
          <label className="manual-field"><span>Listed price <small>Optional</small></span><input type="number" min="0" step="0.01" inputMode="decimal" value={form.price} onChange={updateField("price")} placeholder="49.00" /></label>
          <label className="manual-field"><span>Currency</span><select value={form.currency} onChange={updateField("currency")}>{["USD", "GBP", "EUR", "CAD", "AUD"].map((currency) => <option key={currency}>{currency}</option>)}</select></label>
          <label className="manual-field"><span>Availability</span><select value={form.availability} onChange={updateField("availability")}>{["Not shown", "In stock", "Out of stock", "Pre-order"].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="manual-field manual-field-wide"><span>Promotion text <small>Optional</small></span><input value={form.promotion} onChange={updateField("promotion")} placeholder="Subscribe & Save 15%" /></label>
          <label className="manual-field manual-field-wide"><span>Capture notes <small>Optional · not compared</small></span><textarea value={form.notes} onChange={updateField("notes")} placeholder="Selected size, market or other context" rows="3" /></label>
        </div>
        <div className="capture-actions"><div><ShieldCheck size={20} /><p><strong>Local-only record.</strong> Open the public page yourself, enter what you can see, then save. RivalTrace stores up to 20 captures for this exact URL on this device.</p></div><button className="primary-button" type="submit">{hasSavedBaseline ? "Compare with last capture" : "Save first baseline"}<ArrowRight size={19} /></button></div>
        {captureError && <p className="form-error" role="alert">{captureError}</p>}
      </form>
      {result && <div className={`capture-result capture-result-${result.status}`}>
        <div className="capture-result-heading"><div><p className="eyebrow">{result.status === "baseline" ? "Baseline saved" : result.status === "changed" ? "Observable difference found" : "Comparison complete"}</p><h3>{result.status === "baseline" ? "Ready for a later capture." : result.status === "changed" ? `${result.changes.length} comparable field${result.changes.length === 1 ? "" : "s"} changed.` : "No comparable fields changed."}</h3></div><Badge type={result.status === "changed" ? "price" : "copy"}>{result.captureCount} local capture{result.captureCount === 1 ? "" : "s"}</Badge></div>
        {result.status === "baseline" ? <p className="capture-summary"><Clock size={20} />Saved {new Date(result.after.capturedAt).toLocaleString()} as the first dated observation. This is not yet evidence of a change.</p> : result.changes.length ? <div className="change-list">{result.changes.map((change) => <article className="change-row" key={change.field}><span>{fieldLabels[change.field]}</span><div><small>Before</small><strong>{formatValue(change, change.before, result.before)}</strong></div><ArrowRight size={20} /><div><small>After</small><strong>{formatValue(change, change.after, result.after)}</strong></div>{typeof change.percent === "number" && <Badge type="price">{change.percent > 0 ? "+" : ""}{change.percent}%</Badge>}</article>)}</div> : <p className="capture-summary"><CheckCircle size={20} />The entered currency, price, availability and promotion text match the previous local capture.</p>}
        <p className="capture-boundary"><ShieldCheck size={18} /><span><strong>Evidence boundary:</strong> this result compares your manual entries only. It does not prove why a storefront changed or what impact the change had.</span></p>
      </div>}
      <div className="snapshot-next"><div><h3>Keep the comparison trustworthy.</h3><p>Use the same URL, market, currency, product size and purchase mode each time. If the product label changes, RivalTrace stops the comparison instead of producing a misleading Trace.</p></div><a className="outline-button" href={shopUrl} target="_blank" rel="noreferrer">Open public page <ArrowSquareOut size={18} /></a></div>
      <button className="text-link snapshot-example-link" onClick={() => go("public-report/summer-fridays")}>Prefer a completed example? Open the cited Summer Fridays snapshot <ArrowRight size={18} /></button>
    </section> : <section className="snapshot-empty section-container"><p>Paste a public page URL above to prepare a local evidence record.</p></section>}
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
    ["Homepage focus", "At the August 28 capture, the homepage led with body essentials and also surfaced skincare and hybrid makeup.", sources.home],
    ["Retention offer", "At the August 28 capture, the public site stated 15% off and free shipping for Subscribe & Save.", sources.home],
    ["Circularity incentive", "At the August 28 capture, the recycling program advertised a $25 e-gift card after five or more empties were returned.", sources.home],
  ];
  return <main className="brand-page">
    <MarketingNav go={go} />
    <Breadcrumbs items={[["Home", () => go("home")], ["Beauty brands", null], ["Summer Fridays", null]]} />
    <section className="brand-hero section-container">
      <div><p className="eyebrow">Beauty brand intelligence example</p><h1>Summer Fridays</h1><p>A dated, source-linked monitoring profile showing what RivalTrace recorded on public storefront pages—and where interpretation must stop.</p><div className="example-actions"><a className="primary-button" href={`${import.meta.env.BASE_URL}reports/summer-fridays-competitor-snapshot/`} onClick={(event) => { event.preventDefault(); go("public-report/summer-fridays"); }}>View dated snapshot <ArrowRight size={19} /></a><a className="outline-button" href={`${import.meta.env.BASE_URL}tools/competitor-snapshot/`} onClick={(event) => { event.preventDefault(); go("snapshot"); }}>Check another brand</a></div></div>
      <aside className="brand-summary"><span className="step-icon pink"><Storefront size={28} /></span><div><span>Public website</span><strong>summerfridays.com</strong></div><div><span>Category</span><strong>Skincare + hybrid makeup</strong></div><div><span>Evidence checked</span><strong>{capturedLabel}</strong></div><SourceLink href={sources.home}>Visit official website</SourceLink></aside>
    </section>
    <section className="signal-section section-container"><div className="public-heading"><div><p className="eyebrow">Dated public signals</p><h2>What was visible at capture.</h2></div><p>These August 28 observations may no longer reflect the live site. They do not establish revenue, demand or internal strategy.</p></div><div className="signal-cards">{signals.map(([title, body, href]) => <article key={title}><Badge type="copy">Observed fact</Badge><h3>{title}</h3><p>{body}</p><small>Checked {capturedLabel}</small><SourceLink href={href} /></article>)}</div></section>
    <section className="watch-surfaces section-container"><div><p className="eyebrow">Suggested monitor set</p><h2>Three comparable surfaces.</h2><p>Start narrow. Capture the same page and variant on a repeatable schedule.</p></div><ol><li><span>01</span><div><h3>Homepage</h3><p>Hero campaign, featured categories and retention messages.</p><SourceLink href={sources.home} /></div></li><li><span>02</span><div><h3>Jet Lag Mask product page</h3><p>Selected size, buy-once price, subscription offer and availability.</p><SourceLink href={sources.product} /></div></li><li><span>03</span><div><h3>Jet Lag collection</h3><p>Collection composition, product additions and merchandising order.</p><SourceLink href={sources.collection} /></div></li></ol></section>
    <section className="method-boundary section-container"><ShieldCheck size={31} /><div><p className="eyebrow">Evidence boundary</p><h2>Visible does not mean explained.</h2><p>RivalTrace can document that an offer or product is visible on a dated public page. It cannot infer sales impact, campaign performance or strategy without additional evidence.</p></div></section>
    <Footer go={go} />
  </main>;
}

export function SummerFridaysSnapshot({ go }) {
  return <main className="public-report-page">
    <MarketingNav go={go} />
    <Breadcrumbs items={[["Home", () => go("home")], ["Summer Fridays", () => go("brand/summer-fridays")], ["Current snapshot", null]]} />
    <section className="public-report-hero section-container"><div><div className="report-badges"><Badge type="copy">Baseline only</Badge><Badge>Source-linked example</Badge></div><p className="eyebrow">Cited public snapshot · {capturedLabel}</p><h1>Jet Lag Mask®<br />+ Moisturizer</h1><p>A dated product-page evidence record. It shows what was visible at capture time, not what is live today, and it does not claim a price or promotion change.</p></div><aside><div><span>Brand</span><strong>Summer Fridays</strong></div><div><span>Source type</span><strong>Official product page</strong></div><div><span>Change status</span><strong>Not established</strong></div><SourceLink href={sources.product}>Open captured source</SourceLink></aside></section>
    <section className="evidence-record section-container"><div className="record-heading"><div><p className="eyebrow">Observable facts</p><h2>What the page displayed.</h2></div><time dateTime="2026-08-28">Captured {capturedLabel}</time></div><div className="record-grid"><article><span>Product</span><strong>Jet Lag Mask® + Moisturizer</strong><p>Multitasking moisturizer and mask.</p></article><article><span>Visible sizes</span><strong>28g and 64g</strong><p>1.0 oz and 2.25 oz options are listed.</p></article><article><span>Selected buy-once price</span><strong>$49 USD</strong><p>Visible for the selected product option at capture time.</p></article><article><span>Subscription offer</span><strong>Save 15%</strong><p>The page displays Subscribe & Save with adjustable delivery cadence.</p></article></div><div className="record-source"><ShieldCheck size={22} /><p><strong>Source note:</strong> Values above were read from the public Summer Fridays product page on {capturedLabel}. Availability, selected size and price may change. Verify the original page before acting.</p></div></section>
    <section className="interpretation-grid section-container"><article><p className="eyebrow">What can be said</p><h2>A subscription offer was visible at capture.</h2><p>The evidence supports a factual statement about the page on August 28, 2026—not about its present state.</p></article><article><p className="eyebrow">What cannot be said</p><h2>The offer improved conversion or retention.</h2><p>That would require internal performance data or another reliable source. RivalTrace does not infer it from storefront copy.</p></article></section>
    <section className="report-next section-container"><div><p className="eyebrow">Next valid comparison</p><h2>Capture the same option later.</h2><p>Keep currency, size and purchase mode constant. A later successful capture can then establish a genuine before-and-after Trace.</p></div><a className="primary-button" href={`${import.meta.env.BASE_URL}tools/competitor-snapshot/`} onClick={(event) => { event.preventDefault(); go("snapshot"); }}>Start your snapshot <ArrowRight size={19} /></a></section>
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
    <article className="guide-article section-container"><header><p className="eyebrow">Evidence-first guide · Updated September 22, 2026</p><h1>How to track beauty competitors without inventing the story.</h1><p className="guide-lede"><strong>Short answer:</strong> save a dated baseline, compare the same page and variant later, document only visible differences, and keep interpretation separate from evidence.</p><div className="example-actions"><a className="primary-button" href={`${import.meta.env.BASE_URL}tools/competitor-snapshot/`} onClick={(event) => { event.preventDefault(); go("snapshot"); }}>Prepare a free baseline <ArrowRight size={19} /></a><a className="outline-button" href={`${import.meta.env.BASE_URL}beauty-brands/summer-fridays/`} onClick={(event) => { event.preventDefault(); go("brand/summer-fridays"); }}>See the brand example</a></div></header>
      <section className="guide-steps"><h2>A repeatable five-step workflow</h2>{steps.map(([n, title, body]) => <div key={n}><span>{n}</span><div><h3>{title}</h3><p>{body}</p></div></div>)}</section>
      <section className="guide-checklist"><div><p className="eyebrow">Capture checklist</p><h2>Store enough context to trust the comparison.</h2></div><ul>{["Canonical public source URL", "UTC capture timestamp", "Market and currency", "Product size or variant", "Buy-once or subscription state", "Visible promotion terms", "Screenshot or preserved page evidence"].map((item) => <li key={item}><CheckCircle size={19} />{item}</li>)}</ul></section>
      <section className="guide-faq"><p className="eyebrow">Frequently asked</p><h2>Where teams usually go wrong.</h2>{[["Can the first scan show a change?", "No. It can only establish a baseline unless a valid earlier capture already exists."], ["Does a lower price prove a promotion worked?", "No. The price is observable; performance requires separate evidence."], ["Should every brand have an SEO page?", "Only publish pages with distinct, useful and source-backed information. Empty template pages should stay unindexed."], ["Does RivalTrace require a third-party data API?", "The initial workflow is designed around public-page evidence and rule-based comparisons. This preview does not call external APIs."]].map(([q, a]) => <details key={q}><summary>{q}<ArrowRight size={18} /></summary><p>{a}</p></details>)}</section>
      <section className="report-next"><div><p className="eyebrow">Free worksheet</p><h2>Need a repeatable price log?</h2><p>Use the beauty competitor price tracking template to record the exact variant, market, purchase mode and dated evidence before comparing prices.</p></div><a className="outline-button" href={`${import.meta.env.BASE_URL}guides/beauty-competitor-price-tracking-template/`} onClick={(event) => { event.preventDefault(); go("guide/price-template"); }}>Open the price template <ArrowRight size={19} /></a></section>
    </article>
    <Footer go={go} />
  </main>;
}

export function PriceTrackingTemplateGuide({ go }) {
  const fields = [
    ["Source and time", "Record the exact public product URL and a UTC capture timestamp. A homepage URL is not a substitute for the product page you checked."],
    ["Comparable option", "Keep the market, currency, size or variant, and buy-once versus subscription mode in separate fields."],
    ["Visible offer", "Enter the listed price, availability and promotion terms exactly as shown. Leave unknown values blank rather than guessing."],
    ["Evidence", "Keep a screenshot or preserved-page link if you can. Add a note when a coupon, bundle, shipping threshold or selected option affects the price."],
  ];
  const steps = [
    ["01", "Create a baseline", "Open the public product page yourself. Record one row for the exact option you observed. The first row establishes a dated reference point, not a change."],
    ["02", "Repeat the same context", "On a later date, revisit the same URL and select the same market, currency, size and purchase mode. If any of these differ, start a new comparison group."],
    ["03", "Calculate only comparable differences", "For two valid listed prices, use (later price − earlier price) ÷ earlier price × 100. An illustrative $48 to $52 comparison is +8.33%; it says nothing about sales."],
    ["04", "Keep interpretation separate", "Write the observed difference first, then separately note any hypothesis and what further evidence would be needed before acting."],
  ];
  return <main className="guide-page">
    <MarketingNav go={go} />
    <Breadcrumbs items={[["Home", () => go("home")], ["Guides", null], ["Beauty price tracking template", null]]} />
    <article className="guide-article section-container">
      <header><p className="eyebrow">Free worksheet · Updated September 22, 2026</p><h1>Beauty competitor price tracking template.</h1><p className="guide-lede"><strong>Short answer:</strong> record one exact product option per dated row, then compare only the same page, market, currency, size and purchase mode. A first observation is a baseline—not a price change.</p><div className="example-actions"><a className="primary-button" href={`${import.meta.env.BASE_URL}beauty-competitor-price-tracking-template.csv`} download>Download blank CSV <ArrowRight size={19} /></a><a className="outline-button" href={`${import.meta.env.BASE_URL}tools/competitor-snapshot/`} onClick={(event) => { event.preventDefault(); go("snapshot"); }}>Use the browser tool</a></div><p>The CSV is blank and works without an account or API. It does not automatically visit competitor sites.</p></header>
      <section className="guide-steps"><h2>Four field groups that make a price log trustworthy.</h2>{fields.map(([title, body], index) => <div key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{body}</p></div></div>)}</section>
      <section className="guide-checklist"><div><p className="eyebrow">Blank CSV columns</p><h2>Copy the same structure every time.</h2><p>Each row represents one observed product option at one time. The file includes columns for timestamp, brand, source URL, market, currency, product, variant or size, purchase mode, listed price, promotion terms, availability, evidence URL and notes.</p></div><ul>{["Keep the original source URL", "Use UTC for the timestamp", "Do not merge buy-once and subscription prices", "Leave unobserved fields empty", "Store screenshots separately and link them if needed"].map((item) => <li key={item}><CheckCircle size={19} />{item}</li>)}</ul></section>
      <section className="guide-steps"><h2>How to use the template each week.</h2>{steps.map(([n, title, body]) => <div key={n}><span>{n}</span><div><h3>{title}</h3><p>{body}</p></div></div>)}</section>
      <section className="guide-faq"><p className="eyebrow">Comparison rules</p><h2>When not to call it a price change.</h2>{[["The size or bundle changed", "Do not compare the two prices as the same product. Create a separate group or calculate a clearly labeled unit price only when the unit contents are known."], ["The later price uses a coupon or subscription", "Keep that offer separate from the buy-once listed price. Record the visible terms and avoid treating a temporary incentive as a permanent price cut."], ["A product page disappeared", "Record the page status and timestamp. A missing page alone does not prove that the product was discontinued."], ["Does this template prove sales or campaign impact?", "No. It records public observations. Revenue, demand, conversion and strategic intent require other reliable evidence." ]].map(([q, a]) => <details key={q}><summary>{q}<ArrowRight size={18} /></summary><p>{a}</p></details>)}</section>
      <section className="report-next"><div><p className="eyebrow">See a dated example</p><h2>What a single baseline can establish.</h2><p>Our Summer Fridays product-page snapshot shows the source, selected option, observed price and evidence boundary. It is dated August 28, 2026 and is not presented as a live price.</p></div><a className="outline-button" href={`${import.meta.env.BASE_URL}reports/summer-fridays-competitor-snapshot/`} onClick={(event) => { event.preventDefault(); go("public-report/summer-fridays"); }}>Inspect the cited baseline <ArrowRight size={19} /></a></section>
    </article>
    <Footer go={go} />
  </main>;
}

export function MethodologyPage({ go }) {
  const confidenceLevels = [
    ["01", "Observed fact", "A visible value or message recorded from a named public URL at a stated time."],
    ["02", "Valid comparison", "Two observations of the same page, market, currency, variant and purchase mode."],
    ["03", "Interpretation", "A possible business meaning that remains separate from the observed difference."],
    ["04", "Not established", "A claim the available public evidence cannot support, such as sales impact or intent."],
  ];
  return <main className="methodology-page trust-page">
    <MarketingNav go={go} />
    <Breadcrumbs items={[["Home", () => go("home")], ["Methodology", null]]} />
    <article className="trust-article section-container">
      <header className="trust-hero"><p className="eyebrow">RivalTrace methodology · Updated September 1, 2026</p><h1>Evidence before interpretation.</h1><p className="guide-lede"><strong>Short answer:</strong> RivalTrace records observable storefront facts, compares like with like, and labels interpretation separately. A first capture is a baseline—not proof of change.</p><div className="example-actions"><button className="primary-button" onClick={() => go("snapshot")}>Create a free baseline <ArrowRight size={19} /></button><button className="outline-button" onClick={() => go("public-report/summer-fridays")}>Inspect a cited example</button></div></header>
      <section className="trust-section"><div className="trust-section-heading"><p className="eyebrow">What a useful capture contains</p><h2>Enough context to compare the same thing later.</h2></div><div className="method-cards">{[["Public source", "The exact public URL and a capture timestamp."], ["Market context", "Currency, region and purchase mode when they affect the visible offer."], ["Product identity", "Product label, size or variant so a reformulation or new pack is not misread."], ["Observable fields", "Listed price, availability and promotion wording—without guessing why they changed."]].map(([title, body]) => <article key={title}><ShieldCheck size={23} /><h3>{title}</h3><p>{body}</p></article>)}</div></section>
      <section className="comparison-rule"><div><p className="eyebrow">Comparison rule</p><h2>The first capture creates the reference point.</h2><p>Only a later capture of the same comparable surface can establish a difference. If the product label changes for the same URL, the local tool stops instead of producing a misleading Trace.</p></div><ol><li><span>Baseline</span><strong>One dated observation</strong></li><li><span>Comparison</span><strong>Same page and context later</strong></li><li><span>Trace</span><strong>Observable fields differ</strong></li></ol></section>
      <section className="trust-section"><div className="trust-section-heading"><p className="eyebrow">Confidence labels</p><h2>What each statement is allowed to mean.</h2></div><div className="confidence-list">{confidenceLevels.map(([number, title, body]) => <div key={number}><span>{number}</span><div><h3>{title}</h3><p>{body}</p></div></div>)}</div></section>
      <section className="method-boundary"><ShieldCheck size={31} /><div><p className="eyebrow">Data and privacy boundary</p><h2>The current free tool is local and manual.</h2><p>You open the source page and enter what you can see. Captures stay in this browser. The free snapshot does not fetch the competitor page, call an external data API, sync to an account or run background monitoring. Paid subscriptions are processed separately by PayPal.</p></div></section>
      <section className="trust-update"><div><p className="eyebrow">Freshness and corrections</p><h2>Public examples are dated, linked and revisitable.</h2></div><p>Verify the original source before acting because storefronts change. RivalTrace does not invent historical observations. If a cited factual record is wrong, it should be corrected at the fact level without rewriting the evidence boundary around it.</p></section>
    </article>
    <Footer go={go} />
  </main>;
}

export function AboutPage({ go }) {
  return <main className="about-page trust-page">
    <MarketingNav go={go} />
    <Breadcrumbs items={[["Home", () => go("home")], ["About RivalTrace", null]]} />
    <article className="trust-article section-container">
      <header className="trust-hero"><p className="eyebrow">About RivalTrace</p><h1>A clearer view of the beauty market.</h1><p className="guide-lede"><strong>RivalTrace is an evidence-first beauty competitor monitoring product</strong> for independent brands and lean teams. It helps teams record public price, availability, product and promotion signals without confusing a visible change with its business impact.</p><div className="example-actions"><button className="primary-button" onClick={() => go("snapshot")}>Try the free snapshot <ArrowRight size={19} /></button><button className="outline-button" onClick={() => go("methodology")}>Read the methodology</button></div></header>
      <section className="about-grid"><article><p className="eyebrow">What it does</p><h2>Turns public observations into a repeatable record.</h2><p>Start with one exact competitor page, save the visible facts, and compare the same context later. Use the evidence to decide what deserves attention.</p></article><article><p className="eyebrow">What it does not do</p><h2>It does not claim access to private competitor data.</h2><p>RivalTrace cannot prove revenue, demand, conversion, campaign performance or strategic intent from a storefront page. Those conclusions require additional reliable evidence.</p></article></section>
      <section className="why-beauty"><div><p className="eyebrow">Why beauty first</p><h2>A category where context changes the meaning.</h2></div><p>Beauty teams compare many sizes, bundles, subscription offers, limited launches and promotional messages. A useful monitoring workflow must preserve those details instead of flattening every difference into an alert.</p></section>
      <section className="current-state"><div className="trust-section-heading"><p className="eyebrow">Current product state</p><h2>Useful now, explicit about what comes later.</h2></div><div className="method-cards">{[["Available", "A free manual baseline and comparison tool stored locally in your browser."], ["Demonstrated", "A sample dashboard, evidence workflow and source-linked Summer Fridays example."], ["Subscriptions", "PayPal recurring subscriptions are available, but do not currently unlock extra monitoring features or capacity."], ["Not active", "No third-party crawling, account sync, or background alerts. Additional automation depends on real user demand."]].map(([title, body]) => <article key={title}><CheckCircle size={23} /><h3>{title}</h3><p>{body}</p></article>)}</div></section>
      <section className="report-next"><div><p className="eyebrow">Start with one public page</p><h2>Build the baseline before the story.</h2><p>Record what is visible today, then return to the same page later for the first valid comparison.</p></div><button className="primary-button" onClick={() => go("snapshot")}>Create a snapshot <ArrowRight size={19} /></button></section>
    </article>
    <Footer go={go} />
  </main>;
}

export function PrivacyPage({ go }) {
  return <main className="about-page trust-page">
    <MarketingNav go={go} />
    <Breadcrumbs items={[["Home", () => go("home")], ["Privacy & analytics", null]]} />
    <article className="trust-article section-container">
      <header className="trust-hero"><p className="eyebrow">Privacy & analytics · Updated September 8, 2026</p><h1>Your research stays yours.</h1><p className="guide-lede">The free snapshot stores competitor URLs, capture fields and notes in your browser. Optional Google Analytics loads only after you choose <strong>Allow analytics</strong>.</p></header>
      <section className="about-grid"><article><p className="eyebrow">Local product data</p><h2>Snapshot details stay on this device.</h2><p>The current free tool does not send your competitor URL, product label, price, availability, promotion text or notes to RivalTrace or Google Analytics.</p></article><article><p className="eyebrow">Optional usage data</p><h2>We measure pages and feature actions.</h2><p>After consent, Google Analytics may receive page views, approximate device and location information, origin-level referrer data and fixed RivalTrace interactions such as opening the demo or attempting a snapshot.</p></article></section>
      <section className="why-beauty"><div><p className="eyebrow">What is excluded</p><h2>No form contents or payment details.</h2></div><p>Analytics events use fixed labels. They do not include values typed into RivalTrace forms, capture notes, competitor page contents or payment credentials. Advertising personalization and Google Signals are disabled in the site configuration.</p></section>
      <section className="current-state"><div className="trust-section-heading"><p className="eyebrow">Your choice</p><h2>Optional means optional.</h2></div><div className="method-cards">{[["Before consent", "The Google Analytics script is not loaded and no analytics event is sent."], ["Allow analytics", "Usage events without RivalTrace form contents help us understand acquisition pages, product activation and checkout stages."], ["No thanks", "The site and free snapshot continue to work without analytics."], ["Change later", "Use the Privacy choices button at the bottom-left of any page to update your decision."]].map(([title, body]) => <article key={title}><ShieldCheck size={23} /><h3>{title}</h3><p>{body}</p></article>)}</div></section>
      <section className="report-next"><div><p className="eyebrow">Analytics provider</p><h2>Google Analytics 4</h2><p>Google processes consented analytics events under its own privacy and data controls. Browser do-not-track settings are respected by this site.</p></div><a className="outline-button" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google privacy policy <ArrowSquareOut size={18} /></a></section>
    </article>
    <Footer go={go} />
  </main>;
}
