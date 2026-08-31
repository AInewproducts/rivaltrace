import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUrl, planQuote, changes, plans } from '../src/model.js';

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
