// Utilitas fungsi server (berkas berawalan _ tidak menjadi endpoint).
import { neon } from "@neondatabase/serverless";

export const AUTH = (process.env.NEON_AUTH_BASE_URL || process.env.VITE_NEON_AUTH_URL || "").replace(/\/+$/, "");
let _sql = null, _skema = null;
export function sql() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

// Skema dibuat otomatis (idempoten) sekali per instance fungsi.
export function pastikanSkema() {
  if (_skema) return _skema;
  const q = sql();
  _skema = (async () => {
    await q`CREATE TABLE IF NOT EXISTS profil (
      user_id text PRIMARY KEY, email text, tgl_ujian date,
      dibuat timestamptz NOT NULL DEFAULT now(), diubah timestamptz NOT NULL DEFAULT now())`;
    await q`CREATE TABLE IF NOT EXISTS hasil (
      user_id text NOT NULL, paket_id text NOT NULL, kode text NOT NULL,
      data jsonb NOT NULL, t bigint NOT NULL, diubah timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, paket_id, kode))`;
    await q`CREATE TABLE IF NOT EXISTS latihan (
      user_id text NOT NULL, t bigint NOT NULL, data jsonb NOT NULL,
      diubah timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id, t))`;
    await q`CREATE INDEX IF NOT EXISTS hasil_diubah ON hasil (user_id, diubah)`;
  })().catch((e) => { _skema = null; throw e; });
  return _skema;
}

// Pengguna yang sedang masuk, diperiksa ke Neon Auth memakai cookie sesi dari browser.
export async function penggunaDari(req) {
  const cookie = req.headers.cookie || "";
  if (!AUTH || !/session/i.test(cookie)) return null;
  const r = await fetch(AUTH + "/get-session", { headers: { cookie, accept: "application/json" } });
  if (!r.ok) return null;
  const d = await r.json().catch(() => null);
  return d && d.user && d.user.id ? { id: String(d.user.id), email: d.user.email || "", verified: !!d.user.emailVerified } : null;
}

export async function bodyJSON(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return null; } }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return null;
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return null; }
}
