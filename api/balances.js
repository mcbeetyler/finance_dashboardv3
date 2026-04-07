// api/balances.js
// Vercel serverless function — balance data CRUD backed by Upstash Redis
// Uses the HTTP REST API (derived from REDIS_URL) instead of ioredis TCP,
// which is unreliable in serverless cold-start environments.
// GET  /api/balances  → { balances, snapshots, forecastEvents }
// POST /api/balances  → save { balances?, snapshots?, forecastEvents? }

import crypto from "crypto";

// ── Upstash REST helpers ───────────────────────────────────────────────────
// Derives the REST URL + token from the standard REDIS_URL:
//   rediss://default:TOKEN@hostname.upstash.io:6379
//       → https://hostname.upstash.io  +  Bearer TOKEN

function getUpstash() {
  return {
    restUrl: process.env.finance_dashboard_KV_REST_API_URL,
    token: process.env.finance_dashboard_KV_REST_API_TOKEN,
  };
}

async function kvGet(key) {
  const { restUrl, token } = getUpstash();
  try {
    const res = await fetch(`${restUrl}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([["GET", key]]),
    });
    const data = await res.json();
    const result = data[0]?.result;
    return result ? JSON.parse(result) : null;
  } catch (err) {
    throw new Error(`kvGet failed [url=${restUrl}]: ${err.message} | cause: ${err.cause?.message}`);
  }
}

async function kvSet(key, value) {
  const { restUrl, token } = getUpstash();
  await fetch(`${restUrl}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([["SET", key, JSON.stringify(value)]]),
  });
}

// ── Auth ───────────────────────────────────────────────────────────────────

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(";").forEach((part) => {
    const [k, ...v] = part.trim().split("=");
    if (k) out[k.trim()] = decodeURIComponent(v.join("="));
  });
  return out;
}

function isAuthorized(req) {
  const cookies = parseCookies(req.headers.cookie);
  const expected = crypto
    .createHmac("sha256", process.env.APP_PASSWORD)
    .update("finance-session")
    .digest("hex");
  return cookies.session === expected;
}

// ── Handler ────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  try {
    if (!process.env.APP_PASSWORD) {
      return res.status(500).json({ error: "APP_PASSWORD not configured" });
    }
    if (!process.env.finance_dashboard_KV_REST_API_URL) {
      return res.status(500).json({ error: "finance_dashboard_KV_REST_API_URL not configured" });
    }

    if (!isAuthorized(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
      const [balances, snapshots, forecastEvents] = await Promise.all([
        kvGet("finance_balances"),
        kvGet("finance_snapshots"),
        kvGet("finance_forecast_events"),
      ]);
      return res.status(200).json({ balances, snapshots, forecastEvents });
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const ops = [];
      if (body.balances !== undefined) ops.push(kvSet("finance_balances", body.balances));
      if (body.snapshots !== undefined) ops.push(kvSet("finance_snapshots", body.snapshots));
      if (body.forecastEvents !== undefined) ops.push(kvSet("finance_forecast_events", body.forecastEvents));
      await Promise.all(ops);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST");
    res.status(405).end();
  } catch (err) {
    console.error("[balances] error:", err);
    return res.status(500).json({ error: err.message });
  }
}
