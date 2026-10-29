import test from "node:test";
import assert from "node:assert/strict";
import { bundleValue, priceChange, promotionPrice, shippingThreshold, unitPrice } from "../src/researchCalculators.js";

test("listed-price change uses the earlier price as its percentage denominator", () => {
  assert.equal(priceChange("48", "52").difference, 4);
  assert.ok(Math.abs(priceChange("48", "52").percent - 8.3333333333) < 0.0001);
  assert.equal(priceChange("52", "48").percent, -100 / 13);
  assert.equal(priceChange("0", "52"), null);
  assert.equal(priceChange("", "52"), null);
});

test("unit price converts US fluid ounces to milliliters without mixing mass units", () => {
  assert.equal(unitPrice("30", "30", "ml").perMl, 1);
  assert.ok(Math.abs(unitPrice("30", "1", "fl-oz").milliliters - 29.5735295625) < 0.000001);
  assert.equal(unitPrice("30", "1", "g"), null);
  assert.equal(unitPrice("30", "0", "ml"), null);
});

test("bundle value allows a premium as well as a listed saving", () => {
  assert.deepEqual(bundleValue("70", ["40", "40"]), { bundlePrice: 70, components: [40, 40], componentTotal: 80, difference: 10, percent: 12.5 });
  assert.equal(bundleValue("90", ["40", "40"]).difference, -10);
  assert.equal(bundleValue("70", ["40"]), null);
});

test("promotion math applies a percent before a fixed amount and caps at zero", () => {
  assert.equal(promotionPrice("100", "20", "10").finalPrice, 70);
  assert.equal(promotionPrice("100", "20", "10").effectivePercent, 30);
  assert.equal(promotionPrice("100", "20", "100").finalPrice, 0);
  assert.equal(promotionPrice("100", "120", "0"), null);
});

test("shipping gap separates the current basket from a qualifying basket", () => {
  assert.deepEqual(shippingThreshold("45", "60", "6"), { subtotal: 45, threshold: 60, shippingFee: 6, gap: 15, totalWithCurrentBasket: 51, qualifyingBasketTotal: 60 });
  assert.equal(shippingThreshold("65", "60", "6").gap, 0);
  assert.equal(shippingThreshold("", "60", "6"), null);
});
