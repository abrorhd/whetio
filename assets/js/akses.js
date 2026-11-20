// Status Akses Penuh (berbayar). Paywall hanya berlaku bila server menyatakan aktif.
// Cache di localStorage, terikat ke email akun yang sedang masuk.
import { akun } from "./sinkron.js";

const K = "whetio:akses", API = "/api/bayar/";
export function bacaAkses() { try { return JSON.parse(localStorage.getItem(K) || "null"); } catch (e) { return null; } }
const simpan = (x) => { try { localStorage.setItem(K, JSON.stringify(x)); } catch (e) {} return x; };

export const paywall = () => !!(bacaAkses() || {}).aktif;
// Pemilik Akses Penuh (atau paywall belum aktif → semua akun dianggap penuh).
export function penuh() {
  const a = bacaAkses(), u = akun();
  if (!a || !a.aktif) return !!u;
  return !!(u && a.penuh && a.email === u.email && (!a.sampai || Date.parse(a.sampai) > Date.now()));
}
// "tamu" | "gratis" | "penuh"
export const tingkat = () => (!akun() ? "tamu" : !paywall() || penuh() ? "penuh" : "gratis");

export async function muatAkses(ms = 2500) {
  try {
    const r = await Promise.race([fetch(API, { credentials: "same-origin", cache: "no-store" }), new Promise((_, j) => setTimeout(() => j(new Error("lambat")), ms))]);
    if (!r.ok) throw new Error(String(r.status));
    const d = await r.json(), u = akun();
    return simpan({ aktif: !!d.aktif, penuh: !!d.penuh, sampai: d.berlaku_sampai || null, harga: d.harga, batas: d.sampai, tautan: d.tautan || null,
      kode: d.kode || null, masuk: !!d.masuk, email: d.masuk && u ? u.email : null, t: Date.now() });
  } catch (e) { return bacaAkses(); }
}

export async function mintaKode() {
  const r = await fetch(API, { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ aksi: "kode" }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || "Gagal membuat kode.");
  const a = bacaAkses(); if (a) simpan({ ...a, kode: d.kode });
  return d.kode;
}

export const rupiah = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
export const tglPendek = (iso) => new Date(iso || "2026-12-02T23:59:59+08:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Makassar" });
