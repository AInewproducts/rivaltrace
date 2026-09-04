CREATE TABLE paypal_subscriptions (
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

CREATE INDEX idx_paypal_subscriptions_status
ON paypal_subscriptions(status);

CREATE TABLE paypal_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  subscription_id TEXT,
  received_at INTEGER NOT NULL
);

CREATE INDEX idx_paypal_webhook_events_subscription
ON paypal_webhook_events(subscription_id);
