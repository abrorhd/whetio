// Proxy Neon Auth (Managed Better Auth) di domain situs sendiri, agar cookie sesi menjadi first-party.
// Dipanggil sebagai /api/auth-proxy/?jalur=<jalur Better Auth>, mis. jalur=sign-in/email.
import { AUTH } from "./_lib.js";

const JALUR = /^[a-z0-9-]+(\/[a-z0-9-]+){0,3}$/;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!AUTH) return res.status(503).json({ message: "Layanan akun belum dikonfigurasi." });
  const url = new URL(req.url, "http://x");
  const jalur = String(url.searchParams.get("jalur") || "").replace(/\/+$/, "");
  if (!JALUR.test(jalur)) return res.status(404).json({ message: "Tidak ditemukan." });
  url.searchParams.delete("jalur");
  const qs = url.searchParams.toString();

  const headers = { accept: "application/json" };
  for (const h of ["cookie", "content-type", "origin", "user-agent", "accept-language"]) if (req.headers[h]) headers[h] = req.headers[h];
  if (req.headers["x-forwarded-for"]) headers["x-forwarded-for"] = req.headers["x-forwarded-for"];
  let body;
  if (!["GET", "HEAD"].includes(req.method)) {
    if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) body = JSON.stringify(req.body);
    else if (typeof req.body === "string" || Buffer.isBuffer(req.body)) body = req.body;
    else { const chunks = []; for await (const c of req) chunks.push(c); body = Buffer.concat(chunks); }
    if (!headers["content-type"]) headers["content-type"] = "application/json";
  }
  let r;
  try {
    r = await fetch(`${AUTH}/${jalur}${qs ? "?" + qs : ""}`, { method: req.method, headers, body, redirect: "manual" });
  } catch (e) {
    console.error("auth-proxy:", e && e.message);
    return res.status(502).json({ message: "Layanan akun sedang tidak dapat dihubungi." });
  }
  // Cookie dari Neon dijadikan milik domain ini: buang atribut Domain.
  const cookies = (r.headers.getSetCookie ? r.headers.getSetCookie() : []).map((c) => c.replace(/;\s*Domain=[^;]*/i, ""));
  if (cookies.length) res.setHeader("Set-Cookie", cookies);
  for (const h of ["content-type", "set-auth-jwt", "location"]) { const v = r.headers.get(h); if (v) res.setHeader(h, v); }
  res.status(r.status).send(Buffer.from(await r.arrayBuffer()));
}
