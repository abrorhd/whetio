// Subtes 2 — Penalaran Silogisme. Kunci dibuktikan: kategoris lewat semua model diagram Venn
// (dengan anggapan setiap himpunan tidak kosong), kondisional lewat tabel kebenaran.
//
// Isi soal harus masuk akal (masukan pengguna 25 Nov 2026): premis kategoris diambil dari "dunia" yang wajar
// (SKENARIO: hubungan antarhimpunan yang memang masuk akal), dan premis kondisional selalu searah sebab → akibat.
// Jebakan tetap ada, tetapi berupa kesimpulan yang terdengar wajar namun tidak pasti dari premis
// (konversi, mengiyakan akibat, menyangkal sebab, atau fakta yang benar di dunia nyata tapi tidak dijamin premis).
import { esc } from "./rng.js";

const besar = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- Kategoris ----------
// t = [S, M, P] (subjek, tengah, predikat), r = hubungan [S–M, M–P, S–P]:
//   sub = himpunan pertama seluruhnya di dalam himpunan kedua, sup = sebaliknya,
//   ov = beririsan sebagian, dis = sama sekali tidak beririsan.
export const SKENARIO = [
  { t: ["pegawai baru", "peserta orientasi", "pemegang kartu akses"], r: ["sub", "sub", "sub"] },
  { t: ["pemeriksa pajak", "pegawai bersertifikat pemeriksa", "lulusan diklat pemeriksaan"], r: ["sub", "sub", "sub"] },
  { t: ["pelari maraton", "atlet", "orang yang berlatih rutin"], r: ["sub", "sub", "sub"] },
  { t: ["sukuk ritel", "surat berharga negara", "instrumen yang diterbitkan pemerintah"], r: ["sub", "sub", "sub"] },
  { t: ["pelamar yang lulus tes akhir", "pelamar yang diangkat", "pegawai yang menerima SK"], r: ["sub", "sub", "sub"] },
  { t: ["kendaraan dinas", "kendaraan berpelat merah", "kendaraan pribadi"], r: ["sub", "dis", "dis"] },
  { t: ["rekening tabungan", "produk simpanan bank", "produk pinjaman bank"], r: ["sub", "dis", "dis"] },
  { t: ["ruang rapat", "ruangan ber-AC", "ruangan yang boleh dipakai merokok"], r: ["sub", "dis", "dis"] },
  { t: ["novel", "buku fiksi", "buku pelajaran"], r: ["sub", "dis", "dis"] },
  { t: ["berkas pengajuan yang lengkap", "berkas yang diproses", "berkas yang dikembalikan ke pemohon"], r: ["sub", "dis", "dis"] },
  { t: ["kota pelabuhan", "kota di pesisir", "kota di dataran tinggi"], r: ["sub", "dis", "dis"] },
  { t: ["PNS Kemenkeu", "aparatur sipil negara", "karyawan swasta"], r: ["sub", "dis", "dis"] },
  { t: ["mangga", "buah tropis", "buah khas daerah bersalju"], r: ["sub", "dis", "dis"] },
  { t: ["peserta pelatihan", "pemenang lomba inovasi", "penerima piagam"], r: ["sup", "sub", "ov"] },
  { t: ["pegawai yang ikut senam pagi", "anggota tim voli kantor", "pegawai yang punya seragam olahraga"], r: ["sup", "sub", "ov"] },
  { t: ["pegawai bagian layanan", "petugas loket", "pegawai yang bekerja dari rumah"], r: ["sup", "dis", "ov"] },
  { t: ["pengguna jalan tol", "pengemudi truk bermuatan lebih", "pengendara yang lolos pemeriksaan"], r: ["sup", "dis", "ov"] },
  { t: ["pegawai bagian TI", "pegawai yang bertugas shift malam", "pegawai yang ikut apel pagi"], r: ["ov", "dis", "ov"] },
  { t: ["pengunjung pameran", "pembeli tiket terusan", "pengunjung yang membayar di loket"], r: ["ov", "dis", "ov"] },
  { t: ["pesepeda", "pengguna jalan", "pengemudi mobil"], r: ["sub", "sup", "ov"] },
  { t: ["sungai di Kalimantan", "sungai di Indonesia", "sungai di Jawa"], r: ["sub", "sup", "dis"] },
  { t: ["anggota paduan suara", "pegawai yang gemar bernyanyi", "peserta lomba karaoke kantor"], r: ["sub", "sup", "ov"] },
  { t: ["dokter gigi", "tenaga kesehatan", "pegawai rumah sakit"], r: ["sub", "ov", "ov"] },
  { t: ["pengguna kereta komuter", "penumpang angkutan umum", "pemilik mobil pribadi"], r: ["sub", "ov", "ov"] },
  { t: ["telur ayam", "bahan makanan berprotein", "bahan makanan nabati"], r: ["sub", "ov", "dis"] },
  { t: ["petugas pemadam kebakaran", "petugas terlatih P3K", "relawan bencana"], r: ["sub", "ov", "ov"] },
  { t: ["peserta rapat", "pegawai bagian keuangan", "pemegang laptop kantor"], r: ["ov", "ov", "ov"] },
  { t: ["pengunjung perpustakaan", "anggota perpustakaan", "peminjam buku"], r: ["ov", "sup", "ov"] },
  { t: ["mahasiswa penerima beasiswa", "mahasiswa berprestasi", "mahasiswa yang lulus tepat waktu"], r: ["sub", "ov", "ov"] },
];

