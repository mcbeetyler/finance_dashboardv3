// api/balances.js
// Vercel serverless function — balance data CRUD backed by Redis (REDIS_URL)
// GET  /api/balances  → { balances, snapshots, forecastEvents }
// POST /api/balances  → save { balances?, snapshots?, forecastEvents? }

import crypto from "crypto";
import Redis from "ioredis";

// Reuse connection across warm invocations
let _redis;
function getRedis() {
  if (!_redis) {
    const url = process.env.REDIS_URL;
    _redis = new Redis(url, {
      tls: url.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
    });
  }
  return _redis;
}

async function kvGet(key) {
  const val = await getRedis().get(key);
  return val ? JSON.parse(val) : null;
}

async function kvSet(key, value) {
  await getRedis().set(key, JSON.stringify(value));
}

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

export default async function handler(req, res) {
  try {
    if (!process.env.APP_PASSWORD) {
      return res.status(500).json({ error: "APP_PASSWORD not configured" });
    }
    if (!process.env.REDIS_URL) {
      return res.status(500).json({ error: "REDIS_URL not configured" });
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
