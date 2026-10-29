import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "@phosphor-icons/react";
import { Brand, Badge, DemoNote, Footer, MarketingNav, Steps } from "./App.jsx";
import { PayPalSubscription, SubscriptionSuccess } from "./PayPalSubscription.jsx";
import { trackEvent } from "./analytics.js";
import { plans, planQuote } from "./model.js";

export function Pricing({ go, annual, setAnnual, setPlan }) {
  return <main className="pricing-page">
    <MarketingNav go={go} />
    <section className="pricing-heading">
      <p className="eyebrow">RivalTrace pricing · Current product state</p>
      <h1>Explore the workflow first.<br />Subscribe with clear expectations.</h1>
      <p>The free beauty competitor snapshot and research tools are available without an account or card. The plans below are automatically renewing supporter subscriptions processed by PayPal.</p>
      <p className="pricing-boundary"><strong>Important:</strong> every paid tier currently uses the same manual, browser-local workflow. A subscription does not yet unlock automatic checks, account sync, alerts, background monitoring, or different competitor limits.</p>
      <div className="pricing-free-path"><button className="outline-button" onClick={() => go("snapshot")}>Try the free snapshot first <ArrowRight size={18} /></button><button className="outline-button" onClick={() => go("toolbox")}>Open free research tools</button></div>
      <div className="billing-toggle" role="group" aria-label="Billing period">
        <button className={!annual ? "active" : ""} aria-pressed={!annual} onClick={() => setAnnual(false)}>Monthly</button>
        <button className={annual ? "active" : ""} aria-pressed={annual} onClick={() => setAnnual(true)}>Yearly <span>Save 20%</span></button>
      </div>
    </section>
    <section className="plans">{Object.entries(plans).map(([name, plan]) => {
      const quote = planQuote(name, annual);
      return <article key={name} className={name === "Growth" ? "featured" : ""}>
        {name === "Growth" && <Badge>For growing teams</Badge>}
        <h2>{name}</h2>
        <p>{plan.label}</p>
        <div className="price"><strong>{"$" + quote.monthly}</strong><span>/ month</span></div>
        <small>{annual ? `$${quote.total.toFixed(2)} billed yearly` : "Billed monthly"}</small>
        <button className={name === "Growth" ? "primary-button" : "outline-button"} onClick={() => {
          trackEvent("select_plan", { plan_code: `${name.toLowerCase()}-${annual ? "yearly" : "monthly"}`, billing_period: annual ? "yearly" : "monthly" });
          setPlan(name);
          go("checkout");
        }}>Support with {name}<ArrowRight size={19} /></button>
        <ul>{["Use the current manual local workflow", "Recurring PayPal billing at the displayed price", "Manage or cancel from your PayPal account", "No additional product capacity yet"].map((text) => <li key={text}><Check size={18} />{text}</li>)}</ul>
      </article>;
    })}</section>
    <section className="pricing-faq section-container"><div><p className="eyebrow">Before subscribing</p><h2>What payment changes—and what it does not.</h2></div><div><article><h3>Is the subscription real?</h3><p>Yes. Approval starts an automatically renewing PayPal subscription at the displayed monthly or yearly amount until you cancel.</p></article><article><h3>Does payment unlock automation?</h3><p>No. The current product remains manual and local to this browser. Do not subscribe expecting background monitoring, alerts, account sync, or expanded limits.</p></article><article><h3>Can I evaluate RivalTrace for free?</h3><p>Yes. Use the snapshot, calculators, research library, sample evidence report, and demo before deciding whether to support development.</p></article></div></section>
    <DemoNote>Recurring subscriptions are processed securely by PayPal. You can manage or cancel your plan from your PayPal account.</DemoNote>
    <Footer go={go} />
  </main>;
}

export function Checkout({ go, selectedPlan, annual }) {
  const [subscription, setSubscription] = useState(null);
  const plan = plans[selectedPlan];
  const quote = planQuote(selectedPlan, annual);
  const planCode = `${selectedPlan.toLowerCase()}-${annual ? "yearly" : "monthly"}`;

  useEffect(() => {
    trackEvent("begin_checkout", { checkout_type: "subscription", plan_code: planCode, billing_period: annual ? "yearly" : "monthly", payment_provider: "paypal" });
  }, [annual, planCode]);

  return <main className="checkout-page">
    <header className="simple-header"><Brand go={go} /><Badge>Secure PayPal</Badge></header>
    {subscription
      ? <SubscriptionSuccess subscription={subscription} selectedPlan={selectedPlan} go={go} />
      : <section className="checkout-shell">
        <div className="checkout-form-wrap">
          <a className="back-link" href="#pricing"><ArrowLeft size={18} />Back to plans</a>
          <p className="eyebrow">Secure recurring checkout</p>
          <h1>Make room for<br />a clearer picture.</h1>
          <p>Approve your automatically renewing subscription in PayPal. RivalTrace never receives or stores your card details.</p>
          <p><strong>Before you subscribe:</strong> the current tool is manual and local to this browser. This plan does not yet unlock automatic monitoring, account sync, alerts, or additional capacity.</p>
          <div className="checkout-form">
            <PayPalSubscription planCode={planCode} onSubscribed={setSubscription} />
            <DemoNote>By approving, you start an automatically renewing subscription at the price shown. Cancel anytime from your PayPal account.</DemoNote>
          </div>
        </div>
        <aside className="order-summary">
          <p className="eyebrow">Your plan</p>
          <h2>{selectedPlan}</h2>
          <p>{plan.label}</p>
          <div className="price"><strong>{"$" + quote.monthly}</strong><span>/ month</span></div>
          <p>{annual ? "Yearly billing · 20% discount" : "Monthly billing"}</p>
          <ul><li><Check size={18} />Manual local captures</li><li><Check size={18} />Later same-page comparisons</li><li><Check size={18} />Sample weekly brief</li></ul>
          <div className="total-row"><span>{annual ? "Recurring yearly total" : "Recurring monthly total"}</span><strong>{"$" + quote.total.toFixed(2)}</strong></div>
          <p className="renewal-note">Renews automatically until you cancel. You can manage or cancel the subscription from your PayPal account.</p>
        </aside>
      </section>}
  </main>;
}

export function Product({ go }) {
  return <main className="product-page"><MarketingNav go={go} /><section className="product-hero"><p className="eyebrow">The RivalTrace method</p><h1>Notice the change.<br />Keep the context.</h1><p>A simple workflow for following public beauty storefronts.<br />Evidence first. Your judgment always.</p><button className="primary-button" onClick={() => go("setup")}>Explore the demo<ArrowRight size={20} /></button></section><Steps /><section className="method-grid section-container">{[["01", "Watch the public page", "Pick comparable products or a promotion page. The current service uses a manual browser-based evidence workflow without third-party data APIs."], ["02", "Compare like with like", "Save a baseline, then compare later captures. Retain the currency, product variant, source URL and time of each observation."], ["03", "Make your own call", "Review the evidence and record your decision. A price change is an observation, not proof of a competitor’s sales or strategy."]].map(([n, title, text]) => <article key={n}><span className="eyebrow">{n}</span><h2>{title}</h2><p>{text}</p></article>)}</section><DemoNote /><Footer go={go} /></main>;
}
