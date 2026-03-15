// src/utils/currency.js
// Shared formatting helpers used across all components

// Formats a number as USD for display, e.g. 412840 → "$412,840"
export function formatUSD(amount, decimals = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

// Formats a number in its native currency, e.g. 68000 CHF → "CHF 68,000"
export function formatNative(amount, currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Returns a shortened display, e.g. 412840 → "$413k"
export function formatUSDShort(amount) {
  if (Math.abs(amount) >= 1_000_000) {
    return "$" + (amount / 1_000_000).toFixed(1) + "M";
  }
  if (Math.abs(amount) >= 1_000) {
    return "$" + Math.round(amount / 1_000) + "k";
  }
  return formatUSD(amount);
}
