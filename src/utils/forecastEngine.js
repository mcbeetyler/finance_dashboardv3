// src/utils/forecastEngine.js
// Month-by-month projection engine
// Seeded from live dashboard balances
// Runs three scenarios in parallel: conservative, base, optimistic

// Which strategies are "retirement" (use market rate)
// vs "liquid" (use cash/short rate) vs "other"
const STRATEGY_TYPES = {
  retirement:       "market",
  "house-fund":     "cash",
  "short-term-growth": "market",
  "real-estate":    "none",   // illiquid — no monthly return applied
  crypto:           "market",
  "conversion-buffer": "cash",
  "cash-operational":  "cash",
  "travel-spending":   "cash",
};

// Annual return rates per scenario
const SCENARIOS = {
  conservative: { market: 0.05, cash: 0.035 },
  base:         { market: 0.08, cash: 0.035 },
  optimistic:   { market: 0.11, cash: 0.035 },
};

// Monthly return from annual rate
function monthlyRate(annual) {
  return Math.pow(1 + annual, 1 / 12) - 1;
}

// Add months to a date, returns YYYY-MM string
function addMonths(yearMonth, n) {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Today as YYYY-MM
function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function runForecast({
  holdings,           // live holdings array with nativeAmount + strategyId
  liabilities,        // live liabilities array
  toUSD,              // FX conversion function
  monthlySavings,     // number — total monthly savings to add to liquid
  events,             // array of { id, date (YYYY-MM), amount, bucket, label }
  endYearMonth,       // e.g. "2028-12"
}) {
  const start = currentYearMonth();

  // Seed: calculate starting values per strategy bucket and totals
  const startingAssets = {};
  holdings.forEach((h) => {
    const usd = toUSD(h.nativeAmount, h.currency);
    startingAssets[h.strategyId] = (startingAssets[h.strategyId] || 0) + usd;
  });

  const startingLiabilities = liabilities.reduce(
    (sum, l) => sum + toUSD(l.nativeAmount, l.currency),
    0
  );

  // Build event lookup: month -> array of { amount, bucket }
  const eventsByMonth = {};
  events.forEach((e) => {
    if (!eventsByMonth[e.date]) eventsByMonth[e.date] = [];
    eventsByMonth[e.date].push(e);
  });

  // Run projection for one scenario
  function projectScenario(scenarioKey) {
    const rates = SCENARIOS[scenarioKey];
    const buckets = { ...startingAssets };
    let liabilitiesBalance = startingLiabilities;
    const points = [];

    let current = start;
    while (current <= endYearMonth) {
      // Apply monthly returns per bucket
      Object.keys(buckets).forEach((strategyId) => {
        const type = STRATEGY_TYPES[strategyId] || "cash";
        if (type === "none") return; // real estate — no return applied
        const rate = monthlyRate(rates[type] || rates.cash);
        buckets[strategyId] = (buckets[strategyId] || 0) * (1 + rate);
      });

      // Add monthly savings to house-fund (liquid savings bucket)
      buckets["house-fund"] = (buckets["house-fund"] || 0) + monthlySavings;

      // Apply one-off events this month
      const monthEvents = eventsByMonth[current] || [];
      monthEvents.forEach((ev) => {
        const bucket = ev.bucket || "house-fund";
        buckets[bucket] = (buckets[bucket] || 0) + ev.amount;
      });

      // Calculate totals
      const totalAssets = Object.values(buckets).reduce((s, v) => s + Math.max(v, 0), 0);
      const netWorth = totalAssets - liabilitiesBalance;
      const liquid = (buckets["house-fund"] || 0) +
        (buckets["cash-operational"] || 0) +
        (buckets["conversion-buffer"] || 0) +
        (buckets["travel-spending"] || 0) +
        (buckets["short-term-growth"] || 0) +
        (buckets["crypto"] || 0);
      const retirement = (buckets["retirement"] || 0);

      points.push({
        month: current,
        netWorth: Math.round(netWorth),
        liquid: Math.round(liquid),
        retirement: Math.round(retirement),
        events: monthEvents,
      });

      current = addMonths(current, 1);
    }

    return points;
  }

  return {
    conservative: projectScenario("conservative"),
    base:         projectScenario("base"),
    optimistic:   projectScenario("optimistic"),
    startMonth:   start,
    endMonth:     endYearMonth,
  };
}

// Default events pre-seeded from your spreadsheet patterns
// You can edit/delete these in the UI
export const DEFAULT_EVENTS = [
  {
    id: "e1",
    date: "2026-08",
    amount: 58500,
    bucket: "house-fund",
    label: "Annual bonus",
    type: "bonus",
  },
  {
    id: "e2",
    date: "2027-08",
    amount: 40000,
    bucket: "house-fund",
    label: "Annual bonus",
    type: "bonus",
  },
  {
    id: "e3",
    date: "2028-08",
    amount: 40000,
    bucket: "house-fund",
    label: "Annual bonus",
    type: "bonus",
  },
  {
    id: "e4",
    date: "2026-12",
    amount: 160000,
    bucket: "short-term-growth",
    label: "LTI vest",
    type: "lti",
  },
  {
    id: "e5",
    date: "2027-12",
    amount: 160000,
    bucket: "short-term-growth",
    label: "LTI vest",
    type: "lti",
  },
  {
    id: "e6",
    date: "2026-07",
    amount: -25000,
    bucket: "house-fund",
    label: "Moving / repatriation costs",
    type: "moving",
  },
  {
    id: "e7",
    date: "2026-09",
    amount: 180000,
    bucket: "real-estate",
    label: "Crop ground purchase closes",
    type: "real-estate",
  },
];
