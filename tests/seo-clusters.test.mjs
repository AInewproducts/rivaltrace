import assert from "node:assert/strict";
import test from "node:test";
import { libraryEntries } from "../src/seoLibrary.js";
import { researchTools } from "../src/researchToolCatalog.js";
import { commercialClusters, commercialTargetRoutes, homeFaq, toolForLibraryEntry } from "../src/seoContent.js";

test("commercial SEO layer has 10–15 distinct target routes", () => {
  assert.ok(commercialTargetRoutes.length >= 10 && commercialTargetRoutes.length <= 15);
  assert.equal(new Set(commercialTargetRoutes).size, commercialTargetRoutes.length);
  assert.equal(commercialTargetRoutes.includes("pricing"), true);
  assert.equal(commercialTargetRoutes.includes("home"), true);
});

test("commercial clusters expose useful internal links", () => {
  const supportingRoutes = new Set(["methodology"]);
  assert.equal(commercialClusters.length, 4);
  for (const cluster of commercialClusters) {
    assert.ok(cluster.title.length > 10);
    assert.ok(cluster.body.length > 80);
    assert.ok(cluster.links.length >= 3);
    for (const [route, label] of cluster.links) {
      assert.ok(commercialTargetRoutes.includes(route) || supportingRoutes.has(route), `${route} is not a known commercial or supporting route`);
      assert.ok(label.length > 12);
    }
  }
});

test("FAQ and calculator SEO copy remains complete", () => {
  assert.ok(homeFaq.length >= 4);
  for (const tool of researchTools) {
    assert.ok(tool.focusQuery.length > 10);
    assert.ok(tool.faq.length >= 2);
    assert.equal(new Set(tool.faq.map(([question]) => question)).size, tool.faq.length);
  }
});

test("every library article resolves to a valid free tool route", () => {
  const allowed = new Set(["snapshot", ...researchTools.map((tool) => tool.route)]);
  for (const entry of libraryEntries) {
    const tool = toolForLibraryEntry(entry);
    assert.ok(allowed.has(tool.route), `${entry.route} resolves to invalid tool ${tool.route}`);
    assert.match(tool.path, /^\/tools\/.+\/$/);
  }
});
