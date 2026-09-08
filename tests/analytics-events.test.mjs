import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const analyticsSource = await readFile(new URL("../src/analytics.js", import.meta.url), "utf8");
const checkoutSource = await readFile(new URL("../src/PayPalSubscription.jsx", import.meta.url), "utf8");
const marketingSource = await readFile(new URL("../src/Marketing.jsx", import.meta.url), "utf8");

test("internal QA traffic can be excluded before analytics starts", () => {
  assert.match(analyticsSource, /rt_internal/);
  assert.match(analyticsSource, /!isInternalTraffic\(\)/);
});

test("checkout funnel has distinct privacy-safe stages", () => {
  for (const event of ["begin_checkout", "subscription_create_attempt", "subscription_created", "subscription_approval_received", "subscription_activated", "subscription_cancelled", "subscription_error"]) {
    assert.match(`${marketingSource}\n${checkoutSource}`, new RegExp(`trackEvent\\(\"${event}\"`));
  }
  assert.doesNotMatch(checkoutSource, /trackEvent\([^\n]+subscriptionId/);
  assert.doesNotMatch(checkoutSource, /trackEvent\([^\n]+entitlementToken/);
});