function teksKat(st, T) {
  const X = T[st.x], Y = T[st.y];
  if (st.f === "A") return besar(`semua ${X} adalah ${Y}.`);
  if (st.f === "E") return besar(st.v ? `semua ${X} bukan ${Y}.` : `tidak ada ${X} yang merupakan ${Y}.`);
  if (st.f === "I") return besar(`sebagian ${X} adalah ${Y}.`);
  return besar(`sebagian ${X} bukan ${Y}.`);
}
function nilaiKat(st, regs) {
  const bx = 1 << st.x, by = 1 << st.y;
  if (st.f === "A") return !regs.some((r) => r & bx && !(r & by));
  if (st.f === "E") return !regs.some((r) => r & bx && r & by);
  if (st.f === "I") return regs.some((r) => r & bx && r & by);
  return regs.some((r) => r & bx && !(r & by));
}
function modelKat(nTerm, premis) {
  const nReg = 1 << nTerm, out = [];
  for (let mask = 1; mask < 1 << nReg; mask++) {
    const regs = [];
    for (let r = 0; r < nReg; r++) if (mask & (1 << r)) regs.push(r);
    let ok = true;
    for (let t = 0; t < nTerm && ok; t++) if (!regs.some((r) => r & (1 << t))) ok = false; // tiap himpunan tidak kosong
    if (ok && premis.every((p) => nilaiKat(p, regs))) out.push(regs);
  }
  return out;
}
const kalimatSet = (st, T) => {
  const X = T[st.x], Y = T[st.y];
  return { A: `seluruh ${X} berada di dalam ${Y}`, E: `${X} dan ${Y} sama sekali tidak beririsan`, I: `ada ${X} yang juga ${Y}`, O: `ada ${X} yang berada di luar ${Y}` }[st.f];
};
// "Dunia" sebuah skenario: semua daerah Venn yang tidak dilarang oleh hubungan antarhimpunan.
const PASANG = [[0, 1], [1, 2], [0, 2]];
export function duniaSkenario(sk) {
  const regs = [];
  for (let r = 1; r < 8; r++) {
    const ok = PASANG.every(([a, b], i) => {
      const A = !!(r & (1 << a)), B = !!(r & (1 << b)), h = sk.r[i];
      return h === "sub" ? !(A && !B) : h === "sup" ? !(B && !A) : h === "dis" ? !(A && B) : true;
    });
    if (ok) regs.push(r);
  }
  return regs;
}
// Periksa skenario: setiap hubungan benar-benar berlaku di dunianya (dipakai uji-generator).
export function cekSkenario(sk) {
  const W = duniaSkenario(sk), salah = [];
  for (let t = 0; t < 3; t++) if (!W.some((r) => r & (1 << t))) salah.push(`himpunan ${sk.t[t]} kosong`);
  PASANG.forEach(([a, b], i) => {
    const v = (f, x, y) => nilaiKat({ f, x, y }, W), h = sk.r[i];
    const ok = h === "sub" ? v("A", a, b) && !v("A", b, a) : h === "sup" ? v("A", b, a) && !v("A", a, b)
      : h === "dis" ? v("E", a, b) : v("I", a, b) && v("O", a, b) && v("O", b, a);
    if (!ok) salah.push(`hubungan ${sk.t[a]}–${sk.t[b]} bukan ${h}`);
  });
  return salah;
}
// Pernyataan yang wajar diucapkan tentang pasangan (x, y) di dunia W: "semua"/"tidak ada" bila berlaku,
// selain itu "sebagian … adalah/bukan". (Tidak memakai "sebagian" bila sebenarnya "semua".)
function wajar(W, x, y) {
  const v = (f) => nilaiKat({ f, x, y }, W);
  if (v("A")) return [{ f: "A", x, y }];
  if (v("E")) return [{ f: "E", x, y }];
  return ["I", "O"].filter(v).map((f) => ({ f, x, y }));
}

