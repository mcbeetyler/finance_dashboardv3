// src/components/LiabilitiesPanel.js
// Displays all liabilities with native currency and USD equivalent

import { formatUSD, formatNative } from "../utils/currency";

export function LiabilitiesPanel({ liabilities, toUSD }) {
  const total = liabilities.reduce((sum, l) => sum + toUSD(l.nativeAmount, l.currency), 0);

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
        Liabilities
      </p>

      <div style={{
        background: "#fff",
        border: "0.5px solid #e0e0e0",
        borderRadius: "12px",
        padding: "1rem 1.25rem",
      }}>
        {liabilities.map((l, i) => (
          <div key={l.id} style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "13px",
            padding: "6px 0",
            borderBottom: i < liabilities.length - 1 ? "0.5px solid #eee" : "none",
          }}>
            <span style={{ color: "#555" }}>{l.name}</span>
            <span style={{ display: "flex", gap: "12px" }}>
              <span style={{ color: "#bbb" }}>{formatNative(l.nativeAmount, l.currency)}</span>
              <span style={{ color: "#A32D2D" }}>-{formatUSD(toUSD(l.nativeAmount, l.currency))}</span>
            </span>
          </div>
        ))}

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "13px",
          fontWeight: "500",
          paddingTop: "10px",
          marginTop: "4px",
          borderTop: "0.5px solid #e0e0e0",
        }}>
          <span>Total liabilities</span>
          <span style={{ color: "#A32D2D" }}>-{formatUSD(total)}</span>
        </div>
      </div>
    </div>
  );
}
