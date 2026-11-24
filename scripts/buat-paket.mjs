#!/usr/bin/env node
// Menerbitkan paket simulasi penuh psikotes: 7 subtes dari generator (benih = tanggal), 2 subtes verbal dari
// berkas tulisan Claude, 2 subtes kepribadian dari bank. Tulis psikotes/paket/<tanggal>/ dan perbarui manifest.
// Pakai: node scripts/buat-paket.mjs <YYYY-MM-DD> --verbal <verbal.json>
import fs from "node:fs";
import path from "node:path";
import { SUBTES, buatSubtes, buatRng } from "../assets/js/gen/index.js";
import { susunOpsi, esc } from "../assets/js/gen/rng.js";
import { cek, sidikSA, sidikPK } from "./cek-verbal.mjs";

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const tanggal = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const fVerbal = opt("--verbal");
if (!tanggal || !fVerbal) { console.error("Pakai: node scripts/buat-paket.mjs <YYYY-MM-DD> --verbal <verbal.json>"); process.exit(1); }
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const verbal = JSON.parse(fs.readFileSync(fVerbal, "utf8"));
const r = cek(verbal, { repo: root, tanggal });
r.warn.forEach((w) => console.log("PERINGATAN " + w));
if (r.err.length) { r.err.forEach((e) => console.log("GAGAL " + e)); console.log(`\n${r.err.length} masalah. Paket TIDAK diterbitkan.`); process.exit(2); }

const seed = "whetio-psikotes-" + tanggal;
const rng = buatRng(seed + ":susun");
const rata = (n, k = 5) => rng.shuffle(Array.from({ length: n }, (_, i) => i % k));
const bank = JSON.parse(fs.readFileSync(path.join(root, "data", "kepribadian.json"), "utf8"));

function verbalSA(n) {
  const sa = rng.shuffle(verbal.filter((s) => s.t === "SA")).slice(0, n);
  return sa.map((s) => {
    const idx = rng.shuffle([0, 1, 2, 3, 4]);
    const w = idx.map((i) => s.w[i]);
    return { w, k: [idx.indexOf(0), idx.indexOf(1)].sort((a, b) => a - b), r: s.r, e: esc(s.e), sid: sidikSA(s.w[0], s.w[1]) };
  });
}
function verbalPK(n) {
  const pk = rng.shuffle(verbal.filter((s) => s.t === "PK")).slice(0, n);
  const pos = rata(pk.length);
  return pk.map((s, i) => {
    const { o, k } = susunOpsi(rng, s.o, pos[i]);
    const q = s.f === "L"
      ? `<p class="kelompok">${s.q.map(esc).join(", ")}, …</p><p class="tanya">Kata yang paling tepat melengkapi kelompok di atas adalah …</p>`
      : `<p class="tanya">Manakah kata yang <b>paling berbeda</b> dari kelompoknya?</p>`;
    return { q, o: o.map(esc), k, e: esc(s.e) + ` <span class="kel">Kelompok: ${esc(s.g)}.</span>`, sid: sidikPK(s), g: s.g, f: s.f, kk: s.kk, dasar: s.dasar, d: s.d };
  });
}
function kepribadianPD(n) {
  const ulang = 6;
  const pasang = rng.shuffle(bank.pasangan).slice(0, 4).flat();
  const lain = rng.shuffle(bank.PD.filter((x) => !pasang.includes(x.id))).slice(0, n - ulang - pasang.length);
  const dasar = rng.shuffle(lain.concat(bank.PD.filter((x) => pasang.includes(x.id))));
  const out = dasar.map((x) => ({ id: x.id, q: x.q, d: x.d, r: x.r }));
  // pernyataan berulang: diambil dari 30 butir pertama, disisipkan di paruh akhir
  const asal = rng.sample(out.slice(0, 30), ulang);
  asal.forEach((x) => out.splice(rng.int(Math.max(36, out.indexOf(x) + 20), out.length), 0, { ...x, u: 1 }));
  return { soal: out, pasangan: rng.shuffle(bank.pasangan).filter(([a, b]) => out.some((x) => x.id === a) && out.some((x) => x.id === b)) };
}
function kepribadianKK(n) {
  const out = [];
  for (const sk of rng.shuffle(bank.KK)) {
    if (out.length >= n) break;
    sk.p.forEach((p, i) => out.length < n && out.push({ id: `${sk.id}-${i + 1}`, sk: sk.id, s: sk.s, q: p.q, d: p.d, r: p.r }));
  }
  return out;
}

