// src/components/ForecastChart.js
// Recharts line chart showing three scenario projections
// Net worth, liquid, and retirement on the same chart

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";

// Merge the three scenario arrays into one flat array for recharts
function mergeScenarios(forecast) {
  if (!forecast) return [];
  const { base, conservative, optimistic } = forecast;
  return base.map((point, i) => ({
    month: point.month,
    label: formatMonthLabel(point.month),
    baseNet: point.netWorth,
    consNet: conservative[i]?.netWorth,
    optiNet: optimistic[i]?.netWorth,
    baseLiquid: point.liquid,
    baseRetirement: point.retirement,
    hasEvent: point.events?.length > 0,
  }));
}

function formatMonthLabel(yearMonth) {
  const [y, m] = yearMonth.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function formatUSDShort(value) {
  if (value >= 1_000_000) return "$" + (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return "$" + Math.round(value / 1_000) + "k";
  return "$" + value;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff",
      border: "0.5px solid #e0e0e0",
      borderRadius: "8px",
      padding: "10px 14px",
      fontSize: "12px",
    }}>
      <p style={{ fontWeight: "500", margin: "0 0 6px", color: "#1a1a1a" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ margin: "2px 0", color: p.color }}>
          {p.name}: {formatUSDShort(p.value)}
        </p>
      ))}
    </div>
  );
}

export function ForecastChart({ forecast, returnHomeMonth }) {
  const data = mergeScenarios(forecast);
  if (!data.length) return null;

  // Only show every 3rd label to avoid crowding
  const tickFormatter = (val, index) => (index % 3 === 0 ? val : "");

  return (
    <div>
      {/* Main net worth chart — three scenarios */}
      <p style={{
        fontSize: "12px",
        fontWeight: "500",
        color: "#888",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        margin: "0 0 0.75rem",
      }}>
        Net worth projection
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#aaa" }}
            tickFormatter={tickFormatter}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#aaa" }}
            tickFormatter={formatUSDShort}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
          />
          {returnHomeMonth && (
            <ReferenceLine
              x={formatMonthLabel(returnHomeMonth)}
              stroke="#1D9E75"
              strokeDasharray="4 4"
              label={{
                value: "Return home",
                position: "top",
                fontSize: 11,
                fill: "#1D9E75",
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="optiNet"
            name="Optimistic"
            stroke="#185FA5"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
          />
          <Line
            type="monotone"
            dataKey="baseNet"
            name="Base"
            stroke="#185FA5"
            strokeWidth={2.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="consNet"
            name="Conservative"
            stroke="#185FA5"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="2 3"
            opacity={0.5}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Liquid vs retirement split */}
      <p style={{
        fontSize: "12px",
        fontWeight: "500",
        color: "#888",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        margin: "1.5rem 0 0.75rem",
      }}>
        Liquid vs retirement (base scenario)
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#aaa" }}
            tickFormatter={tickFormatter}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#aaa" }}
            tickFormatter={formatUSDShort}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
          {returnHomeMonth && (
            <ReferenceLine
              x={formatMonthLabel(returnHomeMonth)}
              stroke="#1D9E75"
              strokeDasharray="4 4"
            />
          )}
          <Line
            type="monotone"
            dataKey="baseLiquid"
            name="Liquid"
            stroke="#1D9E75"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="baseRetirement"
            name="Retirement"
            stroke="#534AB7"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
