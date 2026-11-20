// Kode pembayaran Akses Penuh berupa dua kata, mis. "pelatuk tajam".
// Pembeli menulisnya di pesan Trakteer; huruf besar/kecil, tanda baca, dan spasi ganda diabaikan.
import { randomInt } from "node:crypto";

export const BENDA = ["pelatuk", "batu", "pena", "buku", "pohon", "daun", "awan", "bulan", "bintang", "pelangi",
  "gunung", "sungai", "ombak", "pasir", "kertas", "lampu", "jendela", "payung", "sepatu", "topi",
  "layangan", "perahu", "kapal", "kereta", "sepeda", "jam", "cermin", "bantal", "meja", "kursi",
  "tangga", "jembatan", "taman", "kebun", "mangga", "jeruk", "kelapa", "nanas", "melati", "mawar"];
export const SIFAT = ["tajam", "riang", "cerah", "tenang", "gesit", "rapi", "teguh", "hangat", "sejuk", "terang",
  "lincah", "mungil", "gagah", "manis", "segar", "jernih", "kokoh", "ramah", "sigap", "cermat",
  "tekun", "jujur", "sabar", "cepat", "halus", "lembut", "kuat", "bijak", "hebat", "ceria",
  "damai", "indah", "megah", "luwes", "tangkas", "tegar", "mantap", "harum", "lapang", "rajin"];

const B = new Set(BENDA), S = new Set(SIFAT);
export const kodeBaru = () => `${BENDA[randomInt(BENDA.length)]} ${SIFAT[randomInt(SIFAT.length)]}`;

const kata = (teks) => String(teks || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);

// Semua kemungkinan kode di dalam teks: pasangan benda+sifat berurutan, plus format lama WH-XXXXX.
export function calonKode(teks) {
  const w = kata(teks), hasil = new Set();
  for (let i = 0; i + 1 < w.length; i++) if (B.has(w[i]) && S.has(w[i + 1])) hasil.add(`${w[i]} ${w[i + 1]}`);
  const lama = String(teks || "").toUpperCase().match(/WH\s*-?\s*([A-HJ-NP-Z2-9]{5})\b/);
  if (lama) hasil.add("WH-" + lama[1]);
  return [...hasil];
}
