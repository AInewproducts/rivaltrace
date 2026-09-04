import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "@phosphor-icons/react";
import { Brand, Badge, DemoNote, Footer, MarketingNav, Steps } from "./App.jsx";
import { PayPalSubscription, SubscriptionSuccess } from "./PayPalSubscription.jsx";
import { plans, planQuote } from "./model.js";

export function Pricing({ go, annual, setAnnual, setPlan }) {
  return <main className="pricing-page">
    <MarketingNav go={go} />
    <section className="pricing-heading">
      <p className="eyebrow">Room to grow, at your pace</p>
      <h1>A clearer view.<br />A plan that fits.</h1>
      <p>Choose a recurring RivalTrace plan for your beauty workspace.<br />PayPal handles approval, billing and cancellation securely.</p>
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
        <button className={name === "Growth" ? "primary-button" : "outline-button"} onClick={() => { setPlan(name); go("checkout"); }}>Choose {name}<ArrowRight size={19} /></button>
        <ul>{["Up to " + plan.competitors + " competitors", "Public product, price & copy tracking", "Before-and-after evidence", "In-app weekly review"].map((text) => <li key={text}><Check size={18} />{text}</li>)}</ul>
      </article>;
    })}</section>
    <DemoNote>PayPal Sandbox is used while billing is being verified. No real payment method can be charged until live payments are explicitly enabled.</DemoNote>
    <Footer go={go} />
  </main>;
}

export function Checkout({ go, selectedPlan, annual }) {
  const [subscription, setSubscription] = useState(null);
  const plan = plans[selectedPlan];
  const quote = planQuote(selectedPlan, annual);
  const planCode = `${selectedPlan.toLowerCase()}-${annual ? "yearly" : "monthly"}`;

  return <main className="checkout-page">
    <header className="simple-header"><Brand go={go} /><Badge>PayPal Sandbox</Badge></header>
    {subscription
      ? <SubscriptionSuccess subscription={subscription} selectedPlan={selectedPlan} go={go} />
      : <section className="checkout-shell">
        <div className="checkout-form-wrap">
          <a className="back-link" href="#pricing"><ArrowLeft size={18} />Back to plans</a>
          <p className="eyebrow">Secure recurring checkout</p>
          <h1>Make room for<br />a clearer picture.</h1>
          <p>Approve your automatically renewing subscription in PayPal. RivalTrace never receives or stores your card details.</p>
          <div className="checkout-form">
            <PayPalSubscription planCode={planCode} onSubscribed={setSubscription} />
            <DemoNote>Sandbox testing only. Approval creates a test subscription, not a real charge.</DemoNote>
          </div>
        </div>
        <aside className="order-summary">
          <p className="eyebrow">Your plan</p>
          <h2>{selectedPlan}</h2>
          <p>{plan.label}</p>
          <div className="price"><strong>{"$" + quote.monthly}</strong><span>/ month</span></div>
          <p>{annual ? "Yearly billing · 20% discount" : "Monthly billing"}</p>
          <ul><li><Check size={18} />{plan.competitors} competitors</li><li><Check size={18} />Timestamped evidence</li><li><Check size={18} />Weekly review</li></ul>
          <div className="total-row"><span>{annual ? "Recurring yearly total" : "Recurring monthly total"}</span><strong>{"$" + quote.total.toFixed(2)}</strong></div>
          <p className="renewal-note">Renews automatically until you cancel. You can manage or cancel the subscription from your PayPal account.</p>
        </aside>
      </section>}
  </main>;
}

export function Product({ go }) {
  return <main className="product-page"><MarketingNav go={go} /><section className="product-hero"><p className="eyebrow">The RivalTrace method</p><h1>Notice the change.<br />Keep the context.</h1><p>A simple workflow for following public beauty storefronts.<br />Evidence first. Your judgment always.</p><button className="primary-button" onClick={() => go("setup")}>Explore the demo<ArrowRight size={20} /></button></section><Steps /><section className="method-grid section-container">{[["01", "Watch the public page", "Pick comparable products or a promotion page. The initial service is planned for public-page monitoring, without third-party data APIs."], ["02", "Compare like with like", "Save a baseline, then compare later captures. Retain the currency, product variant, source URL and time of each observation."], ["03", "Make your own call", "Review the evidence and record your decision. A price change is an observation, not proof of a competitor’s sales or strategy."]].map(([n, title, text]) => <article key={n}><span className="eyebrow">{n}</span><h2>{title}</h2><p>{text}</p></article>)}</section><DemoNote /><Footer go={go} /></main>;
}
