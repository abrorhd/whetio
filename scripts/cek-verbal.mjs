#!/usr/bin/env node
// Validasi soal verbal harian (Sinonim-Antonim + Pengelompokan Kata) sebelum diterbitkan.
// Pakai: node scripts/cek-verbal.mjs <verbal.json> [--repo .]
import fs from "node:fs";
import path from "node:path";

export const JUMLAH = { SA: 30, PK: 25, PK_MIN_TIAP_FORMAT: 10, SA_MIN_TIAP_JENIS: 12, ULANG_MAKS: 0, JENDELA: 7 };
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

export function cek(data, { repo, tanggal } = {}) {
  const err = [], warn = [];
  if (!Array.isArray(data)) return { err: ["Berkas harus berupa array JSON."], warn };
  const SA = data.filter((s) => s.t === "SA"), PK = data.filter((s) => s.t === "PK");
  if (SA.length !== JUMLAH.SA) err.push(`Sinonim-Antonim harus ${JUMLAH.SA} soal (ada ${SA.length}).`);
  if (PK.length !== JUMLAH.PK) err.push(`Pengelompokan Kata harus ${JUMLAH.PK} soal (ada ${PK.length}).`);
  if (data.length !== SA.length + PK.length) err.push("Ada objek dengan t selain SA/PK.");
  const lama = repo ? sidikLama(repo, tanggal) : new Map();
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
