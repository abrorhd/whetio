// Materi psikotes: konsep, langkah, jebakan, contoh terbahas, dan "Coba 1 soal" per subtes.
// Semua teks dan contoh ditulis orisinal untuk Whetio (bukan kutipan modul).
import { kepalaSitus } from "./kuis.js";
import { kaki } from "./beranda.js";
import { SUBTES, KODE, buatSubtes } from "./gen/index.js";
import { buatRng, esc } from "./gen/rng.js";
import { figur, OPS } from "./gen/diagram.js";

const HURUF = "ABCDEF";
const K_BACA = "whetio:psikotes:materi";
const baca = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
const tulis = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const acak = () => Math.random().toString(36).slice(2);

// ---------- ilustrasi ----------
function venn(jenis) {
  const L = (x, y, t) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="13" font-weight="800" fill="var(--ink)">${t}</text>`;
  const C = (cx, cy, r, isi = "none") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${isi}" stroke="var(--accent)" stroke-width="2.5"/>`;
  const X = (x, y) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="16" font-weight="800" fill="var(--spark)">×</text>`;
  const g = {
    semua: C(70, 45, 38) + C(62, 50, 18, "var(--accent-soft)") + L(62, 55, "A") + L(94, 72, "B"),
    tidak: C(40, 45, 24, "var(--accent-soft)") + C(102, 45, 24) + L(40, 50, "A") + L(102, 50, "B"),
    sebagian: C(54, 45, 28, "var(--accent-soft)") + C(88, 45, 28) + L(40, 50, "A") + L(104, 50, "B") + X(71, 51),
    bukan: C(54, 45, 28, "var(--accent-soft)") + C(88, 45, 28) + L(54, 30, "A") + L(104, 50, "B") + X(42, 56),
  }[jenis];
  return `<svg viewBox="0 0 140 90" width="140" height="90" aria-hidden="true">${g}</svg>`;
}
const DASAR = { b: "bendera", rot: 0, cer: 0, isi: 0, kecil: 0, titik: 0 };
const terap = (s, ops) => ops.reduce((x, o) => OPS[o].f(x), s);
function galeriDR() {
  const daftar = [["asli", [], "Figur asli"], ["R90", ["R90"], "P90 · putar 90° searah jarum jam"], ["R270", ["R270"], "P90← · putar 90° berlawanan"],
    ["R180", ["R180"], "P180 · putar 180°"], ["CH", ["CH"], "CK · cermin kiri–kanan"], ["CV", ["CV"], "CA · cermin atas–bawah"],
    ["INV", ["INV"], "W · balik warna"], ["UK", ["UK"], "U · ubah ukuran"], ["TT", ["TT"], "T · tambah/hapus titik"]];
  return `<div class="ilus-grid">${daftar.map(([, ops, t]) => `<figure>${figur(terap(DASAR, ops), 64)}<figcaption>${t}</figcaption></figure>`).join("")}</div>`;
}

// ---------- isi materi ----------
const KELOMPOK = [
  { judul: "Penalaran", sub: "Mengikuti instruksi, menarik kesimpulan, dan membaca aturan gambar.", kode: ["LPI", "SIL", "DR"] },
  { judul: "Verbal", sub: "Makna kata dan pengelompokan.", kode: ["SA", "PK"] },
  { judul: "Numerik", sub: "Berhitung cepat dan soal cerita sehari-hari.", kode: ["OM", "AS"] },
  { judul: "Figural dan kecepatan", sub: "Pola visual dalam hitungan detik.", kode: ["BP", "VM"] },
  { judul: "Kepribadian", sub: "Tanpa jawaban benar; yang dinilai kecenderungan dan konsistensi.", kode: ["PD", "KK"] },
];

const M = {
  LPI: {
    ukur: "Ketelitian mengikuti instruksi bertingkat dan daya ingat kerja: beberapa langkah harus dipegang sekaligus tanpa tertukar.",
    konsep: `<p>Soal berisi <b>tabel kata</b> dan satu paragraf instruksi. Koordinat selalu ditulis <b>baris dulu, baru kolom</b>. Baris dihitung dari atas (mendatar), kolom dari kiri (menurun).</p>
      <p>Instruksinya tersusun dari tiga bagian:</p>
      <ol><li><b>Penukaran</b> (0–2 kali): dua kotak bertukar isi, dijalankan berurutan.</li>
      <li><b>Syarat</b> pada satu kotak, diuji pada isi kotak <i>setelah</i> semua penukaran.</li>
      <li><b>Arah jawaban</b> dihitung dari kotak syarat: kanan, kiri, atas, bawah, dua kotak, atau serong.</li></ol>
      <table class="tbl"><thead><tr><th>Bunyi syarat</th><th>Cara mengecek</th></tr></thead><tbody>
      <tr><td>lebih dari N huruf</td><td>N tidak termasuk. “Lebih dari empat” berarti 5 huruf ke atas.</td></tr>
      <tr><td>kurang dari N huruf</td><td>N tidak termasuk. “Kurang dari lima” berarti 4 huruf ke bawah.</td></tr>
      <tr><td>tepat N huruf</td><td>Harus sama persis.</td></tr>
      <tr><td>diawali / diakhiri huruf vokal</td><td>Vokal hanya A, I, U, E, O. Selain itu konsonan.</td></tr>
      <tr><td>mengandung huruf X</td><td>Huruf X boleh di posisi mana saja dalam kata.</td></tr></tbody></table>`,
    langkah: ["Baca instruksi sampai habis sekali, lalu tandai kotak-kotak yang disebut.", "Jalankan penukaran satu per satu. Cukup catat isi baru kotak yang terlibat.", "Ambil kata di kotak syarat <b>setelah</b> penukaran, lalu uji syaratnya.", "Syarat terpenuhi → ikuti cabang “maka”. Tidak terpenuhi → cabang “jika tidak”.", "Hitung arah dari kotak syarat, lalu baca kata di sana."],
    jebakan: ["Menguji syarat pada kata <i>sebelum</i> ditukar. Jawaban versi ini hampir selalu tersedia di opsi.", "Tertukar baris dan kolom: “baris 2 kolom 3” tidak sama dengan “baris 3 kolom 2”.", "Menganggap “lebih dari empat” termasuk empat.", "Menghitung “dua kotak di bawahnya” sebagai satu kotak, atau menghitung arah dari kotak penukaran."],
    contoh: {
      q: `<div class="stem-instruksi"><table class="grid-kata"><tr><td>Kopi</td><td>Garam</td><td>Lilin</td><td>Pena</td></tr><tr><td>Topi</td><td>Ember</td><td>Kasur</td><td>Udang</td></tr><tr><td>Batu</td><td>Sendok</td><td>Ombak</td><td>Atap</td></tr></table>
        <p>Tukar baris 1 kolom 2 dengan baris 3 kolom 3. Jika baris 1 kolom 2 diawali huruf vokal, maka jawabannya adalah kotak di bawahnya. Jika tidak, maka jawabannya adalah kotak di sebelah kanannya.</p></div>`,
      o: ["Ember", "Lilin", "Ombak", "Kasur", "Sendok"], k: 0,
      langkah: ["Penukaran: baris 1 kolom 2 (Garam) ↔ baris 3 kolom 3 (Ombak). Sekarang baris 1 kolom 2 berisi <b>Ombak</b>.", "Syarat: Ombak diawali O, huruf vokal → syarat terpenuhi.", "Cabang “maka”: kotak di bawah baris 1 kolom 2 adalah baris 2 kolom 2 = <b>Ember</b>.", "Jebakan: tanpa penukaran, kotaknya berisi Garam (konsonan) sehingga Anda memilih kotak kanannya, Lilin."],
    },
  },
  SIL: {
    ukur: "Penalaran deduktif: menarik kesimpulan yang pasti benar dari pernyataan yang diberikan, terlepas dari benar tidaknya pernyataan itu di dunia nyata.",
    konsep: `<p>Kata kuncinya <b>pasti</b>. Kesimpulan yang “mungkin benar” atau “sesuai kenyataan” tetap salah bila tidak dijamin oleh pernyataan di soal.</p>
      <h4>Empat bentuk pernyataan</h4>
      <div class="ilus-grid lebar"><figure>${venn("semua")}<figcaption><b>Semua A adalah B</b><br>seluruh A berada di dalam B</figcaption></figure>
      <figure>${venn("tidak")}<figcaption><b>Tidak ada A yang B</b><br>A dan B terpisah sama sekali</figcaption></figure>
      <figure>${venn("sebagian")}<figcaption><b>Sebagian A adalah B</b><br>paling sedikit satu A juga B</figcaption></figure>
      <figure>${venn("bukan")}<figcaption><b>Sebagian A bukan B</b><br>paling sedikit satu A di luar B</figcaption></figure></div>
      <p class="hint">“Sebagian” berarti paling sedikit satu, dan tidak menutup kemungkinan semuanya. Di Whetio setiap kelompok dianggap punya anggota, sehingga “Semua A adalah B” juga menjamin “Sebagian A adalah B”.</p>
      <h4>Pola kategoris yang sah</h4>
      <table class="tbl"><thead><tr><th>Premis 1</th><th>Premis 2</th><th>Kesimpulan pasti</th></tr></thead><tbody>
      <tr><td>Semua A adalah B</td><td>Semua B adalah C</td><td>Semua A adalah C</td></tr>
      <tr><td>Semua A adalah B</td><td>Tidak ada B yang C</td><td>Tidak ada A yang C</td></tr>
      <tr><td>Sebagian A adalah B</td><td>Semua B adalah C</td><td>Sebagian A adalah C</td></tr>
      <tr><td>Sebagian A adalah B</td><td>Tidak ada B yang C</td><td>Sebagian A bukan C</td></tr>
      <tr><td>Semua B adalah A</td><td>Semua B adalah C</td><td>Sebagian A adalah C</td></tr></tbody></table>
      <h4>Pola yang tidak menghasilkan kesimpulan pasti</h4>
      <ul><li>Semua A adalah B dan semua C adalah B: A dan C belum tentu beririsan.</li>
      <li>Sebagian A adalah B dan sebagian B adalah C: belum tentu ada A yang juga C.</li>
      <li>Dua premis negatif (tidak ada… dan tidak ada…): tidak ada kesimpulan.</li>
      <li>Semua A adalah B dan tidak ada C yang A: C belum tentu berada di luar B.</li></ul>
      <h4>Pernyataan jika–maka</h4>
      <table class="tbl"><thead><tr><th>Pola</th><th>Premis</th><th>Kesimpulan</th></tr></thead><tbody>
      <tr><td>Modus ponens</td><td>Jika p maka q. p.</td><td>q</td></tr>
      <tr><td>Modus tollens</td><td>Jika p maka q. Tidak q.</td><td>Tidak p</td></tr>
      <tr><td>Silogisme hipotetis</td><td>Jika p maka q. Jika q maka r.</td><td>Jika p maka r (setara: jika tidak r maka tidak p)</td></tr>
      <tr><td>Silogisme disjungtif</td><td>p atau q. Tidak p.</td><td>q</td></tr></tbody></table>
      <p>Pernyataan yang <b>setara</b> dengan “jika p maka q” hanya kontraposisinya: “jika tidak q maka tidak p”. Pernyataan “jika q maka p” (konvers) dan “jika tidak p maka tidak q” (invers) <b>tidak setara</b>.</p>`,
    langkah: ["Tandai kata kunci: semua, sebagian, tidak ada, jika–maka, atau.", "Gambar lingkaran kecil untuk pernyataan kategoris, atau tulis p → q untuk jika–maka.", "Cari istilah yang muncul di kedua premis (istilah tengah). Kesimpulan tidak memuat istilah itu.", "Uji tiap opsi: adakah gambar yang memenuhi semua premis tetapi membuat opsi itu salah? Kalau ada, opsi itu bukan kesimpulan pasti."],
    jebakan: ["Membalik jika–maka. Dari “jika hujan, jalan basah” dan “jalan basah”, Anda tidak bisa menyimpulkan bahwa hujan turun.", "Memperkuat kuantor: “sebagian” diubah menjadi “semua”.", "Memilih kesimpulan yang benar di dunia nyata tetapi tidak didukung premis.", "Terpancing premis tambahan yang tidak berkaitan. Abaikan, karena ia tidak menyumbang kesimpulan."],
    contoh: {
      q: `<p class="premis">Semua pelari adalah atlet. Sebagian mahasiswa adalah pelari.</p><p class="tanya">Kesimpulan yang tepat adalah …</p>`,
      o: ["Sebagian mahasiswa adalah atlet.", "Semua mahasiswa adalah atlet.", "Sebagian atlet bukan mahasiswa.", "Semua atlet adalah pelari.", "Tidak ada mahasiswa yang atlet."], k: 0,
      langkah: ["Premis 1: lingkaran pelari berada di dalam lingkaran atlet.", "Premis 2: ada mahasiswa yang berada di lingkaran pelari, jadi mahasiswa itu pasti juga berada di lingkaran atlet.", "Kesimpulan pasti: <b>Sebagian mahasiswa adalah atlet</b>.", "“Sebagian atlet bukan mahasiswa” mungkin benar, tetapi bisa saja semua atlet adalah mahasiswa, jadi tidak pasti. “Semua atlet adalah pelari” membalik premis 1."],
    },
  },
  DR: {
    ukur: "Penalaran figural: menyimpulkan arti aturan dari contoh gambar, lalu menerapkannya berurutan pada gambar baru.",
    konsep: `<p>Soal memberi empat aturan bernomor. Setiap aturan diperlihatkan lewat contoh (gambar → nomor → gambar), dan arti tiap nomor harus Anda simpulkan sendiri. Setelah itu ada figur awal dengan deretan nomor, misalnya ② → ④. Terapkan aturannya sesuai urutan tersebut.</p>
      <p>Perubahan yang dipakai di latihan Whetio, diterapkan pada satu figur:</p>${galeriDR()}
      <ul><li><b>Putar 180°</b> sama dengan cermin kiri–kanan ditambah cermin atas–bawah. Hasilnya berbeda dari satu kali cermin.</li>
      <li>Putar 90° <b>searah</b> dan <b>berlawanan arah</b> jarum jam menghasilkan gambar yang berbeda. Pantau bagian yang paling khas, misalnya ujung bendera.</li>
      <li>Satu nomor bisa berisi dua perubahan sekaligus, misalnya putar 90° + balik warna. Bandingkan empat ciri gambar kiri dan kanan: arah, cermin, warna, serta ukuran atau titik.</li></ul>`,
    langkah: ["Catat arti tiap nomor dengan singkatan di kertas coret, misalnya 1 = P90, 2 = CK + W.", "Untuk setiap contoh, bandingkan arah, cermin, warna, dan ukuran/titik.", "Terapkan nomor di soal satu per satu dari kiri ke kanan. Buat sketsa kasar tiap langkah.", "Cocokkan dengan opsi lewat ciri paling khas sebelum memilih."],
    jebakan: ["Urutan dibalik. Putaran dan cermin yang ditukar urutannya menghasilkan gambar lain.", "Melewatkan satu aturan, biasanya yang terakhir.", "Salah arah putaran: searah dan berlawanan arah tertukar.", "Lupa bagian warna atau titik dari aturan gabungan."],
    contoh: null, // dibuat dari generator figur agar gambar selalu tepat (lihat contohDR)
  },
  SA: {
    ukur: "Kosakata dan ketepatan memahami makna kata baku, termasuk kata serapan dan istilah administrasi.",
    konsep: `<p>Dari lima kata, tepat dua yang bersinonim (makna sama) <b>atau</b> berantonim (makna berlawanan). Tiga kata lainnya pengecoh. Soal tidak memberi tahu apakah pasangannya sinonim atau antonim.</p>
      <div class="dua-kolom"><div><h4>Contoh sinonim baku</h4><table class="tbl"><tbody>
      <tr><td>absolut</td><td>mutlak</td></tr><tr><td>nisbi</td><td>relatif</td></tr><tr><td>konkret</td><td>nyata</td></tr><tr><td>fiktif</td><td>rekaan</td></tr>
      <tr><td>kredibel</td><td>tepercaya</td></tr><tr><td>esensial</td><td>hakiki</td></tr><tr><td>sahih</td><td>valid</td></tr><tr><td>prakarsa</td><td>inisiatif</td></tr>
      <tr><td>kendala</td><td>hambatan</td></tr><tr><td>paripurna</td><td>lengkap</td></tr></tbody></table></div>
      <div><h4>Contoh antonim baku</h4><table class="tbl"><tbody>
      <tr><td>surplus</td><td>defisit</td></tr><tr><td>konkret</td><td>abstrak</td></tr><tr><td>eksplisit</td><td>implisit</td></tr><tr><td>homogen</td><td>heterogen</td></tr>
      <tr><td>mayoritas</td><td>minoritas</td></tr><tr><td>sentralisasi</td><td>desentralisasi</td></tr><tr><td>ofensif</td><td>defensif</td></tr><tr><td>statis</td><td>dinamis</td></tr>
      <tr><td>kolektif</td><td>individual</td></tr><tr><td>makro</td><td>mikro</td></tr></tbody></table></div></div>
      <h4>Kata yang sering salah kaprah</h4>
      <ul><li><b>acuh</b> berarti peduli, bukan tidak peduli. Yang berarti tidak peduli adalah <i>tak acuh</i>.</li>
      <li><b>bergeming</b> berarti diam, tidak bergerak.</li>
      <li><b>nisbi</b> berarti relatif, lawan kata <i>mutlak</i>.</li></ul>`,
    langkah: ["Mulai dari kata yang paling spesifik atau jarang dipakai. Biasanya ia anggota pasangan.", "Uji calon pasangan dengan kalimat: “X sama artinya dengan Y” atau “X lawan katanya Y”.", "Abaikan bunyi yang mirip, cek maknanya.", "Bila ada dua pasangan yang tampak mungkin, pilih yang hubungannya paling kuat dan baku."],
    jebakan: ["Kata sebidang makna tetapi bukan sinonim, misalnya laut dan ombak.", "Bunyi atau imbuhan yang mirip: akurat–aktual, statis–status, sosialisasi–spesialisasi.", "Arti yang salah kaprah (acuh, bergeming)."],
    contoh: { jenis: "pasangan", w: ["Akurat", "Aktual", "Saksama", "Akuntabel", "Adaptif"], k: [0, 2], r: "S",
      langkah: ["Lima kata ini berawalan mirip. Itu sengaja, agar Anda terpancing bunyi.", "Akurat berarti teliti dan tepat benar; saksama berarti teliti dan cermat. Keduanya <b>sinonim</b>.", "Aktual (terkini), akuntabel (dapat dipertanggungjawabkan), dan adaptif (mudah menyesuaikan diri) tidak berpasangan dengan kata mana pun."] },
  },
  PK: {
    ukur: "Penalaran verbal: mengenali kelompok atau kategori makna dengan cepat.",
    konsep: `<p>Ada dua bentuk soal:</p>
      <ul><li><b>Lengkapi kelompok:</b> tiga kata sekelompok diberikan, lalu pilih satu opsi yang masuk kelompok yang sama.</li>
      <li><b>Kata paling berbeda:</b> dari lima kata, empat sekelompok. Pilih satu yang tidak.</li></ul>
      <p>Kuncinya ada pada <b>nama kelompok yang spesifik</b>. Biola, selo, dan kontrabas bukan sekadar “alat musik”, tetapi “alat musik gesek”. Karena itu gitar (dipetik) dan piano (ditekan) bukan jawabannya.</p>
      <table class="tbl"><thead><tr><th>Dasar pengelompokan</th><th>Contoh kelompok</th></tr></thead><tbody>
      <tr><td>Jenis</td><td>mamalia laut, hewan berkantong, unggas, umbi-umbian, rempah</td></tr>
      <tr><td>Cara kerja</td><td>alat musik gesek / petik / tiup / pukul</td></tr>
      <tr><td>Fungsi</td><td>alat ukur, alat tulis, alat pertukangan</td></tr>
      <tr><td>Bidang</td><td>profesi hukum, profesi kesehatan, istilah anggaran</td></tr>
      <tr><td>Satuan</td><td>panjang, massa, waktu, volume</td></tr>
      <tr><td>Benda langit</td><td>planet, satelit, bintang</td></tr></tbody></table>`,
    langkah: ["Beri nama kelompok sespesifik mungkin, cukup 2–3 kata.", "Uji setiap opsi terhadap nama itu.", "Bila dua opsi sama-sama lolos, persempit nama kelompoknya.", "Kata yang tidak Anda kenal: uji opsi lain dulu, mungkin ia bisa dieliminasi."],
    jebakan: ["Nama kelompok terlalu luas sehingga dua opsi tampak benar.", "Hidup di air dianggap ikan: lumba-lumba dan paus termasuk mamalia.", "Bulan dianggap planet, padahal ia satelit Bumi."],
    contoh: { q: `<p class="premis">Biola · Selo · Kontrabas</p><p class="tanya">Kata yang sekelompok dengan ketiga kata di atas adalah …</p>`,
      o: ["Rebab", "Gitar", "Piano", "Seruling", "Kecapi"], k: 0,
      langkah: ["Nama kelompok: <b>alat musik gesek</b>.", "Rebab dimainkan dengan cara digesek, jadi masuk kelompok.", "Gitar dan kecapi dipetik, piano ditekan, seruling ditiup. Semuanya alat musik, tetapi bukan alat gesek."] },
  },
  OM: {
    ukur: "Kelancaran berhitung dasar dan ketelitian urutan operasi.",
    konsep: `<p>Soal berupa persamaan dengan satu tanda <b>?</b>, yang bisa berupa angka atau tanda operasi (+, −, ×, :). Kedua sisi persamaan harus bernilai sama.</p>
      <p><b>Urutan operasi:</b> kurung → kali dan bagi (dari kiri) → tambah dan kurang (dari kiri).</p>
      <table class="tbl"><thead><tr><th>Bentuk</th><th>Cara membalik</th></tr></thead><tbody>
      <tr><td>? + d = T</td><td>? = T − d</td></tr><tr><td>? − d = T</td><td>? = T + d</td></tr>
      <tr><td>? × d = T</td><td>? = T : d</td></tr><tr><td>(? × d) + e = T</td><td>? = (T − e) : d</td></tr>
      <tr><td>(? + e) × d = T</td><td>? = (T : d) − e</td></tr></tbody></table>
      <p><b>Mencari tanda:</b> hasil jauh lebih besar dari kedua angka biasanya berarti ×. Hasil lebih kecil dan habis dibagi biasanya berarti :. Selalu cek dengan menghitung ulang. Opsi “=” hanya pengecoh, karena yang dicari tanda operasi hitung.</p>`,
    langkah: ["Hitung dulu sisi yang tidak mengandung ?.", "Bongkar sisi yang mengandung ? dari luar ke dalam dengan operasi kebalikan.", "Masukkan jawaban ke soal untuk cek cepat (2–3 detik)."],
    jebakan: ["Mengerjakan dari kiri ke kanan begitu saja dan mengabaikan kurung.", "Tambah dikerjakan sebelum kali.", "Lupa membalik tanda: ? − 8 = 20 berarti ? = 28, bukan 12."],
    contoh: { q: `<p class="persamaan">(6 × 7) − ? = (48 : 4) + 18</p><p class="tanya">? = …</p>`, o: ["12", "30", "18", "24", "6"], k: 0,
      langkah: ["Sisi kanan: 48 : 4 = 12, lalu 12 + 18 = <b>30</b>.", "Sisi kiri: 6 × 7 = 42, sehingga 42 − ? = 30.", "? = 42 − 30 = <b>12</b>.", "Cek: 42 − 12 = 30 ✓. Opsi 30 adalah jebakan bagi yang berhenti setelah menghitung sisi kanan."] },
  },
  AS: {
    ukur: "Penalaran numerik terapan: menerjemahkan cerita sehari-hari menjadi hitungan yang tepat.",
    konsep: `<table class="tbl"><thead><tr><th>Topik</th><th>Kunci hitungan</th></tr></thead><tbody>
      <tr><td>Persen</td><td>a% dari x = a/100 × x</td></tr>
      <tr><td>Diskon bertingkat</td><td>harga × (1 − d₁) × (1 − d₂). Diskon 20% + 10% <b>bukan</b> 30%.</td></tr>
      <tr><td>Naik lalu turun</td><td>harga × (1 + n) × (1 − t). Naik 25% lalu turun 20% kembali ke harga awal.</td></tr>
      <tr><td>Untung / rugi</td><td>untung % = (jual − beli) : beli × 100%. Persennya dihitung dari harga <b>beli</b>.</td></tr>
      <tr><td>Bunga tunggal</td><td>bunga = modal × bunga per tahun × (bulan : 12)</td></tr>
      <tr><td>Kecepatan</td><td>jarak = kecepatan × waktu. 2,25 jam = 2 jam 15 menit.</td></tr>
      <tr><td>Kerja bersama</td><td>waktu bersama = (a × b) : (a + b)</td></tr>
      <tr><td>Perbandingan</td><td>bagian = (porsi : jumlah porsi) × total</td></tr>
      <tr><td>Skala peta</td><td>jarak asli = jarak peta × skala. 100.000 cm = 1 km.</td></tr>
      <tr><td>Rata-rata gabungan</td><td>(n₁ × r₁ + n₂ × r₂) : (n₁ + n₂)</td></tr>
      <tr><td>Satuan</td><td>1 lusin = 12, 1 kodi = 20, 1 gros = 144. 1 tahun = 12 bulan = 52 minggu.</td></tr></tbody></table>
      <p><b>Trik cepat:</b> coret nol di belakang sejak awal lalu kembalikan di akhir, perkirakan dulu untuk membuang opsi yang mustahil, dan cek digit terakhir opsi.</p>`,
    langkah: ["Garis bawahi yang ditanya: harga akhir, persen, waktu, atau bagian?", "Tulis hanya angka penting beserta satuannya.", "Pilih rumus dari tabel, perkirakan hasilnya, baru hitung.", "Cocokkan satuan jawaban (jam:menit, rupiah, km)."],
    jebakan: ["Diskon bertingkat dijumlahkan.", "Persen untung dihitung dari harga jual.", "2,25 jam dibaca 2 jam 25 menit.", "Kerja bersama dirata-rata: (6 + 3) : 2 = 4,5 jam itu salah."],
    contoh: { q: `<p>Harga sepasang sepatu Rp250.000. Toko memberi diskon 20%, lalu diskon tambahan 10% dari harga setelah diskon pertama. Harga yang dibayar adalah …</p>`,
      o: ["Rp180.000", "Rp175.000", "Rp200.000", "Rp185.000", "Rp225.000"], k: 0,
      langkah: ["Diskon 20%: 250.000 × 0,8 = 200.000.", "Diskon tambahan 10%: 200.000 × 0,9 = <b>180.000</b>.", "Rp175.000 adalah jebakan diskon yang dijumlah (30%), dan Rp200.000 jebakan lupa diskon kedua."] },
  },
  BP: {
    ukur: "Persepsi ruang dan kecepatan mencocokkan pola dalam hitungan detik.",
    konsep: `<p>Soal menampilkan pola besar 4×4 sel. Setiap sel kosong, penuh, atau berisi segitiga hitam. Pola itu dibagi menjadi empat kuadran 2×2, dan di sebelahnya ada kerangka dengan tanda <b>?</b> di salah satu kuadran.</p>
      <p>Pilih potongan yang <b>persis sama</b> dengan kuadran di posisi ? pada pola besar, tanpa diputar, dicerminkan, atau dibalik warnanya.</p>
      <table class="tbl"><thead><tr><th>Jenis pengecoh</th><th>Cara mengenali</th></tr></thead><tbody>
      <tr><td>Kuadran lain</td><td>Posisinya beda. Cocokkan sel sudut luar kuadran yang ditanya.</td></tr>
      <tr><td>Diputar 90° atau 180°</td><td>Arah sudut siku segitiga ikut berputar.</td></tr>
      <tr><td>Dicerminkan</td><td>Segitiga menghadap ke sisi sebaliknya.</td></tr>
      <tr><td>Warna terbalik</td><td>Sel hitam menjadi putih. Hitung saja jumlah sel penuh.</td></tr></tbody></table>`,
    langkah: ["Lihat posisi ? (kiri atas, kanan atas, kiri bawah, atau kanan bawah).", "Pada pola besar, ingat satu sel sudut yang paling khas di kuadran itu.", "Buang opsi yang sel sudutnya berbeda, lalu cek satu sel lagi.", "Target sekitar 6 detik per soal. Jangan lebih dari 10 detik."],
    jebakan: ["Memilih kuadran yang posisinya bersebelahan.", "Tertipu potongan benar yang dicerminkan: polanya terlihat akrab tetapi arah segitiganya terbalik.", "Terlalu lama memastikan semua sel. Dua sel yang khas sudah cukup."],
    contoh: null,
  },
  VM: {
    ukur: "Kecepatan persepsi dan konsentrasi: mencocokkan bentuk dengan ritme yang stabil.",
    konsep: `<p>Ada enam gambar referensi berlabel A–F. Setiap soal menampilkan satu gambar, dan Anda menekan huruf referensi yang sama persis. Jumlah soalnya banyak (150), dengan batas sekitar 5 detik per soal.</p>
      <p>Kuncinya bukan teliti lama, tetapi <b>ciri pembeda</b>. Untuk setiap referensi, pilih satu ciri yang tidak dimiliki referensi lain, misalnya arah garis, jumlah garis, atau posisi titik.</p>
      <p>Di Whetio Anda bisa menekan A–F atau angka 1–6 di papan ketik. Biasakan jari tetap di tombol agar mata tidak perlu berpindah.</p>`,
    langkah: ["Gunakan 10 detik pertama untuk menghafal enam ciri pembeda.", "Lihat gambar, tekan, lanjut. Ritme sekitar 3 detik per soal.", "Ragu di antara dua referensi? Pilih yang lebih mirip lalu lanjut. Jangan berhenti."],
    jebakan: ["Bentuk yang mirip tetapi diputar atau berbeda jumlah garisnya.", "Berhenti terlalu lama di satu soal sehingga ritme pecah.", "Mengecek ulang referensi di setiap soal, padahal seharusnya dihafal di awal."],
    contoh: null,
  },
  PD: {
    ukur: "Kecenderungan sikap kerja. Tidak ada jawaban benar atau salah. Yang terbaca adalah arah profil dan konsistensi Anda.",
    konsep: `<p>Setiap butir berupa pernyataan tentang diri Anda, dinilai dengan lima pilihan dari <i>Sangat tidak menggambarkan</i> sampai <i>Sangat menggambarkan</i>.</p>
      <p>Latihan di Whetio memetakan butir ke delapan dimensi sikap kerja: <b>Integritas, Profesionalisme, Sinergi, Pelayanan, Kesempurnaan, Kepemimpinan, Ketangguhan, Ketelitian</b>. Pemetaan ini rancangan Whetio, bukan kisi-kisi resmi.</p>
      <table class="tbl"><thead><tr><th>Jenis butir</th><th>Contoh (ditulis untuk materi ini)</th></tr></thead><tbody>
      <tr><td>Pernyataan positif</td><td>“Saya menyelesaikan pekerjaan sesuai tenggat meskipun tidak diawasi.”</td></tr>
      <tr><td>Pernyataan terbalik</td><td>“Aturan boleh dilonggarkan selama hasil akhirnya baik.” Setuju dengan butir ini menurunkan skor dimensinya.</td></tr>
      <tr><td>Pasangan konsistensi</td><td>“Saya senang menyelesaikan masalah bersama tim.” dan “Saya lebih suka mengerjakan semuanya sendiri.” Jawaban keduanya seharusnya berlawanan arah.</td></tr></tbody></table>
      <p>Whetio membaca empat hal: <b>konsistensi</b> antar-butir berpasangan, <b>rasio “Agak menggambarkan”</b> (terlalu sering berarti ragu-ragu), <b>jawaban ekstrem</b> (semuanya “Sangat” bisa terbaca tidak realistis), dan <b>arah profil</b> per dimensi.</p>`,
    langkah: ["Baca pernyataan sampai selesai, terutama kata “tidak”, “boleh”, dan “selalu”.", "Jawab jujur sesuai kebiasaan Anda saat bekerja, bukan saat santai.", "Tegas: pilih “Menggambarkan” atau “Tidak menggambarkan” bila memang condong, dan gunakan “Agak” secukupnya.", "Jangan kembali mengubah jawaban."],
    jebakan: ["Butir terbalik dijawab setuju karena terburu-buru.", "Terlalu banyak “Agak menggambarkan”.", "Menjawab “Sangat” untuk semua butir sehingga profil tampak tidak realistis."],
    contoh: null,
  },
  KK: {
    ukur: "Penilaian situasi kerja: bagaimana Anda cenderung bertindak menghadapi masalah di kantor dan lingkungan kerja.",
    konsep: `<p>Setiap butir diawali <b>ilustrasi situasi kerja</b>, lalu diikuti beberapa pernyataan tindakan. Setiap pernyataan dinilai dengan skala lima pilihan yang sama seperti Tes Penilaian Diri.</p>
      <div class="ilustrasi">Contoh situasi (ditulis untuk materi ini): <i>Data yang Anda kirim ke unit lain ternyata keliru, dan hal itu baru ketahuan satu jam sebelum rapat bersama.</i></div>
      <table class="tbl"><thead><tr><th>Pernyataan tindakan</th><th>Yang tercermin</th></tr></thead><tbody>
      <tr><td>“Saya memperbaiki data, lalu segera memberi tahu unit tersebut sebelum rapat.”</td><td>tanggung jawab, pelayanan</td></tr>
      <tr><td>“Saya melapor ke atasan sambil menyiapkan data yang benar.”</td><td>keterbukaan, sinergi</td></tr>
      <tr><td>“Saya menunggu sampai ada yang bertanya.”</td><td>menghindar</td></tr>
      <tr><td>“Saya menjelaskan bahwa kesalahan itu berasal dari sistem.”</td><td>melempar tanggung jawab</td></tr></tbody></table>
      <p>Pernyataan dalam satu situasi bisa sama-sama baik. Nilailah masing-masing sesuai seberapa besar kemungkinan Anda benar-benar melakukannya.</p>`,
    langkah: ["Bayangkan situasinya terjadi pada Anda sebagai pegawai, bukan sebagai pengamat.", "Nilai setiap pernyataan secara terpisah, bukan membandingkan lalu memilih satu.", "Utamakan tindakan yang menyelesaikan masalah dan menjaga kerja sama.", "Jaga arah jawaban tetap sama dengan Tes Penilaian Diri."],
    jebakan: ["Memberi nilai tinggi pada tindakan menghindar karena terdengar “aman”.", "Profil KK bertolak belakang dengan PD, misalnya di PD sangat suka kerja tim tetapi di KK memilih menyelesaikan sendiri.", "Terburu-buru. Subtes ini tidak dibatasi per soal."],
    contoh: null,
  },
};

// ---------- bank kecil "Coba 1 soal" untuk subtes yang ditulis (bukan generator) ----------
const BANK = {
  SA: [
    { w: ["Kendala", "Hambatan", "Kendali", "Kendur", "Tujuan"], k: [0, 1], r: "S", e: "Kendala berarti halangan atau rintangan, sama dengan hambatan. Kendali (pengendali) dan kendur (tidak tegang) hanya mirip bunyi." },
    { w: ["Surplus", "Defisit", "Anggaran", "Saldo", "Inflasi"], k: [0, 1], r: "A", e: "Surplus berarti kelebihan (penerimaan melebihi pengeluaran), defisit berarti kekurangan. Anggaran, saldo, dan inflasi sebidang makna tetapi tidak berpasangan." },
    { w: ["Paripurna", "Lengkap", "Purnama", "Pariwisata", "Parlemen"], k: [0, 1], r: "S", e: "Paripurna berarti lengkap atau penuh, seperti dalam “rapat paripurna”. Purnama, pariwisata, dan parlemen hanya mirip bunyi." },
    { w: ["Sentralisasi", "Desentralisasi", "Sosialisasi", "Spesialisasi", "Sinkronisasi"], k: [0, 1], r: "A", e: "Sentralisasi berarti pemusatan, desentralisasi berarti penyerahan wewenang ke daerah atau unit bawah. Ketiga kata lain hanya berakhiran -isasi yang sama." },
    { w: ["Statis", "Dinamis", "Status", "Statistik", "Dramatis"], k: [0, 1], r: "A", e: "Statis berarti diam atau tidak berubah, dinamis berarti terus bergerak dan berubah. Status dan statistik mirip bunyi, dramatis berakhiran sama." },
    { w: ["Eksplisit", "Implisit", "Eksklusif", "Impulsif", "Ekspresif"], k: [0, 1], r: "A", e: "Eksplisit berarti dinyatakan dengan jelas, implisit berarti tersirat. Eksklusif, impulsif, dan ekspresif hanya mirip awalan." },
  ],
  PK: [
    { q: ["Rupiah", "Ringgit", "Baht"], o: ["Dong", "Yen", "Won", "Rupee", "Yuan"], g: "mata uang negara Asia Tenggara", e: "Rupiah (Indonesia), ringgit (Malaysia), dan baht (Thailand) adalah mata uang Asia Tenggara, begitu pula dong (Vietnam). Yen, won, rupee, dan yuan berasal dari Asia di luar Asia Tenggara." },
    { b: true, o: ["Lumba-lumba", "Hiu", "Pari", "Tuna", "Kakap"], g: "ikan", e: "Hiu, pari, tuna, dan kakap adalah ikan. Lumba-lumba hidup di laut tetapi termasuk mamalia: bernapas dengan paru-paru dan menyusui." },
    { b: true, o: ["Bulan", "Merkurius", "Venus", "Mars", "Saturnus"], g: "planet", e: "Merkurius, Venus, Mars, dan Saturnus adalah planet. Bulan adalah satelit alami Bumi." },
    { q: ["Notaris", "Hakim", "Jaksa"], o: ["Advokat", "Akuntan", "Auditor", "Apoteker", "Arsitek"], g: "profesi bidang hukum", e: "Notaris, hakim, dan jaksa adalah profesi hukum, begitu pula advokat (pengacara). Akuntan dan auditor bidang keuangan, apoteker kesehatan, arsitek bangunan." },
    { q: ["Meter", "Inci", "Mil"], o: ["Yard", "Liter", "Gram", "Detik", "Hektare"], g: "satuan panjang", e: "Meter, inci, dan mil adalah satuan panjang, begitu pula yard. Liter satuan volume, gram massa, detik waktu, dan hektare luas." },
  ],
};

// ---------- contoh Diagram Reasoning dari figur (selalu konsisten dengan gambar) ----------
function contohDR() {
  const awal = { b: "panah", rot: 0, cer: 0, isi: 0, kecil: 0, titik: 0 };
  const opsi = [terap(awal, ["CH", "R90"]), terap(awal, ["R90", "CH"]), terap(awal, ["CH"]), terap(awal, ["R90"]), terap(terap(awal, ["CH", "R90"]), ["INV"])];
  const contoh = [["R90", "bendera"], ["CH", "L"], ["INV", "P"]].map(([op, b], i) => {
    const a = { b, rot: 0, cer: 0, isi: 0, kecil: 0, titik: 0 };
    return `<div class="aturan">${figur(a, 52)}<span class="panah">→</span><span class="no-aturan">${i + 1}</span><span class="panah">→</span>${figur(terap(a, [op]), 52)}</div>`;
  }).join("");
  return {
    q: `<div class="stem-diagram"><div class="contoh">${contoh}</div><div class="aturan tanya">${figur(awal, 64)}<span class="panah">→</span><span class="no-aturan">2</span><span class="panah">→</span><span class="no-aturan">1</span><span class="panah">→</span><span class="tanda">?</span></div></div>`,
    o: opsi.map((s) => figur(s, 60)), k: 0,
    langkah: ["Dari contoh: 1 = putar 90° searah jarum jam, 2 = cerminkan kiri–kanan, 3 = balik warna.", "Soal meminta urutan 2 lalu 1: cerminkan panah kiri–kanan dulu, baru putar 90° searah jarum jam.", "Bandingkan sketsa akhir dengan opsi: hanya satu figur yang cocok arah dan warnanya.", "Jebakan: urutan dibalik (putar dulu baru cermin), hanya satu aturan yang dijalankan, atau warnanya ikut dibalik padahal aturan 3 tidak diminta."],
  };
}

// Urutan opsi contoh diacak tiap kunjungan agar kunci tidak selalu A.
function acakOpsi(c) {
  const rng = buatRng(acak()), idx = rng.shuffle([0, 1, 2, 3, 4]);
  if (c.jenis === "pasangan") return { ...c, w: idx.map((i) => c.w[i]), k: c.k.map((j) => idx.indexOf(j)).sort() };
  return { ...c, o: idx.map((i) => c.o[i]), k: idx.indexOf(c.k) };
}

// ---------- kartu soal interaktif ----------
const kartu = {}; // id → {q, jw, pil, buka}
let urutBank = {};
function soalCoba(kode) {
  if (kode === "SA" || kode === "PK") {
    const bank = BANK[kode];
    urutBank[kode] = ((urutBank[kode] ?? Math.floor(Math.random() * bank.length)) + 1) % bank.length;
    const x = bank[urutBank[kode]], rng = buatRng(acak());
    if (kode === "SA") {
      const idx = rng.shuffle([0, 1, 2, 3, 4]);
      return { jenis: "pasangan", w: idx.map((i) => x.w[i]), k: x.k.map((j) => idx.indexOf(j)).sort(), r: x.r, e: x.e };
    }
    const idx = rng.shuffle([0, 1, 2, 3, 4]);
    const stem = x.b ? `<p class="tanya">Kata yang paling berbeda dari yang lain adalah …</p>` : `<p class="premis">${x.q.join(" · ")}</p><p class="tanya">Kata yang sekelompok dengan ketiga kata di atas adalah …</p>`;
    return { q: stem, o: idx.map((i) => esc(x.o[i])), k: idx.indexOf(0), e: `Kelompok: <b>${esc(x.g)}</b>. ${esc(x.e)}` };
  }
  if (kode === "VM") {
    const s = buatSubtes("VM", acak(), 6);
    const i = Math.floor(Math.random() * s.soal.length);
    return { jenis: "vm", ref: s.ref, g: s.soal[i].g, k: s.soal[i].k, e: `Gambar ini sama persis dengan referensi ${HURUF[s.soal[i].k]}.` };
  }
  return buatSubtes(kode, acak(), 1).soal[0];
}
function htmlKartu(id) {
  const c = kartu[id], q = c.q, selesai = c.jw != null;
  let h = "";
  if (q.jenis === "pasangan") {
    const pil = selesai ? c.jw : c.pil || [];
    h += `<p class="stem">Pilih <b>dua</b> kata yang bersinonim atau berantonim.</p><ol class="opts kata-sa">${q.w.map((w, j) => {
      let k = "opt"; if (selesai) { if (q.k.includes(j)) k += " ok"; else if (pil.includes(j)) k += " no"; } else if (pil.includes(j)) k += " pilih";
      return `<li><button class="${k}" data-k="${id}" data-sa="${j}"${selesai ? " disabled" : ""}><span class="L">${HURUF[j]}</span><span>${esc(w)}</span></button></li>`;
    }).join("")}</ol>`;
  } else if (q.jenis === "vm") {
    h += `<div class="ref-vm">${q.ref.map((g, i) => `<div><b>${HURUF[i]}</b>${g}</div>`).join("")}</div><div class="vm-g">${q.g}</div><ol class="opts vm">${q.ref.map((_, j) =>
      `<li><button class="opt${selesai ? (j === q.k ? " ok" : j === c.jw ? " no" : "") : ""}" data-k="${id}" data-o="${j}"${selesai ? " disabled" : ""}><span class="L">${HURUF[j]}</span>${HURUF[j]}</button></li>`).join("")}</ol>`;
  } else {
    const gbr = q.o.some((o) => o.includes("<svg"));
    h += `<div class="stem">${q.q}</div><ol class="opts${gbr ? " gambar" : ""}">${q.o.map((o, j) =>
      `<li><button class="opt${selesai ? (j === q.k ? " ok" : j === c.jw ? " no" : "") : ""}" data-k="${id}" data-o="${j}"${selesai ? " disabled" : ""}><span class="L">${HURUF[j]}</span><span>${o}</span></button></li>`).join("")}</ol>`;
  }
  if (selesai || c.buka) {
    const ok = selesai && (q.jenis === "pasangan" ? c.jw[0] === q.k[0] && c.jw[1] === q.k[1] : c.jw === q.k);
    const kunci = q.jenis === "pasangan" ? `${q.k.map((k) => esc(q.w[k])).join(" – ")} (${q.r === "S" ? "sinonim" : "antonim"})` : HURUF[q.k];
    const v = selesai ? `<div class="v ${ok ? "ok" : "no"}">${ok ? "Benar." : "Kurang tepat."} Kunci: ${kunci}.</div>` : `<div class="v">Kunci: ${kunci}.</div>`;
    h += `<div class="fb">${v}${q.langkah ? `<ol class="bahas">${q.langkah.map((x) => `<li>${x}</li>`).join("")}</ol>` : `<p>${q.e}</p>`}</div>`;
  } else if (q.langkah) {
    h += `<p style="margin:10px 0 0"><button type="button" class="tautan" data-buka="${id}">Lihat pembahasan tanpa menjawab</button></p>`;
  }
  return h;
}
function gambarKartu(id) { const el = document.getElementById(id); if (el) el.querySelector(".kartu-isi").innerHTML = htmlKartu(id); }

// ---------- halaman ----------
const sudah = () => baca(K_BACA) || {};
function meta(s) {
  if (s.jenis === "likert") return `${s.n} butir · ${Math.round(s.durasi / 60)} menit`;
  return `${s.n} soal · ${String(Math.round(s.durasi / 6) / 10).replace(".", ",")} menit · ≤${s.batas} dtk/soal`;
}
function bagian(kode) {
  const s = KODE[kode], m = M[kode], dibaca = !!sudah()[kode];
  const contoh = kode === "DR" ? contohDR() : m.contoh;
  if (contoh) kartu["contoh-" + kode] = { q: acakOpsi(contoh), jw: null };
  const bisaCoba = s.jenis !== "likert";
  return `<details class="mtr" id="${kode}"><summary><span class="mtr-no">${s.no}</span><span class="mtr-judul"><b>${esc(s.nama)}</b><span>${meta(s)}</span></span><span class="mtr-status${dibaca ? " ok" : ""}">${dibaca ? "✓ dibaca" : ""}</span></summary>
    <div class="mtr-isi">
      <div class="mtr-ukur"><b>Yang diukur.</b> ${m.ukur}</div>
      <h3>Konsep inti</h3>${m.konsep}
      <h3>Langkah mengerjakan</h3><ol>${m.langkah.map((x) => `<li>${x}</li>`).join("")}</ol>
      <h3>Jebakan yang sering muncul</h3><ul>${m.jebakan.map((x) => `<li>${x}</li>`).join("")}</ul>
      ${contoh ? `<div class="coba" id="contoh-${kode}"><div class="coba-kepala"><span class="tag">Contoh terbahas</span></div><div class="kartu-isi">${htmlKartu("contoh-" + kode)}</div></div>` : ""}
      ${bisaCoba ? `<div class="coba" id="coba-${kode}"><div class="coba-kepala"><span class="tag spark">Coba 1 soal</span><button type="button" class="btn kecil" data-coba="${kode}">Soal baru</button></div><div class="kartu-isi"><p class="hint" style="margin:0">Tekan <b>Soal baru</b> untuk mendapat soal acak${kode === "SA" || kode === "PK" ? " dari bank contoh" : " dari generator latihan"}. Tidak mengurangi jatah latihan.</p></div></div>` : ""}
      <div class="mtr-kaki"><button type="button" class="btn${dibaca ? "" : " pri"}" data-baca="${kode}">${dibaca ? "Tandai belum dibaca" : "Tandai sudah dibaca"}</button>${bisaCoba ? `<a class="btn" href="/psikotes/latihan/?s=${kode}">Latihan subtes ini</a>` : `<a class="btn" href="/psikotes/">Kerjakan di paket hari ini</a>`}</div>
    </div></details>`;
}
function progres() {
  const n = Object.keys(sudah()).filter((k) => KODE[k]).length;
  return `<div class="mtr-prog"><span><b>${n}</b>/${SUBTES.length} subtes sudah dibaca</span><div class="bar-prog"><i style="width:${Math.round((n / SUBTES.length) * 100)}%"></i></div></div>`;
}

const app = document.getElementById("app");
function render() {
  const terbuka = new Set([...document.querySelectorAll("details.mtr[open]")].map((d) => d.id));
  app.innerHTML = kepalaSitus("materi") + `<main class="wrap materi">
    <div class="pk-head"><h1>Materi psikotes</h1><div class="sub">Konsep, langkah, dan jebakan tiap subtes, lengkap dengan contoh terbahas. Setelah membaca, coba langsung satu soal.</div></div>
    <div id="mtr-prog">${progres()}</div>
    ${KELOMPOK.map((g) => `<div class="mtr-grup"><h2>${g.judul}</h2><p>${g.sub}</p></div>${g.kode.map(bagian).join("")}`).join("")}
    <p class="foot">Materi dan contoh ditulis orisinal oleh Whetio mengikuti format psikotes UPKP, bukan materi resmi BPPK. Strategi harian dan rencana sampai hari H ada di <a href="/psikotes/metode/">Metode belajar</a>.</p>
  </main>` + kaki();
  terbuka.forEach((id) => { const d = document.getElementById(id); if (d) d.open = true; });
}
render();
function bukaHash() {
  const id = decodeURIComponent(location.hash.slice(1)).toUpperCase(), d = id && document.getElementById(id);
  if (d && d.matches("details.mtr")) { d.open = true; d.scrollIntoView({ block: "start" }); }
}
bukaHash();
window.addEventListener("hashchange", bukaHash);

app.addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.dataset.coba) {
    const id = "coba-" + t.dataset.coba;
    kartu[id] = { q: soalCoba(t.dataset.coba), jw: null };
    gambarKartu(id);
    return;
  }
  if (t.dataset.buka) { kartu[t.dataset.buka].buka = true; gambarKartu(t.dataset.buka); return; }
  if (t.dataset.baca) {
    const k = t.dataset.baca, x = sudah();
    if (x[k]) delete x[k]; else x[k] = Date.now();
    tulis(K_BACA, x);
    const d = document.getElementById(k), st = d.querySelector(".mtr-status");
    st.className = "mtr-status" + (x[k] ? " ok" : ""); st.textContent = x[k] ? "✓ dibaca" : "";
    t.className = "btn" + (x[k] ? "" : " pri"); t.textContent = x[k] ? "Tandai belum dibaca" : "Tandai sudah dibaca";
    document.getElementById("mtr-prog").innerHTML = progres();
    if (x[k]) { d.open = false; const n = d.nextElementSibling && d.nextElementSibling.matches("details.mtr") ? d.nextElementSibling : null; d.scrollIntoView({ block: "nearest" }); if (n && !x[n.id]) n.open = true; }
    return;
  }
  const id = t.dataset.k; if (!id || !kartu[id]) return;
  const c = kartu[id];
  if (c.jw != null) return;
  if (t.dataset.sa != null) {
    const j = +t.dataset.sa; c.pil = c.pil || [];
    c.pil = c.pil.includes(j) ? c.pil.filter((x) => x !== j) : c.pil.concat(j);
    if (c.pil.length === 2) c.jw = c.pil.slice().sort();
    gambarKartu(id);
    return;
  }
  if (t.dataset.o != null) { c.jw = +t.dataset.o; gambarKartu(id); }
});
