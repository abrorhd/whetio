// Tingkat akses:
//  - tamu   : paket terbaru saja; latihan bebas BATAS.tamu.sesi sesi/hari × 10 soal. Ajakan masuk.
//  - gratis : (hanya bila paywall aktif) akun tanpa Akses Penuh — paket terbaru; BATAS.gratis.sesi sesi/hari × 10 soal.
//  - penuh  : semua paket, latihan tanpa batas, semua jumlah soal. Bila paywall belum aktif, semua akun = penuh.
import { akun } from "./sinkron.js";
import { pelatuk } from "./merek.js";
import { tingkat, bacaAkses, rupiah, tglPendek } from "./akses.js";

export { tingkat };
export const BATAS = { sesi: 3, soal: 10, tamu: { sesi: 3 }, gratis: { sesi: 5 } };
const kunciKuota = () => (akun() ? "whetio:gratis:latihan" : "whetio:tamu:latihan");
export const tamu = () => !akun();
export const terbatas = () => tingkat() !== "penuh";
export const batasSesi = () => (tingkat() === "gratis" ? BATAS.gratis.sesi : BATAS.tamu.sesi);
const hariIni = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
function baca() { try { const x = JSON.parse(localStorage.getItem(kunciKuota()) || "null"); return x && x.tgl === hariIni() ? x : { tgl: hariIni(), n: 0 }; } catch (e) { return { tgl: hariIni(), n: 0 }; } }
export const sisaLatihan = () => Math.max(0, batasSesi() - baca().n);
export function pakaiLatihan() { const x = baca(); x.n++; try { localStorage.setItem(kunciKuota(), JSON.stringify(x)); } catch (e) {} }

export function tautanMasuk() { return "/akun/?lanjut=" + encodeURIComponent(location.pathname + location.search); }
export function ajakMasuk(judul, ket) {
  return `<div class="ajak-masuk">${pelatuk("ramah", "mini")}<div class="isi"><b>${judul || "Silakan masuk untuk menyimpan progres belajar psikotes."}</b>
    <span>${ket || "Tanpa akun, progres hanya tersimpan di browser ini dan akses latihan dibatasi. Akun gratis."}</span></div>
    <a class="btn pri kecil" href="${tautanMasuk()}">Masuk / Daftar</a></div>`;
}
// Ajakan membuka Akses Penuh untuk akun gratis (paywall aktif).
export function ajakBuka(judul, ket) {
  const a = bacaAkses() || {};
  return `<div class="ajak-masuk ajak-buka">${pelatuk("senyum", "mini")}<div class="isi"><b>${judul || `Buka Akses Penuh — ${rupiah(a.harga || 10000)} sekali bayar`}</b>
    <span>${ket || `Semua arsip paket, latihan bebas tanpa batas, dan mode 20 soal / seperti ujian. Berlaku sampai ${tglPendek(a.batas)}.`}</span></div>
    <a class="btn spark kecil" href="/akses/">Buka akses</a></div>`;
}
// Ajakan sesuai tingkat (kosong bila penuh).
export const ajakan = (judul, ket) => (tingkat() === "tamu" ? ajakMasuk(judul, ket) : tingkat() === "gratis" ? ajakBuka() : "");

