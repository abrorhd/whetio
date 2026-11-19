// Subtes 1 — Logika Penalaran Instruksi (baris–kolom, penukaran, syarat, arah).
import { esc } from "./rng.js";

const KATA = ("Ayah Bata Buku Bel Cicak Daun Emas Gelas Hujan Ikan Jarak Kain Kapal Kucing Lampu Langit Laptop Madu Meja Nanas Obat Pagar Payung Pensil Rok Roti Sapi Sabun Sayur Soda Spons Tali Tahu Tikar Ubi Ulat Wajan Zebra " +
  "Anggur Api Awan Bambu Bantal Batu Benang Bola Bunga Cermin Dasi Delima Domba Elang Embun Garam Gitar Gunung Handuk Helm Ijuk Jagung Jamur Jeruk Kabel Kaca Kayu Kelinci Kertas " +
  "Kipas Kopi Kunci Lemari Lilin Mangga Mawar Minyak Nampan Obeng Oven Padi Panci Pasir Perahu Piring Rambut Rusa Sendok Sepatu Sumur Tas Teko Tenda Topi Udang Ular Undangan " +
  "Bensin Akar Atap Arang Ember Ekor Irisan Kancing Kasur Lilin Mentega Ombak Pisang Rakit Salju Tomat Wortel Bawang Kursi Pintu Jendela Pena Dompet Karpet Koin").split(" ");
const KATA_U = [...new Set(KATA)];
const ANGKA = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh"];
const VOKAL = "AIUEO";
const ARAH = [
  { d: [0, 1], t: "kotak di sebelah kanannya" }, { d: [0, -1], t: "kotak di sebelah kirinya" },
  { d: [-1, 0], t: "kotak di atasnya" }, { d: [1, 0], t: "kotak di bawahnya" },
  { d: [0, 2], t: "dua kotak di sebelah kanannya" }, { d: [0, -2], t: "dua kotak di sebelah kirinya" },
  { d: [2, 0], t: "dua kotak di bawahnya" }, { d: [-2, 0], t: "dua kotak di atasnya" },
  { d: [1, 1], t: "kotak serong kanan bawahnya" }, { d: [-1, -1], t: "kotak serong kiri atasnya" },
];

function syarat(rng, kata) {
  const L = kata.length, up = kata.toUpperCase();
  const jenis = rng.pick(["gt", "gt", "lt", "eq", "awal", "akhir", "isi"]);
  if (jenis === "gt") { const N = Math.max(3, L - rng.int(0, 2)); return { t: `terdiri dari lebih dari ${ANGKA[N]} huruf`, f: (w) => w.length > N }; }
  if (jenis === "lt") { const N = Math.min(9, L + rng.int(0, 1)); return { t: `terdiri dari kurang dari ${ANGKA[N]} huruf`, f: (w) => w.length < N }; }
  if (jenis === "eq") { const N = Math.max(3, Math.min(9, L + rng.pick([0, 0, 1, -1]))); return { t: `terdiri dari tepat ${ANGKA[N]} huruf`, f: (w) => w.length === N }; }
  if (jenis === "awal") { const v = rng.chance(0.5); return { t: `diawali huruf ${v ? "vokal" : "konsonan"}`, f: (w) => VOKAL.includes(w[0].toUpperCase()) === v }; }
  if (jenis === "akhir") { const v = rng.chance(0.5); return { t: `diakhiri huruf ${v ? "vokal" : "konsonan"}`, f: (w) => VOKAL.includes(w[w.length - 1].toUpperCase()) === v }; }
  const ada = rng.chance(0.5);
  const pool = ada ? [...new Set(up.split(""))] : "BDGKLMNPRSTU".split("").filter((h) => !up.includes(h));
  const h = rng.pick(pool.length ? pool : ["Z"]);
  return { t: `mengandung huruf ${h}`, f: (w) => w.toUpperCase().includes(h) };
}

