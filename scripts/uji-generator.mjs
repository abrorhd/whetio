#!/usr/bin/env node
// Uji tahan banting generator: banyak benih, cek opsi unik, kunci valid, ketunggalan kunci (diagram & block), kerumitan figural (block & visual).
// Pakai: node scripts/uji-generator.mjs [jumlahBenih=40]
import { SUBTES, buatSubtes } from "../assets/js/gen/index.js";
import { BENTUK } from "../assets/js/gen/diagram.js";
import { blockData, kuadran, kunciBlok } from "../assets/js/gen/block.js";
import { susunRef, kunciVM, tersambung } from "../assets/js/gen/visual.js";
import { SKENARIO, cekSkenario } from "../assets/js/gen/silogisme.js";
import { buatRng } from "../assets/js/gen/rng.js";

const N = Number(process.argv[2] || 40);
let gagal = 0;
const lapor = (m) => { gagal++; if (gagal < 30) console.log("GAGAL " + m); };

// Bentuk diagram harus asimetris: 8 transformasi D4 menghasilkan himpunan titik berbeda.
for (const [nama, pts] of Object.entries(BENTUK)) {
  const P = pts.split(" ").map((p) => p.split(",").map(Number)).map(([x, y]) => [x - 50, y - 50]);
  const tf = [];
  for (let cer = 0; cer < 2; cer++) for (let rot = 0; rot < 4; rot++) {
    tf.push(P.map(([x, y]) => { let a = cer ? -x : x, b = y; for (let i = 0; i < rot; i++) [a, b] = [-b, a]; return `${Math.round(a)},${Math.round(b)}`; }).sort().join(" "));
  }
  if (new Set(tf).size !== 8) lapor(`bentuk ${nama} simetris (${new Set(tf).size}/8)`);
}

// Silogisme: setiap skenario kategoris konsisten (hubungan antarhimpunannya benar-benar berlaku).
for (const sk of SKENARIO) cekSkenario(sk).forEach((m) => lapor(`SIL skenario "${sk.t.join(" / ")}": ${m}`));

// Block Pattern: kunci = kuadran bertanda ? persis; tidak ada pengecoh yang sama dengan kunci; kuadran cukup rumit.
for (let i = 0; i < N * 5; i++) {
  const d = blockData(buatRng("uji-bp-" + i)), kb = kunciBlok(d.benar);
  if (kb !== kunciBlok(kuadran(d.g, d.t))) lapor(`BP uji-bp-${i}: kunci bukan kuadran ?`);
  if (d.g.length !== 6 || d.benar.length !== 3) lapor(`BP uji-bp-${i}: ukuran pola bukan 6×6 / 3×3`);
  const ks = d.peng.map((p) => kunciBlok(p.g));
  if (ks.includes(kb) || new Set(ks).size !== 4) lapor(`BP uji-bp-${i}: pengecoh sama dengan kunci/sesamanya`);
  if (!d.peng.some((p) => p.w.startsWith("potongan benar dengan"))) lapor(`BP uji-bp-${i}: tidak ada pengecoh yang hampir sama`);
  if (d.benar.flat().filter((x) => x >= 2).length < 3) lapor(`BP uji-bp-${i}: kuadran kunci terlalu sederhana`);
}
// Visual Matching: enam referensi berbeda, tersambung, 5–7 ruas, dan tiap pasangan beda minimal satu ruas/titik.
for (let i = 0; i < N * 5; i++) {
  const ref = susunRef(buatRng("uji-vm-" + i));
  if (ref.length !== 6 || new Set(ref.map(kunciVM)).size !== 6) lapor(`VM uji-vm-${i}: referensi tidak unik`);
  ref.forEach((g, a) => {
    if (!tersambung(g.r)) lapor(`VM uji-vm-${i}: referensi ${a} terputus`);
    if (g.r.length < 5 || g.r.length > 7) lapor(`VM uji-vm-${i}: referensi ${a} punya ${g.r.length} ruas`);
    ref.slice(a + 1).forEach((h) => {
      const beda = g.r.filter((x) => !h.r.includes(x)).length + h.r.filter((x) => !g.r.includes(x)).length;
      if (beda < 2 && String(g.t) === String(h.t)) lapor(`VM uji-vm-${i}: dua referensi nyaris sama`);
    });
  });
}

const t0 = Date.now();
for (const s of SUBTES.filter((x) => x.gen || x.kode === "VM")) {
  const t1 = Date.now();
  for (let i = 0; i < N; i++) {
    const seed = "uji-" + i;
    const r = buatSubtes(s.kode, seed, s.kode === "VM" ? 30 : 5);
    if (s.kode === "VM") {
      if (r.ref.length !== 6 || new Set(r.ref).size !== 6) lapor(`VM ${seed}: referensi tidak unik`);
      r.soal.forEach((q, j) => { if (r.ref[q.k] === undefined) lapor(`VM ${seed}#${j}: kunci di luar A–F`); });
      continue;
    }
    if (r.soal.length !== 5) lapor(`${s.kode} ${seed}: hanya ${r.soal.length} soal`);
    r.soal.forEach((q, j) => {
      if (q.o.length !== 5) lapor(`${s.kode} ${seed}#${j}: opsi ${q.o.length}`);
      if (new Set(q.o).size !== q.o.length) lapor(`${s.kode} ${seed}#${j}: opsi kembar → ${q.o.join(" | ").slice(0, 200)}`);
      if (!(q.k >= 0 && q.k < q.o.length)) lapor(`${s.kode} ${seed}#${j}: kunci tidak valid`);
      if (!q.e || q.e.length < 20) lapor(`${s.kode} ${seed}#${j}: pembahasan kosong`);
      if (/undefined|NaN|null/.test(q.q + q.o.join("") + q.e)) lapor(`${s.kode} ${seed}#${j}: ada undefined/NaN → ${(q.q + " || " + q.o.join(" | ")).replace(/<[^>]+>/g, " ").slice(0, 240)}`);
    });
  }
  console.log(`${s.kode.padEnd(4)} ${N} benih × ${s.kode === "VM" ? 30 : 5} soal — ${Date.now() - t1} ms`);
}
console.log(gagal ? `\n${gagal} masalah.` : `\nLOLOS (${Date.now() - t0} ms)`);
process.exit(gagal ? 1 : 0);
