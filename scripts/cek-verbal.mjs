#!/usr/bin/env node
// Validasi soal verbal harian (Sinonim-Antonim + Pengelompokan Kata) sebelum diterbitkan, termasuk variasi PK.
// Pakai: node scripts/cek-verbal.mjs <verbal.json> [--repo .]
import fs from "node:fs";
import path from "node:path";

export const JUMLAH = { SA: 30, PK: 25, PK_MIN_TIAP_FORMAT: 10, SA_MIN_TIAP_JENIS: 12, ULANG_MAKS: 0, JENDELA: 7 };
// Variasi Pengelompokan Kata (masukan pengguna 24 Nov 2026: PK kurang variatif). Tiap soal PK wajib memberi label:
//   kk    = kelas kata anggota kelompok: benda (nomina konkret), nama (nama diri: tempat/tokoh/lembaga), abstrak (nomina
//           abstrak/konsep/istilah), kerja (verba), sifat (adjektiva)
//   dasar = dasar pengelompokan: jenis (anggota satu kategori), fungsi (kegunaan/cara kerja sama), ciri (sifat/ciri
//           fisik sama), bagian (bagian/tahap dari satu keseluruhan atau proses), makna (makna kata searah/serumpun)
//   d     = bidang (daftar BIDANG di bawah)
export const VARIASI = {
  KK: ["benda", "nama", "abstrak", "kerja", "sifat"],
  KK_MIN: { kerja: 4, sifat: 4, abstrak: 3 },
  KK_MAKS: { benda: 10, nama: 5 },
  DASAR: ["jenis", "fungsi", "ciri", "bagian", "makna"],
  DASAR_MIN: { makna: 3, fungsi: 2, ciri: 2, bagian: 2 },
  DASAR_MAKS: { jenis: 12 },
  BIDANG: ["perasaan-watak", "gerak-tindakan", "bahasa-komunikasi", "kerja-organisasi", "keuangan-ekonomi", "hukum-pemerintahan",
    "sains", "tubuh-kesehatan", "hewan", "tumbuhan-pangan", "geografi-alam", "seni-budaya", "rumah-benda",
    "teknologi-transportasi", "pendidikan-ilmu", "olahraga-permainan", "waktu-ukuran"],
  BIDANG_MAKS: 2,
  BIDANG_MIN_JENIS: 12,
  KATA_ULANG_MAKS: 0, // kata PK (3 kata soal + 5 opsi) yang sudah dipakai di PK paket mana pun sebelumnya: kata diperbarui tiap hari
};
const kata = (s) => typeof s === "string" && /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]{1,24}$/.test(s.trim());
const norm = (s) => String(s).trim().toLowerCase();
export const sidikSA = (w0, w1) => "SA:" + [norm(w0), norm(w1)].sort().join("+");
export const sidikPK = (s) => (s.f === "L" ? "PKL:" + s.q.map(norm).sort().join("+") + ">" + norm(s.o[0]) : "PKB:" + s.o.map(norm).sort().join("+"));

export function sidikLama(repo, tanggal) {
  const dir = path.join(repo, "psikotes", "paket");
  if (!fs.existsSync(dir)) return new Map();
  const tgl = fs.readdirSync(dir).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d !== tanggal).sort().slice(-JUMLAH.JENDELA);
  const m = new Map();
  for (const d of tgl) {
    const f = path.join(dir, d, "soal.json");
    if (!fs.existsSync(f)) continue;
    const p = JSON.parse(fs.readFileSync(f, "utf8"));
    for (const st of p.subtes) for (const s of st.soal) if (s.sid) m.set(s.sid, d);
  }
  return m;
}

const unhtml = (h) => String(h).replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
// Kata dan nama kelompok PK dari SEMUA paket sebelumnya (bukan hanya 7 terakhir): Map kata → tanggal, Map kelompok → tanggal.
export function pkLama(repo, tanggal) {
  const dir = path.join(repo, "psikotes", "paket"), kata = new Map(), kel = new Map();
  if (!fs.existsSync(dir)) return { kata, kel };
  const tgl = fs.readdirSync(dir).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d !== tanggal).sort();
  for (const d of tgl) {
    const f = path.join(dir, d, "soal.json");
    if (!fs.existsSync(f)) continue;
    const pk = (JSON.parse(fs.readFileSync(f, "utf8")).subtes || []).find((x) => x.kode === "PK");
    for (const q of (pk && pk.soal) || []) {
      const m = String(q.q).match(/class="kelompok">([\s\S]*?)<\/p>/);
      const soal = m ? unhtml(m[1]).replace(/,?\s*…\s*$/, "").split(",") : [];
      soal.concat(q.o.map(unhtml)).forEach((w) => w.trim() && kata.set(norm(w), d));
      if (q.g) kel.set(norm(q.g), d);
    }
  }
  return { kata, kel };
}

