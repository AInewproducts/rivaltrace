export const PLAN_CATALOG = Object.freeze({
  "starter-monthly": { name: "Starter", billing: "monthly", price: "29.00", currency: "USD", intervalLabel: "Monthly", envKey: "PAYPAL_PLAN_STARTER_MONTHLY" },
  "starter-yearly": { name: "Starter", billing: "yearly", price: "278.40", currency: "USD", intervalLabel: "Yearly", envKey: "PAYPAL_PLAN_STARTER_YEARLY" },
  "growth-monthly": { name: "Growth", billing: "monthly", price: "79.00", currency: "USD", intervalLabel: "Monthly", envKey: "PAYPAL_PLAN_GROWTH_MONTHLY" },
  "growth-yearly": { name: "Growth", billing: "yearly", price: "758.40", currency: "USD", intervalLabel: "Yearly", envKey: "PAYPAL_PLAN_GROWTH_YEARLY" },
  "agency-monthly": { name: "Agency", billing: "monthly", price: "249.00", currency: "USD", intervalLabel: "Monthly", envKey: "PAYPAL_PLAN_AGENCY_MONTHLY" },
  "agency-yearly": { name: "Agency", billing: "yearly", price: "2390.40", currency: "USD", intervalLabel: "Yearly", envKey: "PAYPAL_PLAN_AGENCY_YEARLY" },
});

export function resolvePayPalEnvironment(env) {
  if (env.PAYPAL_ENV !== "live") return { environment: "sandbox", sdkEnvironment: "sandbox", apiBase: "https://api-m.sandbox.paypal.com" };
  if (env.LIVE_PAYMENTS_ENABLED !== "true") throw new Error("Live subscriptions are disabled until explicitly approved.");
  return { environment: "live", sdkEnvironment: "production", apiBase: "https://api-m.paypal.com" };
}

export function getPlan(env, planCode) {
  const catalog = PLAN_CATALOG[planCode];
  if (!catalog) throw new Error("Unknown RivalTrace subscription plan.");
  const planId = env[catalog.envKey];
  if (typeof planId !== "string" || !/^P-[A-Z0-9]{8,40}$/.test(planId)) throw new Error("This RivalTrace PayPal plan is not provisioned.");
  return { ...catalog, code: planCode, planId };
}

export function publicPlans(env) {
  return Object.fromEntries(Object.keys(PLAN_CATALOG).flatMap((code) => {
    try {
      const plan = getPlan(env, code);
      return [[code, { name: plan.name, billing: plan.billing, price: plan.price, currency: plan.currency, intervalLabel: plan.intervalLabel }]];
    } catch {
      return [];
    }
  }));
}
