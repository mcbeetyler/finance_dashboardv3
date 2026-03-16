// src/components/LoginPage.js
// Password gate — shown when the session cookie is absent or expired

import { useState } from "react";

export function LoginPage({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onLogin();
      } else {
        setError("Incorrect password");
        setPassword("");
      }
    } catch {
      setError("Network error — try again");
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "#fafaf9",
    }}>
      <div style={{ width: "320px" }}>
        <p style={{ fontSize: "13px", color: "#888", marginBottom: "1.5rem", textAlign: "center" }}>
          Finance dashboard
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            style={{
              width: "100%",
              fontSize: "15px",
              padding: "10px 12px",
              border: error ? "1px solid #A32D2D" : "0.5px solid #ccc",
              borderRadius: "8px",
              boxSizing: "border-box",
              marginBottom: "10px",
              outline: "none",
            }}
          />
          {error && (
            <p style={{ fontSize: "12px", color: "#A32D2D", margin: "0 0 10px" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%",
              fontSize: "14px",
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              background: loading || !password ? "#e0e0e0" : "#185FA5",
              color: loading || !password ? "#999" : "#fff",
              cursor: loading || !password ? "not-allowed" : "pointer",
              fontWeight: "500",
            }}
          >
            {loading ? "Unlocking..." : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
