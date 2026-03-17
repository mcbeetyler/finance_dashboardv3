// src/components/UpdatePage.js
// Monthly update workflow — file upload, review, and save

import { useState } from "react";
import { parseIBKR } from "../parsers/parseIBKR";
import { parseEmpower } from "../parsers/parseEmpower";
import { strategies, holdings, liabilities } from "../data/initialData";
import { formatUSD, formatNative } from "../utils/currency";

export function UpdatePage({ balances, onSave, toUSD }) {
  const [parsed, setParsed] = useState({});
  const [overrides, setOverrides] = useState({});
  const [status, setStatus] = useState({ ibkr: null, empower: null });
  const [unmatched, setUnmatched] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleIBKR(e) {
    const file = e.target.files[0];
    if (!file) return;
    setStatus((s) => ({ ...s, ibkr: "parsing" }));
    try {
      const text = await file.text();
      const { matched, unmatched: u } = parseIBKR(text);
      setParsed((p) => ({ ...p, ...matched }));
      setUnmatched((prev) => [...prev, ...u]);
      setStatus((s) => ({
        ...s,
        ibkr: `Parsed — ${Object.keys(matched).length} holdings found`,
      }));
    } catch (err) {
      setStatus((s) => ({ ...s, ibkr: "Error parsing file — " + err.message }));
    }
  }

  async function handleEmpower(e) {
    const file = e.target.files[0];
    if (!file) return;
    setStatus((s) => ({ ...s, empower: "parsing" }));
    try {
      const { matched, excluded, debug } = await parseEmpower(file);
      setParsed((p) => ({ ...p, ...matched }));
      const debugStr = debug
        ? ` | rows:${debug.totalRows} withAmts:${debug.rowsWithAmounts} | ${debug.combined.slice(0, 5).join(" || ")}`
        : "";
      setStatus((s) => ({
        ...s,
        empower: `Parsed — ${Object.keys(matched).length} accounts found, ${excluded.length} excluded${debugStr}`,
      }));
    } catch (err) {
      setStatus((s) => ({
        ...s,
        empower: "Error parsing file — " + err.message,
      }));
    }
  }

  function handleOverride(id, value) {
    setOverrides((o) => ({ ...o, [id]: value }));
  }

  function getEffectiveAmount(id) {
    if (overrides[id] !== undefined) return parseFloat(overrides[id]) || 0;
    if (parsed[id] !== undefined) return parsed[id].amount;
    return balances.holdings[id]?.nativeAmount ??
      balances.liabilities[id]?.nativeAmount ?? 0;
  }

  async function handleSave() {
    setSaving(true);
    const holdingUpdates = {};
    const liabilityUpdates = {};

    holdings.forEach((h) => {
      const effective = getEffectiveAmount(h.id);
      if (
        parsed[h.id] !== undefined ||
        overrides[h.id] !== undefined
      ) {
        holdingUpdates[h.id] = effective;
      }
    });

    liabilities.forEach((l) => {
      const effective = getEffectiveAmount(l.id);
      if (
        parsed[l.id] !== undefined ||
        overrides[l.id] !== undefined
      ) {
        liabilityUpdates[l.id] = effective;
      }
    });

    onSave({ holdings: holdingUpdates, liabilities: liabilityUpdates });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const hasChanges =
    Object.keys(parsed).length > 0 || Object.keys(overrides).length > 0;

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#1a1a1a" }}>

      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "18px", fontWeight: "500", margin: "0 0 4px" }}>Update balances</h1>
        <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>
          Upload your latest files, review changes, then save.
        </p>
      </div>

      {/* File upload zones */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "2rem" }}>
        <DropZone
          label="IBKR CSV"
          accept=".csv"
          status={status.ibkr}
          onChange={handleIBKR}
          hint="Activity Statement export"
        />
        <DropZone
          label="Empower PDF"
          accept=".pdf"
          status={status.empower}
          onChange={handleEmpower}
          hint="Dashboard PDF export"
        />
      </div>

      {/* Unmatched tickers */}
      {unmatched.length > 0 && (
        <div style={{ background: "#FAEEDA", border: "0.5px solid #EF9F27", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "13px", fontWeight: "500", color: "#854F0B", margin: "0 0 8px" }}>
            Unrecognized tickers — add these to parseIBKR.js manually
          </p>
          {unmatched.map((u) => (
            <p key={u.ticker} style={{ fontSize: "12px", color: "#854F0B", margin: "2px 0" }}>
              {u.ticker} — {formatUSD(u.value)}
            </p>
          ))}
        </div>
      )}

      {/* Review table — holdings grouped by strategy */}
      <ReviewSection
        title="Holdings"
        items={holdings}
        parsed={parsed}
        overrides={overrides}
        balances={balances.holdings}
        onOverride={handleOverride}
        toUSD={toUSD}
        strategies={strategies}
      />

      {/* Review table — liabilities */}
      <ReviewSection
        title="Liabilities"
        items={liabilities}
        parsed={parsed}
        overrides={overrides}
        balances={balances.liabilities}
        onOverride={handleOverride}
        toUSD={toUSD}
        isLiability
      />

      {/* Save button */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "2rem" }}>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          style={{
            padding: "10px 24px",
            fontSize: "14px",
            fontWeight: "500",
            background: hasChanges ? "#185FA5" : "#e0e0e0",
            color: hasChanges ? "#fff" : "#999",
            border: "none",
            borderRadius: "8px",
            cursor: hasChanges ? "pointer" : "not-allowed",
          }}
        >
          {saving ? "Saving…" : "Save & snapshot"}
        </button>
        {saved && (
          <span style={{ fontSize: "13px", color: "#3B6D11" }}>
            Saved — snapshot recorded
          </span>
        )}
      </div>
    </div>
  );
}

