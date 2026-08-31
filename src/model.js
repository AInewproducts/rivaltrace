export const plans = {
  Starter: { price: 29, competitors: 5, label: "For independent beauty founders" },
  Growth: { price: 79, competitors: 20, label: "For growing beauty teams" },
  Agency: { price: 249, competitors: 60, label: "For multi-brand partners" },
};

export function planQuote(name, annual) {
  const monthly = annual ? Number((plans[name].price * 0.8).toFixed(2)) : plans[name].price;
  return { monthly, total: Number((monthly * (annual ? 12 : 1)).toFixed(2)) };
}

// Syntax validation only. This frontend does not fetch the URL.
export function normalizeUrl(value) {
  try {
    const raw = value.trim();
    if (!raw || /\s/.test(raw)) return null;
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    const hostname = url.hostname.toLowerCase();
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || !hostname.includes(".") || hostname.endsWith(".local") || hostname.endsWith(".localhost") || /^\d+(\.\d+){3}$/.test(hostname)) return null;
    if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(hostname)) return null;
    return url.href;
  } catch { return null; }
}

export const changes = [
  { id: "price", type: "Price", product: "Barrier Serum", short: "$48 → $52", image: "/assets/beauty-serum.webp", title: "A new price for Barrier Serum.", before: "$48.00", after: "$52.00", beforeDetail: "Barrier Serum · 30 ml · USD", afterDetail: "Same product and size · USD", finding: "+8.33% in listed price.", context: "The example price moves from $48 to $52. This does not establish a change in demand, sales, margin or brand strategy.", checks: ["Confirm currency and product variant", "Check whether an offer has ended", "Review shipping and bundle conditions"] },
  { id: "product", type: "Product", product: "Daily Set", short: "Product added", image: "/assets/beauty-cleanser.webp", title: "A Daily Set joins the collection.", before: "Not listed in the sample", after: "Daily Set added", beforeDetail: "Example collection listing", afterDetail: "Cleanser + cream · Sample product set", finding: "One new product listing.", context: "A new bundle appears in the illustrative collection. A listing does not prove the exact launch date or that the product is currently in stock.", checks: ["Check the products and sizes included", "Compare bundle and individual prices", "Verify availability on the product page"] },
  { id: "copy", type: "Copy", product: "Homepage", short: "Promotion copy updated", image: "/assets/beauty-cleanser.webp", title: "A different offer on the homepage.", before: "Meet your daily essentials.", after: "Discover the Daily Set.", beforeDetail: "Example homepage headline", afterDetail: "Example promotion headline", finding: "The headline now features a set.", context: "The example homepage wording changes from individual essentials to a product set. This is a copy observation, not a claim about the brand’s strategy.", checks: ["Read the offer terms and dates", "Check which products are eligible", "Compare the destination landing page"] },
];
