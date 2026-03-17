// src/components/ChartsPage.js
// Three charts: net worth history, strategy allocation, top holdings

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function formatUSDShort(value) {
  if (value >= 1_000_000) return "$" + (value / 1_000_000).toFixed(2) + "M";
  if (value >= 1_000) return "$" + Math.round(value / 1_000) + "k";
  return "$" + Math.round(value);
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: "12px",
      fontWeight: "500",
      color: "#888",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      margin: "0 0 1rem",
    }}>
      {children}
    </p>
  );
}

// ── Net Worth History ────────────────────────────────────────────────────────

function NetWorthChart({ snapshots }) {
  if (snapshots.length < 2) {
    return (
      <div style={{
        background: "#f9f9f9",
        borderRadius: "8px",
        padding: "2rem",
        textAlign: "center",
        color: "#aaa",
        fontSize: "13px",
      }}>
        {snapshots.length === 0
          ? "No history yet — save your first snapshot on the Update Balances page."
          : "Save one more snapshot next month to start seeing your trend."}
      </div>
    );
  }

  const data = snapshots.map((s) => {
    const d = new Date(s.date);
    return {
      label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      netWorth: Math.round(s.netWorth),
    };
  });

  const min = Math.min(...data.map((d) => d.netWorth));
  const max = Math.max(...data.map((d) => d.netWorth));
  const pad = (max - min) * 0.1;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="nwGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#185FA5" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#185FA5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#aaa" }} />
        <YAxis
          tick={{ fontSize: 11, fill: "#aaa" }}
          tickFormatter={formatUSDShort}
          domain={[Math.max(0, min - pad), max + pad]}
          width={56}
        />
        <Tooltip
          formatter={(v) => [formatUSDShort(v), "Net worth"]}
          contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "0.5px solid #e0e0e0" }}
        />
        <Area
          type="monotone"
          dataKey="netWorth"
          stroke="#185FA5"
          strokeWidth={2.5}
          fill="url(#nwGradient)"
          dot={{ r: 3, fill: "#185FA5" }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Strategy Allocation ──────────────────────────────────────────────────────

function AllocationChart({ strategies, holdings, toUSD }) {
  const totals = {};
  for (const h of holdings) {
    const usd = toUSD(h.nativeAmount, h.currency);
    if (usd <= 0) continue;
    totals[h.strategyId] = (totals[h.strategyId] || 0) + usd;
  }

  const data = strategies
    .map((s) => ({ name: s.name, value: Math.round(totals[s.id] || 0), color: s.color }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (!data.length) {
    return (
      <div style={{
        background: "#f9f9f9",
        borderRadius: "8px",
        padding: "2rem",
        textAlign: "center",
        color: "#aaa",
        fontSize: "13px",
      }}>
        No balance data yet.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0].payload;
    return (
      <div style={{
        background: "#fff",
        border: "0.5px solid #e0e0e0",
        borderRadius: "8px",
        padding: "8px 12px",
        fontSize: "12px",
      }}>
        <p style={{ margin: 0, fontWeight: "500" }}>{name}</p>
        <p style={{ margin: "2px 0 0", color: "#555" }}>
          {formatUSDShort(value)} · {((value / total) * 100).toFixed(1)}%
        </p>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
      <div style={{ flexShrink: 0 }}>
        <PieChart width={180} height={180}>
          <Pie
            data={data}
            cx={85}
            cy={85}
            innerRadius={52}
            outerRadius={82}
            dataKey="value"
            strokeWidth={1}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        {data.map((d) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "10px",
              height: "10px",
              borderRadius: "2px",
              background: d.color,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: "12px", color: "#444", flex: 1 }}>{d.name}</span>
            <span style={{ fontSize: "12px", color: "#888", fontVariantNumeric: "tabular-nums" }}>
              {formatUSDShort(d.value)}
            </span>
            <span style={{ fontSize: "11px", color: "#bbb", width: "36px", textAlign: "right" }}>
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Top Holdings ─────────────────────────────────────────────────────────────

function TopHoldingsChart({ holdings, toUSD }) {
  const data = holdings
    .map((h) => ({ name: h.name, value: Math.round(toUSD(h.nativeAmount, h.currency)) }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 12)
    .map((d) => ({
      ...d,
      // Truncate long names for the axis
      shortName: d.name.length > 32 ? d.name.slice(0, 30) + "…" : d.name,
    }));

  if (!data.length) {
    return (
      <div style={{
        background: "#f9f9f9",
        borderRadius: "8px",
        padding: "2rem",
        textAlign: "center",
        color: "#aaa",
        fontSize: "13px",
      }}>
        No balance data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={data.length * 34 + 20}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#aaa" }}
          tickFormatter={formatUSDShort}
        />
        <YAxis
          type="category"
          dataKey="shortName"
          tick={{ fontSize: 11, fill: "#555" }}
          width={200}
        />
        <Tooltip
          formatter={(v) => [formatUSDShort(v), "Value"]}
          contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "0.5px solid #e0e0e0" }}
          cursor={{ fill: "#f5f5f5" }}
        />
        <Bar dataKey="value" fill="#185FA5" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function ChartsPage({ snapshots, strategies, holdings, toUSD }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      <div>
        <SectionLabel>Net worth history</SectionLabel>
        <NetWorthChart snapshots={snapshots} />
      </div>

      <div>
        <SectionLabel>Allocation by strategy</SectionLabel>
        <AllocationChart strategies={strategies} holdings={holdings} toUSD={toUSD} />
      </div>

      <div>
        <SectionLabel>Top holdings</SectionLabel>
        <TopHoldingsChart holdings={holdings} toUSD={toUSD} />
      </div>
    </div>
  );
}
