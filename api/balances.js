// api/balances.js
// Vercel serverless function — balance data CRUD backed by Vercel KV
// GET  /api/balances          → { balances, snapshots }
// POST /api/balances          → save { balances?, snapshots? }

import crypto from "crypto";
import { kv } from "@vercel/kv";

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
  if (!process.env.APP_PASSWORD) {
    return res.status(500).json({ error: "APP_PASSWORD not configured" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    const [balances, snapshots, forecastEvents] = await Promise.all([
      kv.get("finance_balances"),
      kv.get("finance_snapshots"),
      kv.get("finance_forecast_events"),
    ]);
    return res.status(200).json({ balances, snapshots, forecastEvents });
  }

  if (req.method === "POST") {
    const body = req.body || {};
    const ops = [];
    if (body.balances !== undefined) ops.push(kv.set("finance_balances", body.balances));
    if (body.snapshots !== undefined) ops.push(kv.set("finance_snapshots", body.snapshots));
    if (body.forecastEvents !== undefined) ops.push(kv.set("finance_forecast_events", body.forecastEvents));
    await Promise.all(ops);
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).end();
}