const subtes = SUBTES.map((m) => {
  const dasar = { kode: m.kode, no: m.no, nama: m.nama, n: m.n, durasi: m.durasi, batas: m.batas, target: m.target, jenis: m.jenis };
  if (m.kode === "SA") return { ...dasar, soal: verbalSA(m.n) };
  if (m.kode === "PK") return { ...dasar, soal: verbalPK(m.n) };
  if (m.kode === "PD") return { ...dasar, ...kepribadianPD(m.n) };
  if (m.kode === "KK") return { ...dasar, soal: kepribadianKK(m.n) };
  if (m.kode === "VM") return { ...dasar, ...buatSubtes("VM", seed, m.n) };
  return { ...dasar, ...buatSubtes(m.kode, seed, m.n, rata(m.n)) };
});
for (const st of subtes) {
  if (st.soal.length !== st.n) { console.log(`GAGAL ${st.kode}: ${st.soal.length} soal, seharusnya ${st.n}.`); process.exit(2); }
}

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const BLN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const [y, mo, d] = tanggal.split("-").map(Number);
const judul = `Simulasi ${d} ${BULAN[mo - 1]} ${y}`;
const kunci = `whetio-psikotes-${tanggal.replace(/-/g, "")}-v1`;
const total = subtes.reduce((a, s) => a + s.n, 0);
const paket = { id: tanggal, tanggal, judul, judulPendek: `${d} ${BLN[mo - 1]}`, kunci, versi: 1, jumlah: total, subtes };

const dir = path.join(root, "psikotes", "paket", tanggal);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "soal.json"), JSON.stringify(paket) + "\n");
fs.writeFileSync(path.join(dir, "index.html"), `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Siap Psikotes · ${d} ${BLN[mo - 1]} · Whetio</title>
<meta name="description" content="${judul}: simulasi penuh psikotes UPKP — 11 subtes, ${total} butir, berwaktu seperti ujian asli.">
<link rel="icon" href="/assets/img/logo.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap">
<link rel="stylesheet" href="/assets/whetio.css">
</head>
<body>
<div id="app" data-src="/psikotes/paket/${tanggal}/soal.json"><p class="muat">Memuat simulasi…</p></div>
<script type="module" src="/assets/js/paket.js"></script>
</body>
</html>
`);

const mf = path.join(root, "psikotes", "paket.json");
const list = (fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, "utf8")) : []).filter((p) => p.id !== tanggal);
list.unshift({ id: tanggal, tanggal, judul, kunci, jumlah: total, subtes: Object.fromEntries(subtes.map((s) => [s.kode, s.n])) });
list.sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
fs.writeFileSync(mf, JSON.stringify(list, null, 2) + "\n");

const ringkas = subtes.map((s) => {
  if (s.jenis !== "pg" && s.jenis !== "vm") return `${s.kode} ${s.n}`;
  const h = Array(s.jenis === "vm" ? 6 : 5).fill(0); s.soal.forEach((q) => h[q.k]++);
  return `${s.kode} ${s.n} [${h.join("/")}]`;
});
console.log(`Paket ${tanggal} diterbitkan: ${total} butir, ${(fs.statSync(path.join(dir, "soal.json")).size / 1024).toFixed(0)} KB.\n` + ringkas.join(" · "));
