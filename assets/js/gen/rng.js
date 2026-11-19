// Angka acak berbenih (deterministik) + utilitas kecil. Dipakai di browser dan Node.
export function benih(s) {
  let h = 1779033703 ^ String(s).length;
  for (let i = 0; i < String(s).length; i++) {
    h = Math.imul(h ^ String(s).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export function buatRng(seed) {
  let a = typeof seed === "number" ? seed >>> 0 : benih(seed);
  const r = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.shuffle = (arr) => { const x = arr.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
  r.sample = (arr, n) => r.shuffle(arr).slice(0, n);
  r.chance = (p) => r() < p;
  r.sub = (tag) => buatRng(benih(String(a) + ":" + tag));
  return r;
}

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const rp = (n) => "Rp" + Math.round(n).toLocaleString("id-ID").replace(/,/g, ".");
export const ribuan = (n) => Math.round(n).toLocaleString("id-ID").replace(/,/g, ".");

// Susun soal pilihan ganda: o[0] = kunci; kembalikan opsi teracak + indeks kunci.
// posisiKunci (opsional) memaksa letak kunci (untuk meratakan A–E dalam satu paket).
export function susunOpsi(rng, opsi, posisiKunci) {
  const kunci = opsi[0];
  const salah = rng.shuffle(opsi.slice(1));
  const k = posisiKunci == null ? rng.int(0, opsi.length - 1) : posisiKunci;
  return { o: salah.slice(0, k).concat([kunci], salah.slice(k)), k };
}

// Lengkapi daftar pengecoh unik sampai n, memakai fungsi cadangan.
export function unikkan(kunci, kandidat, n, cadangan, rng) {
  const out = [], lihat = new Set([String(kunci)]);
  for (const c of kandidat) { const s = String(c); if (!lihat.has(s)) { lihat.add(s); out.push(c); } if (out.length >= n) break; }
  let jaga = 0;
  while (out.length < n && jaga++ < 500) { const c = cadangan(rng); const s = String(c); if (!lihat.has(s)) { lihat.add(s); out.push(c); } }
  return out;
}
