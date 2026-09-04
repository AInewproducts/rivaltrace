CREATE TABLE IF NOT EXISTS paypal_subscriptions (
  subscription_id TEXT PRIMARY KEY,
  plan_code TEXT NOT NULL,
  paypal_plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  checkout_reference TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  activated_at INTEGER,
  cancelled_at INTEGER
);

CREATE INDEX IF NOT EXISTS paypal_subscriptions_status_idx
  ON paypal_subscriptions(status);

CREATE TABLE IF NOT EXISTS paypal_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  subscription_id TEXT,
  received_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS paypal_webhook_subscription_idx
  ON paypal_webhook_events(subscription_id);
