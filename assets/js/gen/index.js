// Metadata subtes psikotes UPKP + pintu masuk generator (browser & Node).
import { buatRng, susunOpsi } from "./rng.js";
import { instruksi } from "./instruksi.js";
import { silogisme } from "./silogisme.js";
import { diagram } from "./diagram.js";
import { operasi } from "./operasi.js";
import { aritmatika } from "./aritmatika.js";
import { block } from "./block.js";
import { visualSet } from "./visual.js";

// n, durasi (detik), batas = batas waktu per soal (detik), target = tempo ideal per soal (detik).
export const SUBTES = [
  { kode: "LPI", no: 1, nama: "Logika Penalaran Instruksi", n: 20, durasi: 14 * 60, batas: 45, target: 30, jenis: "pg", gen: instruksi,
    petunjuk: "Baca tabel kata, jalankan penukaran berurutan, lalu ikuti syarat untuk menemukan kata jawaban.",
    kiat: ["Tandai koordinat dengan jari: baris = mendatar, kolom = menurun.", "Kerjakan penukaran dulu, baru cek syarat pada kata hasil penukaran.", "Hitung huruf dengan pelan — jebakan paling sering ada di sini."] },
  { kode: "SIL", no: 2, nama: "Penalaran Silogisme", n: 24, durasi: 20 * 60, batas: 60, target: 45, jenis: "pg", gen: silogisme,
    petunjuk: "Pilih kesimpulan yang PASTI benar berdasarkan pernyataan yang diberikan, bukan yang hanya mungkin.",
    kiat: ["Perhatikan kata semua, sebagian, tidak ada, jika–maka.", "Gambar lingkaran Venn kecil di kepala/kertas.", "“Jika A maka B” tidak berarti “jika B maka A”."] },
  { kode: "DR", no: 3, nama: "Diagram Reasoning", n: 20, durasi: 18 * 60, batas: 60, target: 45, jenis: "pg", gen: diagram,
    petunjuk: "Pelajari arti tiap aturan bernomor dari contohnya, lalu terapkan berurutan pada figur di soal.",
    kiat: ["Tulis singkat arti tiap nomor: P90, P180, CK (cermin kiri-kanan), W (warna).", "Terapkan aturan satu per satu, kiri ke kanan.", "Abaikan bentuk di contoh; yang penting perubahannya."] },
  { kode: "SA", no: 4, nama: "Sinonim-Antonim", n: 30, durasi: 10 * 60, batas: 30, target: 20, jenis: "pasangan",
    petunjuk: "Dari lima kata, pilih DUA kata yang bersinonim (sama makna) atau berantonim (lawan makna).",
    kiat: ["Cari kata paling “aneh” lebih dulu; pasangannya biasanya ada.", "Kata serapan (otonom, rekonsiliasi) sering jadi kunci.", "Jangan kejar arti sempurna — pilih pasangan paling kuat."] },
  { kode: "PK", no: 5, nama: "Pengelompokan Kata", n: 25, durasi: 8 * 60, batas: 30, target: 15, jenis: "pg",
    petunjuk: "Lengkapi kelompok kata, atau pilih satu kata yang paling berbeda dari yang lain.",
    kiat: ["Tentukan nama kelompoknya dengan satu kata (alat tulis, planet, protein hewani).", "Uji tiap opsi pada nama kelompok itu.", "Kata yang tidak Anda pahami: lewati, cek opsi lain dulu."] },
  { kode: "OM", no: 6, nama: "Operasi Matematika", n: 20, durasi: 12 * 60, batas: 45, target: 30, jenis: "pg", gen: operasi,
    petunjuk: "Cari angka atau tanda operasi pengganti ? agar kedua sisi persamaan bernilai sama.",
    kiat: ["Hitung sisi yang lengkap lebih dulu.", "Untuk mencari tanda, coba × dan : dulu — paling sering jadi kunci.", "Kerjakan yang di dalam kurung dulu."] },
  { kode: "AS", no: 7, nama: "Aritmatika Sosial", n: 20, durasi: 12 * 60, batas: 45, target: 30, jenis: "pg", gen: aritmatika,
    petunjuk: "Selesaikan soal cerita sehari-hari: harga, diskon, angsuran, kecepatan, perbandingan.",
    kiat: ["Coret nol di belakang sejak awal, kembalikan di akhir.", "Cek digit terakhir opsi untuk mengeliminasi cepat.", "1 tahun = 12 bulan = 52 minggu; diskon bertingkat tidak dijumlah."] },
  { kode: "BP", no: 8, nama: "Block Pattern", n: 30, durasi: 4 * 60, batas: 10, target: 6, jenis: "pg", gen: block,
    petunjuk: "Pilih potongan yang tepat untuk kuadran bertanda ? pada pola besar.",
    kiat: ["Lihat sudut luar kuadran yang ditanya — itu ciri paling cepat.", "Waspadai potongan yang benar tapi diputar atau dicerminkan.", "Jangan lebih dari 10 detik per soal."] },
  { kode: "VM", no: 9, nama: "Visual Matching", n: 150, durasi: 150 * 5, batas: 5, target: 3, jenis: "vm",
    petunjuk: "Hafalkan dulu enam gambar referensi A–F. Setelah itu referensi disembunyikan; cocokkan setiap gambar dengan hurufnya. Tekan A–F atau 1–6 di papan ketik.",
    kiat: ["Manfaatkan waktu hafal: tetapkan satu ciri pembeda per huruf.", "Pakai satu ciri pembeda tiap referensi (arah garis, jumlah garis).", "Ritme 3 detik: lihat → tekan → lanjut, jangan ragu."] },
  { kode: "PD", no: 10, nama: "Tes Penilaian Diri", n: 61, durasi: 30 * 60, batas: 0, target: 0, jenis: "likert",
    petunjuk: "Pilih seberapa pernyataan menggambarkan diri Anda. Tidak ada jawaban benar atau salah.",
    kiat: ["Jawab konsisten — pernyataan yang sama bisa muncul lagi.", "Kurangi pilihan “Agak menggambarkan”.", "Posisikan diri sebagai calon pemimpin yang baik, tetapi tetap realistis."] },
  { kode: "KK", no: 11, nama: "Tes Kepribadian (Kantor & Lingkungan)", n: 68, durasi: 40 * 60, batas: 0, target: 0, jenis: "likert",
    petunjuk: "Baca ilustrasi situasi kerja, lalu nilai seberapa tiap pernyataan menggambarkan tindakan Anda.",
    kiat: ["Utamakan kerja sama dan penyelesaian masalah, bukan menghindar.", "Jangan mengubah jawaban yang sudah dipilih.", "Kerjakan berurutan; tidak perlu buru-buru."] },
];
export const KODE = Object.fromEntries(SUBTES.map((s) => [s.kode, s]));
export const GEN_KODE = SUBTES.filter((s) => s.gen || s.kode === "VM").map((s) => s.kode);

// Buat n soal untuk satu subtes (generator). posisiKunci: array opsional untuk meratakan kunci.
export function buatSubtes(kode, seed, n, posisiKunci) {
  const rng = buatRng(seed + ":" + kode);
  const meta = KODE[kode];
  if (kode === "VM") return visualSet(rng, n);
  const soal = [], lihat = new Set();
  let jaga = 0;
  while (soal.length < n && jaga++ < n * 30) {
    const s = meta.gen(rng);
    const sidik = s.q.replace(/<[^>]+>/g, "").slice(0, 400) + "|" + s.o[0];
    if (lihat.has(sidik)) continue;
    lihat.add(sidik);
    const pk = posisiKunci ? posisiKunci[soal.length] : null;
    const { o, k } = susunOpsi(rng, s.o, pk);
    soal.push({ q: s.q, o, k, e: s.e });
  }
  return { soal };
}
export { buatRng };
