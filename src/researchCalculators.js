// U.S. fluid ounces only; see NIST Guide to the SI, Appendix B.9.
const US_FL_OZ_TO_ML = 29.5735295625;

function amount(value, { zero = true } = {}) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || (zero ? number < 0 : number <= 0)) return null;
  return number;
}

export function priceChange(beforeInput, afterInput) {
  const before = amount(beforeInput, { zero: false });
  const after = amount(afterInput);
  if (before === null || after === null) return null;
  const difference = after - before;
  return { before, after, difference, percent: (difference / before) * 100 };
}

export function unitPrice(priceInput, quantityInput, unit) {
  const price = amount(priceInput);
  const quantity = amount(quantityInput, { zero: false });
  if (price === null || quantity === null || !["ml", "fl-oz"].includes(unit)) return null;
  const milliliters = unit === "ml" ? quantity : quantity * US_FL_OZ_TO_ML;
  return { price, quantity, unit, milliliters, perMl: price / milliliters, per30Ml: (price / milliliters) * 30 };
}

export function bundleValue(bundleInput, componentInputs) {
  const bundlePrice = amount(bundleInput);
  if (bundlePrice === null || !Array.isArray(componentInputs) || componentInputs.length < 2 || componentInputs.length > 10) return null;
  const components = componentInputs.map((input) => amount(input, { zero: false }));
  if (components.some((component) => component === null)) return null;
  const componentTotal = components.reduce((sum, component) => sum + component, 0);
  const difference = componentTotal - bundlePrice;
  return { bundlePrice, components, componentTotal, difference, percent: (difference / componentTotal) * 100 };
}

export function promotionPrice(priceInput, percentInput, fixedInput) {
  const price = amount(priceInput, { zero: false });
  const percent = amount(percentInput);
  const fixed = amount(fixedInput);
  if (price === null || percent === null || percent > 100 || fixed === null) return null;
  const afterPercent = price * (1 - percent / 100);
  const finalPrice = Math.max(0, afterPercent - fixed);
  return { price, percent, fixed, afterPercent, finalPrice, totalDiscount: price - finalPrice, effectivePercent: ((price - finalPrice) / price) * 100 };
}

export function shippingThreshold(subtotalInput, thresholdInput, feeInput) {
  const subtotal = amount(subtotalInput);
  const threshold = amount(thresholdInput, { zero: false });
  const shippingFee = amount(feeInput);
  if (subtotal === null || threshold === null || shippingFee === null) return null;
  const gap = Math.max(0, threshold - subtotal);
  return { subtotal, threshold, shippingFee, gap, totalWithCurrentBasket: subtotal + (gap > 0 ? shippingFee : 0), qualifyingBasketTotal: Math.max(subtotal, threshold) };
}
