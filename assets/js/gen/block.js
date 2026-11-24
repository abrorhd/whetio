// Subtes 8 — Block Pattern: pilih potongan kuadran yang hilang dari pola 6×6 (empat kuadran 3×3).
// Sel: 0 kosong, 1 penuh, segitiga hitam dengan sudut siku di 2=kiri-bawah, 3=kanan-atas, 4=kiri-atas, 5=kanan-bawah,
// setengah sel hitam di 6=atas, 7=kanan, 8=bawah, 9=kiri.
const ROT = { 0: 0, 1: 1, 4: 3, 3: 5, 5: 2, 2: 4, 6: 7, 7: 8, 8: 9, 9: 6 }; // putar 90° searah jarum jam
const CER = { 0: 0, 1: 1, 4: 3, 3: 4, 2: 5, 5: 2, 6: 6, 8: 8, 7: 9, 9: 7 }; // cermin kiri–kanan
const BAL = { 0: 0, 1: 1, 4: 2, 2: 4, 3: 5, 5: 3, 6: 8, 8: 6, 7: 7, 9: 9 }; // cermin atas–bawah
const INV = { 0: 1, 1: 0, 4: 5, 5: 4, 3: 2, 2: 3, 6: 8, 8: 6, 7: 9, 9: 7 }; // warna terbalik
// Sel pengganti yang sekilas mirip (untuk pengecoh "satu sel berbeda").
const MIRIP = { 0: [6, 7, 8, 9, 2, 3, 4, 5], 1: [6, 7, 8, 9, 2, 3, 4, 5], 2: [4, 5, 8, 9], 3: [4, 5, 6, 7], 4: [2, 3, 6, 9], 5: [2, 3, 7, 8], 6: [8, 3, 4, 1], 7: [9, 3, 5, 1], 8: [6, 2, 5, 1], 9: [7, 2, 4, 1] };
const putar = (g) => g[0].map((_, c) => g.map((row) => ROT[row[c]]).reverse());
const cermin = (g) => g.map((row) => row.slice().reverse().map((x) => CER[x]));
const cerminAtas = (g) => g.slice().reverse().map((row) => row.map((x) => BAL[x]));
const balik = (g) => g.map((row) => row.map((x) => INV[x]));
const kunciG = (g) => g.map((r) => r.join("")).join("/");
const N = 6, H = N / 2;

function sel(x, y, s, t) {
  if (t === 0) return "";
  const e = 0.4; // tumpang tipis agar tidak ada celah garis rambut antar-sel
  if (t === 1) return `<rect x="${x}" y="${y}" width="${s + e}" height="${s + e}"/>`;
  if (t >= 6) {
    const h = s / 2;
    const r = { 6: [x, y, s + e, h + e], 7: [x + h, y, h + e, s + e], 8: [x, y + h, s + e, h + e], 9: [x, y, h + e, s + e] }[t];
    return `<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}"/>`;
  }
  const TL = `${x},${y}`, TR = `${x + s},${y}`, BL = `${x},${y + s}`, BR = `${x + s},${y + s}`;
  const p = { 2: [TL, BL, BR], 3: [TL, TR, BR], 4: [BL, TL, TR], 5: [TR, BR, BL] }[t];
  return `<polygon points="${p.join(" ")}"/>`;
}
export function gambarPola(g, uk) {
  const n = g.length, s = +(100 / n).toFixed(4);
  let isi = "", kisi = "";
  g.forEach((row, r) => row.forEach((t, c) => (isi += sel(+(c * s).toFixed(3), +(r * s).toFixed(3), s, t))));
  for (let i = 1; i < n; i++) { const p = +(i * s).toFixed(3); kisi += `M${p} 0V100M0 ${p}H100`; }
  return `<svg class="blok" viewBox="-1 -1 102 102" width="${uk}" height="${uk}" aria-hidden="true"><rect x="0" y="0" width="100" height="100" fill="var(--surface)"/><path d="${kisi}" stroke="var(--line)" stroke-width="0.6" fill="none"/><g fill="var(--ink)">${isi}</g><rect x="0" y="0" width="100" height="100" fill="none" stroke="var(--ink)" stroke-width="2"/></svg>`;
}
function kerangka(target, uk) {
  let s = "";
  for (let q = 0; q < 4; q++) {
    const x = (q % 2) * 50, y = Math.floor(q / 2) * 50;
    s += `<rect x="${x}" y="${y}" width="50" height="50" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/>`;
    if (q === target) s += `<text x="${x + 25}" y="${y + 36}" text-anchor="middle" font-size="30" font-weight="800" fill="var(--ink)">?</text>`;
  }
  return `<svg class="blok" viewBox="-1 -1 102 102" width="${uk}" height="${uk}" aria-hidden="true">${s}</svg>`;
}
const NAMA_Q = ["kiri atas", "kanan atas", "kiri bawah", "kanan bawah"];

