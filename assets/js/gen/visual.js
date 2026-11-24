// Subtes 9 — Visual Matching: cocokkan tiap gambar dengan salah satu dari 6 referensi (A–F), 3–5 detik per soal.
// Gambar disusun acak dari 5–7 ruas garis pada kisi 4×4 titik (kadang ditambah satu titik bulat). Enam referensi
// dibuat dari 2–3 "keluarga": tiap keluarga berisi satu bentuk dasar beserta versinya yang diputar, dicerminkan,
// atau digeser satu ruasnya — sehingga harus dibedakan dari ciri kecil, bukan dari bentuk kasarnya.
const M = 3; // koordinat titik kisi 0..3
const RUAS = [];
for (let y = 0; y <= M; y++) for (let x = 0; x <= M; x++) {
  if (x < M) RUAS.push([x, y, x + 1, y]);
  if (y < M) RUAS.push([x, y, x, y + 1]);
  if (x < M && y < M) RUAS.push([x, y, x + 1, y + 1], [x + 1, y, x, y + 1]);
}
const kunciR = ([a, b, c, d]) => (a < c || (a === c && b < d) ? `${a}${b}${c}${d}` : `${c}${d}${a}${b}`);
const miring = (r) => r[0] !== r[2] && r[1] !== r[3];
const TF = {
  R90: ([x, y]) => [M - y, x], R180: ([x, y]) => [M - x, M - y], R270: ([x, y]) => [y, M - x],
  CX: ([x, y]) => [M - x, y], CY: ([x, y]) => [x, M - y], TR: ([x, y]) => [y, x], AT: ([x, y]) => [M - y, M - x],
};
const NAMA_TF = Object.keys(TF);

// Kotak batas gambar (titik bulat dihitung selebar satu sel). Gambar selalu disimpan tergeser ke pojok kiri atas,
// sehingga dua gambar yang hanya beda letak dianggap sama (di layar keduanya digambar di tengah).
function batas(ruas, titik) {
  const xs = ruas.flatMap((r) => [r[0], r[2]]).concat(titik ? [titik[0] - 0.5, titik[0] + 0.5] : []);
  const ys = ruas.flatMap((r) => [r[1], r[3]]).concat(titik ? [titik[1] - 0.5, titik[1] + 0.5] : []);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}
function buat(ruas, titik) {
  const b = batas(ruas, titik);
  return { r: [...new Set(ruas.map(([a, c, d, e]) => kunciR([a - b.x, c - b.y, d - b.x, e - b.y])))].sort(), t: titik ? [titik[0] - b.x, titik[1] - b.y] : null };
}
const kunciG = (g) => g.r.join(" ") + "|" + (g.t ? g.t.join(",") : "");
const keRuas = (k) => [+k[0], +k[1], +k[2], +k[3]];
const ukuran = (g) => batas(g.r.map(keRuas), g.t);
function ubah(g, nama) {
  const f = TF[nama];
  return buat(g.r.map(keRuas).map(([a, b, c, d]) => [...f([a, b]), ...f([c, d])]), g.t ? f(g.t) : null);
}
const titikDari = (r) => [`${r[0]},${r[1]}`, `${r[2]},${r[3]}`];
function tersambung(rs) {
  if (!rs.length) return false;
  const R = rs.map(keRuas), lihat = new Set(titikDari(R[0])), pakai = new Set([0]);
  let ada = true;
  while (ada) {
    ada = false;
    R.forEach((r, i) => { if (!pakai.has(i) && titikDari(r).some((p) => lihat.has(p))) { pakai.add(i); titikDari(r).forEach((p) => lihat.add(p)); ada = true; } });
  }
  return pakai.size === R.length;
}
// Ruas yang boleh ditambahkan: belum dipakai dan bersinggungan dengan bentuk.
function calon(rs) {
  const titik = new Set(rs.map(keRuas).flatMap(titikDari)), ada = new Set(rs);
  return RUAS.filter((r) => !ada.has(kunciR(r)) && titikDari(r).some((p) => titik.has(p)));
}
const ambilBobot = (rng, arr) => { const w = arr.map((r) => (miring(r) ? 1 : 2.2)); let x = rng() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < arr.length; i++) if ((x -= w[i]) < 0) return arr[i]; return arr[arr.length - 1]; };

