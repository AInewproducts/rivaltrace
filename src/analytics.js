export const ANALYTICS_MEASUREMENT_ID = "G-SP4RSW5E92";
export const ANALYTICS_CONSENT_KEY = "rivaltrace_analytics_consent";
export const ANALYTICS_INTERNAL_KEY = "rivaltrace_internal_traffic";

const ROUTE_CHANGE_EVENT = "rivaltrace:route-change";
let analyticsStarted = false;
let trackingInstalled = false;

function readInternalTrafficPreference() {
  try {
    const marker = new URLSearchParams(window.location.search).get("rt_internal");
    if (marker === "1") window.localStorage.setItem(ANALYTICS_INTERNAL_KEY, "1");
    if (marker === "0") window.localStorage.removeItem(ANALYTICS_INTERNAL_KEY);
    return window.localStorage.getItem(ANALYTICS_INTERNAL_KEY) === "1";
  } catch {
    return false;
  }
}

export function isInternalTraffic() {
  return readInternalTrafficPreference();
}

export function analyticsAllowedByBrowser() {
  return navigator.doNotTrack !== "1" && window.doNotTrack !== "1" && !isInternalTraffic();
}

export function readAnalyticsConsent() {
  try {
    return window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
  } catch {
    return null;
  }
}

export function saveAnalyticsConsent(value) {
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  } catch {
    // A blocked localStorage should not prevent the site from working.
  }
}

function currentPagePath() {
  return `${window.location.pathname}${window.location.hash || ""}`;
}

function currentSafeLocation() {
  return `${window.location.origin}${currentPagePath()}`;
}

export function trackEvent(name, parameters = {}) {
  if (!analyticsStarted || typeof window.gtag !== "function") return;
  window.gtag("event", name, parameters);
}

export function trackPageView() {
  trackEvent("page_view", {
    page_title: document.title,
    page_location: currentSafeLocation(),
    page_path: currentPagePath(),
  });
}

function identifyInteraction(element) {
  const label = (element.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
  const href = element.getAttribute("href") || "";

  if (label.includes("open demo") || href.endsWith("#app")) return "demo_open";
  if (label.includes("choose starter")) return "plan_starter_select";
  if (label.includes("choose growth")) return "plan_growth_select";
  if (label.includes("checkout") || href.includes("#checkout")) return "checkout_open";
  if (label.includes("sample report") || label.includes("sample evidence") || label.includes("cited snapshot") || label.includes("current snapshot")) return "sample_evidence_open";
  if (label.includes("free snapshot") || label.includes("free baseline") || label.includes("prepare baseline") || label.includes("start your snapshot") || label.includes("create a snapshot") || label.includes("competitor url")) return "free_snapshot_cta";
  if (label.includes("brand example") || label.includes("summer fridays")) return "brand_example_open";
  if (label.includes("methodology")) return "methodology_open";
  if (label.includes("guide") || label.includes("monitoring basics")) return "guide_open";
  return null;
}

function installRouteTracking() {
  if (trackingInstalled) return;
  trackingInstalled = true;

  for (const method of ["pushState", "replaceState"]) {
    const original = window.history[method];
    window.history[method] = function trackedHistoryMethod(...args) {
      const result = original.apply(this, args);
      window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
      return result;
    };
  }

  const onRouteChange = () => window.setTimeout(trackPageView, 0);
  window.addEventListener("popstate", onRouteChange);
  window.addEventListener("hashchange", onRouteChange);
  window.addEventListener(ROUTE_CHANGE_EVENT, onRouteChange);

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.classList.contains("trace-form")) trackEvent("snapshot_prepare_attempt");
    if (form.classList.contains("manual-capture-form")) trackEvent("snapshot_capture_attempt");
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const element = event.target.closest("a, button");
    if (!element || element.closest(".analytics-consent")) return;
    const interaction = identifyInteraction(element);
    if (interaction) trackEvent("cta_click", { interaction });
  });
}

export function startAnalytics() {
  if (!analyticsAllowedByBrowser() || readAnalyticsConsent() !== "granted") return;

  window[`ga-disable-${ANALYTICS_MEASUREMENT_ID}`] = false;
  if (!window.dataLayer) window.dataLayer = [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }

  if (!document.querySelector(`script[data-rivaltrace-ga="${ANALYTICS_MEASUREMENT_ID}"]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_MEASUREMENT_ID}`;
    script.dataset.rivaltraceGa = ANALYTICS_MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  if (!analyticsStarted) {
    analyticsStarted = true;
    window.gtag("js", new Date());
    window.gtag("config", ANALYTICS_MEASUREMENT_ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      anonymize_ip: true,
      page_location: currentSafeLocation(),
    });
    installRouteTracking();
    trackPageView();
  }
}

export function stopAnalytics() {
  analyticsStarted = false;
  window[`ga-disable-${ANALYTICS_MEASUREMENT_ID}`] = true;
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (name === "_ga" || name?.startsWith("_ga_")) {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    }
  }
}
