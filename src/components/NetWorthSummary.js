// src/components/NetWorthSummary.js
// Top-level summary cards: assets, liabilities, net worth + delta vs last snapshot

import { formatUSD } from "../utils/currency";

export function NetWorthSummary({
  totalAssets,
  totalLiabilities,
  fxStatus,
  delta,
  lastSnapshot,
}) {
  const netWorth = totalAssets - totalLiabilities;

  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginBottom: "1rem",
      }}>
        <div>
          <p style={{ fontSize: "13px", color: "#888", margin: "0 0 4px" }}>
            Net worth
          </p>
          <p style={{ fontSize: "32px", fontWeight: "500", margin: 0 }}>
            {formatUSD(netWorth)}
          </p>
          {delta !== null && (
            <p style={{
              fontSize: "13px",
              margin: "4px 0 0",
              color: delta >= 0 ? "#3B6D11" : "#A32D2D",
              fontWeight: "500",
            }}>
              {delta >= 0 ? "+" : ""}{formatUSD(delta)} vs last snapshot
              {lastSnapshot && (
                <span style={{ fontWeight: "400", color: "#aaa", marginLeft: "6px" }}>
                  ({new Date(lastSnapshot.date).toLocaleDateString("en-US", {
                    month: "short", year: "numeric",
                  })})
                </span>
              )}
            </p>
          )}
        </div>
        <span style={{
          fontSize: "11px",
          padding: "3px 8px",
          borderRadius: "6px",
          background: fxStatus === "live" ? "#EAF3DE" : "#FAEEDA",
          color: fxStatus === "live" ? "#3B6D11" : "#854F0B",
        }}>
          {fxStatus === "live"
            ? "FX live"
            : fxStatus === "loading"
              ? "FX loading…"
              : "FX fallback"}
        </span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: "12px",
      }}>
        <MetricCard label="Total assets" value={formatUSD(totalAssets)} />
        <MetricCard
          label="Total liabilities"
          value={formatUSD(totalLiabilities)}
          negative
        />
        <MetricCard label="Net worth" value={formatUSD(netWorth)} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, negative }) {
  return (
    <div style={{
      background: "#f5f5f3",
      borderRadius: "8px",
      padding: "1rem",
    }}>
      <p style={{ fontSize: "12px", color: "#888", margin: "0 0 4px" }}>
        {label}
      </p>
      <p style={{
        fontSize: "20px",
        fontWeight: "500",
        margin: 0,
        color: negative ? "#A32D2D" : "inherit",
      }}>
        {value}
      </p>
    </div>
  );
}