function DropZone({ label, accept, status, onChange, hint }) {
  const isParsed = status && !status.includes("Error") && status !== "parsing";
  const isError = status && status.includes("Error");
  return (
    <div style={{
      border: `1px dashed ${isParsed ? "#1D9E75" : isError ? "#A32D2D" : "#ccc"}`,
      borderRadius: "12px",
      padding: "1.25rem",
      textAlign: "center",
      background: isParsed ? "#EAF3DE" : isError ? "#FCEBEB" : "#fafafa",
    }}>
      <p style={{ fontSize: "14px", fontWeight: "500", margin: "0 0 4px", color: isParsed ? "#3B6D11" : isError ? "#A32D2D" : "#1a1a1a" }}>
        {label}
      </p>
      <p style={{ fontSize: "12px", color: "#888", margin: "0 0 12px" }}>{hint}</p>
      <input type="file" accept={accept} onChange={onChange} style={{ fontSize: "12px", width: "100%" }} />
      {status && (
        <p style={{ fontSize: "11px", margin: "8px 0 0", color: isParsed ? "#3B6D11" : isError ? "#A32D2D" : "#888" }}>
          {status}
        </p>
      )}
    </div>
  );
}

function ReviewRow({ item, parsed, overrides, balances, onOverride, toUSD, isLast }) {
  const current = balances[item.id]?.nativeAmount ?? 0;
  const parsedEntry = parsed[item.id];
  const override = overrides[item.id];
  const newAmount = override !== undefined
    ? parseFloat(override) || 0
    : parsedEntry?.amount ?? current;
  const delta = toUSD(newAmount, item.currency) - toUSD(current, item.currency);
  const hasChange = parsedEntry !== undefined || override !== undefined;
  const updatedAt = balances[item.id]?.updatedAt ?? null;
  const stale = updatedAt ? daysSince(updatedAt) > 30 : current === 0;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)",
      gap: "8px",
      alignItems: "center",
      padding: "10px 16px",
      borderBottom: isLast ? "none" : "0.5px solid #eee",
      background: hasChange ? "#f0f7ff" : "transparent",
    }}>
      <div>
        <p style={{ fontSize: "13px", margin: 0, color: "#1a1a1a" }}>{item.name}</p>
        <p style={{ fontSize: "11px", margin: 0, color: "#bbb" }}>
          {item.account} · {item.currency}
          {parsedEntry
            ? <span style={{ color: "#185FA5", marginLeft: "6px" }}>● {parsedEntry.source}</span>
            : <span style={{ color: stale ? "#BA7517" : "#bbb", marginLeft: "6px" }}>
                · {updatedAt ? formatUpdatedAt(updatedAt) : "never updated"}
              </span>
          }
        </p>
      </div>
      <div style={{ fontSize: "13px", color: "#888", textAlign: "right" }}>
        {formatNative(current, item.currency)}
      </div>
      <div style={{ textAlign: "right" }}>
        <input
          type="number"
          value={override !== undefined ? override : parsedEntry !== undefined ? parsedEntry.amount : ""}
          placeholder={String(current)}
          onChange={(e) => onOverride(item.id, e.target.value)}
          style={{
            width: "100%",
            fontSize: "13px",
            padding: "4px 8px",
            border: "0.5px solid #ccc",
            borderRadius: "6px",
            textAlign: "right",
            background: parsedEntry && override === undefined ? "#E6F1FB" : "#fff",
          }}
        />
      </div>
      <div style={{
        fontSize: "12px",
        textAlign: "right",
        color: delta > 0 ? "#3B6D11" : delta < 0 ? "#A32D2D" : "#bbb",
        fontWeight: delta !== 0 ? "500" : "400",
      }}>
        {delta !== 0 ? (delta > 0 ? "+" : "") + formatUSD(delta) : "—"}
      </div>
    </div>
  );
}

