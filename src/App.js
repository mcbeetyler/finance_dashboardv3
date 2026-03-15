import { useFxRates } from "./hooks/useFxRates";
import { strategies, holdings, liabilities } from "./data/initialData";
import { NetWorthSummary } from "./components/NetWorthSummary";
import { StrategyList } from "./components/StrategyList";
import { LiabilitiesPanel } from "./components/LiabilitiesPanel";

export default function App() {
  const { toUSD, status: fxStatus } = useFxRates();

  const totalAssets = holdings.reduce(
    (sum, h) => sum + toUSD(h.nativeAmount, h.currency),
    0
  );

  const totalLiabilities = liabilities.reduce(
    (sum, l) => sum + toUSD(l.nativeAmount, l.currency),
    0
  );

  return (
    <div style={{
      maxWidth: "720px",
      margin: "0 auto",
      padding: "2rem 1.5rem",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: "#1a1a1a",
    }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "18px", fontWeight: "500", margin: "0 0 4px" }}>
          Finance dashboard
        </h1>
        <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>
          All values in USD · Placeholder data
        </p>
      </div>

      <NetWorthSummary
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
        fxStatus={fxStatus}
      />

      <StrategyList
        strategies={strategies}
        holdings={holdings}
        toUSD={toUSD}
        totalAssets={totalAssets}
      />

      <LiabilitiesPanel
        liabilities={liabilities}
        toUSD={toUSD}
      />

      <p style={{ fontSize: "11px", color: "#bbb", textAlign: "right", marginTop: "2rem" }}>
        Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>
    </div>
  );
}