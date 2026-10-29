export const homeFaq = [
  ["What does RivalTrace monitor?", "The free snapshot lets you record publicly visible price, availability, and promotional wording, then compare a later manual capture on the same device."],
  ["Will my first scan show historical changes?", "No. Your first capture establishes a baseline. A real change can only be shown after a later comparable capture. The sample dashboard reports remain clearly labeled illustrations."],
  ["Does this version use AI or third-party data APIs?", "No. The snapshot tool stores your entries in this browser and compares them with rules. It does not fetch the competitor page, call an external API, or sync to an account."],
  ["Can I subscribe or start background monitoring here?", "You can start a real automatically renewing PayPal subscription. The current monitoring workflow remains manual and local to this browser; background monitoring and account sync are not included yet."],
];

export const commercialClusters = [
  {
    eyebrow: "Monitor competitor pages",
    title: "Build a beauty competitor baseline",
    body: "Start with one exact product, collection, or promotion page. Preserve the public URL, market, selected variant, purchase mode, and capture time before you compare anything.",
    links: [
      ["snapshot", "Open the free competitor snapshot"],
      ["guide/monitoring", "Read the monitoring workflow"],
      ["methodology", "Review the evidence methodology"],
    ],
  },
  {
    eyebrow: "Analyze beauty pricing",
    title: "Compare listed prices without losing context",
    body: "Calculate a price movement or normalize liquid pack sizes only after confirming that the offers use the same currency, market, variant, and purchase mode.",
    links: [
      ["calculator/beauty-price-change-calculator", "Calculate a listed-price change"],
      ["calculator/skincare-price-per-ml-calculator", "Compare skincare price per ml"],
      ["guide/price-template", "Download the price tracking template"],
    ],
  },
  {
    eyebrow: "Check offers and thresholds",
    title: "Rebuild the public offer arithmetic",
    body: "Keep bundle contents, promotion eligibility, discount order, shipping market, and threshold rules beside every calculation. A headline is not a complete offer.",
    links: [
      ["calculator/beauty-bundle-savings-calculator", "Check listed bundle savings"],
      ["calculator/beauty-promotion-price-calculator", "Model promotion arithmetic"],
      ["calculator/free-shipping-threshold-calculator", "Check a shipping threshold"],
    ],
  },
  {
    eyebrow: "Report what changed",
    title: "Turn observations into a decision brief",
    body: "Use source-linked before-and-after evidence, keep alternative explanations visible, and finish with a decision owner and next check instead of an unsupported story.",
    links: [
      ["public-report/summer-fridays", "Inspect a cited beauty snapshot"],
      ["library/worksheets/weekly-brief-template", "Copy the weekly brief template"],
      ["library/guides/competitor-watchlist", "Choose a focused watchlist"],
    ],
  },
];

const libraryToolRules = [
  { terms: ["unit price", "per ml", "pack-size", "fill size"], route: "calculator/skincare-price-per-ml-calculator", path: "/tools/skincare-price-per-ml-calculator/", title: "Compare skincare price per ml" },
  { terms: ["bundle"], route: "calculator/beauty-bundle-savings-calculator", path: "/tools/beauty-bundle-savings-calculator/", title: "Check listed bundle savings" },
  { terms: ["shipping threshold", "free-shipping", "shipping policy"], route: "calculator/free-shipping-threshold-calculator", path: "/tools/free-shipping-threshold-calculator/", title: "Calculate a free-shipping threshold" },
  { terms: ["promotion", "coupon", "discount", "offer eligibility", "gift with purchase"], route: "calculator/beauty-promotion-price-calculator", path: "/tools/beauty-promotion-price-calculator/", title: "Model promotion arithmetic" },
  { terms: ["price", "pricing"], route: "calculator/beauty-price-change-calculator", path: "/tools/beauty-price-change-calculator/", title: "Calculate a listed-price change" },
];

export function toolForLibraryEntry(entry) {
  const searchable = `${entry.title} ${entry.summary}`.toLowerCase();
  return libraryToolRules.find((rule) => rule.terms.some((term) => searchable.includes(term))) || {
    route: "snapshot",
    path: "/tools/competitor-snapshot/",
    title: "Create a manual competitor baseline",
  };
}

export const commercialTargetRoutes = [
  "home",
  "snapshot",
  "guide/monitoring",
  "guide/price-template",
  "toolbox",
  "calculator/beauty-price-change-calculator",
  "calculator/skincare-price-per-ml-calculator",
  "calculator/beauty-bundle-savings-calculator",
  "calculator/beauty-promotion-price-calculator",
  "calculator/free-shipping-threshold-calculator",
  "public-report/summer-fridays",
  "library/worksheets/weekly-brief-template",
  "library/guides/competitor-watchlist",
  "pricing",
];
