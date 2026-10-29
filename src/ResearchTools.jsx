import { useState } from "react";
import { ArrowRight, Calculator, ChartLineUp, Package, Tag, Truck } from "@phosphor-icons/react";
import { bundleValue, priceChange, promotionPrice, shippingThreshold, unitPrice } from "./researchCalculators.js";
import { researchTools } from "./researchToolCatalog.js";

const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const href = (path) => `${base}${path}`;
const iconBySlug = {
  "beauty-price-change-calculator": ChartLineUp,
  "skincare-price-per-ml-calculator": Calculator,
  "beauty-bundle-savings-calculator": Package,
  "beauty-promotion-price-calculator": Tag,
  "free-shipping-threshold-calculator": Truck,
};
const fixed = (value, digits = 2) => Number(value).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const signed = (value) => `${value > 0 ? "+" : ""}${fixed(value)}`;

function NumberField({ label, value, onChange, placeholder = "0", min = "0", max }) {
  return <label className="tool-field"><span>{label}</span><input type="number" inputMode="decimal" min={min} max={max} step="any" value={value ?? ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectField({ label, value, onChange }) {
  return <label className="tool-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="ml">ml</option><option value="fl-oz">US fl oz</option></select></label>;
}

function Result({ children, ready, instruction }) {
  return <section className="tool-result" aria-live="polite"><p className="eyebrow">Calculated result</p>{ready ? children : <p className="tool-empty">{instruction}</p>}</section>;
}

function CalculatorForm({ tool }) {
  const [form, setForm] = useState({ unitA: "ml", unitB: "ml" });
  const update = (name) => (value) => setForm((current) => ({ ...current, [name]: value }));
  let fields;
  let result;
  let instruction = "Enter valid, non-negative amounts to calculate. Nothing is uploaded or saved.";

  if (tool.slug === "beauty-price-change-calculator") {
    const value = priceChange(form.earlier, form.later);
    fields = <div className="tool-fields"><NumberField label="Earlier listed price" value={form.earlier} onChange={update("earlier")} placeholder="48" /><NumberField label="Later listed price" value={form.later} onChange={update("later")} placeholder="52" /></div>;
    instruction = "Enter an earlier price greater than zero and a later price in the same currency.";
    result = <Result ready={value} instruction={instruction}><strong>{value && `${signed(value.difference)} price units · ${signed(value.percent)}%`}</strong><p>Formula: (later price − earlier price) ÷ earlier price × 100. Match the same product, size, variant, market, and purchase mode before calling this a change.</p></Result>;
  } else if (tool.slug === "skincare-price-per-ml-calculator") {
    const first = unitPrice(form.priceA, form.sizeA, form.unitA);
    const second = unitPrice(form.priceB, form.sizeB, form.unitB);
    fields = <div className="tool-pair"><fieldset><legend>Product A</legend><div className="tool-fields"><NumberField label="Listed price" value={form.priceA} onChange={update("priceA")} placeholder="30" /><NumberField label="Liquid quantity" value={form.sizeA} onChange={update("sizeA")} placeholder="30" min="0.001" /><SelectField label="Quantity unit" value={form.unitA} onChange={update("unitA")} /></div></fieldset><fieldset><legend>Product B</legend><div className="tool-fields"><NumberField label="Listed price" value={form.priceB} onChange={update("priceB")} placeholder="45" /><NumberField label="Liquid quantity" value={form.sizeB} onChange={update("sizeB")} placeholder="50" min="0.001" /><SelectField label="Quantity unit" value={form.unitB} onChange={update("unitB")} /></div></fieldset></div>;
    instruction = "Enter both listed prices and positive liquid quantities. Use one currency for both products.";
    result = <Result ready={first && second} instruction={instruction}><div className="tool-result-grid"><div><small>Product A</small><strong>{first && fixed(first.perMl, 3)} per ml</strong><span>{first && `${fixed(first.per30Ml)} per 30 ml`}</span></div><div><small>Product B</small><strong>{second && fixed(second.perMl, 3)} per ml</strong><span>{second && `${fixed(second.per30Ml)} per 30 ml`}</span></div></div><p>US fluid ounces are converted to ml. This is a listed-price comparison, not a quality or efficacy ranking.</p></Result>;
  } else if (tool.slug === "beauty-bundle-savings-calculator") {
    const components = (form.components || "").split(/[\n,]/).map((part) => part.trim());
    const value = components.some((part) => !part) ? null : bundleValue(form.bundle, components);
    fields = <div className="tool-fields"><NumberField label="Bundle listed price" value={form.bundle} onChange={update("bundle")} placeholder="70" /><label className="tool-field tool-field-wide"><span>Separately listed component prices (comma-separated)</span><textarea rows="3" value={form.components || ""} placeholder="40, 40" onChange={(event) => update("components")(event.target.value)} /></label></div>;
    instruction = "Enter a bundle price and 2–10 positive component prices in the same currency.";
    result = <Result ready={value} instruction={instruction}><strong>{value && `${signed(value.difference)} price units · ${signed(value.percent)}% of component total`}</strong><p>{value && `Separate listed total: ${fixed(value.componentTotal)}. Bundle listed price: ${fixed(value.bundlePrice)}.`} A negative difference is a bundle premium, not a saving.</p></Result>;
  } else if (tool.slug === "beauty-promotion-price-calculator") {
    const value = promotionPrice(form.original, form.percentage, form.fixed);
    fields = <div className="tool-fields"><NumberField label="Original listed price" value={form.original} onChange={update("original")} placeholder="100" min="0.001" /><NumberField label="Percentage off" value={form.percentage} onChange={update("percentage")} placeholder="20" max="100" /><NumberField label="Fixed amount off" value={form.fixed} onChange={update("fixed")} placeholder="10" /></div>;
    instruction = "Enter a positive original price and both discount fields; use 0 for an unused discount.";
    result = <Result ready={value} instruction={instruction}><strong>{value && `${fixed(value.finalPrice)} modeled final price`}</strong><p>{value && `After percentage: ${fixed(value.afterPercent)}. Total modeled reduction: ${fixed(value.totalDiscount)} (${fixed(value.effectivePercent)}%).`} The percentage is applied first; confirm the merchant allows stacking.</p></Result>;
  } else if (tool.slug === "free-shipping-threshold-calculator") {
    const value = shippingThreshold(form.subtotal, form.threshold, form.fee);
    fields = <div className="tool-fields"><NumberField label="Current basket subtotal" value={form.subtotal} onChange={update("subtotal")} placeholder="45" /><NumberField label="Free-shipping threshold" value={form.threshold} onChange={update("threshold")} placeholder="60" min="0.001" /><NumberField label="Shipping fee below threshold" value={form.fee} onChange={update("fee")} placeholder="6" /></div>;
    instruction = "Enter a subtotal, a positive threshold, and the published below-threshold shipping fee.";
    result = <Result ready={value} instruction={instruction}><strong>{value && `${fixed(value.gap)} price units to threshold`}</strong><p>{value && `Current basket with modeled shipping: ${fixed(value.totalWithCurrentBasket)}. Minimum qualifying basket subtotal: ${fixed(value.qualifyingBasketTotal)}.`} Extra products are a real purchase, not a free way to avoid shipping.</p></Result>;
  }

  return <div className="tool-calculator"><div className="tool-inputs"><p className="eyebrow">Try the calculator</p><p>Use figures from your own research. They remain in this browser tab and are not sent to RivalTrace.</p>{fields}</div>{result}</div>;
}

function ToolHeader({ go, Nav }) {
  return <><Nav go={go} /><div className="library-breadcrumb"><a href={href("/")} onClick={(event) => { event.preventDefault(); go("home"); }}>RivalTrace</a><span>/</span><a href={href("/tools/")} onClick={(event) => { event.preventDefault(); go("toolbox"); }}>Free tools</a></div></>;
}

export function ResearchToolsHub({ go, Nav, Footer }) {
  return <main className="library-page"><ToolHeader go={go} Nav={Nav} /><div className="library-container tool-hub"><header className="library-hero"><p className="eyebrow">No API · No account · No uploaded research</p><h1>Free beauty competitor research tools.</h1><p>Use one manual snapshot and five transparent calculators to examine public beauty prices, pack sizes, bundles, promotions, and shipping thresholds. Each tool explains the arithmetic and what the result cannot prove.</p></header><div className="library-grid"><a className="library-card" href={href("/tools/competitor-snapshot/")} onClick={(event) => { event.preventDefault(); go("snapshot"); }}><h3>Free beauty competitor snapshot</h3><p>Save a manual product, collection, or promotion baseline locally, then compare a later observation on the same device.</p><span>Open snapshot <ArrowRight size={17} /></span></a>{researchTools.map((tool) => { const Icon = iconBySlug[tool.slug]; return <a className="library-card" href={href(tool.path)} onClick={(event) => { event.preventDefault(); go(tool.route); }} key={tool.route}><Icon size={26} weight="duotone" className="tool-card-icon" /><small>{tool.focusQuery}</small><h3>{tool.title}</h3><p>{tool.description}</p><span>Open calculator <ArrowRight size={17} /></span></a>; })}</div><section className="tool-hub-note"><h2>What these tools do not do</h2><p>They do not fetch competitor sites or provide live prices. Use an official public page, keep its URL and capture date, and compare only equivalent offers. Calculated differences do not reveal a competitor's sales, costs, intent, or customer demand.</p><div className="tool-hub-actions"><a href={href("/methodology/")} onClick={(event) => { event.preventDefault(); go("methodology"); }}>Read the evidence methodology <ArrowRight size={17} /></a><a href={href("/pricing/")} onClick={(event) => { event.preventDefault(); go("pricing"); }}>Review pricing and current product limits <ArrowRight size={17} /></a></div></section></div><Footer go={go} /></main>;
}

export function ResearchToolPage({ tool, go, Nav, Footer }) {
  const Icon = iconBySlug[tool.slug];
  return <main className="library-page">
    <ToolHeader go={go} Nav={Nav} />
    <article className="library-container tool-article">
      <header className="tool-heading">
        <Icon size={35} weight="duotone" />
        <p className="eyebrow">Free local calculator · {tool.intent}</p>
        <h1>{tool.title}</h1>
        <p>{tool.lede}</p>
        <small>Updated October 29, 2026 · Focus: {tool.focusQuery}</small>
      </header>
      <CalculatorForm tool={tool} />
      <div className="tool-editorial">
        <section>
          <h2>How to use this calculator</h2>
          <p>{tool.how}</p>
          {tool.source && <p className="tool-source">Conversion reference: <a href={tool.source.url} target="_blank" rel="noopener noreferrer">{tool.source.title}</a>.</p>}
        </section>
        <section><h2>Worked example</h2><p>{tool.example}</p></section>
        <section><h2>How to interpret the result</h2><p>{tool.interpretation}</p></section>
        <section className="library-boundary"><h2>Limits of this calculation</h2><p>{tool.boundary}</p></section>
        <section className="tool-followup">
          <h2>Keep the evidence with the number</h2>
          <p>Save the exact official source URL, selected variant and purchase mode, market, currency, and capture time. If there is only one observation, call it a baseline. For a change claim, retain the earlier and later comparable records.</p>
          <a href={href(tool.related.path)} onClick={(event) => { event.preventDefault(); go(`library/guides/${tool.related.path.split("/").filter(Boolean).at(-1)}`); }}>{tool.related.title} <ArrowRight size={17} /></a>
        </section>
        <section className="tool-faq">
          <p className="eyebrow">Common questions</p>
          <h2>Use the result without overstating it.</h2>
          {tool.faq.map(([question, answer]) => <details key={question}><summary>{question}<ArrowRight size={17} /></summary><p>{answer}</p></details>)}
        </section>
        <section className="tool-next-step"><div><p className="eyebrow">Next step</p><h2>Save the observation before the number disappears.</h2><p>The free snapshot keeps a manual baseline in this browser. If you are considering a paid subscription, review the current product boundary first: paid plans do not yet unlock automated monitoring, account sync, alerts, or additional capacity.</p></div><div><a className="primary-button" href={href("/tools/competitor-snapshot/")} onClick={(event) => { event.preventDefault(); go("snapshot"); }}>Create a free baseline <ArrowRight size={18} /></a><a className="outline-button" href={href("/pricing/")} onClick={(event) => { event.preventDefault(); go("pricing"); }}>See pricing and limits</a></div></section>
      </div>
      <div className="tool-other">
        <h2>Other free tools</h2>
        <div>{researchTools.filter((item) => item.slug !== tool.slug).map((item) => <a href={href(item.path)} onClick={(event) => { event.preventDefault(); go(item.route); }} key={item.route}>{item.title}<ArrowRight size={16} /></a>)}</div>
      </div>
    </article>
    <Footer go={go} />
  </main>;
}
