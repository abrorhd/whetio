// Akses tamu: latihan gratis terbatas tanpa login, dengan ajakan masuk untuk menyimpan progres.
//  - Simulasi: hanya paket terbaru (hari ini). Arsip paket sebelumnya → perlu masuk.
//  - Latihan bebas: BATAS.sesi sesi per hari, maksimal BATAS.soal soal per sesi.
import { akun } from "./sinkron.js";
import { pelatuk } from "./merek.js";

export const BATAS = { sesi: 3, soal: 10 };
const K = "whetio:tamu:latihan";
export const tamu = () => !akun();
const hariIni = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
function baca() { try { const x = JSON.parse(localStorage.getItem(K) || "null"); return x && x.tgl === hariIni() ? x : { tgl: hariIni(), n: 0 }; } catch (e) { return { tgl: hariIni(), n: 0 }; } }
export const sisaLatihanTamu = () => Math.max(0, BATAS.sesi - baca().n);
export function pakaiLatihanTamu() { const x = baca(); x.n++; try { localStorage.setItem(K, JSON.stringify(x)); } catch (e) {} }

export function tautanMasuk() { return "/akun/?lanjut=" + encodeURIComponent(location.pathname + location.search); }
export function ajakMasuk(judul, ket) {
  return `<div class="ajak-masuk">${pelatuk("ramah", "mini")}<div class="isi"><b>${judul || "Silakan masuk untuk menyimpan progres belajar psikotes."}</b>
    <span>${ket || "Tanpa akun, progres hanya tersimpan di browser ini dan akses latihan dibatasi. Akun gratis."}</span></div>
    <a class="btn pri kecil" href="${tautanMasuk()}">Masuk / Daftar</a></div>`;
}
