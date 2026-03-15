// src/hooks/useBalances.js
// Manages balance data in localStorage
// Separates live balances from the static initialData structure

import { useState, useEffect } from "react";
import { holdings, liabilities } from "../data/initialData";

const BALANCES_KEY = "finance_balances";
const SNAPSHOTS_KEY = "finance_snapshots";

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

export function useBalances() {
  const [balances, setBalances] = useState(() => {
    try {
      const stored = localStorage.getItem(BALANCES_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return buildDefaultBalances();
  });

  const [snapshots, setSnapshots] = useState(() => {
    try {
      const stored = localStorage.getItem(SNAPSHOTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem(BALANCES_KEY, JSON.stringify(balances));
  }, [balances]);

  useEffect(() => {
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
  }, [snapshots]);

  function updateBalances(updates) {
    const now = new Date().toISOString();
    setBalances((prev) => {
      const next = { ...prev };
      if (updates.holdings) {
        next.holdings = { ...prev.holdings };
        Object.entries(updates.holdings).forEach(([id, amount]) => {
          next.holdings[id] = { nativeAmount: amount, updatedAt: now };
        });
      }
      if (updates.liabilities) {
        next.liabilities = { ...prev.liabilities };
        Object.entries(updates.liabilities).forEach(([id, amount]) => {
          next.liabilities[id] = { nativeAmount: amount, updatedAt: now };
        });
      }
      return next;
    });
  }

  function saveSnapshot(totalNetWorth) {
    const snapshot = {
      date: new Date().toISOString(),
      netWorth: totalNetWorth,
    };
    setSnapshots((prev) => {
      const filtered = prev.filter(
        (s) => s.date.slice(0, 7) !== snapshot.date.slice(0, 7)
      );
      return [...filtered, snapshot].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
    });
  }

  function exportBackup() {
    const data = {
      balances,
      snapshots,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
  };
}
