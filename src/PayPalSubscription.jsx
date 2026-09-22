import { useEffect, useMemo, useState } from "react";
import { PayPalProvider, PayPalSubscriptionButton } from "@paypal/react-paypal-js/sdk-v6";
import { CheckCircle, ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import { trackEvent } from "./analytics.js";

const PAYMENT_API_BASE = (import.meta.env.VITE_PAYMENT_API_BASE || "").replace(/\/$/, "");

async function readJson(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "The subscription service could not complete this request.");
  return body;
}

function apiRequest(path, init) {
  if (!PAYMENT_API_BASE) return Promise.reject(new Error("PayPal checkout is not connected to this deployment yet."));
  return fetch(`${PAYMENT_API_BASE}${path}`, init);
}

export function PayPalSubscription({ planCode, onSubscribed }) {
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState("Loading secure PayPal checkout…");
  const [error, setError] = useState("");
  const plan = config?.plans?.[planCode];

  useEffect(() => {
    let disposed = false;
    apiRequest("/api/paypal/config")
      .then(readJson)
      .then((next) => {
        if (disposed) return;
        setConfig(next);
        setStatus(next.environment === "sandbox" ? "Sandbox mode — no real charge will be made." : "Secure recurring subscription powered by PayPal.");
      })
      .catch((nextError) => {
        if (disposed) return;
        setError(nextError.message);
        setStatus("");
      });
    return () => { disposed = true; };
  }, []);

  const providerKey = useMemo(() => `${config?.environment || "pending"}:${config?.clientId || "none"}`, [config]);
  if (error) return <div className="payment-state payment-state-error"><WarningCircle size={22} /><div><strong>Checkout is not ready.</strong><p>{error}</p></div></div>;
  if (!config || !plan) return <div className="payment-state"><span className="payment-spinner" aria-hidden="true" /><div><strong>Preparing PayPal</strong><p>{planCode && config ? "This PayPal plan has not been provisioned yet." : status}</p></div></div>;

  return <div className="paypal-subscription">
    <PayPalProvider key={providerKey} clientId={config.clientId} environment={config.sdkEnvironment} components={["paypal-subscriptions"]} pageType="checkout">
      <PayPalSubscriptionButton
        createSubscription={async () => {
          setError("");
          setStatus("Creating your subscription securely…");
          trackEvent("subscription_create_attempt", { plan_code: planCode, payment_provider: "paypal" });
          try {
            const subscription = await readJson(await apiRequest("/api/paypal/subscriptions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ planCode }),
            }));
            if (typeof subscription.subscriptionId !== "string") throw new Error("PayPal did not return a subscription ID.");
            trackEvent("subscription_created", { plan_code: planCode, payment_provider: "paypal" });
            return { subscriptionId: subscription.subscriptionId };
          } catch (nextError) {
            trackEvent("subscription_error", { plan_code: planCode, payment_provider: "paypal", error_stage: "create" });
            throw nextError;
          }
        }}
        onApprove={async ({ subscriptionId }) => {
          trackEvent("subscription_approval_received", { plan_code: planCode, payment_provider: "paypal" });
          try {
            setStatus("Verifying the subscription with PayPal…");
            const verified = await readJson(await apiRequest("/api/paypal/subscriptions/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ planCode, subscriptionId }),
            }));
            if (verified.status !== "ACTIVE" || typeof verified.entitlementToken !== "string") throw new Error("PayPal has not activated this subscription.");
            localStorage.setItem("rivaltrace_subscription_v1", JSON.stringify({ entitlementToken: verified.entitlementToken, planCode, subscriptionId, savedAt: new Date().toISOString() }));
            setStatus("Subscription active and verified.");
            trackEvent("subscription_activated", { plan_code: planCode, payment_provider: "paypal" });
            onSubscribed({ ...verified, planCode, subscriptionId });
          } catch (nextError) {
            trackEvent("subscription_error", { plan_code: planCode, payment_provider: "paypal", error_stage: "verify" });
            setError(nextError instanceof Error ? nextError.message : "The subscription could not be verified.");
          }
        }}
        onCancel={() => {
          trackEvent("subscription_cancelled", { plan_code: planCode, payment_provider: "paypal" });
          setStatus("Checkout was cancelled. No subscription was created.");
        }}
        onError={(nextError) => {
          trackEvent("subscription_error", { plan_code: planCode, payment_provider: "paypal", error_stage: "paypal" });
          setError(nextError?.message || "PayPal could not complete the subscription.");
        }}
        presentationMode="auto"
      />
    </PayPalProvider>
    <p className="checkout-message" aria-live="polite">{error || status}</p>
    <p className="subscription-safety"><ShieldCheck size={17} />{config.environment === "sandbox" ? "PayPal Sandbox only. Test approvals cannot charge a real payment method." : `You authorize recurring ${plan.intervalLabel.toLowerCase()} charges of ${plan.currency} ${plan.price} until cancellation.`}</p>
  </div>;
}

export function SubscriptionSuccess({ subscription, selectedPlan, go }) {
  return <section className="success-card"><CheckCircle size={62} /><p className="eyebrow">Subscription verified</p><h1>Your RivalTrace plan<br />is active.</h1><p>PayPal confirmed the {selectedPlan} subscription. The current capture tool remains manual and local to this browser; automated monitoring and account sync are not available yet.</p><p className="subscription-reference">Subscription reference · {subscription.subscriptionId}</p><button className="primary-button" onClick={() => go("app")}>Open the demo workspace</button></section>;
}