function ReviewSection({ title, items, parsed, overrides, balances, onOverride, toUSD, strategies }) {
  const rowProps = { parsed, overrides, balances, onOverride, toUSD };

  // Grouped by strategy when strategies are provided (holdings)
  if (strategies) {
    const groups = strategies
      .map((s) => ({ strategy: s, items: items.filter((h) => h.strategyId === s.id) }))
      .filter((g) => g.items.length > 0);

    return (
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "13px", fontWeight: "500", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.75rem" }}>
          {title}
        </p>
        <div style={{ border: "0.5px solid #e0e0e0", borderRadius: "12px", overflow: "hidden" }}>
          {groups.map((group, gi) => (
            <div key={group.strategy.id}>
              <div style={{
                padding: "7px 16px",
                background: "#f5f5f3",
                borderTop: gi > 0 ? "0.5px solid #e0e0e0" : "none",
                borderBottom: "0.5px solid #eee",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <span style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: group.strategy.color,
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: "12px", fontWeight: "500", color: "#555" }}>
                  {group.strategy.name}
                </span>
              </div>
              {group.items.map((item, i) => (
                <ReviewRow
                  key={item.id}
                  item={item}
                  isLast={i === group.items.length - 1 && gi === groups.length - 1}
                  {...rowProps}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Flat list (liabilities)
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <p style={{ fontSize: "13px", fontWeight: "500", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.75rem" }}>
        {title}
      </p>
      <div style={{ border: "0.5px solid #e0e0e0", borderRadius: "12px", overflow: "hidden" }}>
        {items.map((item, i) => (
          <ReviewRow
            key={item.id}
            item={item}
            isLast={i === items.length - 1}
            {...rowProps}
          />
        ))}
      </div>
    </div>
  );
}

function daysSince(isoString) {
  if (!isoString) return 999;
  return Math.floor((Date.now() - new Date(isoString).getTime()) / 86400000);
}

function formatUpdatedAt(isoString) {
  const d = new Date(isoString);
  const days = daysSince(isoString);
  if (days === 0) return "updated today";
  if (days === 1) return "updated yesterday";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  const label = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  return `updated ${label}`;
}
