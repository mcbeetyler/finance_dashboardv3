// src/hooks/useBalances.js
// Manages balance data.
// On localhost (npm start): uses localStorage — same as before, no API needed.
// On Vercel (production): reads/writes via /api/balances backed by Vercel KV.

import { useState, useEffect } from "react";
import { holdings, liabilities } from "../data/initialData";

const BALANCES_KEY = "finance_balances";
const SNAPSHOTS_KEY = "finance_snapshots";

// True when running on Vercel; false on localhost dev server
const IS_LOCAL =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

function buildDefaultBalances() {
  const h = {};
  holdings.forEach((item) => {
    h[item.id] = {
      nativeAmount: item.nativeAmount,
      updatedAt: item.nativeAmount > 0 ? new Date().toISOString() : null,
    };
  });
  const l = {};
  liabilities.forEach((item) => {
    l[item.id] = {
      nativeAmount: item.nativeAmount,
      updatedAt: item.nativeAmount > 0 ? new Date().toISOString() : null,
    };
  });
  return { holdings: h, liabilities: l };
}

// ── localStorage helpers (localhost only) ──────────────────────────────────

function lsRead(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return fallback;
}

function lsWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// ── API helpers (Vercel only) ──────────────────────────────────────────────

async function apiGet() {
  const res = await fetch("/api/balances");
  if (!res.ok) return null;
  return res.json();
}

async function apiPost(body) {
  await fetch("/api/balances", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(console.error);
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useBalances() {
  const [balances, setBalances] = useState(() =>
    IS_LOCAL ? lsRead(BALANCES_KEY, buildDefaultBalances()) : buildDefaultBalances()
  );

  const [snapshots, setSnapshots] = useState(() =>
    IS_LOCAL ? lsRead(SNAPSHOTS_KEY, []) : []
  );

  // API mode: load from KV on mount
  useEffect(() => {
    if (IS_LOCAL) return;
    apiGet().then((data) => {
      if (!data) return;
      if (data.balances) setBalances(data.balances);
      if (data.snapshots) setSnapshots(data.snapshots);
    });
  }, []);

  // localStorage mode: persist on every change
  useEffect(() => {
    if (!IS_LOCAL) return;
    lsWrite(BALANCES_KEY, balances);
  }, [balances]);

  useEffect(() => {
    if (!IS_LOCAL) return;
    lsWrite(SNAPSHOTS_KEY, snapshots);
  }, [snapshots]);

  // ── Actions ──────────────────────────────────────────────────────────────

  function updateBalances(updates) {
    const now = new Date().toISOString();
    setBalances((prev) => {
      const next = {
        holdings: { ...prev.holdings },
        liabilities: { ...prev.liabilities },
      };
      if (updates.holdings) {
        Object.entries(updates.holdings).forEach(([id, amount]) => {
          next.holdings[id] = { nativeAmount: amount, updatedAt: now };
        });
      }
      if (updates.liabilities) {
        Object.entries(updates.liabilities).forEach(([id, amount]) => {
          next.liabilities[id] = { nativeAmount: amount, updatedAt: now };
        });
      }
      if (!IS_LOCAL) apiPost({ balances: next });
      return next;
    });
  }

  function saveSnapshot(totalNetWorth) {
    const snapshot = { date: new Date().toISOString(), netWorth: totalNetWorth };
    setSnapshots((prev) => {
      const filtered = prev.filter(
        (s) => s.date.slice(0, 7) !== snapshot.date.slice(0, 7)
      );
      const next = [...filtered, snapshot].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      if (!IS_LOCAL) apiPost({ snapshots: next });
      return next;
    });
  }

  function exportBackup() {
    const data = { balances, snapshots, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Seed KV (or localStorage) from a previously exported backup JSON file.
  // Use this once after deploying to Vercel to migrate your local data.
  function importBackup(jsonText) {
    const data = JSON.parse(jsonText);
    if (data.balances) {
      setBalances(data.balances);
      if (IS_LOCAL) lsWrite(BALANCES_KEY, data.balances);
      else apiPost({ balances: data.balances });
    }
    if (data.snapshots) {
      setSnapshots(data.snapshots);
      if (IS_LOCAL) lsWrite(SNAPSHOTS_KEY, data.snapshots);
      else apiPost({ snapshots: data.snapshots });
    }
  }

  const lastSnapshot =
    snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null;

  return {
    balances,
    snapshots,
    lastSnapshot,
    updateBalances,
    saveSnapshot,
    exportBackup,
    importBackup,
  };
}
