// api/auth.js
// Vercel serverless function — password auth
// GET  /api/auth  → 200 if valid session cookie, 401 otherwise
// POST /api/auth  → verify password, set httpOnly cookie on success

import crypto from "crypto";

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(";").forEach((part) => {
    const [k, ...v] = part.trim().split("=");
    if (k) out[k.trim()] = decodeURIComponent(v.join("="));
  });
  return out;
}

function sessionToken() {
  return crypto
    .createHmac("sha256", process.env.APP_PASSWORD)
    .update("finance-session")
    .digest("hex");
}

export default function handler(req, res) {
  if (!process.env.APP_PASSWORD) {
    return res.status(500).json({ error: "APP_PASSWORD not configured" });
  }

  if (req.method === "GET") {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.session === sessionToken()) {
      return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "POST") {
    const { password } = req.body || {};
    if (password === process.env.APP_PASSWORD) {
      const token = sessionToken();
      res.setHeader(
        "Set-Cookie",
        `session=${token}; HttpOnly; Path=/; Max-Age=2592000; SameSite=Strict`
      );
      return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ error: "Invalid password" });
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).end();
}
