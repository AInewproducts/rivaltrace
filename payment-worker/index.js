import { getPlan, publicPlans, resolvePayPalEnvironment } from "./config.js";

const encoder = new TextEncoder();

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = new Set((env.ALLOWED_ORIGINS || "https://ainewproducts.github.io,http://localhost:5173").split(",").map((value) => value.trim()).filter(Boolean));
  return origin && allowed.has(origin) ? origin : null;
}

function corsHeaders(request, env) {
  const origin = allowedOrigin(request, env);
  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

function json(request, env, body, status = 200) {
  return Response.json(body, { status, headers: corsHeaders(request, env) });
}

function safeError(error, env) {
  const message = error instanceof Error ? error.message : "Subscription service error.";
  if (env.PAYPAL_ENV !== "live") return message;
  if (/Unknown RivalTrace|not provisioned|disabled|Invalid/.test(message)) return message;
  return "The PayPal subscription service could not complete this request.";
}

function normalizeSubscriptionId(value) {
  if (typeof value !== "string" || !/^I-[A-Z0-9]{6,40}$/.test(value)) throw new Error("Invalid PayPal subscription ID.");
  return value;
}

function base64UrlEncode(value) {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function entitlementKey(env, usage) {
  if (!env.ENTITLEMENT_SIGNING_SECRET || env.ENTITLEMENT_SIGNING_SECRET.length < 32) throw new Error("Subscription signing is not configured.");
  return crypto.subtle.importKey("raw", encoder.encode(env.ENTITLEMENT_SIGNING_SECRET), { name: "HMAC", hash: "SHA-256" }, false, usage);
}

async function issueEntitlement(env, subscriptionId, planCode) {
  const encoded = base64UrlEncode(JSON.stringify({ subscriptionId, planCode, version: 1 }));
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await entitlementKey(env, ["sign"]), encoder.encode(encoded)));
  return `${encoded}.${base64UrlEncode(signature)}`;
}

async function decodeEntitlement(env, token) {
  if (typeof token !== "string" || token.length > 2048) throw new Error("Invalid subscription token.");
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) throw new Error("Invalid subscription token.");
  const valid = await crypto.subtle.verify("HMAC", await entitlementKey(env, ["verify"]), base64UrlDecode(signature), encoder.encode(encoded));
  if (!valid) throw new Error("Invalid subscription token.");
  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encoded)));
  if (payload.version !== 1 || !PLAN_CODE_PATTERN.test(payload.planCode)) throw new Error("Invalid subscription token.");
  return { subscriptionId: normalizeSubscriptionId(payload.subscriptionId), planCode: payload.planCode };
}

const PLAN_CODE_PATTERN = /^(starter|growth|agency)-(monthly|yearly)$/;

async function accessToken(env) {
  const { apiBase } = resolvePayPalEnvironment(env);
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) throw new Error("PayPal credentials are not configured.");
  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const body = await response.json();
  if (!response.ok || typeof body.access_token !== "string") throw new Error("PayPal authentication failed.");
  return body.access_token;
}

