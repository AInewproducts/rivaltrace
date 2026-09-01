import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUrl, planQuote, changes, plans } from '../src/model.js';
import { diffSnapshots, getSnapshotRecord, loadSnapshotStore, saveCapture } from '../src/snapshots.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test('normalizes a public URL without contacting it', () => {
  assert.equal(normalizeUrl('summerfridays.com'), 'https://summerfridays.com/');
  assert.equal(normalizeUrl(' https://example.com/products/serum '), 'https://example.com/products/serum');
});
test('rejects invalid inputs and obvious local/non-web targets', () => {
  for (const value of ['', 'hello', 'a b.com', 'localhost', 'http://127.0.0.1', 'http://10.0.0.1', 'http://[::1]', 'ftp://example.com', 'https://user:pass@example.com', 'javascript:alert(1)', 'test.local', 'https://-test.com']) assert.equal(normalizeUrl(value), null, value);
});
test('yearly quotes retain the selected discount and period', () => {
  assert.deepEqual(planQuote('Growth', true), {monthly: 63.2, total: 758.4});
  assert.deepEqual(planQuote('Growth', false), {monthly: 79, total: 79});
  for (const name of Object.keys(plans)) assert.equal(planQuote(name, true).total, Number((plans[name].price * 12 * .8).toFixed(2)));
});
test('every sample row has unique evidence and matching product art', () => {
  assert.equal(new Set(changes.map(x => x.id)).size, 3);
  for (const item of changes) { assert.ok(item.before); assert.ok(item.after); assert.ok(item.checks.length); assert.ok(item.image.startsWith('/assets/beauty-')); }
});
test('public acquisition routes have multi-page entry files', async () => {
  for (const path of [
    '../tools/competitor-snapshot/index.html',
    '../beauty-brands/summer-fridays/index.html',
    '../reports/summer-fridays-competitor-snapshot/index.html',
    '../guides/how-to-track-beauty-competitors/index.html',
  ]) {
    const html = await import('node:fs/promises').then(({ readFile }) => readFile(new URL(path, import.meta.url), 'utf8'));
    assert.match(html, /index, follow/);
    assert.match(html, /<meta name="description"/);
  }
});

test('first manual capture creates a baseline and persists it locally', () => {
  const storage = memoryStorage();
  const result = saveCapture({ url: 'https://example.com/products/serum', pageLabel: 'Barrier Serum · 30ml', price: '48', currency: 'USD', availability: 'In stock', promotion: '' , capturedAt: '2026-09-01T01:00:00.000Z' }, storage);
  assert.equal(result.status, 'baseline');
  assert.equal(result.changes.length, 0);
  assert.equal(result.captureCount, 1);
  assert.equal(getSnapshotRecord('https://example.com/products/serum/', storage).latest.price, 48);
});

test('later manual captures report only comparable observable differences', () => {
  const storage = memoryStorage();
  const common = { url: 'https://example.com/products/serum', pageLabel: 'Barrier Serum · 30ml', currency: 'USD' };
  saveCapture({ ...common, price: '48', availability: 'In stock', promotion: '', capturedAt: '2026-09-01T01:00:00.000Z' }, storage);
  const unchanged = saveCapture({ ...common, price: '48', availability: 'In stock', promotion: '', capturedAt: '2026-09-02T01:00:00.000Z' }, storage);
  assert.equal(unchanged.status, 'unchanged');
  const changed = saveCapture({ ...common, price: '52', availability: 'Out of stock', promotion: 'Free mini', capturedAt: '2026-09-03T01:00:00.000Z' }, storage);
  assert.equal(changed.status, 'changed');
  assert.deepEqual(changed.changes.map((item) => item.field), ['price', 'availability', 'promotion']);
  assert.equal(changed.changes[0].percent, 8.33);
  assert.equal(changed.captureCount, 3);
});

test('manual captures reject a changed product label for the same URL', () => {
  const storage = memoryStorage();
  saveCapture({ url: 'https://example.com/p/serum', pageLabel: 'Serum · 30ml', price: '30' }, storage);
  assert.throws(() => saveCapture({ url: 'https://example.com/p/serum', pageLabel: 'Serum · 50ml', price: '45' }, storage), /same page label/);
});

test('snapshot comparison handles blank values, currency changes and corrupt storage', () => {
  const changes = diffSnapshots(
    { price: null, currency: 'USD', availability: 'Not shown', promotion: '' },
    { price: 42, currency: 'GBP', availability: 'In stock', promotion: '' },
  );
  assert.deepEqual(changes.map((item) => item.field), ['currency', 'price', 'availability']);
  assert.equal('percent' in changes[1], false);
  assert.deepEqual(loadSnapshotStore(memoryStorage({ rivaltrace_manual_snapshots_v1: '{broken' })), {});
});
