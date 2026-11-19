// Tanggal ujian (pilihan pengguna) dan rencana belajar per fase menuju psikotes.
import { kirimTgl } from "./sinkron.js";
export const PILIHAN_TGL = [["2026-11-30", "Sen, 30 Nov"], ["2026-12-01", "Sel, 1 Des"], ["2026-12-02", "Rab, 2 Des"]];
export const KUNCI_TGL = "whetio:psikotes:tgl";
export function tglUjian() { try { return localStorage.getItem(KUNCI_TGL); } catch (e) { return null; } }
export function setTglUjian(t) { try { localStorage.setItem(KUNCI_TGL, t); } catch (e) {} kirimTgl(t); }
export function sisaHari(t, dari = new Date()) {
  if (!t) return null;
  const [y, m, d] = t.split("-").map(Number);
  const a = new Date(dari.getFullYear(), dari.getMonth(), dari.getDate());
  return Math.round((new Date(y, m - 1, d) - a) / 864e5);
}
export const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export function teksTgl(t) { const [y, m, d] = t.split("-").map(Number); return `${d} ${BULAN[m - 1]} ${y}`; }

export function fase(h) {
  if (h == null) return null;
  if (h < 0) return { id: "lewat", judul: "Psikotes sudah lewat", tugas: ["Semoga hasilnya baik! Situs tetap bisa dipakai untuk latihan."] };
  if (h === 0) return { id: "h", judul: "Hari H", tugas: ["Sarapan, datang lebih awal, cek perangkat.", "Subtes kognitif: amankan soal mudah, selalu pilih jawaban sebelum waktu habis.", "Subtes kepribadian: tenang, konsisten, jangan ubah jawaban."] };
  if (h === 1) return { id: "istirahat", judul: "Fase 4 · Istirahat (H-1)", tugas: ["Tidak ada simulasi penuh. Cukup satu drill Visual Matching ringan (tempo 100%).", "Baca ulang strategi hari H dan panduan kepribadian.", "Tidur cukup — psikotes butuh otak yang segar."] };
  if (h === 2) return { id: "gladi", judul: "Fase 3 · Gladi (H-2)", tugas: ["Simulasi penuh paket hari ini, berurutan dan berwaktu tanpa jeda panjang.", "Buka pembahasan semua soal yang salah/kosong.", "Catat 3 jebakan yang masih sering mengecoh."] };
  if (h <= 7) return { id: "tempo", judul: "Fase 2 · Kejar tempo", tugas: ["Pagi: simulasi penuh paket hari ini (mode berwaktu).", "Sore: drill tempo 100% → 80% untuk dua subtes terlemah (lihat “Fokus hari ini”).", "Visual Matching & Block Pattern: drill tempo 2× sehari, 5 menit saja."] };
  return { id: "teknik", judul: "Fase 1 · Kenali & benahi teknik", tugas: ["Kerjakan paket hari ini sebagai diagnostik (subtes baru boleh mode latihan dulu).", "Baca pembahasan sampai paham pola jebakannya.", "Drill mode latihan untuk dua subtes terlemah, lalu satu drill tempo 150%."] };
}