export function instruksi(rng) {
  for (let coba = 0; coba < 200; coba++) {
    const [R, C] = rng.pick([[3, 3], [3, 4], [4, 4], [4, 4], [4, 5], [5, 4], [5, 5]]);
    const w = rng.sample(KATA_U, R * C);
    const awal = Array.from({ length: R }, (_, r) => w.slice(r * C, r * C + C));
    const g = awal.map((row) => row.slice());
    const sel = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) sel.push([r, c]);
    const nTukar = rng.pick([0, 1, 1, 2, 2, 2]);
    const tukar = [];
    for (let i = 0; i < nTukar; i++) {
      const [a, b] = rng.sample(sel, 2);
      tukar.push([a, b]);
      const t = g[a[0]][a[1]]; g[a[0]][a[1]] = g[b[0]][b[1]]; g[b[0]][b[1]] = t;
    }
    const kandidatSyarat = nTukar && rng.chance(0.6) ? rng.pick(tukar)[rng.int(0, 1)] : rng.pick(sel);
    const [sr, sc] = kandidatSyarat;
    const sy = syarat(rng, g[sr][sc]);
    const dalam = (r, c) => r >= 0 && r < R && c >= 0 && c < C;
    const arahOk = ARAH.filter((a) => dalam(sr + a.d[0], sc + a.d[1]));
    if (arahOk.length < 2) continue;
    const [a1, a2] = rng.sample(arahOk, 2);
    const t1 = [sr + a1.d[0], sc + a1.d[1]], t2 = [sr + a2.d[0], sc + a2.d[1]];
    const benar = sy.f(g[sr][sc]);
    const tj = benar ? t1 : t2, tl = benar ? t2 : t1;
    const kunci = g[tj[0]][tj[1]];
    // Jebakan: mengabaikan penukaran, salah cabang, kata syarat, tetangga.
    const benarAwal = sy.f(awal[sr][sc]);
    const tjAwal = benarAwal ? t1 : t2;
    const kandidat = [g[tl[0]][tl[1]], awal[tjAwal[0]][tjAwal[1]], awal[tj[0]][tj[1]], g[sr][sc]];
    for (const a of ARAH.slice(0, 4)) { const r = tj[0] + a.d[0], c = tj[1] + a.d[1]; if (dalam(r, c)) kandidat.push(g[r][c]); }
    const pengecoh = [...new Set(kandidat.filter((x) => x !== kunci))];
    if (pengecoh.length < 4) continue;
    // Dua pengecoh terkuat (cabang lain, abaikan penukaran) + dua acak dari sisanya.
    const unik = [kunci].concat(pengecoh.slice(0, 2), rng.sample(pengecoh.slice(2), 2));

    const tabel = '<table class="grid-kata">' + awal.map((row) => "<tr>" + row.map((x) => `<td>${esc(x)}</td>`).join("") + "</tr>").join("") + "</table>";
    const kal = tukar.map(([a, b]) => `Tukar baris ${a[0] + 1} kolom ${a[1] + 1} dengan baris ${b[0] + 1} kolom ${b[1] + 1}.`);
    kal.push(`Jika baris ${sr + 1} kolom ${sc + 1} ${sy.t}, maka jawabannya adalah ${a1.t}. Jika tidak, maka jawabannya adalah ${a2.t}.`);
    const langkah = tukar.map(([a, b], i) => `Tukar ${i + 1}: (${a[0] + 1},${a[1] + 1}) ↔ (${b[0] + 1},${b[1] + 1}).`);
    const e = (langkah.length ? langkah.join(" ") + " " : "") +
      `Setelah itu baris ${sr + 1} kolom ${sc + 1} berisi <b>${esc(g[sr][sc])}</b> (${g[sr][sc].length} huruf), sehingga syarat “${esc(sy.t)}” ${benar ? "terpenuhi" : "tidak terpenuhi"}. ` +
      `Jawabannya ${benar ? a1.t : a2.t}: <b>${esc(kunci)}</b>.` + (nTukar && awal[tjAwal[0]][tjAwal[1]] !== kunci ? ` Bila penukaran diabaikan, Anda akan memilih ${esc(awal[tjAwal[0]][tjAwal[1]])}.` : "");
    return { q: `<div class="stem-instruksi">${tabel}<p>${kal.map(esc).join(" ")}</p></div>`, o: unik.slice(0, 5).map(esc), e };
  }
  throw new Error("instruksi: gagal membuat soal");
}
