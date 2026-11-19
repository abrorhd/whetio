// Subtes 8 — Block Pattern: pilih potongan kuadran yang hilang dari pola 4×4.
// Sel: 0 kosong, 1 penuh, segitiga hitam dengan sudut siku di 2=kiri-bawah, 3=kanan-atas, 4=kiri-atas, 5=kanan-bawah.
const ROT = { 0: 0, 1: 1, 4: 3, 3: 5, 5: 2, 2: 4 };
const CER = { 0: 0, 1: 1, 4: 3, 3: 4, 2: 5, 5: 2 };
const INV = { 0: 1, 1: 0, 4: 5, 5: 4, 3: 2, 2: 3 };
const putar = (g) => g[0].map((_, c) => g.map((row) => ROT[row[c]]).reverse());
const cermin = (g) => g.map((row) => row.slice().reverse().map((x) => CER[x]));
const balik = (g) => g.map((row) => row.map((x) => INV[x]));
const kunciG = (g) => g.map((r) => r.join("")).join("/");

function sel(x, y, s, t) {
  if (t === 0) return "";
  if (t === 1) return `<rect x="${x}" y="${y}" width="${s + 0.4}" height="${s + 0.4}"/>`;
  const TL = `${x},${y}`, TR = `${x + s},${y}`, BL = `${x},${y + s}`, BR = `${x + s},${y + s}`;
  const p = { 2: [TL, BL, BR], 3: [TL, TR, BR], 4: [BL, TL, TR], 5: [TR, BR, BL] }[t];
  return `<polygon points="${p.join(" ")}"/>`;
}
export function gambarPola(g, uk) {
  const n = g.length, s = 100 / n;
  let isi = "";
  g.forEach((row, r) => row.forEach((t, c) => (isi += sel(c * s, r * s, s, t))));
  return `<svg class="blok" viewBox="-1 -1 102 102" width="${uk}" height="${uk}" aria-hidden="true"><rect x="0" y="0" width="100" height="100" fill="var(--surface)"/><g fill="var(--ink)">${isi}</g><rect x="0" y="0" width="100" height="100" fill="none" stroke="var(--ink)" stroke-width="2"/></svg>`;
}
function kerangka(target, uk) {
  const h = uk / 2;
  let s = "";
  for (let q = 0; q < 4; q++) {
    const x = (q % 2) * 50, y = Math.floor(q / 2) * 50;
    s += `<rect x="${x}" y="${y}" width="50" height="50" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/>`;
    if (q === target) s += `<text x="${x + 25}" y="${y + 36}" text-anchor="middle" font-size="30" font-weight="800" fill="var(--ink)">?</text>`;
  }
  return `<svg class="blok" viewBox="-1 -1 102 102" width="${uk}" height="${uk}" aria-hidden="true">${s}</svg>`;
}
const NAMA_Q = ["kiri atas", "kanan atas", "kiri bawah", "kanan bawah"];

export function block(rng) {
  for (let coba = 0; coba < 500; coba++) {
    const pBlok = rng.pick([0.3, 0.38, 0.45]);
    const g = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => (rng() < pBlok ? 1 : rng() < 0.45 ? rng.pick([2, 3, 4, 5]) : 0)));
    const Q = [0, 1, 2, 3].map((q) => { const r0 = Math.floor(q / 2) * 2, c0 = (q % 2) * 2; return [g[r0].slice(c0, c0 + 2), g[r0 + 1].slice(c0, c0 + 2)]; });
    if (Q.some((q) => q.flat().every((x) => x === 0) || q.flat().every((x) => x === 1))) continue;
    if (new Set(Q.map(kunciG)).size < 4) continue;
    const t = rng.int(0, 3), benar = Q[t];
    const kand = [
      ...rng.shuffle(Q.filter((_, i) => i !== t)).map((q) => ({ g: q, w: "kuadran lain" })),
      { g: putar(benar), w: "potongan benar yang diputar 90°" }, { g: putar(putar(benar)), w: "potongan benar yang diputar 180°" },
      { g: cermin(benar), w: "potongan benar yang dicerminkan" }, { g: balik(benar), w: "potongan benar dengan warna terbalik" },
    ];
    const lihat = new Set([kunciG(benar)]), peng = [];
    const ambil = (x) => { const k = kunciG(x.g); if (!lihat.has(k)) { lihat.add(k); peng.push(x); } };
    // dua kuadran lain + dua transformasi, agar pengecoh tidak hanya satu jenis
    kand.slice(0, 2).forEach(ambil); rng.shuffle(kand.slice(3)).forEach((x) => peng.length < 4 && ambil(x)); kand.forEach((x) => peng.length < 4 && ambil(x));
    if (peng.length < 4) continue;
    const q = `<div class="stem-blok">${gambarPola(g, 132)}<span class="sama">=</span>${kerangka(t, 132)}</div>`;
    const e = `Tanda ? ada di kuadran ${NAMA_Q[t]}; ambil potongan 2×2 tepat dari posisi itu tanpa diputar atau dicerminkan. Pengecoh: ${[...new Set(peng.map((p) => p.w))].join(", ")}.`;
    return { q, o: [benar].concat(peng.map((p) => p.g)).map((x) => gambarPola(x, 64)), e };
  }
  throw new Error("block gagal");
}