async function paypalRequest(env, path, init = {}) {
  const { apiBase } = resolvePayPalEnvironment(env);
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await accessToken(env)}`, "Content-Type": "application/json", "PayPal-Request-Id": crypto.randomUUID(), ...(init.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = Array.isArray(body.details)
      ? body.details.map((detail) => [detail.issue, detail.field, detail.description].filter(Boolean).join(": ")).filter(Boolean).join("; ")
      : "";
    throw new Error([`PayPal request failed (${response.status})`, body.name, body.message, details].filter(Boolean).join(": "));
  }
  return body;
}

async function createSubscription(request, env) {
  const body = await request.json();
  const plan = getPlan(env, body.planCode);
  const checkoutReference = crypto.randomUUID();
  const siteUrl = (env.PUBLIC_SITE_URL || "https://ainewproducts.github.io/rivaltrace/").replace(/\/$/, "");
  const subscription = await paypalRequest(env, "/v1/billing/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: plan.planId,
      custom_id: `rivaltrace:${plan.code}:${checkoutReference}`,
      application_context: { brand_name: "RivalTrace", locale: "en-US", shipping_preference: "NO_SHIPPING", user_action: "SUBSCRIBE_NOW", return_url: `${siteUrl}/`, cancel_url: `${siteUrl}/` },
    }),
  });
  const subscriptionId = normalizeSubscriptionId(subscription.id);
  const now = Date.now();
  await env.DB.prepare(`INSERT INTO paypal_subscriptions (subscription_id, plan_code, paypal_plan_id, status, checkout_reference, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)`)
    .bind(subscriptionId, plan.code, plan.planId, typeof subscription.status === "string" ? subscription.status : "APPROVAL_PENDING", checkoutReference, now).run();
  return json(request, env, { subscriptionId, status: subscription.status || "APPROVAL_PENDING" }, 201);
}

async function verifySubscription(request, env) {
  const body = await request.json();
  const plan = getPlan(env, body.planCode);
  const subscriptionId = normalizeSubscriptionId(body.subscriptionId);
  const record = await env.DB.prepare("SELECT subscription_id, checkout_reference FROM paypal_subscriptions WHERE subscription_id = ?1 AND plan_code = ?2").bind(subscriptionId, plan.code).first();
  if (!record) throw new Error("Invalid RivalTrace subscription record.");
  const subscription = await paypalRequest(env, `/v1/billing/subscriptions/${subscriptionId}`, { method: "GET" });
  if (subscription.plan_id !== plan.planId || subscription.custom_id !== `rivaltrace:${plan.code}:${record.checkout_reference}`) throw new Error("Invalid PayPal subscription details.");
  if (subscription.status !== "ACTIVE") throw new Error("PayPal has not activated this subscription.");
  const now = Date.now();
  await env.DB.prepare("UPDATE paypal_subscriptions SET status = 'ACTIVE', activated_at = COALESCE(activated_at, ?1), updated_at = ?1 WHERE subscription_id = ?2").bind(now, subscriptionId).run();
  return json(request, env, { status: "ACTIVE", subscriptionId, planCode: plan.code, entitlementToken: await issueEntitlement(env, subscriptionId, plan.code) });
}

async function entitlementStatus(request, env) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  const payload = await decodeEntitlement(env, token);
  const record = await env.DB.prepare("SELECT status FROM paypal_subscriptions WHERE subscription_id = ?1 AND plan_code = ?2").bind(payload.subscriptionId, payload.planCode).first();
  return json(request, env, { active: record?.status === "ACTIVE", subscriptionId: record?.status === "ACTIVE" ? payload.subscriptionId : null, planCode: record?.status === "ACTIVE" ? payload.planCode : null });
}

async function verifyWebhook(request, env, event) {
  if (!env.PAYPAL_WEBHOOK_ID) throw new Error("PayPal webhook verification is not configured.");
  const verification = await paypalRequest(env, "/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: JSON.stringify({
      auth_algo: request.headers.get("PAYPAL-AUTH-ALGO"),
      cert_url: request.headers.get("PAYPAL-CERT-URL"),
      transmission_id: request.headers.get("PAYPAL-TRANSMISSION-ID"),
      transmission_sig: request.headers.get("PAYPAL-TRANSMISSION-SIG"),
      transmission_time: request.headers.get("PAYPAL-TRANSMISSION-TIME"),
      webhook_id: env.PAYPAL_WEBHOOK_ID,
      webhook_event: event,
    }),
  });
  if (verification.verification_status !== "SUCCESS") throw new Error("Invalid PayPal webhook signature.");
}

const EVENT_STATUS = {
  "BILLING.SUBSCRIPTION.ACTIVATED": "ACTIVE",
  "BILLING.SUBSCRIPTION.RE-ACTIVATED": "ACTIVE",
  "BILLING.SUBSCRIPTION.CANCELLED": "CANCELLED",
  "BILLING.SUBSCRIPTION.SUSPENDED": "SUSPENDED",
  "BILLING.SUBSCRIPTION.EXPIRED": "EXPIRED",
};

async function processWebhook(request, env) {
  const event = await request.json();
  if (typeof event.id !== "string" || typeof event.event_type !== "string") throw new Error("Invalid PayPal webhook event.");
  await verifyWebhook(request, env, event);
  const existing = await env.DB.prepare("SELECT event_id FROM paypal_webhook_events WHERE event_id = ?1").bind(event.id).first();
  if (existing) return json(request, env, { received: true, duplicate: true });
  const subscriptionId = typeof event.resource?.id === "string" && event.resource.id.startsWith("I-") ? event.resource.id : null;
  const nextStatus = EVENT_STATUS[event.event_type] || null;
  const now = Date.now();
  const statements = [env.DB.prepare("INSERT INTO paypal_webhook_events (event_id, event_type, subscription_id, received_at) VALUES (?1, ?2, ?3, ?4)").bind(event.id, event.event_type, subscriptionId, now)];
  if (subscriptionId && nextStatus) statements.push(env.DB.prepare("UPDATE paypal_subscriptions SET status = ?1, updated_at = ?2, activated_at = CASE WHEN ?1 = 'ACTIVE' THEN COALESCE(activated_at, ?2) ELSE activated_at END, cancelled_at = CASE WHEN ?1 = 'CANCELLED' THEN ?2 ELSE cancelled_at END WHERE subscription_id = ?3").bind(nextStatus, now, subscriptionId));
  await env.DB.batch(statements);
  return json(request, env, { received: true });
}

async function handle(request, env) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  if (url.pathname !== "/api/paypal/webhook" && !allowedOrigin(request, env)) return json(request, env, { error: "Origin is not allowed." }, 403);
  if (request.method === "GET" && url.pathname === "/api/paypal/config") {
    const resolved = resolvePayPalEnvironment(env);
    if (!env.PAYPAL_CLIENT_ID) throw new Error("PayPal credentials are not configured.");
    return json(request, env, { clientId: env.PAYPAL_CLIENT_ID, environment: resolved.environment, sdkEnvironment: resolved.sdkEnvironment, plans: publicPlans(env) });
  }
  if (request.method === "POST" && url.pathname === "/api/paypal/subscriptions") return createSubscription(request, env);
  if (request.method === "POST" && url.pathname === "/api/paypal/subscriptions/verify") return verifySubscription(request, env);
  if (request.method === "GET" && url.pathname === "/api/paypal/entitlement") return entitlementStatus(request, env);
  if (request.method === "POST" && url.pathname === "/api/paypal/webhook") return processWebhook(request, env);
  return json(request, env, { error: "Not found." }, 404);
}

export default {
  async fetch(request, env) {
    try { return await handle(request, env); }
    catch (error) {
      console.error("RivalTrace payment worker request failed", {
        method: request.method,
        path: new URL(request.url).pathname,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      return json(request, env, { error: safeError(error, env) }, /Invalid|Unknown|not provisioned/.test(error?.message || "") ? 400 : 502);
    }
  },
};