export function cek(data, { repo, tanggal } = {}) {
  const err = [], warn = [];
  if (!Array.isArray(data)) return { err: ["Berkas harus berupa array JSON."], warn };
  const SA = data.filter((s) => s.t === "SA"), PK = data.filter((s) => s.t === "PK");
  if (SA.length !== JUMLAH.SA) err.push(`Sinonim-Antonim harus ${JUMLAH.SA} soal (ada ${SA.length}).`);
  if (PK.length !== JUMLAH.PK) err.push(`Pengelompokan Kata harus ${JUMLAH.PK} soal (ada ${PK.length}).`);
  if (data.length !== SA.length + PK.length) err.push("Ada objek dengan t selain SA/PK.");
  const lama = repo ? sidikLama(repo, tanggal) : new Map();
  const { kata: kataLama, kel: kelLama } = repo ? pkLama(repo, tanggal) : { kata: new Map(), kel: new Map() };
  const lihat = new Set();
  const nS = SA.filter((s) => s.r === "S").length, nA = SA.filter((s) => s.r === "A").length;
  if (nS < JUMLAH.SA_MIN_TIAP_JENIS || nA < JUMLAH.SA_MIN_TIAP_JENIS) err.push(`Sinonim (${nS}) dan antonim (${nA}) masing-masing minimal ${JUMLAH.SA_MIN_TIAP_JENIS}.`);
  const nL = PK.filter((s) => s.f === "L").length, nB = PK.filter((s) => s.f === "B").length;
  if (nL < JUMLAH.PK_MIN_TIAP_FORMAT || nB < JUMLAH.PK_MIN_TIAP_FORMAT) err.push(`Format lengkapi (${nL}) dan paling-berbeda (${nB}) masing-masing minimal ${JUMLAH.PK_MIN_TIAP_FORMAT}.`);
  const cekE = (s, i) => { if (typeof s.e !== "string" || s.e.length < 30 || s.e.length > 420) err.push(`#${i + 1}: pembahasan (e) harus 30–420 karakter.`); };
  data.forEach((s, i) => {
    const id = `#${i + 1} (${s.t})`;
    if (s.t === "SA") {
      if (!Array.isArray(s.w) || s.w.length !== 5 || !s.w.every(kata)) return err.push(`${id}: w harus 5 kata/frasa pendek.`);
      if (new Set(s.w.map(norm)).size !== 5) err.push(`${id}: ada kata kembar.`);
      if (!["S", "A"].includes(s.r)) err.push(`${id}: r harus "S" atau "A".`);
      const sd = sidikSA(s.w[0], s.w[1]);
      if (lihat.has(sd)) err.push(`${id}: pasangan ${s.w[0]}–${s.w[1]} dobel dalam paket ini.`);
      if (lama.has(sd)) err.push(`${id}: pasangan ${s.w[0]}–${s.w[1]} sudah keluar di paket ${lama.get(sd)}.`);
      lihat.add(sd); cekE(s, i);
    } else if (s.t === "PK") {
      if (!["L", "B"].includes(s.f)) return err.push(`${id}: f harus "L" (lengkapi) atau "B" (paling berbeda).`);
      if (!Array.isArray(s.o) || s.o.length !== 5 || !s.o.every(kata)) return err.push(`${id}: o harus 5 kata/frasa pendek.`);
      if (new Set(s.o.map(norm)).size !== 5) err.push(`${id}: opsi kembar.`);
      if (typeof s.g !== "string" || s.g.length < 3) err.push(`${id}: g (nama kelompok) wajib.`);
      if (s.f === "L") {
        if (!Array.isArray(s.q) || s.q.length !== 3 || !s.q.every(kata)) err.push(`${id}: q harus 3 kata.`);
        else if (s.q.some((x) => s.o.map(norm).includes(norm(x)))) err.push(`${id}: kata di q muncul lagi di opsi.`);
      }
      if (!VARIASI.KK.includes(s.kk)) err.push(`${id}: kk (kelas kata) harus salah satu dari ${VARIASI.KK.join("/")}.`);
      if (!VARIASI.DASAR.includes(s.dasar)) err.push(`${id}: dasar harus salah satu dari ${VARIASI.DASAR.join("/")}.`);
      if (!VARIASI.BIDANG.includes(s.d)) err.push(`${id}: d (bidang) harus salah satu dari ${VARIASI.BIDANG.join(", ")}.`);
      if (typeof s.g === "string" && kelLama.has(norm(s.g))) err.push(`${id}: nama kelompok "${s.g}" sudah pernah dipakai (paket ${kelLama.get(norm(s.g))}); pilih kelompok lain.`);
      const sd = sidikPK(s);
      if (lihat.has(sd)) err.push(`${id}: soal dobel dalam paket ini.`);
      if (lama.has(sd)) err.push(`${id}: soal sama sudah keluar di paket ${lama.get(sd)}.`);
      lihat.add(sd); cekE(s, i);
    }
  });
  // Panjang kata tidak boleh menjadi petunjuk: kunci SA menjadi kata terpanjang di 3–10 soal saja.
  const panjang = SA.filter((s) => Array.isArray(s.w) && Math.max(s.w[0].length, s.w[1].length) >= Math.max(...s.w.map((x) => x.length))).length;
  if (SA.length === JUMLAH.SA && (panjang < 3 || panjang > 10)) err.push(`Kata kunci SA menjadi kata terpanjang di ${panjang} soal; harus 3–10 agar panjang kata tidak jadi petunjuk.`);
  const pkPanjang = PK.filter((s) => Array.isArray(s.o) && s.o[0].length >= Math.max(...s.o.map((x) => x.length))).length;
  if (PK.length === JUMLAH.PK && pkPanjang > 9) err.push(`Kunci PK menjadi opsi terpanjang di ${pkPanjang} soal; maksimal 9.`);
  // Variasi PK: kelas kata, dasar pengelompokan, bidang, dan kata yang tidak diulang dari paket-paket sebelumnya.
  if (PK.length === JUMLAH.PK) {
    const hitung = (k) => PK.reduce((m, s) => ((m[s[k]] = (m[s[k]] || 0) + 1), m), {});
    const kk = hitung("kk"), dasar = hitung("dasar"), bid = hitung("d");
    for (const [k, n] of Object.entries(VARIASI.KK_MIN)) if ((kk[k] || 0) < n) err.push(`Variasi PK: kelas kata "${k}" baru ${kk[k] || 0} soal; minimal ${n}.`);
    for (const [k, n] of Object.entries(VARIASI.KK_MAKS)) if ((kk[k] || 0) > n) err.push(`Variasi PK: kelas kata "${k}" ada ${kk[k]} soal; maksimal ${n}.`);
    for (const [k, n] of Object.entries(VARIASI.DASAR_MIN)) if ((dasar[k] || 0) < n) err.push(`Variasi PK: dasar "${k}" baru ${dasar[k] || 0} soal; minimal ${n}.`);
    for (const [k, n] of Object.entries(VARIASI.DASAR_MAKS)) if ((dasar[k] || 0) > n) err.push(`Variasi PK: dasar "${k}" ada ${dasar[k]} soal; maksimal ${n}.`);
    for (const [k, n] of Object.entries(bid)) if (VARIASI.BIDANG.includes(k) && n > VARIASI.BIDANG_MAKS) err.push(`Variasi PK: bidang "${k}" ada ${n} soal; maksimal ${VARIASI.BIDANG_MAKS}.`);
    const nBid = Object.keys(bid).filter((k) => VARIASI.BIDANG.includes(k)).length;
    if (nBid < VARIASI.BIDANG_MIN_JENIS) err.push(`Variasi PK: hanya ${nBid} bidang berbeda; minimal ${VARIASI.BIDANG_MIN_JENIS}.`);
    const semua = PK.flatMap((s) => (s.f === "L" && Array.isArray(s.q) ? s.q : []).concat(Array.isArray(s.o) ? s.o : []));
    const ulang = [...new Set(semua.map(norm).filter((w) => kataLama.has(w)))];
    if (ulang.length > VARIASI.KATA_ULANG_MAKS) err.push(`Variasi PK: kata harus baru setiap hari, tetapi ${ulang.length} kata sudah pernah dipakai di PK paket sebelumnya; ganti: ${ulang.map((w) => `${w} (${kataLama.get(w)})`).join(", ")}.`);
    else if (ulang.length) warn.push(`PK memakai ulang ${ulang.length} kata dari paket sebelumnya: ${ulang.join(", ")}.`);
  }
  return { err, warn };
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const args = process.argv.slice(2);
  const repo = args.includes("--repo") ? args[args.indexOf("--repo") + 1] : null;
  const r = cek(JSON.parse(fs.readFileSync(args[0], "utf8")), { repo });
  r.warn.forEach((w) => console.log("PERINGATAN " + w));
  r.err.forEach((e) => console.log("GAGAL " + e));
  console.log(r.err.length ? `\n${r.err.length} masalah.` : "LOLOS");
  process.exit(r.err.length ? 2 : 0);
}
