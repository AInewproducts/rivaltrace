import process from "node:process";

const apiBase = process.env.RIVALTRACE_PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
const clientId = process.env.RIVALTRACE_PAYPAL_CLIENT_ID;
const secret = (await new Promise((resolve, reject) => {
  let value = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => { value += chunk; });
  process.stdin.on("end", () => resolve(value.trim()));
  process.stdin.on("error", reject);
}));

if (!clientId || clientId.length < 40) throw new Error("Set RIVALTRACE_PAYPAL_CLIENT_ID.");
if (!secret || secret.length < 20) throw new Error("Pipe the PayPal client secret to stdin.");

const tokenResponse = await fetch(`${apiBase}/v1/oauth2/token`, {
  method: "POST",
  headers: {
    Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: "grant_type=client_credentials",
});
const tokenBody = await tokenResponse.json();
if (!tokenResponse.ok || typeof tokenBody.access_token !== "string") throw new Error("PayPal OAuth failed.");

async function paypal(path, init = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${tokenBody.access_token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": crypto.randomUUID(),
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(body.details) ? body.details.map((item) => item.description).filter(Boolean).join("; ") : "";
    throw new Error(`${body.message || "PayPal API request failed"}${detail ? `: ${detail}` : ""}`);
  }
  return body;
}

const existingProducts = await paypal("/v1/catalogs/products?page_size=20&page=1&total_required=true");
let product = existingProducts.products?.find((item) => item.name === "RivalTrace" && item.type === "SERVICE");
let createdProduct = false;
if (!product) {
  product = await paypal("/v1/catalogs/products", {
    method: "POST",
    body: JSON.stringify({
      name: "RivalTrace",
      description: "Evidence-first beauty competitor monitoring subscription.",
      type: "SERVICE",
      home_url: "https://ainewproducts.github.io/rivaltrace/",
    }),
  });
  createdProduct = true;
}

const catalog = [
  { code: "starter-monthly", envKey: "PAYPAL_PLAN_STARTER_MONTHLY", name: "RivalTrace Starter Monthly", amount: "29.00", unit: "MONTH" },
  { code: "starter-yearly", envKey: "PAYPAL_PLAN_STARTER_YEARLY", name: "RivalTrace Starter Yearly", amount: "278.40", unit: "YEAR" },
  { code: "growth-monthly", envKey: "PAYPAL_PLAN_GROWTH_MONTHLY", name: "RivalTrace Growth Monthly", amount: "79.00", unit: "MONTH" },
  { code: "growth-yearly", envKey: "PAYPAL_PLAN_GROWTH_YEARLY", name: "RivalTrace Growth Yearly", amount: "758.40", unit: "YEAR" },
  { code: "agency-monthly", envKey: "PAYPAL_PLAN_AGENCY_MONTHLY", name: "RivalTrace Agency Monthly", amount: "249.00", unit: "MONTH" },
  { code: "agency-yearly", envKey: "PAYPAL_PLAN_AGENCY_YEARLY", name: "RivalTrace Agency Yearly", amount: "2390.40", unit: "YEAR" },
];

const listed = await paypal(`/v1/billing/plans?product_id=${encodeURIComponent(product.id)}&page_size=20&page=1&total_required=true`);
const planIds = {};
const createdPlans = [];
for (const definition of catalog) {
  let plan = listed.plans?.find((item) => item.name === definition.name && item.status === "ACTIVE");
  if (!plan) {
    plan = await paypal("/v1/billing/plans", {
      method: "POST",
      body: JSON.stringify({
        product_id: product.id,
        name: definition.name,
        description: `${definition.name} automatically renews until cancelled.`,
        status: "ACTIVE",
        billing_cycles: [{
          frequency: { interval_unit: definition.unit, interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: { fixed_price: { value: definition.amount, currency_code: "USD" } },
        }],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: { value: "0", currency_code: "USD" },
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 1,
        },
      }),
    });
    createdPlans.push(definition.code);
  }
  planIds[definition.envKey] = plan.id;
}

console.log(JSON.stringify({ environment: apiBase.includes("sandbox") ? "sandbox" : "live", productId: product.id, createdProduct, createdPlans, planIds }, null, 2));
