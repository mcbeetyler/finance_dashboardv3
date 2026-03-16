// src/parsers/parseEmpower.js
// Extracts account balances from Empower PDF export
// Uses fuzzy name matching to map accounts to holding IDs
// Requires pdfjs-dist — install with: npm install pdfjs-dist

import * as pdfjsLib from "pdfjs-dist";

// Point pdfjs at its worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

// Maps Empower account name fragments to holding IDs in initialData.js
// Add more entries here as your Empower accounts change
const ACCOUNT_MAP = [
  { match: "tyler schwab",                id: "h16", label: "Tyler Schwab IRA" },
  { match: "mindy schwab",                id: "h3",  label: "Mindy Schwab IRA" },
  { match: "bayer",                       id: "h1",  label: "Fidelity — Bayer 401k" },
  { match: "gemini",                      id: "h36", label: "Gemini crypto" },
  { match: "chase",                       id: "h38", label: "Chase checking" },
  { match: "goppert",                     id: "h40", label: "Goppert checking" },
  // Explicitly excluded — managed manually
  { match: "interactive brokers",         id: null,  label: "IBKR — handled via CSV" },
  { match: "ubs",                         id: null,  label: "UBS — manual CHF entry" },
];

export async function parseEmpower(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // Extract all text from all pages
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    fullText += " " + pageText;
  }

  return extractBalances(fullText);
}

function extractBalances(text) {
  const matched = {};   // holdingId -> { amount, label, source }
  const unmatched = []; // { label, amount } for unknowns
  const excluded = [];  // accounts we intentionally skip

  // Normalize text for matching
  const normalized = text.toLowerCase();

  // Find all dollar amounts with their positions
  const amountPattern = /\$[\d,]+(?:\.\d{2})?/g;
  const amounts = [];
  let m;
  while ((m = amountPattern.exec(text)) !== null) {
    amounts.push({
      value: parseFloat(m[0].replace(/[$,]/g, "")),
      index: m.index,
    });
  }

  // For each known account, find its name in the text
  // then grab the nearest dollar amount after it
  for (const account of ACCOUNT_MAP) {
    const nameIndex = normalized.indexOf(account.match.toLowerCase());
    if (nameIndex === -1) continue;

    if (account.id === null) {
      excluded.push(account.label);
      continue;
    }

    // Find the closest amount that appears after the account name
    const nearbyAmounts = amounts
      .filter((a) => a.index > nameIndex && a.index < nameIndex + 300)
      .sort((a, b) => a.index - b.index);

    if (nearbyAmounts.length === 0) continue;

    let amount = nearbyAmounts[0].value;

    // Liabilities are stored as positive numbers in our data
    // but may appear as negative in the PDF
    if (account.isLiability) {
      amount = Math.abs(amount);
    }

    matched[account.id] = {
      amount,
      label: account.label,
      source: "Empower PDF",
      isLiability: account.isLiability || false,
    };
  }

  return { matched, unmatched, excluded };
}
