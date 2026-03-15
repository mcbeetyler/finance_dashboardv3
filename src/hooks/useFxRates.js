// src/hooks/useFxRates.js
// Fetches live exchange rates on app load (USD as base)
// Falls back to approximate rates if the API is unavailable

import { useState, useEffect } from "react";

const FALLBACK_RATES = {
  USD: 1,
  CHF: 1.12,
  EUR: 1.08,
};

export function useFxRates() {
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [status, setStatus] = useState("loading"); // "loading" | "live" | "fallback"

  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch(
          "https://api.exchangerate-api.com/v4/latest/USD"
        );
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setRates({
          USD: 1,
          CHF: data.rates.CHF ? 1 / data.rates.CHF : FALLBACK_RATES.CHF,
          EUR: data.rates.EUR ? 1 / data.rates.EUR : FALLBACK_RATES.EUR,
        });
        setStatus("live");
      } catch (err) {
        console.warn("FX fetch failed, using fallback rates:", err.message);
        setStatus("fallback");
      }
    }

    fetchRates();
  }, []);

  // Converts a native amount to USD
  function toUSD(amount, currency) {
    const rate = rates[currency] ?? 1;
    return amount * rate;
  }

  return { rates, status, toUSD };
}