// Pilih acak berbobot: premis universal (semua/tidak ada) lebih sering daripada partikular.
const BOBOT = { A: 3, E: 3, I: 2, O: 1 };
function pilihPremis(rng, arr) { let x = rng() * arr.reduce((a, s) => a + BOBOT[s.f], 0); for (const s of arr) if ((x -= BOBOT[s.f]) < 0) return { ...s }; return { ...arr[0] }; }
// Ambil butir dari daftar tanpa mengulang dalam satu paket (rng yang sama dipakai untuk seluruh subtes).
function ambilBaru(rng, daftar, tag) {
  const pakai = rng[tag] || (rng[tag] = new Set());
  let sisa = daftar.filter((x) => !pakai.has(x));
  if (!sisa.length) { pakai.clear(); sisa = daftar; }
  const x = rng.pick(sisa); pakai.add(x); return x;
}

function kategoris(rng) {
  const sk = ambilBaru(rng, SKENARIO, "_silSk"), T = sk.t, W = duniaSkenario(sk);
  for (let coba = 0; coba < 400; coba++) {
    const p1 = pilihPremis(rng, wajar(W, 0, 1).concat(wajar(W, 1, 0)));
    const p2 = pilihPremis(rng, wajar(W, 1, 2).concat(wajar(W, 2, 1)));
    if ("IO".includes(p1.f) && "IO".includes(p2.f) && rng.chance(0.85)) continue; // dua premis "sebagian" jarang dipakai
    [p1, p2].forEach((p) => (p.v = rng.int(0, 1)));
    const premis = rng.chance(0.5) ? [p1, p2] : [p2, p1];
    const M = modelKat(3, premis);
    if (!M.length) continue;
    const vektor = (st) => M.map((regs) => (nilaiKat(st, regs) ? 1 : 0)).join("");
    const kelas = (st) => { const v = vektor(st); return v.includes("0") ? (v.includes("1") ? "mungkin" : "salah") : "pasti"; };
    const kand = [];
    for (const f of ["A", "E", "I", "O"]) for (const [x, y] of [[0, 2], [2, 0]]) kand.push({ f, x, y, v: rng.int(0, 1) });
    const pasti = kand.filter((s) => kelas(s) === "pasti");
    if (!pasti.length && coba < 300 && rng.chance(0.7)) continue; // utamakan soal yang punya kesimpulan pasti
    const TDK = `Tidak dapat disimpulkan hubungan antara ${T[0]} dan ${T[2]}.`;
    const lihat = new Set(), pengecoh = [];
    const ambil = (s, k) => { const v = vektor(s); if (lihat.has(v) || k === "pasti") return; lihat.add(v); pengecoh.push({ t: teksKat(s, T), k, nyata: nilaiKat(s, W) }); };
    let kunci = null, kunciTeks = TDK;
    if (pasti.length) {
      const kuat = pasti.filter((s) => s.f === "A" || s.f === "E");
      kunci = kuat.length ? rng.pick(kuat) : rng.pick(pasti);
      kunciTeks = teksKat(kunci, T);
      lihat.add(vektor(kunci));
    }
    // Pengecoh: (1) S–P yang terdengar benar (benar di dunia nyata) tapi tidak dijamin premis,
    // (2) konversi premis (jebakan klasik), (3) S–P lain yang tidak pasti, (4) maksimal satu yang bertentangan dengan premis.
    const sp = rng.shuffle(kand.filter((s) => kelas(s) !== "pasti"));
    sp.filter((s) => kelas(s) === "mungkin" && nilaiKat(s, W)).forEach((s) => ambil(s, "mungkin"));
    const konversi = premis.map((p) => ({ f: p.f, x: p.y, y: p.x, v: p.v })).filter((s) => kelas(s) === "mungkin");
    rng.shuffle(konversi).forEach((s) => ambil(s, "konversi"));
    sp.filter((s) => kelas(s) === "mungkin").forEach((s) => ambil(s, "mungkin"));
    // Pernyataan lain tentang himpunan tengah yang tidak dijamin premis (yang benar di dunia nyata didahulukan).
    const kandM = [];
    for (const f of ["A", "E", "I", "O"]) for (const [x, y] of [[0, 1], [1, 0], [1, 2], [2, 1]]) kandM.push({ f, x, y, v: rng.int(0, 1) });
    const mM = rng.shuffle(kandM.filter((s) => kelas(s) === "mungkin"));
    mM.filter((s) => nilaiKat(s, W)).concat(mM).forEach((s) => ambil(s, "mungkin"));
    let opsi = pengecoh.slice(0, 4);
    if (kunci && rng.chance(0.65)) opsi.splice(rng.int(0, Math.min(3, opsi.length)), 0, { t: TDK, k: "tdk" });
    opsi = opsi.slice(0, 4);
    for (const s of sp.filter((x) => kelas(x) === "salah")) { // paling banyak dua pengecoh yang bertentangan dengan premis
      if (opsi.length >= 4 || opsi.filter((x) => x.k === "salah").length >= 2) break;
      if (!lihat.has(vektor(s))) { lihat.add(vektor(s)); opsi.push({ t: teksKat(s, T), k: "salah" }); }
    }
    if (opsi.length < 4 && kunci && !opsi.some((p) => p.k === "tdk")) opsi.push({ t: TDK, k: "tdk" });
    if (opsi.length < 4) continue;
    if (kunci && !nilaiKat(kunci, W)) continue; // pengaman: kesimpulan pasti harus juga benar di dunia nyata skenario
    const q = premis.map((p) => teksKat(p, T)).join(" ");
    const jebak = opsi.find((p) => p.k === "mungkin" && p.nyata) || opsi.find((p) => p.k === "konversi") || opsi.find((p) => p.k === "mungkin");
    const uraian = premis.map((p) => kalimatSet(p, T)).join("; ");
    let e = `Gambarkan himpunannya: ${esc(uraian)}. ` + (kunci
      ? `“${esc(kunciTeks)}” selalu benar pada setiap diagram Venn yang memenuhi kedua premis.`
      : `Premis tidak mengikat ${esc(T[0])} dengan ${esc(T[2])}: ada diagram yang memenuhi premis dengan hubungan apa pun di antara keduanya.`);
    if (jebak) e += jebak.k === "konversi"
      ? ` Jebakan: “${esc(jebak.t)}” membalik premis; “semua A adalah B” tidak berarti “semua B adalah A”.`
      : ` Jebakan: “${esc(jebak.t)}” terdengar wajar, tetapi tidak dijamin oleh premis.`;
    return { q: `<p class="premis">${esc(q)}</p><p class="tanya">Kesimpulan yang tepat adalah …</p>`, o: [kunciTeks].concat(opsi.map((p) => p.t)).map(esc), e };
  }
  throw new Error("silogisme kategoris gagal");
}

