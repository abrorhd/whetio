// Subtes 7 — Aritmatika Sosial: soal cerita dengan angka bersih dan pengecoh dari kesalahan umum.
import { rp, ribuan, unikkan } from "./rng.js";

const NAMA = ["Iksan", "Rani", "Bagas", "Dewi", "Fajar", "Lestari", "Yoga", "Maya", "Hendra", "Putri", "Arif", "Nanda", "Salsa", "Tegar"];
const BARANG = [["beras", "kg"], ["gula", "kg"], ["kopi", "kg"], ["minyak goreng", "liter"], ["tepung", "kg"]];
const jam = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}.${String(m % 60).padStart(2, "0")}`;
const persen = (n) => String(n).replace(".", ",") + "%";

const T = [
  // rata-rata gabungan
  (r) => { const n1 = r.pick([10, 12, 15, 20, 25]), n2 = r.pick([5, 8, 10, 15]), a1 = r.int(60, 90), d = r.int(2, 12); const a2 = a1 - d; const tot = n1 * a1 + n2 * a2; if (tot % (n1 + n2)) return null;
    const k = tot / (n1 + n2);
    return { q: `Rata-rata nilai ${n1} peserta kelas A adalah ${a1}, sedangkan rata-rata ${n2} peserta kelas B adalah ${a2}. Rata-rata nilai seluruh peserta adalah …`, k, f: String, sal: [(a1 + a2) / 2, k + 1, k - 1, a1 - 1], e: `(${n1}×${a1} + ${n2}×${a2}) : ${n1 + n2} = ${tot} : ${n1 + n2} = ${k}. Jangan merata-ratakan ${a1} dan ${a2} begitu saja karena jumlah pesertanya berbeda.` }; },
  // DP + angsuran
  (r) => { const dp = r.int(3, 9) * 5e6, cic = r.int(10, 30) * 25e4, th = r.int(2, 5); const k = dp + cic * 12 * th; const nm = r.pick(NAMA);
    return { q: `${nm} membeli sebuah mobil bekas dengan uang muka ${rp(dp)} dan angsuran ${rp(cic)} per bulan selama ${th} tahun. Jumlah seluruh uang yang dibayarkan ${nm} adalah …`, k, f: rp, sal: [cic * 12 * th, dp + cic * 52 * th, dp + cic * 10 * th, dp + cic * th * 12 - cic * 12], e: `${rp(dp)} + (${rp(cic)} × ${12 * th} bulan) = ${rp(dp)} + ${rp(cic * 12 * th)} = ${rp(k)}. Satu tahun = 12 bulan, dan uang muka ikut dihitung.` }; },
  // campuran dan kembalian
  (r) => { const [b, s] = r.pick(BARANG); const x1 = r.pick([10, 15, 20, 25, 30]), x2 = r.pick([10, 15, 20]); const h1 = r.int(60, 140) * 100, h2 = h1 - r.int(4, 12) * 100; const tot = x1 * h1 + x2 * h2; if (tot % (x1 + x2)) return null;
    const hc = tot / (x1 + x2), beli = r.int(3, 9), bayar = Math.ceil((hc * beli + 1) / 50000) * 50000; const k = bayar - hc * beli; const nm = r.pick(NAMA);
    return { q: `Pedagang mencampur ${x1} ${s} ${b} seharga ${rp(h1)}/${s} dengan ${x2} ${s} ${b} seharga ${rp(h2)}/${s}. ${nm} membeli ${beli} ${s} ${b} campuran itu dan membayar ${rp(bayar)}. Uang kembalian ${nm} adalah …`, k, f: rp, sal: [hc * beli, bayar - ((h1 + h2) / 2) * beli, k + 500, k - 500], e: `Harga campuran = (${x1}×${rp(h1)} + ${x2}×${rp(h2)}) : ${x1 + x2} = ${rp(hc)}/${s}. Belanja = ${beli} × ${rp(hc)} = ${rp(hc * beli)}. Kembalian = ${rp(bayar)} − ${rp(hc * beli)} = ${rp(k)}.` }; },
  // diskon bertingkat
  (r) => { const h = r.int(4, 30) * 25000, d1 = r.pick([10, 20, 25, 30, 40]), d2 = r.pick([5, 10, 20]); const k = h * (100 - d1) / 100 * (100 - d2) / 100; if (!Number.isInteger(k)) return null;
    return { q: `Sebuah jaket berharga ${rp(h)} mendapat diskon ${d1}% ditambah diskon lanjutan ${d2}%. Harga yang harus dibayar adalah …`, k, f: rp, sal: [h * (100 - d1 - d2) / 100, h * (100 - d1) / 100, h * d1 * d2 / 1e4, h - h * d2 / 100], e: `Diskon lanjutan dihitung dari harga setelah diskon pertama: ${rp(h)} × ${100 - d1}% = ${rp(h * (100 - d1) / 100)}, lalu × ${100 - d2}% = ${rp(k)}. Menjumlahkan diskon menjadi ${d1 + d2}% adalah jebakan.` }; },
  // untung persen
  (r) => { const beli = r.int(8, 40) * 5000, p = r.pick([10, 12, 15, 20, 25, 30, 40]); const jual = beli * (100 + p) / 100; if (!Number.isInteger(jual)) return null; const salahBase = Math.round((jual - beli) / jual * 1000) / 10;
    return { q: `Pedagang membeli barang seharga ${rp(beli)} dan menjualnya seharga ${rp(jual)}. Persentase keuntungannya adalah …`, k: p, f: persen, sal: [salahBase, p + 5, p - 5, p * 2], e: `Untung = ${rp(jual - beli)}; persentase dihitung dari harga beli: ${rp(jual - beli)} : ${rp(beli)} × 100% = ${p}%.` }; },
  // bunga tunggal
  (r) => { const m = r.int(2, 20) * 1e6, b = r.pick([4, 5, 6, 8, 9, 12]), bl = r.pick([3, 6, 8, 9, 10, 18]); const bunga = m * b / 100 * bl / 12; if (!Number.isInteger(bunga)) return null; const k = m + bunga;
    return { q: `Tabungan awal ${rp(m)} dengan bunga tunggal ${b}% per tahun. Saldo setelah ${bl} bulan adalah …`, k, f: rp, sal: [m + m * b / 100, bunga, m + m * b / 100 * bl, m + bunga * 2], e: `Bunga = ${rp(m)} × ${b}% × ${bl}/12 = ${rp(bunga)}. Saldo = ${rp(m)} + ${rp(bunga)} = ${rp(k)}.` }; },
  // kecepatan → jam tiba
  (r) => { const v = r.pick([40, 45, 50, 60, 72, 80]), t = r.pick([90, 105, 120, 135, 150, 165, 195]); const jarak = v * t / 60; if (!Number.isInteger(jarak)) return null; const ber = r.int(5 * 12, 9 * 12) * 5; const k = ber + t;
    return { q: `Sebuah bus berangkat pukul ${jam(ber)} menempuh jarak ${jarak} km dengan kecepatan rata-rata ${v} km/jam. Bus tiba pukul …`, k, f: jam, sal: [ber + Math.floor(t / 60) * 60 + Math.round(((t / 60) % 1) * 100), k + 15, k - 15, k + 60], e: `Waktu tempuh = ${jarak} : ${v} = ${Math.floor(t / 60)} jam ${t % 60} menit. ${jam(ber)} + ${Math.floor(t / 60)}.${String(t % 60).padStart(2, "0")} = ${jam(k)}.` }; },
  // kerja bersama
  (r) => { const [a, b] = r.pick([[6, 3], [12, 6], [10, 15], [20, 30], [12, 4], [18, 9], [24, 12], [15, 10], [30, 20], [8, 24]]); const k = a * b / (a + b);
    return { q: `Pak Hasan dapat mengecat pagar sendirian dalam ${a} hari, sedangkan Pak Udin dalam ${b} hari. Jika bekerja bersama, pagar selesai dalam … hari`, k, f: String, sal: [(a + b) / 2, a + b, Math.abs(a - b), k + 1], e: `Kecepatan bersama = 1/${a} + 1/${b} = ${(a + b)}/${a * b} pagar per hari, sehingga waktunya ${a * b}/${a + b} = ${k} hari.` }; },
  // pembagian perbandingan
  (r) => { const [x, y, z] = [r.int(1, 5), r.int(2, 6), r.int(3, 7)]; const s = x + y + z, u = r.int(2, 9) * 50000; const tot = s * u; const nm = r.sample(NAMA, 3);
    return { q: `Uang ${rp(tot)} dibagikan kepada ${nm[0]}, ${nm[1]}, dan ${nm[2]} dengan perbandingan ${x} : ${y} : ${z}. Bagian ${nm[1]} adalah …`, k: y * u, f: rp, sal: [x * u, z * u, tot / 3, (y + 1) * u], e: `Total bagian ${s}. Satu bagian = ${rp(tot)} : ${s} = ${rp(u)}. ${nm[1]} = ${y} × ${rp(u)} = ${rp(y * u)}.` }; },
  // skala peta
  (r) => { const cm = r.int(3, 18) + (r.chance(0.3) ? 0.5 : 0), sk = r.pick([250000, 500000, 1000000, 1500000, 2000000]); const km = cm * sk / 1e5; if (!Number.isInteger(km * 10)) return null;
    const f = (n) => String(n).replace(".", ",") + " km";
    return { q: `Pada peta berskala 1 : ${ribuan(sk)}, jarak dua kota adalah ${String(cm).replace(".", ",")} cm. Jarak sebenarnya adalah …`, k: km, f, sal: [km * 10, km / 10, cm * sk / 1e3, km + 5], e: `${String(cm).replace(".", ",")} cm × ${ribuan(sk)} = ${ribuan(cm * sk)} cm = ${f(km)} (1 km = 100.000 cm).` }; },
  // gaji + lembur
  (r) => { const g = r.int(30, 80) * 1e5, tarif = r.int(20, 50) * 1000, j = r.int(6, 30); const k = g + tarif * j; const nm = r.pick(NAMA);
    return { q: `Gaji pokok ${nm} ${rp(g)} per bulan. Bulan ini ia lembur ${j} jam dengan upah lembur ${rp(tarif)} per jam. Penghasilan ${nm} bulan ini adalah …`, k, f: rp, sal: [g + tarif * (j - 2), tarif * j, g + tarif * j * 2, k + 100000], e: `${rp(g)} + (${j} × ${rp(tarif)}) = ${rp(g)} + ${rp(tarif * j)} = ${rp(k)}.` }; },
  // naik lalu turun persen
  (r) => { const h = r.int(4, 40) * 10000, n = r.pick([10, 20, 25, 50]), t = r.pick([10, 20, 25]); const k = h * (100 + n) / 100 * (100 - t) / 100; if (!Number.isInteger(k)) return null;
    return { q: `Harga suatu barang ${rp(h)} naik ${n}%, lalu turun ${t}% dari harga barunya. Harga akhirnya adalah …`, k, f: rp, sal: [h * (100 + n - t) / 100, h * (100 + n) / 100, h * (100 - t) / 100, h], e: `${rp(h)} × ${100 + n}% = ${rp(h * (100 + n) / 100)}; lalu × ${100 - t}% = ${rp(k)}. Persentase berurutan tidak boleh dijumlahkan.` }; },
  // umur
  (r) => { const anak = r.int(6, 18), lalu = r.int(2, 6), kali = r.pick([3, 4, 5]); const ayahLalu = (anak - lalu) * kali; const ayah = ayahLalu + lalu; if (ayah < 25 || ayah > 70 || anak - lalu < 2) return null; const S = ayah + anak;
    return { q: `Jumlah umur ayah dan anak sekarang ${S} tahun. ${lalu} tahun lalu, umur ayah ${kali} kali umur anak. Umur anak sekarang adalah … tahun`, k: anak, f: String, sal: [anak - lalu, Math.round(S / (kali + 1)), anak + lalu, anak + 1], e: `Misal umur anak a. Ayah = ${S} − a. ${lalu} tahun lalu: ${S} − a − ${lalu} = ${kali}(a − ${lalu}) → ${S - lalu + kali * lalu} = ${kali + 1}a → a = ${anak}.` }; },
  // harga satuan lusin/kodi
  (r) => { const sat = r.pick([["lusin", 12], ["kodi", 20], ["gros", 144]]); const n = r.int(2, 6), per = r.int(2, 12) * 500; const tot = n * sat[1] * per;
    return { q: `Toko membeli ${n} ${sat[0]} pensil seharga ${rp(tot)}. Harga satu pensil adalah …`, k: per, f: rp, sal: [tot / n, tot / (n * 10), per * 2, tot / (n * (sat[1] === 12 ? 20 : 12))].filter((v) => Number.isInteger(v)), e: `1 ${sat[0]} = ${sat[1]} buah, jadi ${n} ${sat[0]} = ${n * sat[1]} buah. ${rp(tot)} : ${n * sat[1]} = ${rp(per)}.` }; },
  // potongan pajak honor
  (r) => { const h = r.int(10, 80) * 1e5, p = r.pick([2.5, 5, 6, 15]); const pot = h * p / 100; if (!Number.isInteger(pot)) return null; const k = h - pot;
    return { q: `Seorang narasumber menerima honor ${rp(h)} yang dipotong pajak ${persen(p)}. Honor bersih yang diterima adalah …`, k, f: rp, sal: [pot, h + pot, h - pot * 2, h - h * p / 1000], e: `Potongan = ${persen(p)} × ${rp(h)} = ${rp(pot)}. Bersih = ${rp(h)} − ${rp(pot)} = ${rp(k)}.` }; },
];

export function aritmatika(rng) {
  for (let i = 0; i < 300; i++) {
    const s = rng.pick(T)(rng);
    if (!s) continue;
    const sal = s.sal.filter((v) => Number.isFinite(v) && v > 0 && Number.isInteger(Math.round(v * 10)));
    const kf = s.f(s.k);
    const peng = unikkan(kf, sal.map((v) => s.f(Math.round(v * 10) / 10)).filter((x) => x !== s.f(s.k)), 4, (r) => s.f(Math.round(s.k * (1 + r.pick([-0.2, -0.1, 0.1, 0.15, 0.2])))), rng);
    if (peng.includes(kf) || peng.length < 4) continue;
    return { q: `<p>${s.q}</p>`, o: [kf].concat(peng), e: s.e };
  }
  throw new Error("aritmatika gagal");
}
