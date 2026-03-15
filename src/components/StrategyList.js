// src/components/StrategyList.js
// Renders one card per strategy with value, progress bar, and holdings drill-down

import { formatUSD, formatNative } from "../utils/currency";

export function StrategyList({ strategies, holdings, toUSD, totalAssets }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <p style={{
        fontSize: "13px",
        fontWeight: "500",
        color: "#888",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        margin: "0 0 0.75rem",
      }}>
        Strategies
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {strategies.map((strategy) => (
          <StrategyCard
            key={strategy.id}
            strategy={strategy}
            holdings={holdings.filter((h) => h.strategyId === strategy.id)}
            toUSD={toUSD}
            totalAssets={totalAssets}
          />
        ))}
      </div>
    </div>
  );
}

function StrategyCard({ strategy, holdings, toUSD, totalAssets }) {
  const totalUSD = holdings.reduce((sum, h) => sum + toUSD(h.nativeAmount, h.currency), 0);
  const pct = totalAssets > 0 ? (totalUSD / totalAssets) * 100 : 0;
  const hasTarget = strategy.target !== null;
  const targetPct = hasTarget ? Math.min((totalUSD / strategy.target) * 100, 100) : pct;

  return (
    <div style={{
      background: "#fff",
      border: "0.5px solid #e0e0e0",
      borderRadius: "12px",
      padding: "1rem 1.25rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px", fontWeight: "500" }}>{strategy.name}</span>
          <RegionBadge region={strategy.region} />
        </div>
        <span style={{ fontSize: "14px", fontWeight: "500" }}>{formatUSD(totalUSD)}</span>
      </div>

      <div style={{ background: "#f0f0f0", borderRadius: "4px", height: "6px", marginBottom: "6px" }}>
        <div style={{
          background: strategy.color,
          height: "6px",
          borderRadius: "4px",
          width: `${targetPct}%`,
          transition: "width 0.4s ease",
        }} />
      </div>

      <p style={{ fontSize: "12px", color: "#888", margin: "0 0 10px" }}>
        {hasTarget
          ? `${Math.round(targetPct)}% of ${formatUSD(strategy.target)} target · ${formatUSD(Math.max(strategy.target - totalUSD, 0))} to go`
          : `${Math.round(pct)}% of total assets`}
      </p>

      {holdings.length > 0 && (
        <div style={{ borderTop: "0.5px solid #eee", paddingTop: "10px" }}>
          {holdings.map((h) => (
            <div key={h.id} style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "12px",
              color: "#666",
              padding: "3px 0",
            }}>
              <span>{h.name} <span style={{ color: "#bbb" }}>· {h.account}</span></span>
              <span style={{ display: "flex", gap: "8px" }}>
                <span style={{ color: "#bbb" }}>{formatNative(h.nativeAmount, h.currency)}</span>
                <span>{formatUSD(toUSD(h.nativeAmount, h.currency))}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RegionBadge({ region }) {
  const isSwiss = region === "CH";
  return (
    <span style={{
      fontSize: "11px",
      padding: "2px 8px",
      borderRadius: "6px",
      background: isSwiss ? "#f0f0f0" : "#E6F1FB",
      color: isSwiss ? "#666" : "#185FA5",
    }}>
      {region}
    </span>
  );
}
