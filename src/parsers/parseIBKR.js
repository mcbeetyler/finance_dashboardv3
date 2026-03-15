// src/parsers/parseIBKR.js
// Parses IBKR Activity Statement CSV
// Maps known tickers to holding IDs defined in initialData.js
// Returns matched holdings and any unrecognized tickers for manual review

// Maps IBKR ticker symbols to holding IDs in initialData.js
const TICKER_TO_HOLDING_ID = {
  SGOV: "h4",
  MINT: "h5",
  TBUX: "h6",
  SCHD: "h8",
  VYM:  "h9",
  VYMI: "h10",
  ASML: "h11",
  ITA:  "h12",
  INTC: "h13",
  PLTR: "h14",
  AMD:  "h15",
  NVDA: "h16",
  TSLA: "h17",
  UNH:  "h18",
  UPS:  "h19",
  BBAI: "h20",
  SMCI: "h21",
  KTOS: "h22",
  AI:   "h23",
};

// Cash row in IBKR CSV appears as "USD" in the forex/cash section
const CASH_HOLDING_ID = "h7";

export function parseIBKR(csvText) {
  const lines = csvText.split("\n").map((l) => l.trim());
  const matched = {};   // holdingId -> { amount, ticker }
  const unmatched = []; // tickers we don't recognize
  let cashAmount = 0;

  // Find the Open Positions section and extract stock values
  let inOpenPositions = false;
  for (const line of lines) {
    const cols = parseCSVLine(line);
    if (!cols.length) continue;

    // Detect section header
    if (cols[0] === "Open Positions" && cols[1] === "Header") {
      inOpenPositions = true;
      continue;
    }

    // Stop at next section
    if (inOpenPositions && cols[0] !== "Open Positions") {
      inOpenPositions = false;
    }

    if (inOpenPositions && cols[1] === "Data" && cols[2] === "Summary") {
      const assetClass = cols[3]; // "Stocks", "Equity and Index Options"
      const ticker = cols[5];
      const valueStr = cols[11];

      if (assetClass === "Stocks" && ticker && valueStr) {
        const value = parseFloat(valueStr.replace(/,/g, ""));
        if (isNaN(value)) continue;

        if (TICKER_TO_HOLDING_ID[ticker]) {
          matched[TICKER_TO_HOLDING_ID[ticker]] = {
            amount: value,
            ticker,
            source: "IBKR CSV",
          };
        } else {
          // Skip options and known non-equity rows
          if (!ticker.includes(" ")) {
            unmatched.push({ ticker, value });
          }
        }
      }
    }
  }

  // Extract cash balance from Net Asset Value section
  for (const line of lines) {
    const cols = parseCSVLine(line);
    if (
      cols[0] === "Net Asset Value" &&
      cols[1] === "Data" &&
      cols[2] === "Cash "
    ) {
      const val = parseFloat(cols[4]?.replace(/,/g, "") ?? "0");
      if (!isNaN(val)) cashAmount = val;
    }
  }

  if (cashAmount !== 0) {
    matched[CASH_HOLDING_ID] = {
      amount: cashAmount,
      ticker: "USD Cash",
      source: "IBKR CSV",
    };
  }

  return { matched, unmatched };
}

// Handles quoted fields with commas inside them
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}
