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
    await q`CREATE TABLE IF NOT EXISTS laporan (
      id bigserial PRIMARY KEY, dibuat timestamptz NOT NULL DEFAULT now(), diubah timestamptz NOT NULL DEFAULT now(),
      jenis text NOT NULL, kategori text NOT NULL, paket_id text, kode text, no int, usulan int,
      pesan text NOT NULL DEFAULT '', konteks jsonb, halaman text, user_id text, email text, ip_hash text,
      status text NOT NULL DEFAULT 'baru', catatan text)`;
    await q`CREATE INDEX IF NOT EXISTS laporan_status ON laporan (status, dibuat DESC)`;
    await q`CREATE INDEX IF NOT EXISTS laporan_sidik ON laporan (ip_hash, dibuat)`;
    await q`CREATE TABLE IF NOT EXISTS akses (
      user_id text PRIMARY KEY, email text, berlaku_sampai timestamptz NOT NULL, sumber text NOT NULL, ref text,
      dibuat timestamptz NOT NULL DEFAULT now(), diubah timestamptz NOT NULL DEFAULT now())`;
    await q`CREATE TABLE IF NOT EXISTS pesanan (
      kode text PRIMARY KEY, user_id text NOT NULL, email text, status text NOT NULL DEFAULT 'menunggu',
      pembayaran_id text, dibuat timestamptz NOT NULL DEFAULT now(), dibayar timestamptz)`;
    await q`CREATE INDEX IF NOT EXISTS pesanan_user ON pesanan (user_id, dibuat DESC)`;
    await q`CREATE TABLE IF NOT EXISTS pembayaran (
      id text PRIMARY KEY, sumber text NOT NULL, dibuat timestamptz NOT NULL DEFAULT now(), nominal int, nama text, pesan text,
      kode text, user_id text, status text NOT NULL, data jsonb, diubah timestamptz NOT NULL DEFAULT now())`;
    await q`CREATE INDEX IF NOT EXISTS pembayaran_status ON pembayaran (status, dibuat DESC)`;
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

// Akses Penuh (berbayar). Paywall hanya aktif bila token webhook Trakteer dan halaman Trakteer sudah diatur.
export const HARGA = 10000;
export const BERLAKU_SAMPAI = "2026-12-02T23:59:59+08:00";
export const TRAKTEER_URL = (process.env.TRAKTEER_URL || "").trim();
export const paywallAktif = () => !!(process.env.TRAKTEER_WEBHOOK_TOKEN && TRAKTEER_URL && process.env.PAYWALL !== "off");
export function adalahAdmin(u) {
  const daftar = (process.env.ADMIN_EMAILS || "").toLowerCase().split(/[\s,;]+/).filter(Boolean);
  return !!(u && u.verified && u.email && daftar.includes(u.email.toLowerCase()));
}
export async function aksesDari(q, u) {
  if (!u) return null;
  if (adalahAdmin(u)) return { sampai: BERLAKU_SAMPAI, sumber: "admin" };
  const [a] = await q`SELECT berlaku_sampai, sumber FROM akses WHERE user_id = ${u.id} AND berlaku_sampai > now()`;
  return a ? { sampai: new Date(a.berlaku_sampai).toISOString(), sumber: a.sumber } : null;
}
export async function berikanAkses(q, userId, email, sumber, ref) {
  await q`INSERT INTO akses (user_id, email, berlaku_sampai, sumber, ref) VALUES (${userId}, ${email || null}, ${BERLAKU_SAMPAI}, ${sumber}, ${ref || null})
    ON CONFLICT (user_id) DO UPDATE SET berlaku_sampai = GREATEST(akses.berlaku_sampai, EXCLUDED.berlaku_sampai), sumber = EXCLUDED.sumber, ref = EXCLUDED.ref, diubah = now()`;
}

