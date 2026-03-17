// src/parsers/parseEmpower.js
// Parses Empower dashboard PDF export.
// Uses pdfjs x/y coordinates to group text into rows, then combines each
// institution-name row with its subtitle row for unambiguous matching.
// This correctly distinguishes duplicates like:
//   "Vanguard / Cargill Employee Retirement"  (h6)
//   "Vanguard - 1 / Cargill Employee Retirement"  (h9)

import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// Maps combined (institution + subtitle) text to holding/liability IDs.
// More specific strings must come before less specific ones.
// isLiability: true → amount stored as Math.abs (Empower shows negatives)
const ACCOUNT_MAP = [
  // ── Holdings ────────────────────────────────────────────────────────────
  { match: "bayer corporation",                        id: "h1",  label: "Fidelity — Bayer 401k" },
  { match: "kids 529",                                 id: "h2",  label: "Kids 529" },
  { match: "mindy schwab",                             id: "h3",  label: "Mindy Schwab" },
  { match: "optum hsa",                                id: "h4",  label: "Optum HSA" },
  { match: "trust schwab",                             id: "h5",  label: "Trust Schwab" },
  // Vanguard -1 (1080 accounts) must appear BEFORE plain Vanguard to avoid
  // "vanguard cargill..." matching the "vanguard - 1 cargill..." rows.
  { match: "vanguard - 1 cargill employee retirement", id: "h9",  label: "Vanguard - 1 Cargill Employee Retirement (1080)" },
  { match: "vanguard - 1 cargill partnership plan",    id: "h10", label: "Vanguard - 1 Cargill Partnership Plan (1080)" },
  { match: "vanguard cargill employee retirement",     id: "h6",  label: "Vanguard — Cargill Employee Retirement" },
  { match: "vanguard cargill partnership plan",        id: "h7",  label: "Vanguard — Cargill Partnership Plan" },
  { match: "bonus deferral",                           id: "h8",  label: "Vanguard — Bonus Deferral Plan" },
  { match: "tyler schwab",                             id: "h16", label: "Tyler Schwab" },
  { match: "gemini",                                   id: "h36", label: "Gemini crypto" },
  { match: "total checking",                           id: "h38", label: "Chase checking" },
  { match: "draftkings",                               id: "h39", label: "DraftKings etc" },
  { match: "goppert",                                  id: "h40", label: "Goppert checking" },

  // ── Liabilities ─────────────────────────────────────────────────────────
  { match: "platinum card",       id: "l1", label: "Amex Platinum",                isLiability: true },
  { match: "ending in 9162",      id: "l2", label: "Chase credit card (9162)",     isLiability: true },
  { match: "ending in 9216",      id: "l3", label: "Chase credit card (9216)",     isLiability: true },
  { match: "investment property", id: "l4", label: "Investment property mortgage", isLiability: true },

  // ── Explicitly excluded ─────────────────────────────────────────────────
  { match: "interactive brokers", id: null, label: "IBKR — handled via CSV" },
  { match: "ubs",                 id: null, label: "UBS — manual CHF entry" },
  { match: "2222 w 73rd",         id: null, label: "Home — manual entry" },
];

export async function parseEmpower(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // ── 1. Extract all text items with (x, y) positions ───────────────────
  const allItems = [];
  let pageYOffset = 0;

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    content.items.forEach((item) => {
      const str = item.str.trim();
      if (!str) return;
      allItems.push({
        str,
        x: item.transform[4],
        // PDF y is from bottom; flip so y increases top-to-bottom
        y: pageYOffset + (viewport.height - item.transform[5]),
      });
    });

    pageYOffset += viewport.height + 20;
  }

  // ── 2. Group items into rows (same y ± 5pt) ───────────────────────────
  const rowBuckets = [];
  allItems.forEach((item) => {
    const existing = rowBuckets.find((r) => Math.abs(r.y - item.y) <= 5);
    if (existing) {
      existing.items.push(item);
    } else {
      rowBuckets.push({ y: item.y, items: [item] });
    }
  });
  rowBuckets.sort((a, b) => a.y - b.y);

  // ── 3. Process each row: extract label text and dollar amount ──────────
  const rows = rowBuckets.map((bucket) => {
    const sorted = [...bucket.items].sort((a, b) => a.x - b.x);

    // Dollar amount (may be negative for liabilities)
    const amountMatch = sorted
      .map((i) => i.str)
      .join(" ")
      .match(/-?\$[\d,]+(?:\.\d{2})?/);

    // Label: everything that isn't a dollar amount, timestamp, or date
    const label = sorted
      .filter(
        (i) =>
          !i.str.match(/^-?\$[\d,]+(?:\.\d{2})?$/) &&
          !i.str.match(/^\d{1,2}:\d{2}$/) &&
          !i.str.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) &&
          i.str.toLowerCase() !== "manual entry"
      )
      .map((i) => i.str)
      .join(" ");

    return {
      label,
      amount: amountMatch
        ? parseFloat(amountMatch[0].replace(/[$,]/g, ""))
        : null,
    };
  });

  // ── 4. Match rows to ACCOUNT_MAP ──────────────────────────────────────
  console.log("[Empower] rows extracted:", rows.length);
  console.log("[Empower] rows with amounts:", rows.filter(r => r.amount !== null).length);
  console.log("[Empower] first 40 rows:", rows.slice(0, 40));
  const result = extractBalances(rows);
  console.log("[Empower] matched:", result.matched);
  console.log("[Empower] excluded:", result.excluded);
  return result;
}

function extractBalances(rows) {
  const matched = {};
  const excluded = [];
  const unmatched = [];

  for (let i = 0; i < rows.length; i++) {
    if (rows[i].amount === null) continue;

    // Combine the institution-name row with the subtitle row below it.
    // This is what distinguishes "Vanguard" vs "Vanguard - 1" entries.
    const subtitleLabel = rows[i + 1]?.label ?? "";
    const combined = `${rows[i].label} ${subtitleLabel}`
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    for (const account of ACCOUNT_MAP) {
      if (!combined.includes(account.match.toLowerCase())) continue;

      if (account.id === null) {
        excluded.push(account.label);
        break;
      }

      // First match wins — don't overwrite if already found
      if (!matched[account.id]) {
        matched[account.id] = {
          amount: account.isLiability
            ? Math.abs(rows[i].amount)
            : rows[i].amount,
          label: account.label,
          source: "Empower PDF",
          isLiability: !!account.isLiability,
        };
      }
      break;
    }
  }

  return { matched, unmatched, excluded };
}
