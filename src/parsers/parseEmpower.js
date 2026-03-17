// src/parsers/parseEmpower.js
// Parses Empower copy-paste CSV (manually copied from Empower dashboard).
//
// Row pattern (repeating):
//   [Institution, Type, Amount]   ← account data row (col1 non-empty, col2 has $)
//   [Subtitle,   ,    Timestamp]  ← account description row
//
// Institution is matched exactly; subtitle is matched as substring.
// More specific entries (Vanguard - 1) must appear before less specific (Vanguard).

const ACCOUNT_MAP = [
  // ── Vanguard (institution exact-match required to disambiguate) ────────
  { institution: "vanguard - 1", subtitle: "cargill employee",  id: "h9",  label: "Vanguard - 1 Cargill Employee Retirement (1080)" },
  { institution: "vanguard - 1", subtitle: "cargill partnership", id: "h10", label: "Vanguard - 1 Cargill Partnership Plan (1080)" },
  { institution: "vanguard - 1", subtitle: "bonus deferral",    id: "h8",  label: "Vanguard — Bonus Deferral Plan" },
  { institution: "vanguard",     subtitle: "cargill employee",  id: "h6",  label: "Vanguard — Cargill Employee Retirement" },
  { institution: "vanguard",     subtitle: "cargill partnership", id: "h7", label: "Vanguard — Cargill Partnership Plan" },

  // ── Other holdings (subtitle match only) ──────────────────────────────
  { subtitle: "total checking",      id: "h38", label: "Chase checking" },
  { subtitle: "draftkings",          id: "h39", label: "DraftKings etc" },
  { subtitle: "goppert",             id: "h40", label: "Goppert checking" },
  { subtitle: "bayer corporation",   id: "h1",  label: "Fidelity — Bayer 401k" },
  { subtitle: "kids 529",            id: "h2",  label: "Kids 529" },
  { subtitle: "mindy schwab",        id: "h3",  label: "Mindy Schwab" },
  { subtitle: "optum hsa",           id: "h4",  label: "Optum HSA" },
  { subtitle: "trust schwab",        id: "h5",  label: "Trust Schwab" },
  { subtitle: "tyler schwab",        id: "h16", label: "Tyler Schwab" },
  { subtitle: "gemini",              id: "h36", label: "Gemini crypto" },

  // ── Liabilities ────────────────────────────────────────────────────────
  { subtitle: "platinum card",       id: "l1",  label: "Amex Platinum",                isLiability: true },
  { subtitle: "ending in 9162",      id: "l2",  label: "Chase credit card (9162)",     isLiability: true },
  { subtitle: "ending in 9216",      id: "l3",  label: "Chase credit card (9216)",     isLiability: true },
  { subtitle: "investment property", id: "l4",  label: "Investment property mortgage", isLiability: true },

  // ── Explicitly excluded ────────────────────────────────────────────────
  { subtitle: "interactive brokers", id: null, label: "IBKR — handled via CSV" },
  { subtitle: "ubs",                 id: null, label: "UBS — manual CHF entry" },
  { subtitle: "2222 w 73rd",         id: null, label: "Home — manual entry" },
  { subtitle: "robinhood",           id: null, label: "Robinhood — closed" },
];

function parseAmount(str) {
  if (!str) return null;
  const s = str.replace(/[$,\s]/g, "");
  // Parentheses = negative: ($1,234.56) → -1234.56
  if (s.startsWith("(") && s.endsWith(")")) {
    return -parseFloat(s.slice(1, -1));
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function parseCSVLine(line) {
  const cols = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === "," && !inQuotes) {
      cols.push(cur.trim());
      cur = "";
    } else {
      cur += line[i];
    }
  }
  cols.push(cur.trim());
  return cols;
}

export async function parseEmpower(file) {
  const raw = await file.text();
  // Strip UTF-8 BOM if present
  const text = raw.replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).map(parseCSVLine);

  const matched = {};
  const excluded = [];
  const unmatched = [];

  for (let i = 0; i < lines.length - 1; i++) {
    const [col0, col1, col2] = lines[i];

    // Account row: has a type in col1 and a dollar amount in col2
    if (!col1 || !col2 || !col2.includes("$")) continue;

    const amount = parseAmount(col2);
    if (amount === null) continue;

    const institution = col0.toLowerCase().trim();
    const subtitle = (lines[i + 1]?.[0] ?? "").toLowerCase().trim();

    let found = false;
    for (const acct of ACCOUNT_MAP) {
      if (acct.institution && institution !== acct.institution) continue;
      if (!subtitle.includes(acct.subtitle)) continue;

      found = true;
      if (acct.id === null) {
        excluded.push(acct.label);
      } else if (!matched[acct.id]) {
        matched[acct.id] = {
          amount: acct.isLiability ? Math.abs(amount) : amount,
          label: acct.label,
          source: "Empower CSV",
          isLiability: !!acct.isLiability,
        };
      }
      break;
    }

    if (!found) {
      unmatched.push({ institution: col0, subtitle: lines[i + 1]?.[0] ?? "", amount });
    }
  }

  return { matched, excluded, unmatched };
}