function bentukDasar(rng) {
  for (let coba = 0; coba < 200; coba++) {
    const k = rng.int(5, 7);
    let rs = [kunciR(ambilBobot(rng, RUAS))];
    while (rs.length < k) rs.push(kunciR(ambilBobot(rng, calon(rs))));
    const R = rs.map(keRuas);
    if (R.filter(miring).length > 3) continue;
    const g = buat(R, rng.chance(0.45) ? [rng.pick([0.5, 1.5, 2.5]), rng.pick([0.5, 1.5, 2.5])] : null);
    if (!cukup(g)) continue;
    // harus asimetris: delapan putaran/cerminan menghasilkan delapan gambar berbeda
    if (new Set([kunciG(g), ...NAMA_TF.map((n) => kunciG(ubah(g, n)))]).size !== 8) continue;
    return g;
  }
  return null;
}
// Geser satu ruas: lepas satu ruas lalu pasang satu ruas lain yang bersinggungan; bentuk tetap tersambung.
function geserRuas(rng, g) {
  for (let coba = 0; coba < 40; coba++) {
    const lepas = rng.pick(g.r), sisa = g.r.filter((x) => x !== lepas);
    if (!tersambung(sisa)) continue;
    const c = calon(sisa).filter((r) => kunciR(r) !== lepas);
    if (!c.length) continue;
    const h = buat([...sisa.map(keRuas), ambilBobot(rng, c)], g.t);
    if (tersambung(h.r) && cukup(h)) return h;
  }
  return null;
}
function geserTitik(rng, g) {
  if (!g.t) return null;
  const pilih = [0.5, 1.5, 2.5].flatMap((x) => [0.5, 1.5, 2.5].map((y) => [x, y])).filter(([x, y]) => x !== g.t[0] || y !== g.t[1]);
  const h = buat(g.r.map(keRuas), rng.pick(pilih));
  return cukup(h) ? h : null;
}
// Gambar harus cukup besar: lebar dan tinggi minimal dua sel kisi.
function cukup(g) { const b = ukuran(g); return b.w >= 2 && b.h >= 2; }

export { kunciG as kunciVM, tersambung, ukuran };
export function glyph(g, uk = 48) {
  const b = ukuran(g), ox = (M - b.w) / 2, oy = (M - b.h) / 2; // digambar di tengah bingkai
  const X = (v) => 6 + (v + ox) * 16, Y = (v) => 6 + (v + oy) * 16;
  const s = g.r.map(keRuas).map(([a, c, d, e]) => `<line x1="${X(a)}" y1="${Y(c)}" x2="${X(d)}" y2="${Y(e)}"/>`).join("");
  const t = g.t ? `<circle cx="${X(g.t[0])}" cy="${Y(g.t[1])}" r="4.2" fill="var(--ink)" stroke="none"/>` : "";
  return `<svg class="glyph" viewBox="0 0 60 60" width="${uk}" height="${uk}" aria-hidden="true"><g stroke="var(--ink)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">${s}${t}</g></svg>`;
}

// Enam referensi: 2 keluarga × 3 versi atau 3 keluarga × 2 versi. Diekspor untuk scripts/uji-generator.mjs.
export function susunRef(rng) {
  for (let coba = 0; coba < 100; coba++) {
    const nKel = rng.pick([2, 3]), per = 6 / nKel, ref = [], lihat = new Set();
    const tambah = (g) => { if (!g) return false; const k = kunciG(g); if (lihat.has(k)) return false; lihat.add(k); ref.push(g); return true; };
    let ok = true;
    for (let i = 0; i < nKel && ok; i++) {
      const dasar = bentukDasar(rng);
      if (!tambah(dasar)) { ok = false; break; }
      const tf = rng.shuffle(NAMA_TF);
      for (let j = 1; j < per && ok; j++) {
        let v = null;
        if (rng.chance(0.3)) v = rng.chance(0.3) ? geserTitik(rng, dasar) : geserRuas(rng, dasar);
        if (!v || lihat.has(kunciG(v))) v = ubah(dasar, tf.pop());
        while (lihat.has(kunciG(v)) && tf.length) v = ubah(dasar, tf.pop());
        ok = tambah(v);
      }
    }
    if (ok && ref.length === 6) return rng.shuffle(ref);
  }
  throw new Error("visual gagal");
}

export function visualSet(rng, n) {
  const ref = susunRef(rng);
  const per = Array.from({ length: n }, (_, i) => i % 6);
  const urut = rng.shuffle(per);
  for (let i = 2; i < urut.length; i++) if (urut[i] === urut[i - 1] && urut[i] === urut[i - 2]) { const j = rng.int(0, urut.length - 1); [urut[i], urut[j]] = [urut[j], urut[i]]; }
  return { ref: ref.map((g) => glyph(g, 40)), soal: urut.map((k) => ({ g: glyph(ref[k], 72), k })) };
}
