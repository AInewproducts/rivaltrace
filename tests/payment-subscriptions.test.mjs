import test from "node:test";
import assert from "node:assert/strict";
import { PLAN_CATALOG, getPlan, publicPlans, resolvePayPalEnvironment } from "../payment-worker/config.js";

test("live PayPal subscriptions require the explicit release switch", () => {
  assert.deepEqual(resolvePayPalEnvironment({ PAYPAL_ENV: "sandbox" }), { environment: "sandbox", sdkEnvironment: "sandbox", apiBase: "https://api-m.sandbox.paypal.com" });
  assert.throws(() => resolvePayPalEnvironment({ PAYPAL_ENV: "live" }), /disabled/);
  assert.equal(resolvePayPalEnvironment({ PAYPAL_ENV: "live", LIVE_PAYMENTS_ENABLED: "true" }).environment, "live");
});

test("the six PayPal plans match the public pricing model", () => {
  assert.deepEqual(Object.fromEntries(Object.entries(PLAN_CATALOG).map(([code, plan]) => [code, plan.price])), {
    "starter-monthly": "29.00",
    "starter-yearly": "278.40",
    "growth-monthly": "79.00",
    "growth-yearly": "758.40",
    "agency-monthly": "249.00",
    "agency-yearly": "2390.40",
  });
});

test("only provisioned PayPal plan IDs are exposed", () => {
  const env = { PAYPAL_PLAN_STARTER_MONTHLY: "P-12345678ABCDEFG" };
  assert.equal(getPlan(env, "starter-monthly").planId, "P-12345678ABCDEFG");
  assert.throws(() => getPlan(env, "growth-monthly"), /not provisioned/);
  assert.deepEqual(Object.keys(publicPlans(env)), ["starter-monthly"]);
});
