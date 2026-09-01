export const SNAPSHOT_STORAGE_KEY = "rivaltrace_manual_snapshots_v1";

export function snapshotKey(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeManualCapture(input) {
  const priceText = String(input.price ?? "").trim();
  const price = priceText === "" ? null : Number(priceText);
  if (price !== null && (!Number.isFinite(price) || price < 0)) throw new Error("Enter a valid listed price, or leave it blank.");

  const url = snapshotKey(input.url);
  if (!url) throw new Error("Enter a valid public page URL first.");

  const pageLabel = String(input.pageLabel ?? "").trim();
  if (!pageLabel) throw new Error("Add a page or product label so future captures can be compared safely.");

  return {
    url,
    pageLabel,
    price,
    currency: String(input.currency || "USD").trim().toUpperCase(),
    availability: String(input.availability || "Not shown").trim(),
    promotion: String(input.promotion ?? "").trim(),
    notes: String(input.notes ?? "").trim(),
    capturedAt: input.capturedAt || new Date().toISOString(),
  };
}

export function diffSnapshots(before, after) {
  const changes = [];
  if (before.currency !== after.currency) changes.push({ field: "currency", before: before.currency, after: after.currency });
  if (before.price !== after.price) {
    const change = { field: "price", before: before.price, after: after.price };
    if (before.currency === after.currency && before.price !== null && after.price !== null && before.price !== 0) {
      change.percent = Number((((after.price - before.price) / before.price) * 100).toFixed(2));
    }
    changes.push(change);
  }
  if (before.availability !== after.availability) changes.push({ field: "availability", before: before.availability, after: after.availability });
  if (before.promotion !== after.promotion) changes.push({ field: "promotion", before: before.promotion, after: after.promotion });
  return changes;
}

export function loadSnapshotStore(storage = globalThis.localStorage) {
  if (!storage) return {};
  try {
    const parsed = JSON.parse(storage.getItem(SNAPSHOT_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function getSnapshotRecord(url, storage = globalThis.localStorage) {
  const key = snapshotKey(url);
  return key ? loadSnapshotStore(storage)[key] || null : null;
}

export function saveCapture(input, storage = globalThis.localStorage) {
  if (!storage) throw new Error("Browser storage is unavailable on this device.");
  const capture = normalizeManualCapture(input);
  const store = loadSnapshotStore(storage);
  const previousRecord = store[capture.url];
  const before = previousRecord?.latest || null;

  if (before && before.pageLabel.toLocaleLowerCase() !== capture.pageLabel.toLocaleLowerCase()) {
    throw new Error(`Use the same page label as the saved baseline: “${before.pageLabel}”.`);
  }

  const changes = before ? diffSnapshots(before, capture) : [];
  const history = [...(previousRecord?.history || []), capture].slice(-20);
  store[capture.url] = {
    baseline: previousRecord?.baseline || capture,
    latest: capture,
    history,
  };
  storage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(store));

  return {
    status: before ? (changes.length ? "changed" : "unchanged") : "baseline",
    before,
    after: capture,
    changes,
    captureCount: history.length,
  };
}
