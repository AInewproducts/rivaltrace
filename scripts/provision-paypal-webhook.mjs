import process from "node:process";

const clientId = process.env.RIVALTRACE_PAYPAL_CLIENT_ID;
const apiBase = process.env.RIVALTRACE_PAYPAL_API_BASE || "https://api-m.paypal.com";
const webhookUrl = process.env.RIVALTRACE_PAYPAL_WEBHOOK_URL;
const secret = (await new Promise((resolve) => {
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => { input += chunk; });
  process.stdin.on("end", () => resolve(input.trim()));
}));

if (!clientId || !secret || !webhookUrl) {
  throw new Error("RIVALTRACE_PAYPAL_CLIENT_ID, RIVALTRACE_PAYPAL_WEBHOOK_URL and a client secret on stdin are required.");
}

const authResponse = await fetch(`${apiBase}/v1/oauth2/token`, {
  method: "POST",
  headers: {
    Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: "grant_type=client_credentials",
});
const auth = await authResponse.json();
if (!authResponse.ok || typeof auth.access_token !== "string") {
  throw new Error(`PayPal authentication failed (${authResponse.status}).`);
}

const eventTypes = [
  "BILLING.SUBSCRIPTION.ACTIVATED",
  "BILLING.SUBSCRIPTION.CANCELLED",
  "BILLING.SUBSCRIPTION.CREATED",
  "BILLING.SUBSCRIPTION.EXPIRED",
  "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
  "BILLING.SUBSCRIPTION.RE-ACTIVATED",
  "BILLING.SUBSCRIPTION.SUSPENDED",
  "BILLING.SUBSCRIPTION.UPDATED",
];

const response = await fetch(`${apiBase}/v1/notifications/webhooks`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${auth.access_token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: webhookUrl,
    event_types: eventTypes.map((name) => ({ name })),
  }),
});
const webhook = await response.json();
if (!response.ok || typeof webhook.id !== "string") {
  throw new Error(`PayPal webhook creation failed (${response.status}): ${webhook.message || "Unknown error"}`);
}

console.log(JSON.stringify({
  environment: apiBase.includes("sandbox") ? "sandbox" : "live",
  webhookId: webhook.id,
  url: webhook.url,
  eventTypes: webhook.event_types?.map(({ name }) => name) || eventTypes,
}, null, 2));
