// src/components/ForecastPage.js
// Main forecast view — settings, events, and chart in one page

import { useState, useMemo } from "react";
import { ForecastChart } from "./ForecastChart";
import { ForecastEvents } from "./ForecastEvents";
import { runForecast } from "../utils/forecastEngine";
import { formatUSD } from "../utils/currency";

const SCENARIOS = ["conservative", "base", "optimistic"];

export function ForecastPage({ holdings, liabilities, toUSD, events, onEventsChange }) {
  const [monthlySavings, setMonthlySavings] = useState(6000);
  const [returnHomeMonth, setReturnHomeMonth] = useState("2028-09");
  const [activeScenario, setActiveScenario] = useState("base");

  const forecast = useMemo(() => {
    return runForecast({
      holdings,
      liabilities,
      toUSD,
      monthlySavings,
      events,
      endYearMonth: "2028-12",
    });
  }, [holdings, liabilities, toUSD, monthlySavings, events]);

  // Pull out the return-home month data point for the summary cards
  const summaryPoint = useMemo(() => {
    const scenario = forecast[activeScenario];
    if (!scenario) return null;
    const point = scenario.find((p) => p.month === returnHomeMonth);
    return point || scenario[scenario.length - 1];
  }, [forecast, activeScenario, returnHomeMonth]);

  const today = useMemo(() => {
    const base = forecast.base;
    return base?.[0] || null;
  }, [forecast]);

  return (
    <div style={{
      maxWidth: "720px",
      margin: "0 auto",
      padding: "2rem 1.5rem",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: "#1a1a1a",
    }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "18px", fontWeight: "500", margin: "0 0 4px" }}>
          Forecast
        </h1>
        <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>
          Projected from today · Seeded from live balances
        </p>
      </div>

      {/* Settings bar */}
      <div style={{
        background: "#f5f5f3",
        borderRadius: "12px",
        padding: "1rem 1.25rem",
        marginBottom: "1.5rem",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "16px",
        alignItems: "end",
      }}>
        <div>
          <label style={{ fontSize: "11px", color: "#888", display: "block", marginBottom: "4px" }}>
            Monthly savings
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "#888" }}>$</span>
            <input
              type="number"
              value={monthlySavings}
              onChange={(e) => setMonthlySavings(Number(e.target.value) || 0)}
              style={{
                width: "100%",
                fontSize: "14px",
                fontWeight: "500",
                padding: "6px 8px",
                border: "0.5px solid #ccc",
                borderRadius: "6px",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: "11px", color: "#888", display: "block", marginBottom: "4px" }}>
            Return home
          </label>
          <input
            type="month"
            value={returnHomeMonth}
            min="2026-01"
            max="2028-12"
            onChange={(e) => setReturnHomeMonth(e.target.value)}
            style={{
              width: "100%",
              fontSize: "13px",
              padding: "6px 8px",
              border: "0.5px solid #ccc",
              borderRadius: "6px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: "11px", color: "#888", display: "block", marginBottom: "4px" }}>
            Scenario
          </label>
          <div style={{ display: "flex", gap: "4px" }}>
            {SCENARIOS.map((s) => (
              <button
                key={s}
                onClick={() => setActiveScenario(s)}
                style={{
                  flex: 1,
                  fontSize: "11px",
                  padding: "6px 4px",
                  borderRadius: "6px",
                  border: "0.5px solid #e0e0e0",
                  background: activeScenario === s ? "#185FA5" : "#fff",
                  color: activeScenario === s ? "#fff" : "#888",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {s === "conservative" ? "Cons." : s === "optimistic" ? "Opti." : "Base"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards at return-home date */}
      {summaryPoint && today && (
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{
            fontSize: "13px",
            fontWeight: "500",
            color: "#888",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: "0 0 0.75rem",
          }}>
            At return home · {formatDate(returnHomeMonth)} · {activeScenario}
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0,1fr))",
            gap: "12px",
          }}>
            <SummaryCard
              label="Net worth"
              value={formatUSD(summaryPoint.netWorth)}
              delta={summaryPoint.netWorth - today.netWorth}
            />
            <SummaryCard
              label="Liquid assets"
              value={formatUSD(summaryPoint.liquid)}
              delta={summaryPoint.liquid - today.liquid}
            />
            <SummaryCard
              label="Retirement"
              value={formatUSD(summaryPoint.retirement)}
              delta={summaryPoint.retirement - today.retirement}
            />
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{
        background: "#fff",
        border: "0.5px solid #e0e0e0",
        borderRadius: "12px",
        padding: "1.25rem",
        marginBottom: "1.5rem",
      }}>
        <ForecastChart
          forecast={forecast}
          returnHomeMonth={returnHomeMonth}
        />
      </div>

      {/* Return assumptions */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0,1fr))",
        gap: "8px",
        marginBottom: "1.5rem",
      }}>
        {[
          { label: "Conservative", market: "5%", cash: "3.5%" },
          { label: "Base", market: "8%", cash: "3.5%" },
          { label: "Optimistic", market: "11%", cash: "3.5%" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "#f5f5f3",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            border: activeScenario === s.label.toLowerCase()
              ? "1.5px solid #185FA5"
              : "0.5px solid transparent",
          }}>
            <p style={{ fontSize: "12px", fontWeight: "500", margin: "0 0 4px", color: "#555" }}>
              {s.label}
            </p>
            <p style={{ fontSize: "11px", color: "#888", margin: 0 }}>
              Market {s.market} · Cash {s.cash}
            </p>
          </div>
        ))}
      </div>

      {/* Events */}
      <ForecastEvents events={events} onChange={onEventsChange} />

      <p style={{ fontSize: "11px", color: "#bbb", textAlign: "right", margin: "1rem 0 0" }}>
        Projections are estimates only · Not financial advice
      </p>
    </div>
  );
}

function SummaryCard({ label, value, delta }) {
  return (
    <div style={{
      background: "#f5f5f3",
      borderRadius: "8px",
      padding: "1rem",
    }}>
      <p style={{ fontSize: "12px", color: "#888", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: "18px", fontWeight: "500", margin: "0 0 2px" }}>{value}</p>
      {delta !== undefined && (
        <p style={{
          fontSize: "11px",
          margin: 0,
          color: delta >= 0 ? "#3B6D11" : "#A32D2D",
        }}>
          {delta >= 0 ? "+" : ""}{formatUSD(delta)} from today
        </p>
      )}
    </div>
  );
}

function formatDate(yearMonth) {
  const [y, m] = yearMonth.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
