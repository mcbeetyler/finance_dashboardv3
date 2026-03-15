// src/components/ForecastEvents.js
// Add, edit, and delete one-off forecast events
// Events appear as markers on the chart timeline

import { useState } from "react";
import { formatUSD } from "../utils/currency";

const EVENT_TYPES = {
  bonus:       { label: "Annual bonus",        color: "#1D9E75" },
  lti:         { label: "LTI vest",            color: "#185FA5" },
  moving:      { label: "Moving / repatriation", color: "#D85A30" },
  "real-estate": { label: "Real estate",       color: "#0F6E56" },
  rental:      { label: "Rental income",       color: "#1D9E75" },
  other:       { label: "Other",               color: "#888780" },
};

const BUCKET_OPTIONS = [
  { value: "house-fund",        label: "House fund" },
  { value: "short-term-growth", label: "Short-term growth" },
  { value: "retirement",        label: "Long-term retirement" },
  { value: "real-estate",       label: "Real estate" },
  { value: "cash-operational",  label: "Cash / operational" },
  { value: "crypto",            label: "Crypto" },
];

const EMPTY_EVENT = {
  id: "",
  date: "",
  amount: "",
  bucket: "house-fund",
  label: "",
  type: "bonus",
};

export function ForecastEvents({ events, onChange }) {
  const [editing, setEditing] = useState(null); // null | "new" | event.id
  const [form, setForm] = useState(EMPTY_EVENT);

  function startNew() {
    setForm({ ...EMPTY_EVENT, id: `e${Date.now()}` });
    setEditing("new");
  }

  function startEdit(event) {
    setForm({ ...event, amount: String(event.amount) });
    setEditing(event.id);
  }

  function handleDelete(id) {
    onChange(events.filter((e) => e.id !== id));
  }

  function handleSave() {
    if (!form.date || !form.amount || !form.label) return;
    const saved = {
      ...form,
      amount: parseFloat(form.amount),
    };
    if (editing === "new") {
      onChange([...events, saved].sort((a, b) => a.date.localeCompare(b.date)));
    } else {
      onChange(
        events
          .map((e) => (e.id === editing ? saved : e))
          .sort((a, b) => a.date.localeCompare(b.date))
      );
    }
    setEditing(null);
    setForm(EMPTY_EVENT);
  }

  function handleCancel() {
    setEditing(null);
    setForm(EMPTY_EVENT);
  }

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "0.75rem",
      }}>
        <p style={{
          fontSize: "13px",
          fontWeight: "500",
          color: "#888",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          margin: 0,
        }}>
          One-off events
        </p>
        <button
          onClick={startNew}
          style={{
            fontSize: "12px",
            padding: "4px 12px",
            borderRadius: "6px",
            border: "0.5px solid #e0e0e0",
            background: "#fff",
            cursor: "pointer",
            color: "#185FA5",
          }}
        >
          + Add event
        </button>
      </div>

      {/* Event list */}
      <div style={{
        border: "0.5px solid #e0e0e0",
        borderRadius: "12px",
        overflow: "hidden",
        marginBottom: editing ? "12px" : 0,
      }}>
        {sorted.length === 0 && (
          <p style={{ fontSize: "13px", color: "#bbb", padding: "1rem", margin: 0, textAlign: "center" }}>
            No events yet — add one above
          </p>
        )}
        {sorted.map((event, i) => {
          const typeInfo = EVENT_TYPES[event.type] || EVENT_TYPES.other;
          const isPositive = event.amount >= 0;
          return (
            <div key={event.id} style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto auto",
              gap: "10px",
              alignItems: "center",
              padding: "10px 16px",
              borderBottom: i < sorted.length - 1 ? "0.5px solid #eee" : "none",
              background: editing === event.id ? "#f0f7ff" : "transparent",
            }}>
              <span style={{
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "6px",
                background: typeInfo.color + "18",
                color: typeInfo.color,
                whiteSpace: "nowrap",
              }}>
                {typeInfo.label}
              </span>
              <div>
                <p style={{ fontSize: "13px", margin: 0, color: "#1a1a1a" }}>{event.label}</p>
                <p style={{ fontSize: "11px", margin: 0, color: "#bbb" }}>
                  {formatDate(event.date)} · {BUCKET_OPTIONS.find(b => b.value === event.bucket)?.label || event.bucket}
                </p>
              </div>
              <span style={{
                fontSize: "13px",
                fontWeight: "500",
                color: isPositive ? "#3B6D11" : "#A32D2D",
                whiteSpace: "nowrap",
              }}>
                {isPositive ? "+" : ""}{formatUSD(event.amount)}
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => startEdit(event)}
                  style={{
                    fontSize: "11px",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    border: "0.5px solid #e0e0e0",
                    background: "#fff",
                    cursor: "pointer",
                    color: "#888",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  style={{
                    fontSize: "11px",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    border: "0.5px solid #e0e0e0",
                    background: "#fff",
                    cursor: "pointer",
                    color: "#A32D2D",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / edit form */}
      {editing && (
        <div style={{
          border: "0.5px solid #185FA5",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          background: "#f0f7ff",
        }}>
          <p style={{ fontSize: "13px", fontWeight: "500", margin: "0 0 12px" }}>
            {editing === "new" ? "Add event" : "Edit event"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", color: "#888", display: "block", marginBottom: "4px" }}>Label</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="e.g. LTI vest"
                style={{ width: "100%", fontSize: "13px", padding: "6px 8px", border: "0.5px solid #ccc", borderRadius: "6px", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "#888", display: "block", marginBottom: "4px" }}>Date (YYYY-MM)</label>
              <input
                type="month"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                style={{ width: "100%", fontSize: "13px", padding: "6px 8px", border: "0.5px solid #ccc", borderRadius: "6px", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "#888", display: "block", marginBottom: "4px" }}>Amount (negative = outflow)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 40000 or -25000"
                style={{ width: "100%", fontSize: "13px", padding: "6px 8px", border: "0.5px solid #ccc", borderRadius: "6px", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "#888", display: "block", marginBottom: "4px" }}>Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                style={{ width: "100%", fontSize: "13px", padding: "6px 8px", border: "0.5px solid #ccc", borderRadius: "6px", boxSizing: "border-box" }}
              >
                {Object.entries(EVENT_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "11px", color: "#888", display: "block", marginBottom: "4px" }}>Add to strategy bucket</label>
              <select
                value={form.bucket}
                onChange={(e) => setForm((f) => ({ ...f, bucket: e.target.value }))}
                style={{ width: "100%", fontSize: "13px", padding: "6px 8px", border: "0.5px solid #ccc", borderRadius: "6px", boxSizing: "border-box" }}
              >
                {BUCKET_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleSave}
              disabled={!form.date || !form.amount || !form.label}
              style={{
                fontSize: "13px",
                padding: "7px 18px",
                borderRadius: "6px",
                border: "none",
                background: form.date && form.amount && form.label ? "#185FA5" : "#e0e0e0",
                color: form.date && form.amount && form.label ? "#fff" : "#999",
                cursor: form.date && form.amount && form.label ? "pointer" : "not-allowed",
              }}
            >
              Save event
            </button>
            <button
              onClick={handleCancel}
              style={{
                fontSize: "13px",
                padding: "7px 18px",
                borderRadius: "6px",
                border: "0.5px solid #e0e0e0",
                background: "#fff",
                cursor: "pointer",
                color: "#888",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(yearMonth) {
  const [y, m] = yearMonth.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
