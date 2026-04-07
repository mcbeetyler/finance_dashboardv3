// src/data/initialData.js
// Structure-only file — all nativeAmounts are 0.
// Real balances are stored in Vercel KV (production) or localStorage (localhost).
// Safe to commit: no actual financial values here.

export const strategies = [
  { id: "retirement",        name: "Long-term retirement",  color: "#185FA5", target: null,   region: "US + CH" },
  { id: "house-fund",        name: "House fund",            color: "#1D9E75", target: 400000, region: "US + CH" },
  { id: "short-term-growth", name: "Short-term growth",     color: "#534AB7", target: null,   region: "US + CH" },
  { id: "real-estate",       name: "Real estate",           color: "#0F6E56", target: null,   region: "US" },
  { id: "crypto",            name: "Crypto",                color: "#BA7517", target: null,   region: "US" },
  { id: "conversion-buffer", name: "Conversion buffer",     color: "#D85A30", target: null,   region: "CH" },
  { id: "cash-operational",  name: "Cash / operational",    color: "#888780", target: null,   region: "US + CH" },
  { id: "travel-spending",   name: "Travel / spending",     color: "#7F77DD", target: null,   region: "CH" },
];

export const holdings = [
  // ── Long-term retirement ──────────────────────────────
  { id: "h1",  name: "Fidelity — Bayer 401k",                        account: "Fidelity",                  strategyId: "retirement",        currency: "USD", nativeAmount: 0 },
  { id: "h2",  name: "Kids 529",                                      account: "Manual Investment Holdings", strategyId: "retirement",        currency: "USD", nativeAmount: 0 },
  { id: "h3",  name: "Mindy Schwab",                                  account: "Manual Investment Holdings", strategyId: "retirement",        currency: "USD", nativeAmount: 0 },
  { id: "h4",  name: "Optum HSA",                                     account: "Manual Investment Holdings", strategyId: "retirement",        currency: "USD", nativeAmount: 0 },
  { id: "h5",  name: "Trust Schwab",                                  account: "Manual Investment Holdings", strategyId: "house-fund",        currency: "USD", nativeAmount: 0 },
  { id: "h6",  name: "Vanguard — Cargill Employee Retirement",        account: "Vanguard",                  strategyId: "retirement",        currency: "USD", nativeAmount: 0 },
  { id: "h7",  name: "Vanguard — Cargill Partnership Plan",           account: "Vanguard",                  strategyId: "retirement",        currency: "USD", nativeAmount: 0 },
  { id: "h8",  name: "Vanguard — Bonus Deferral Plan",                account: "Vanguard",                  strategyId: "retirement",        currency: "USD", nativeAmount: 0 },
  { id: "h9",  name: "Vanguard — Cargill Employee Retirement (1080)", account: "Vanguard",                  strategyId: "retirement",        currency: "USD", nativeAmount: 0 },
  { id: "h10", name: "Vanguard — Cargill Partnership Plan (1080)",    account: "Vanguard",                  strategyId: "retirement",        currency: "USD", nativeAmount: 0 },
  { id: "h11", name: "Swiss pension (BVG)",                           account: "Swiss Pension",             strategyId: "retirement",        currency: "CHF", nativeAmount: 0 },

  // ── House fund (IBKR — cash equivalents) ─────────────
  { id: "h12", name: "IBKR — SGOV (iShares 0-3m Treasury)",          account: "IBKR",                      strategyId: "house-fund",        currency: "USD", nativeAmount: 0 },
  { id: "h13", name: "IBKR — MINT (PIMCO Short Maturity)",           account: "IBKR",                      strategyId: "house-fund",        currency: "USD", nativeAmount: 0 },
  { id: "h14", name: "IBKR — TBUX (T. Rowe Ultra Short)",            account: "IBKR",                      strategyId: "house-fund",        currency: "USD", nativeAmount: 0 },
  { id: "h15", name: "IBKR — USD cash",                              account: "IBKR",                      strategyId: "cash-operational",  currency: "USD", nativeAmount: 0 },

  // ── Short-term growth ─────────────────────────────────
  { id: "h16", name: "Tyler Schwab",                                  account: "Manual Investment Holdings", strategyId: "retirement",        currency: "USD", nativeAmount: 0 },
  { id: "h17", name: "IBKR — SCHD (Schwab US Dividend ETF)",         account: "IBKR",                      strategyId: "short-term-growth", currency: "USD", nativeAmount: 0 },
  { id: "h18", name: "IBKR — VYM (Vanguard High Dividend)",          account: "IBKR",                      strategyId: "short-term-growth", currency: "USD", nativeAmount: 0 },
  { id: "h19", name: "IBKR — VYMI (Vanguard Intl Dividend)",         account: "IBKR",                      strategyId: "short-term-growth", currency: "USD", nativeAmount: 0 },
  { id: "h20", name: "IBKR — ASML",                                  account: "IBKR",                      strategyId: "short-term-growth", currency: "USD", nativeAmount: 0 },
  { id: "h21", name: "IBKR — ITA (iShares Aerospace & Defense)",     account: "IBKR",                      strategyId: "short-term-growth", currency: "USD", nativeAmount: 0 },
  { id: "h22", name: "IBKR — INTC (Intel)",                          account: "IBKR",                      strategyId: "short-term-growth", currency: "USD", nativeAmount: 0 },
  { id: "h23", name: "IBKR — PLTR (Palantir)",                       account: "IBKR",                      strategyId: "short-term-growth", currency: "USD", nativeAmount: 0 },
  { id: "h24", name: "IBKR — AMD",                                   account: "IBKR",                      strategyId: "short-term-growth", currency: "USD", nativeAmount: 0 },
  { id: "h25", name: "IBKR — NVDA (Nvidia)",                         account: "IBKR",                      strategyId: "short-term-growth", currency: "USD", nativeAmount: 0 },
  { id: "h26", name: "IBKR — TSLA (Tesla)",                          account: "IBKR",                      strategyId: "short-term-growth", currency: "USD", nativeAmount: 0 },
  { id: "h27", name: "IBKR — UNH (UnitedHealth)",                    account: "IBKR",                      strategyId: "short-term-growth", currency: "USD", nativeAmount: 0 },
  { id: "h28", name: "IBKR — UPS",                                   account: "IBKR",                      strategyId: "short-term-growth", currency: "USD", nativeAmount: 0 },
  { id: "h29", name: "IBKR — BBAI (BigBear.ai)",                     account: "IBKR",                      strategyId: "short-term-growth", currency: "USD", nativeAmount: 0 },
  { id: "h30", name: "IBKR — SMCI (Super Micro Computer)",           account: "IBKR",                      strategyId: "short-term-growth", currency: "USD", nativeAmount: 0 },
  { id: "h31", name: "IBKR — KTOS (Kratos Defense)",                 account: "IBKR",                      strategyId: "short-term-growth", currency: "USD", nativeAmount: 0 },
  { id: "h32", name: "IBKR — AI (C3.ai)",                            account: "IBKR",                      strategyId: "short-term-growth", currency: "USD", nativeAmount: 0 },

  // ── Real estate ───────────────────────────────────────
  { id: "h33", name: "Primary home",                                  account: "Real Estate",               strategyId: "real-estate",       currency: "USD", nativeAmount: 0 },
  { id: "h34", name: "Rental property — equity",                     account: "Real Estate",               strategyId: "real-estate",       currency: "USD", nativeAmount: 0 },
  { id: "h35", name: "Crop ground — purchase in progress",           account: "Real Estate",               strategyId: "real-estate",       currency: "USD", nativeAmount: 0 },

  // ── Crypto ────────────────────────────────────────────
  { id: "h36", name: "Gemini",                                        account: "Gemini",                    strategyId: "crypto",            currency: "USD", nativeAmount: 0 },

  // ── Conversion buffer ─────────────────────────────────
  { id: "h37", name: "IBKR — CHF cash",                              account: "IBKR",                      strategyId: "conversion-buffer", currency: "CHF", nativeAmount: 0 },

  // ── Cash / operational ────────────────────────────────
  { id: "h38", name: "Chase checking",                                account: "Chase",                     strategyId: "cash-operational",  currency: "USD", nativeAmount: 0 },
  { id: "h39", name: "DraftKings etc",                                account: "Manual Bank",               strategyId: "cash-operational",  currency: "USD", nativeAmount: 0 },
  { id: "h40", name: "Goppert checking",                              account: "Goppert",                   strategyId: "cash-operational",  currency: "USD", nativeAmount: 0 },
  { id: "h41", name: "UBS checking",                                  account: "UBS",                       strategyId: "cash-operational",  currency: "CHF", nativeAmount: 0 },

  // ── Travel / spending ─────────────────────────────────
  { id: "h42", name: "Wise — USD",                                    account: "Wise",                      strategyId: "travel-spending",   currency: "USD", nativeAmount: 0 },
  { id: "h43", name: "Wise — CHF",                                    account: "Wise",                      strategyId: "travel-spending",   currency: "CHF", nativeAmount: 0 },
  { id: "h44", name: "Wise — EUR",                                    account: "Wise",                      strategyId: "travel-spending",   currency: "EUR", nativeAmount: 0 },
  { id: "h45", name: "Revolut — USD",                                 account: "Revolut",                   strategyId: "travel-spending",   currency: "USD", nativeAmount: 0 },
  { id: "h46", name: "Revolut — CHF",                                 account: "Revolut",                   strategyId: "travel-spending",   currency: "CHF", nativeAmount: 0 },
  { id: "h47", name: "Revolut — EUR",                                 account: "Revolut",                   strategyId: "travel-spending",   currency: "EUR", nativeAmount: 0 },

  // ── Short-term growth — LTI ───────────────────────────
  { id: "h48", name: "Cargill LTI — restricted stock units",         account: "Cargill LTI",               strategyId: "short-term-growth", currency: "USD", nativeAmount: 0 },
  { id: "h49", name: "IBKR — GOOGL (Alphabet)",                      account: "IBKR",                      strategyId: "short-term-growth", currency: "USD", nativeAmount: 0 },
];

export const liabilities = [
  { id: "l1", name: "Amex Platinum",               account: "American Express",  currency: "USD", nativeAmount: 0 },
  { id: "l2", name: "Chase credit card (9162)",     account: "Chase",            currency: "USD", nativeAmount: 0 },
  { id: "l3", name: "Chase credit card (9216)",     account: "Chase",            currency: "USD", nativeAmount: 0 },
  { id: "l4", name: "Investment property mortgage", account: "Manual Mortgage",  currency: "USD", nativeAmount: 0 },
  { id: "l5", name: "Swiss credit card",            account: "Swiss Credit Card", currency: "CHF", nativeAmount: 0 },
  { id: "l6", name: "SoFi student loan",            account: "SoFi",             currency: "USD", nativeAmount: 0 },
  { id: "l7", name: "Aidvantage student loan",      account: "Aidvantage",       currency: "USD", nativeAmount: 0 },
];
