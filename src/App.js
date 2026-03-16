// src/App.js
// Main app — wires together navigation, dashboard, and update page

import { useState, useEffect, useRef } from "react";
import { useFxRates } from "./hooks/useFxRates";
import { useBalances } from "./hooks/useBalances";
import { strategies, holdings, liabilities } from "./data/initialData";
import { NetWorthSummary } from "./components/NetWorthSummary";
import { StrategyList } from "./components/StrategyList";
import { LiabilitiesPanel } from "./components/LiabilitiesPanel";
import { Navigation } from "./components/Navigation";
import { UpdatePage } from "./components/UpdatePage";
import { ForecastPage } from "./components/ForecastPage";
import { LoginPage } from "./components/LoginPage";

// On localhost we skip auth (no API routes running)
const IS_LOCAL =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(IS_LOCAL);
  const [authChecked, setAuthChecked] = useState(IS_LOCAL);

  // Check for a valid session cookie on load (Vercel only)
  useEffect(() => {
    if (IS_LOCAL) return;
    fetch("/api/auth")
      .then((r) => setIsAuthenticated(r.ok))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setAuthChecked(true));
  }, []);

  const { toUSD, status: fxStatus } = useFxRates();
  const {
    balances,
    lastSnapshot,
    updateBalances,
    saveSnapshot,
    exportBackup,
    importBackup,
    forecastEvents,
    updateForecastEvents,
  } = useBalances();

  const [view, setView] = useState("dashboard");
  const importInputRef = useRef(null);

  const totalAssets = holdings.reduce((sum, h) => {
    const amount = balances.holdings[h.id]?.nativeAmount ?? h.nativeAmount;
    return sum + toUSD(amount, h.currency);
  }, 0);

  const totalLiabilities = liabilities.reduce((sum, l) => {
    const amount = balances.liabilities[l.id]?.nativeAmount ?? l.nativeAmount;
    return sum + toUSD(amount, l.currency);
  }, 0);

  const netWorth = totalAssets - totalLiabilities;
  const delta = lastSnapshot ? netWorth - lastSnapshot.netWorth : null;

  const hasStaleAccounts = Object.values(balances.holdings).some((h) => {
    if (!h.updatedAt) return h.nativeAmount === 0;
    const days = (Date.now() - new Date(h.updatedAt).getTime()) / 86400000;
    return days > 30;
  });

  function handleSave(updates) {
    updateBalances(updates);
    saveSnapshot(netWorth);
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        importBackup(ev.target.result);
      } catch {
        alert("Invalid backup file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const liveHoldings = holdings.map((h) => ({
    ...h,
    nativeAmount: balances.holdings[h.id]?.nativeAmount ?? h.nativeAmount,
  }));

  const liveLiabilities = liabilities.map((l) => ({
    ...l,
    nativeAmount: balances.liabilities[l.id]?.nativeAmount ?? l.nativeAmount,
  }));

  // Show nothing until auth check completes (avoids flash of login page)
  if (!authChecked) return null;

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div style={{
      maxWidth: "720px",
      margin: "0 auto",
      padding: "2rem 1.5rem",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: "#1a1a1a",
    }}>
      <Navigation
        currentView={view}
        onViewChange={setView}
        hasStaleAccounts={hasStaleAccounts}
      />

      {view === "dashboard" && (
        <>
          <NetWorthSummary
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            fxStatus={fxStatus}
            delta={delta}
            lastSnapshot={lastSnapshot}
          />
          <StrategyList
            strategies={strategies}
            holdings={liveHoldings}
            toUSD={toUSD}
            totalAssets={totalAssets}
          />
          <LiabilitiesPanel
            liabilities={liveLiabilities}
            toUSD={toUSD}
          />
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "2rem",
          }}>
            <p style={{ fontSize: "11px", color: "#bbb", margin: 0 }}>
              Last updated: {new Date().toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric",
              })}
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                ref={importInputRef}
                type="file"
                accept=".json"
                style={{ display: "none" }}
                onChange={handleImportFile}
              />
              <button
                onClick={() => importInputRef.current?.click()}
                style={{
                  fontSize: "11px",
                  color: "#888",
                  background: "transparent",
                  border: "0.5px solid #e0e0e0",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  cursor: "pointer",
                }}
              >
                Import backup
              </button>
              <button
                onClick={exportBackup}
                style={{
                  fontSize: "11px",
                  color: "#888",
                  background: "transparent",
                  border: "0.5px solid #e0e0e0",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  cursor: "pointer",
                }}
              >
                Export backup
              </button>
            </div>
          </div>
        </>
      )}

      {view === "update" && (
        <UpdatePage
          balances={balances}
          onSave={handleSave}
          toUSD={toUSD}
        />
      )}

      {view === "forecast" && (
        <ForecastPage
          holdings={liveHoldings}
          liabilities={liveLiabilities}
          toUSD={toUSD}
          events={forecastEvents}
          onEventsChange={updateForecastEvents}
        />
      )}
    </div>
  );
}