// ---------- Kondisional ----------
// Rantai sebab → akibat: [p, q, r] dengan p → q → r; tiap butir [kalimat positif, kalimat negasinya].
export const TEMA = [
  [["hujan turun deras", "hujan tidak turun deras"], ["jalan menjadi licin", "jalan tidak menjadi licin"], ["pengendara melaju pelan", "pengendara tidak melaju pelan"]],
  [["Rina lembur", "Rina tidak lembur"], ["laporan selesai tepat waktu", "laporan tidak selesai tepat waktu"], ["atasan memberi apresiasi", "atasan tidak memberi apresiasi"]],
  [["Andi rutin berolahraga", "Andi tidak rutin berolahraga"], ["Andi bugar", "Andi tidak bugar"], ["Andi produktif bekerja", "Andi tidak produktif bekerja"]],
  [["listrik padam", "listrik tidak padam"], ["server berhenti", "server tidak berhenti"], ["layanan daring terganggu", "layanan daring tidak terganggu"]],
  [["target penerimaan tercapai", "target penerimaan tidak tercapai"], ["tim mendapat bonus", "tim tidak mendapat bonus"], ["tim mengadakan syukuran", "tim tidak mengadakan syukuran"]],
  [["harga bahan baku naik", "harga bahan baku tidak naik"], ["biaya produksi naik", "biaya produksi tidak naik"], ["harga jual naik", "harga jual tidak naik"]],
  [["Dina berangkat pukul enam", "Dina tidak berangkat pukul enam"], ["Dina tiba sebelum apel", "Dina tidak tiba sebelum apel"], ["Dina mengikuti apel pagi", "Dina tidak mengikuti apel pagi"]],
  [["mesin dirawat berkala", "mesin tidak dirawat berkala"], ["mesin berfungsi baik", "mesin tidak berfungsi baik"], ["produksi berjalan lancar", "produksi tidak berjalan lancar"]],
  [["sungai meluap", "sungai tidak meluap"], ["sawah tergenang", "sawah tidak tergenang"], ["panen tertunda", "panen tidak tertunda"]],
  [["Sari belajar tekun", "Sari tidak belajar tekun"], ["nilai Sari memuaskan", "nilai Sari tidak memuaskan"], ["Sari mendapat beasiswa", "Sari tidak mendapat beasiswa"]],
  [["stok gudang habis", "stok gudang tidak habis"], ["pesanan ditunda", "pesanan tidak ditunda"], ["pelanggan menerima pemberitahuan", "pelanggan tidak menerima pemberitahuan"]],
  [["rapat diundur", "rapat tidak diundur"], ["jadwal kunjungan berubah", "jadwal kunjungan tidak berubah"], ["sopir dinas diberi tahu", "sopir dinas tidak diberi tahu"]],
  [["wajib pajak lapor tepat waktu", "wajib pajak tidak lapor tepat waktu"], ["wajib pajak terhindar dari denda", "wajib pajak tidak terhindar dari denda"], ["wajib pajak tenang", "wajib pajak tidak tenang"]],
  [["Budi menabung tiap bulan", "Budi tidak menabung tiap bulan"], ["dana darurat Budi cukup", "dana darurat Budi tidak cukup"], ["Budi siap menghadapi kebutuhan mendadak", "Budi tidak siap menghadapi kebutuhan mendadak"]],
  [["SPT terlambat disampaikan", "SPT tidak terlambat disampaikan"], ["wajib pajak dikenai denda", "wajib pajak tidak dikenai denda"], ["jumlah yang harus dibayar bertambah", "jumlah yang harus dibayar tidak bertambah"]],
  [["Joko terlambat lebih dari 30 menit", "Joko tidak terlambat lebih dari 30 menit"], ["tunjangan kinerja Joko dipotong", "tunjangan kinerja Joko tidak dipotong"], ["penghasilan Joko bulan ini berkurang", "penghasilan Joko bulan ini tidak berkurang"]],
  [["aplikasi diperbarui", "aplikasi tidak diperbarui"], ["celah keamanan tertutup", "celah keamanan tidak tertutup"], ["risiko kebocoran data berkurang", "risiko kebocoran data tidak berkurang"]],
  [["kemarau berlangsung panjang", "kemarau tidak berlangsung panjang"], ["debit air waduk turun", "debit air waduk tidak turun"], ["pasokan air ke rumah warga dibatasi", "pasokan air ke rumah warga tidak dibatasi"]],
  [["suku bunga acuan naik", "suku bunga acuan tidak naik"], ["bunga kredit naik", "bunga kredit tidak naik"], ["permintaan kredit melambat", "permintaan kredit tidak melambat"]],
  [["jembatan diperbaiki", "jembatan tidak diperbaiki"], ["jalan ditutup sementara", "jalan tidak ditutup sementara"], ["kendaraan dialihkan ke jalur lain", "kendaraan tidak dialihkan ke jalur lain"]],
  [["berkas pengajuan kurang lengkap", "berkas pengajuan lengkap"], ["pengajuan dikembalikan", "pengajuan tidak dikembalikan"], ["pencairan dana tertunda", "pencairan dana tidak tertunda"]],
  [["Tono lupa mengisi daya ponsel", "Tono tidak lupa mengisi daya ponsel"], ["ponsel Tono mati", "ponsel Tono tidak mati"], ["Tono melewatkan pesan rapat", "Tono tidak melewatkan pesan rapat"]],
  [["permintaan beras melonjak", "permintaan beras tidak melonjak"], ["harga beras naik", "harga beras tidak naik"], ["pemerintah menggelar operasi pasar", "pemerintah tidak menggelar operasi pasar"]],
  [["anggaran disetujui", "anggaran tidak disetujui"], ["pengadaan alat dilaksanakan", "pengadaan alat tidak dilaksanakan"], ["layanan laboratorium meningkat", "layanan laboratorium tidak meningkat"]],
  [["Lina lulus ujian dinas", "Lina tidak lulus ujian dinas"], ["Lina naik pangkat", "Lina tidak naik pangkat"], ["gaji pokok Lina naik", "gaji pokok Lina tidak naik"]],
];
// Dua pilihan yang wajar (a atau b) dan akibat pilihan b (c): [a, b, c].
export const PILIHAN = [
  [["rapat diadakan di aula", "rapat tidak diadakan di aula"], ["rapat diadakan secara daring", "rapat tidak diadakan secara daring"], ["peserta menerima tautan rapat", "peserta tidak menerima tautan rapat"]],
  [["Rudi berangkat naik kereta", "Rudi tidak berangkat naik kereta"], ["Rudi berangkat naik bus", "Rudi tidak berangkat naik bus"], ["Rudi turun di terminal kota", "Rudi tidak turun di terminal kota"]],
  [["laporan dikirim lewat surel", "laporan tidak dikirim lewat surel"], ["laporan diantar langsung", "laporan tidak diantar langsung"], ["kurir kantor ditugaskan", "kurir kantor tidak ditugaskan"]],
  [["Mira membayar tunai", "Mira tidak membayar tunai"], ["Mira membayar dengan QRIS", "Mira tidak membayar dengan QRIS"], ["Mira menerima notifikasi pembayaran", "Mira tidak menerima notifikasi pembayaran"]],
  [["Sinta memilih jurusan akuntansi", "Sinta tidak memilih jurusan akuntansi"], ["Sinta memilih jurusan perpajakan", "Sinta tidak memilih jurusan perpajakan"], ["Sinta mempelajari undang-undang pajak", "Sinta tidak mempelajari undang-undang pajak"]],
  [["pesanan dikirim lewat darat", "pesanan tidak dikirim lewat darat"], ["pesanan dikirim lewat udara", "pesanan tidak dikirim lewat udara"], ["ongkos kirim lebih mahal", "ongkos kirim tidak lebih mahal"]],
];
const lit = (v, n) => ({ k: "L", v, n });
const imp = (a, b) => ({ k: "I", a, b });
const atau = (a, b) => ({ k: "O", a, b });
const tdk = (v) => ({ k: "T", v }); // "Tidak dapat dipastikan apakah …"
const neg = (l) => lit(l.v, !l.n);
function nilaiP(f, row) {
  if (f.k === "L") return !!(row >> f.v & 1) !== f.n;
  if (f.k === "I") return !nilaiP(f.a, row) || nilaiP(f.b, row);
  return nilaiP(f.a, row) || nilaiP(f.b, row);
}
function teksP(f, K, awal = true) {
  const kl = (l) => K[l.v][l.n ? 1 : 0];
  let s;
  if (f.k === "T") s = `tidak dapat dipastikan apakah ${K[f.v][0]}`;
  else if (f.k === "L") s = kl(f);
  else if (f.k === "I") s = `jika ${kl(f.a)}, maka ${kl(f.b)}`;
  else s = `${kl(f.a)} atau ${kl(f.b)}`;
  return awal ? besar(s) + "." : s;
}
const [p, q, r] = [0, 1, 2].map((v) => lit(v, false));
// Pola yang sah (kunci pasti) dan pola keliru yang sering menjebak (kunci "tidak dapat dipastikan").
const POLA = [
  { n: "Modus ponens", w: 3, t: TEMA, pr: [imp(p, q), p], k: q, why: "Sebab terjadi dan aturannya “jika–maka”, jadi akibatnya pasti terjadi." },
  { n: "Modus tollens", w: 3, t: TEMA, pr: [imp(p, q), neg(q)], k: neg(p), why: "Akibat tidak terjadi, jadi sebabnya pasti tidak terjadi." },
  { n: "Silogisme hipotetis", w: 2, t: TEMA, pr: [imp(p, q), imp(q, r)], k: imp(p, r), why: "Dua “jika–maka” yang bersambung dapat dirangkai dari sebab awal ke akibat akhir." },
  { n: "Silogisme hipotetis (kontraposisi)", w: 1, t: TEMA, pr: [imp(p, q), imp(q, r)], k: imp(neg(r), neg(p)), why: "Rangkaian “jika p maka r” setara dengan “jika tidak r maka tidak p”." },
  { n: "Rantai modus ponens", w: 2, t: TEMA, pr: [imp(p, q), imp(q, r), p], k: r, why: "Terapkan modus ponens dua kali berurutan dari sebab awal." },
  { n: "Rantai modus tollens", w: 2, t: TEMA, pr: [imp(p, q), imp(q, r), neg(r)], k: neg(p), why: "Terapkan modus tollens dua kali dari akibat akhir ke belakang." },
  { n: "Mengiyakan akibat (keliru)", w: 1.5, t: TEMA, pr: [imp(p, q), q], k: tdk(0), why: "Akibat yang terjadi bisa saja disebabkan hal lain, jadi sebabnya tidak dapat dipastikan." },
  { n: "Menyangkal sebab (keliru)", w: 1.5, t: TEMA, pr: [imp(p, q), neg(p)], k: tdk(1), why: "Tanpa sebab itu, akibatnya tetap bisa muncul karena hal lain, jadi tidak dapat dipastikan." },
  { n: "Rantai dengan akibat akhir terjadi (keliru)", w: 1, t: TEMA, pr: [imp(p, q), imp(q, r), r], k: tdk(0), why: "Akibat akhir terjadi tidak membuktikan sebab awalnya terjadi." },
  { n: "Silogisme disjungtif", w: 2, t: PILIHAN, pr: [atau(p, q), neg(p)], k: q, why: "Dari dua kemungkinan “atau”, bila satu tidak terjadi, yang lain pasti terjadi." },
  { n: "Silogisme disjungtif + modus ponens", w: 1, t: PILIHAN, pr: [atau(p, q), neg(p), imp(q, r)], k: r, why: "Pilihan pertama gugur sehingga pilihan kedua terjadi, lalu akibatnya pasti terjadi." },
  { n: "Silogisme disjungtif + modus tollens", w: 1, t: PILIHAN, pr: [atau(p, q), imp(q, r), neg(r)], k: p, why: "Akibat pilihan kedua tidak terjadi, jadi pilihan kedua gugur dan pilihan pertama pasti terjadi." },
];
const pilihPola = (rng) => { let x = rng() * POLA.reduce((a, b) => a + b.w, 0); for (const pl of POLA) if ((x -= pl.w) < 0) return pl; return POLA[0]; };

