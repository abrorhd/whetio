// Subtes 3 — Diagram Reasoning. Bentuk asimetris (tiap putaran/cermin tampak berbeda),
// aturan bernomor diperlihatkan lewat contoh, lalu diterapkan berurutan pada figur baru.
import { esc } from "./rng.js";

export const BENTUK = {
  L: "30,14 48,14 48,68 78,68 78,86 30,86",
  bendera: "28,12 37,12 37,20 76,33 37,47 37,88 28,88",
  panah: "24,86 24,44 60,44 60,30 84,52 60,74 60,60 40,60 40,86",
  P: "30,14 62,14 76,28 76,44 62,58 46,58 46,86 30,86",
  sepatu: "30,16 46,16 46,58 80,64 80,84 30,84",
};
const NAMA_BENTUK = Object.keys(BENTUK);

// keadaan: {b, rot(0..3, searah jarum jam), cer(0/1, cermin kiri-kanan diterapkan lebih dulu), isi(0 putih/1 hitam), kecil(0/1), titik(0/1)}
export const OPS = {
  R90: { t: "putar 90° searah jarum jam", f: (s) => ({ ...s, rot: (s.rot + 1) % 4 }) },
  R180: { t: "putar 180°", f: (s) => ({ ...s, rot: (s.rot + 2) % 4 }) },
  R270: { t: "putar 90° berlawanan arah jarum jam", f: (s) => ({ ...s, rot: (s.rot + 3) % 4 }) },
  CH: { t: "cerminkan kiri–kanan", f: (s) => ({ ...s, rot: (4 - s.rot) % 4, cer: 1 - s.cer }) },
  CV: { t: "cerminkan atas–bawah", f: (s) => ({ ...s, rot: (6 - s.rot) % 4, cer: 1 - s.cer }) },
  INV: { t: "balik warna (hitam ↔ putih)", f: (s) => ({ ...s, isi: 1 - s.isi }) },
  UK: { t: "ubah ukuran (besar ↔ kecil)", f: (s) => ({ ...s, kecil: 1 - s.kecil }) },
  TT: { t: "tambah/hapus titik di tengah", f: (s) => ({ ...s, titik: 1 - s.titik }) },
};
const GEO = ["R90", "R180", "R270", "CH", "CV"];
const ATR = ["INV", "UK", "TT"];
const kunciS = (s) => [s.b, s.rot, s.cer, s.isi, s.kecil, s.titik].join("|");

export function figur(s, uk = 64) {
  const sk = s.kecil ? 0.62 : 1;
  const tf = `translate(50 50) scale(${sk}) rotate(${s.rot * 90}) scale(${s.cer ? -1 : 1} 1) translate(-50 -50)`;
  const isi = s.isi ? "var(--ink)" : "var(--surface)";
  const titik = s.titik ? `<circle cx="50" cy="50" r="7" fill="${s.isi ? "var(--surface)" : "var(--ink)"}" stroke="var(--ink)" stroke-width="2"/>` : "";
  return `<svg class="fig" viewBox="0 0 100 100" width="${uk}" height="${uk}" aria-hidden="true"><rect x="2" y="2" width="96" height="96" rx="6" fill="none" stroke="var(--line)" stroke-width="2"/><g transform="${tf}"><polygon points="${BENTUK[s.b]}" fill="${isi}" stroke="var(--ink)" stroke-width="3.5" stroke-linejoin="round"/></g>${titik}</svg>`;
}
const terapkan = (s, aturan) => aturan.reduce((x, op) => OPS[op].f(x), s);
const acakS = (rng, b) => ({ b: b || rng.pick(NAMA_BENTUK), rot: rng.int(0, 3), cer: rng.int(0, 1), isi: rng.int(0, 1), kecil: rng.chance(0.25) ? 1 : 0, titik: rng.chance(0.2) ? 1 : 0 });
const bulat = (n) => `<span class="no-aturan">${n}</span>`;

export function diagram(rng) {
  for (let coba = 0; coba < 200; coba++) {
    // empat aturan bernomor; sebagian berupa gabungan geometri + atribut
    const pilih = rng.sample(GEO, 3).concat(rng.sample(ATR, 1));
    const aturan = rng.shuffle(pilih).map((g) => (GEO.includes(g) && rng.chance(0.25) ? [g, rng.pick(ATR)] : [g]));
    const panjang = rng.pick([2, 2, 3]);
    const urut = []; while (urut.length < panjang) { const i = rng.int(0, 3); if (urut[urut.length - 1] !== i) urut.push(i); }
    const awal = acakS(rng);
    const opsUrut = urut.flatMap((i) => aturan[i]);
    const jawab = terapkan(awal, opsUrut);
    // pengecoh: urutan terbalik, tanpa langkah terakhir/pertama, aturan tertukar, putar arah salah
    const kand = [
      terapkan(awal, urut.slice().reverse().flatMap((i) => aturan[i])),
      terapkan(awal, urut.slice(0, -1).flatMap((i) => aturan[i])),
      terapkan(awal, urut.slice(1).flatMap((i) => aturan[i])),
      terapkan(awal, urut.map((i) => (i + 1) % 4).flatMap((i) => aturan[i])),
      terapkan(jawab, ["R180"]), terapkan(jawab, ["CH"]), terapkan(jawab, ["INV"]), terapkan(jawab, ["R90"]),
    ];
    const lihat = new Set([kunciS(jawab)]), pengecoh = [];
    for (const s of kand) { const k = kunciS(s); if (!lihat.has(k)) { lihat.add(k); pengecoh.push(s); } }
    const kuat = pengecoh.slice(0, 4);
    if (kuat.length < 4) continue;
    const contoh = aturan.map((ops, i) => {
      const a = acakS(rng, NAMA_BENTUK.filter((b) => b !== awal.b)[i % 4]);
      const b = terapkan(a, ops);
      return `<div class="aturan">${figur(a, 52)}<span class="panah">→</span>${bulat(i + 1)}<span class="panah">→</span>${figur(b, 52)}</div>`;
    }).join("");
    const soal = `<div class="aturan tanya">${figur(awal, 64)}${urut.map((i) => `<span class="panah">→</span>${bulat(i + 1)}`).join("")}<span class="panah">→</span><span class="tanda">?</span></div>`;
    const daftar = aturan.map((ops, i) => `${i + 1} = ${ops.map((o) => OPS[o].t).join(" + ")}`).join("; ");
    const e = `Aturan dari contoh: ${esc(daftar)}. Terapkan berurutan ${urut.map((i) => i + 1).join(" → ")} pada figur awal. Urutan penting: membalik urutan atau melewatkan satu aturan menghasilkan figur lain di pilihan jawaban.`;
    return { q: `<div class="stem-diagram"><div class="contoh">${contoh}</div>${soal}</div>`, o: [jawab].concat(kuat).map((s) => figur(s, 60)), e };
  }
  throw new Error("diagram gagal");
}
