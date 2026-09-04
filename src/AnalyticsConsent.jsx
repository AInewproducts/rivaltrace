import { useEffect, useState } from "react";
import { analyticsAllowedByBrowser, readAnalyticsConsent, saveAnalyticsConsent, startAnalytics, stopAnalytics } from "./analytics.js";
import "./analytics.css";

export function AnalyticsConsent() {
  const [decision, setDecision] = useState(readAnalyticsConsent);
  const [open, setOpen] = useState(() => !readAnalyticsConsent());
  const browserAllowsAnalytics = analyticsAllowedByBrowser();

  useEffect(() => {
    if (decision === "granted") startAnalytics();
  }, [decision]);

  if (!browserAllowsAnalytics) return null;

  const choose = (value) => {
    saveAnalyticsConsent(value);
    setDecision(value);
    setOpen(false);
    if (value === "granted") startAnalytics();
    else stopAnalytics();
  };

  if (!open) {
    return <button className="analytics-preferences" type="button" onClick={() => setOpen(true)}>Privacy choices</button>;
  }

  return <aside className="analytics-consent" aria-label="Analytics privacy choices" role="dialog" aria-live="polite">
    <div>
      <strong>Help improve RivalTrace?</strong>
      <p>Optional analytics tells us which pages and features are useful. We never send competitor URLs, capture fields, notes, or payment details.</p>
      <a href={`${import.meta.env.BASE_URL}privacy/`}>Privacy & analytics</a>
    </div>
    <div className="analytics-actions">
      <button type="button" className="analytics-decline" onClick={() => choose("denied")}>No thanks</button>
      <button type="button" className="analytics-accept" onClick={() => choose("granted")}>Allow analytics</button>
    </div>
  </aside>;
}