function kondisional(rng) {
  for (let coba = 0; coba < 300; coba++) {
    const pola = pilihPola(rng), K = ambilBaru(rng, pola.t, pola.t === TEMA ? "_silTema" : "_silPilih"), { pr, k } = pola;
    const baris = []; for (let row = 0; row < 8; row++) if (pr.every((f) => nilaiP(f, row))) baris.push(row);
    if (!baris.length) continue;
    const vek = (f) => [0, 1, 2, 3, 4, 5, 6, 7].map((row) => (nilaiP(f, row) ? 1 : 0)).join("");
    const tentu = (v) => baris.every((row) => (row >> v & 1)) || baris.every((row) => !(row >> v & 1));
    // benar = opsi ini kesimpulan yang sah (formula pasti benar, atau "tidak dapat dipastikan" tentang hal yang memang tak tentu)
    const benar = (f) => (f.k === "T" ? !tentu(f.v) : baris.every((row) => nilaiP(f, row)));
    if (!benar(k)) continue;
    const dipakai = new Set(pr.flatMap((f) => (f.k === "L" ? [f.v] : [f.a.v, f.b.v])));
    // Pengecoh yang terdengar wajar: konversi/inversi aturan, fakta yang tidak pasti, "tidak dapat dipastikan" padahal pasti.
    const kand = [], c = (f, j) => kand.push({ f, j });
    pr.filter((f) => f.k === "I").forEach((f) => { c(imp(f.b, f.a), "konversi"); c(imp(neg(f.a), neg(f.b)), "inversi"); });
    if (k.k === "I") { c(imp(k.b, k.a), "konversi"); c(imp(neg(k.a), neg(k.b)), "inversi"); }
    if (k.k === "L") { c(neg(k), "fakta"); c(tdk(k.v), "tdk"); }
    if (k.k === "T") { c(lit(k.v, false), "fakta"); c(lit(k.v, true), "fakta"); }
    [...dipakai].forEach((v) => { c(lit(v, false), "fakta"); c(lit(v, true), "fakta"); c(tdk(v), "tdk"); });
    const kunciVek = k.k === "T" ? "T" + k.v : vek(k), lihat = new Set([kunciVek]), pengecoh = [];
    for (const x of rng.shuffle(kand.slice(0, 2)).concat(rng.shuffle(kand.slice(2)))) {
      if (pengecoh.length >= 4) break;
      const v = x.f.k === "T" ? "T" + x.f.v : vek(x.f);
      if (lihat.has(v) || benar(x.f)) continue;
      lihat.add(v); pengecoh.push(x);
    }
    if (pengecoh.length < 4) continue;
    const q0 = pr.map((f) => teksP(f, K)).join(" ");
    // Jebakan yang dibahas: pembalikan aturan dulu, lalu "tidak dapat dipastikan" yang keliru, lalu fakta.
    const salahTotal = (f) => f.k !== "T" && baris.every((row) => !nilaiP(f, row));
    const jebak = ["konversi", "inversi", "tdk", "fakta"].map((j) => pengecoh.find((x) => x.j === j && !salahTotal(x.f))).find(Boolean) || pengecoh[0];
    const kenapa = { konversi: "keliru karena membalik arah aturan “jika–maka”: akibat itu bisa muncul dari sebab lain.",
      inversi: "keliru karena tanpa sebab itu, akibatnya masih bisa terjadi karena hal lain.",
      tdk: "keliru karena premis sudah memastikannya.",
      fakta: salahTotal(jebak.f) ? "bertentangan dengan premis." : "tidak dijamin oleh premis." }[jebak.j];
    const e = `${pola.n}. ${pola.why} Maka: “${esc(teksP(k, K))}” Jebakan: “${esc(teksP(jebak.f, K))}” ${kenapa}`;
    return { q: `<p class="premis">${esc(q0)}</p><p class="tanya">Kesimpulan yang tepat adalah …</p>`, o: [k].concat(pengecoh.map((x) => x.f)).map((f) => esc(teksP(f, K))), e };
  }
  throw new Error("silogisme kondisional gagal");
}

export function silogisme(rng) { return rng.chance(0.55) ? kategoris(rng) : kondisional(rng); }