function selAcak(rng) {
  const x = rng();
  if (x < 0.24) return 1;
  if (x < 0.52) return rng.pick([2, 3, 4, 5]);
  if (x < 0.74) return rng.pick([6, 7, 8, 9]);
  return 0;
}
// Pengecoh paling halus: potongan benar dengan satu sel diganti sel yang mirip.
function satuSel(rng, g) {
  const r = rng.int(0, H - 1), c = rng.int(0, H - 1);
  const h = g.map((row) => row.slice());
  h[r][c] = rng.pick(MIRIP[g[r][c]]);
  return { g: h, w: `potongan benar dengan satu sel berbeda (baris ${r + 1}, kolom ${c + 1})` };
}
// Dua sel bersebelahan yang berbeda isinya ditukar.
function tukarSel(rng, g) {
  for (let i = 0; i < 20; i++) {
    const r = rng.int(0, H - 1), c = rng.int(0, H - 1), mendatar = rng.chance(0.5);
    const r2 = mendatar ? r : r + 1, c2 = mendatar ? c + 1 : c;
    if (r2 >= H || c2 >= H || g[r][c] === g[r2][c2]) continue;
    const h = g.map((row) => row.slice());
    [h[r][c], h[r2][c2]] = [h[r2][c2], h[r][c]];
    return { g: h, w: "potongan benar dengan dua sel bersebelahan tertukar" };
  }
  return satuSel(rng, g);
}

// Data mentah satu soal (dipakai juga oleh scripts/uji-generator.mjs untuk memeriksa ketunggalan kunci).
export function blockData(rng) {
  for (let coba = 0; coba < 500; coba++) {
    const g = Array.from({ length: N }, () => Array.from({ length: N }, () => selAcak(rng)));
    const Q = [0, 1, 2, 3].map((q) => kuadran(g, q));
    // tiap kuadran harus "ramai": ada sel kosong, ada sel hitam penuh/separuh, dan minimal tiga sel miring/setengah
    if (Q.some((q) => { const f = q.flat(); return !f.includes(0) || f.filter((x) => x >= 2).length < 3 || f.every((x) => x !== 1 && x < 6); })) continue;
    if (new Set(Q.map(kunciG)).size < 4) continue;
    const t = rng.int(0, 3), benar = Q[t];
    const lain = rng.shuffle(Q.filter((_, i) => i !== t)).map((q) => ({ g: q, w: "kuadran lain" }));
    const ubah = rng.shuffle([
      { g: putar(benar), w: "potongan benar yang diputar 90°" }, { g: putar(putar(benar)), w: "potongan benar yang diputar 180°" },
      { g: cermin(benar), w: "potongan benar yang dicerminkan kiri–kanan" }, { g: cerminAtas(benar), w: "potongan benar yang dicerminkan atas–bawah" },
      { g: balik(benar), w: "potongan benar dengan warna terbalik" },
    ]);
    const halus = [satuSel(rng, benar), tukarSel(rng, benar), satuSel(rng, benar), satuSel(rng, benar)];
    const lihat = new Set([kunciG(benar), ...Q.filter((_, i) => i !== t).map(kunciG)]), peng = [];
    const ambil = (x, paksa) => { const k = kunciG(x.g); if (paksa ? !peng.some((p) => kunciG(p.g) === k) && k !== kunciG(benar) : !lihat.has(k)) { lihat.add(k); peng.push(x); } };
    // susunan pengecoh: 1–2 yang hampir sama (satu sel beda / tertukar), 1 kuadran lain, sisanya transformasi
    const nHalus = rng.pick([1, 2, 2]);
    halus.forEach((x) => peng.length < nHalus && ambil(x));
    ambil(lain[0], true);
    ubah.forEach((x) => peng.length < 4 && ambil(x));
    halus.concat(lain).forEach((x) => peng.length < 4 && ambil(x, lain.includes(x)));
    if (peng.length < 4) continue;
    return { g, t, Q, benar, peng };
  }
  throw new Error("block gagal");
}
export const kuadran = (g, t) => { const r0 = Math.floor(t / 2) * H, c0 = (t % 2) * H; return g.slice(r0, r0 + H).map((row) => row.slice(c0, c0 + H)); };
export { kunciG as kunciBlok };

export function block(rng) {
  const { g, t, benar, peng } = blockData(rng);
  const q = `<div class="stem-blok">${gambarPola(g, 150)}<span class="sama">=</span>${kerangka(t, 150)}</div>`;
  const e = `Tanda ? ada di kuadran ${NAMA_Q[t]}; ambil potongan 3×3 tepat dari posisi itu tanpa diputar, dicerminkan, atau diubah satu sel pun. Pengecoh: ${[...new Set(peng.map((p) => p.w))].join("; ")}.`;
  return { q, o: [benar].concat(peng.map((p) => p.g)).map((x) => gambarPola(x, 72)), e };
}
