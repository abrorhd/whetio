// Subtes 2 — Penalaran Silogisme. Kunci dibuktikan: kategoris lewat semua model diagram Venn
// (dengan anggapan setiap himpunan tidak kosong), kondisional lewat tabel kebenaran.
import { esc } from "./rng.js";

const ISTILAH = ["pelari", "pegawai pajak", "pecinta kopi", "penulis", "pembaca buku", "atlet", "mahasiswa", "anggota koperasi",
  "pengendara motor", "dokter", "guru", "relawan", "pemain catur", "orang jujur", "orang hemat", "penyanyi", "pendaki gunung",
  "pedagang", "petani", "nelayan", "musisi", "pemrogram", "pesepeda", "perenang", "penari", "pelukis", "fotografer", "pengusaha",
  "pelajar", "orang disiplin", "pegawai teladan", "penggemar sejarah", "pengguna kereta", "pemilik kebun"];
const besar = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- Kategoris ----------
function teksKat(st, T) {
  const X = T[st.x], Y = T[st.y];
  if (st.f === "A") return besar(`semua ${X} adalah ${Y}.`);
  if (st.f === "E") return besar(st.v ? `semua ${X} bukan ${Y}.` : `tidak ada ${X} yang merupakan ${Y}.`);
  if (st.f === "I") return besar(`sebagian ${X} adalah ${Y}.`);
  return besar(`sebagian ${X} bukan ${Y}.`);
}
function nilaiKat(st, regs) {
  const bx = 1 << st.x, by = 1 << st.y;
  if (st.f === "A") return !regs.some((r) => r & bx && !(r & by));
  if (st.f === "E") return !regs.some((r) => r & bx && r & by);
  if (st.f === "I") return regs.some((r) => r & bx && r & by);
  return regs.some((r) => r & bx && !(r & by));
}
function modelKat(nTerm, premis) {
  const nReg = 1 << nTerm, out = [];
  for (let mask = 1; mask < 1 << nReg; mask++) {
    const regs = [];
    for (let r = 0; r < nReg; r++) if (mask & (1 << r)) regs.push(r);
    let ok = true;
    for (let t = 0; t < nTerm && ok; t++) if (!regs.some((r) => r & (1 << t))) ok = false; // tiap himpunan tidak kosong
    if (ok && premis.every((p) => nilaiKat(p, regs))) out.push(regs);
  }
  return out;
}
const BENTUK = ["A", "A", "A", "E", "E", "I", "I", "O"];
const kalimatSet = (st, T) => {
  const X = T[st.x], Y = T[st.y];
  return { A: `seluruh ${X} berada di dalam ${Y}`, E: `${X} dan ${Y} sama sekali tidak beririsan`, I: `ada ${X} yang juga ${Y}`, O: `ada ${X} yang berada di luar ${Y}` }[st.f];
};

function kategoris(rng) {
  for (let coba = 0; coba < 400; coba++) {
    const pakaiLepas = rng.chance(0.2); // premis tambahan yang tidak berkaitan
    const T = rng.sample(ISTILAH, pakaiLepas ? 4 : 3); // 0=S, 1=M, 2=P, (3=Q)
    const p1 = rng.chance(0.5) ? { f: rng.pick(BENTUK), x: 0, y: 1 } : { f: rng.pick(BENTUK), x: 1, y: 0 };
    const p2 = rng.chance(0.5) ? { f: rng.pick(BENTUK), x: 1, y: 2 } : { f: rng.pick(BENTUK), x: 2, y: 1 };
    [p1, p2].forEach((p) => (p.v = rng.int(0, 1)));
    const premis = [p1, p2];
    if (pakaiLepas) premis.push({ f: rng.pick(BENTUK), x: 3, y: rng.pick([0, 1]), v: rng.int(0, 1) });
    const M = modelKat(T.length, premis);
    if (!M.length) continue;
    const vektor = (st) => M.map((regs) => (nilaiKat(st, regs) ? 1 : 0)).join("");
    const kand = [];
    for (const f of ["A", "E", "I", "O"]) for (const [x, y] of [[0, 2], [2, 0]]) kand.push({ f, x, y, v: rng.int(0, 1) });
    const kelas = (st) => { const v = vektor(st); return v.includes("0") ? (v.includes("1") ? "mungkin" : "salah") : "pasti"; };
    const pasti = kand.filter((s) => kelas(s) === "pasti");
    const TDK = `Tidak dapat disimpulkan hubungan antara ${T[0]} dan ${T[2]}.`;
    let kunci, kunciTeks, pengecoh = [];
    const lihat = new Set();
    if (pasti.length) {
      const pref = pasti.filter((s) => s.f === "A" || s.f === "E");
      kunci = rng.chance(0.75) && pref.length ? rng.pick(pref) : rng.pick(pasti);
      kunciTeks = teksKat(kunci, T);
      lihat.add(vektor(kunci));
      const lain = rng.shuffle(kand.filter((s) => kelas(s) !== "pasti"));
      lain.sort((a, b) => (kelas(a) === "mungkin" ? 0 : 1) - (kelas(b) === "mungkin" ? 0 : 1));
      for (const s of lain) { const v = vektor(s); if (!lihat.has(v)) { lihat.add(v); pengecoh.push({ t: teksKat(s, T), k: kelas(s) }); } }
      if (rng.chance(0.6)) pengecoh.splice(rng.int(0, Math.min(2, pengecoh.length)), 0, { t: TDK, k: "tdk" });
      // isi dengan pernyataan tentang M yang tidak pasti
      const kandM = [];
      for (const f of ["A", "E", "I", "O"]) for (const [x, y] of [[0, 1], [1, 0], [1, 2], [2, 1]]) kandM.push({ f, x, y, v: 0 });
      for (const s of rng.shuffle(kandM)) { if (pengecoh.length >= 4) break; const v = vektor(s); if (!v.includes("0") || lihat.has(v)) continue; lihat.add(v); pengecoh.push({ t: teksKat(s, T), k: v.includes("1") ? "mungkin" : "salah" }); }
      if (pengecoh.length < 4 && !pengecoh.some((p) => p.k === "tdk")) pengecoh.push({ t: TDK, k: "tdk" });
    } else {
      kunci = null; kunciTeks = TDK;
      for (const s of rng.shuffle(kand)) { const v = vektor(s); if (!lihat.has(v)) { lihat.add(v); pengecoh.push({ t: teksKat(s, T), k: kelas(s) }); } }
    }
    pengecoh = pengecoh.slice(0, 4);
    if (pengecoh.length < 4) continue;
    if (!pasti.length && pengecoh.filter((p) => p.k === "mungkin").length < 3) continue;
    const q = premis.map((p) => teksKat(p, T)).join(" ");
    const uraian = premis.slice(0, 2).map((p) => kalimatSet(p, T)).join("; ");
    let e = `Gambarkan himpunannya: ${esc(uraian)}.` + (pakaiLepas ? ` Premis tentang ${esc(T[3])} tidak menghubungkan ${esc(T[0])} dengan ${esc(T[2])}.` : "") + " ";
    e += kunci ? `“${esc(kunciTeks)}” benar pada setiap diagram yang memenuhi premis.` : `Ada diagram yang memenuhi premis tetapi membuat setiap pernyataan tentang ${esc(T[0])}–${esc(T[2])} salah, jadi tidak ada hubungan yang pasti.`;
    const mungkin = pengecoh.find((p) => p.k === "mungkin");
    if (mungkin) e += ` Pengecoh seperti “${esc(mungkin.t)}” hanya mungkin benar, tidak pasti.`;
    return { q: `<p class="premis">${esc(q)}</p><p class="tanya">Kesimpulan yang tepat adalah …</p>`, o: [kunciTeks].concat(pengecoh.map((p) => p.t)).map(esc), e };
  }
  throw new Error("silogisme kategoris gagal");
}

// ---------- Kondisional ----------
const TEMA = [
  [["hujan turun deras", "hujan tidak turun deras"], ["jalan menjadi licin", "jalan tidak menjadi licin"], ["pengendara melaju pelan", "pengendara tidak melaju pelan"]],
  [["Rina lembur", "Rina tidak lembur"], ["laporan selesai tepat waktu", "laporan tidak selesai tepat waktu"], ["atasan memberi apresiasi", "atasan tidak memberi apresiasi"]],
  [["Andi rutin berolahraga", "Andi tidak rutin berolahraga"], ["Andi bugar", "Andi tidak bugar"], ["Andi produktif bekerja", "Andi tidak produktif bekerja"]],
  [["listrik padam", "listrik tidak padam"], ["server berhenti", "server tidak berhenti"], ["layanan daring terganggu", "layanan daring tidak terganggu"]],
  [["target penerimaan tercapai", "target penerimaan tidak tercapai"], ["tim mendapat bonus", "tim tidak mendapat bonus"], ["tim mengadakan syukuran", "tim tidak mengadakan syukuran"]],
  [["harga bahan baku naik", "harga bahan baku tidak naik"], ["biaya produksi naik", "biaya produksi tidak naik"], ["harga jual naik", "harga jual tidak naik"]],
  [["Dina berangkat pukul enam", "Dina tidak berangkat pukul enam"], ["Dina tiba sebelum apel", "Dina tidak tiba sebelum apel"], ["Dina mengikuti apel pagi", "Dina tidak mengikuti apel pagi"]],
  [["mesin dirawat berkala", "mesin tidak dirawat berkala"], ["mesin jarang rusak", "mesin tidak jarang rusak"], ["produksi berjalan lancar", "produksi tidak berjalan lancar"]],
  [["sungai meluap", "sungai tidak meluap"], ["sawah tergenang", "sawah tidak tergenang"], ["panen tertunda", "panen tidak tertunda"]],
  [["Sari belajar tekun", "Sari tidak belajar tekun"], ["nilai Sari memuaskan", "nilai Sari tidak memuaskan"], ["Sari mendapat beasiswa", "Sari tidak mendapat beasiswa"]],
  [["stok gudang habis", "stok gudang tidak habis"], ["pesanan ditunda", "pesanan tidak ditunda"], ["pelanggan menerima pemberitahuan", "pelanggan tidak menerima pemberitahuan"]],
  [["rapat diundur", "rapat tidak diundur"], ["jadwal kunjungan berubah", "jadwal kunjungan tidak berubah"], ["sopir dinas diberi tahu", "sopir dinas tidak diberi tahu"]],
  [["wajib pajak lapor tepat waktu", "wajib pajak tidak lapor tepat waktu"], ["wajib pajak terhindar dari denda", "wajib pajak tidak terhindar dari denda"], ["wajib pajak tenang", "wajib pajak tidak tenang"]],
  [["Budi menabung tiap bulan", "Budi tidak menabung tiap bulan"], ["dana darurat Budi cukup", "dana darurat Budi tidak cukup"], ["Budi siap menghadapi kebutuhan mendadak", "Budi tidak siap menghadapi kebutuhan mendadak"]],
];
const lit = (v, n) => ({ k: "L", v, n });
const imp = (a, b) => ({ k: "I", a, b });
const atau = (a, b) => ({ k: "O", a, b });
const neg = (l) => lit(l.v, !l.n);
function nilaiP(f, row) {
  if (f.k === "L") return !!(row >> f.v & 1) !== f.n;
  if (f.k === "I") return !nilaiP(f.a, row) || nilaiP(f.b, row);
  return nilaiP(f.a, row) || nilaiP(f.b, row);
}
function teksP(f, K, awal = true) {
  const kl = (l) => K[l.v][l.n ? 1 : 0];
  let s;
  if (f.k === "L") s = kl(f);
  else if (f.k === "I") s = `jika ${kl(f.a)}, maka ${kl(f.b)}`;
  else s = `${kl(f.a)} atau ${kl(f.b)}`;
  return awal ? besar(s) + "." : s;
}
const POLA = [
  { n: "Modus ponens", buat: (p, q) => ({ pr: [imp(p, q), p], k: q, why: "Bila sebab terjadi dan aturannya “jika–maka”, akibatnya pasti terjadi." }) },
  { n: "Modus tollens", buat: (p, q) => ({ pr: [imp(p, q), neg(q)], k: neg(p), why: "Bila akibat tidak terjadi, sebabnya pasti tidak terjadi." }) },
  { n: "Silogisme hipotetis", buat: (p, q, r) => ({ pr: [imp(p, q), imp(q, r)], k: imp(p, r), why: "Dua “jika–maka” yang bersambung dapat dirangkai dari awal ke akhir." }) },
  { n: "Silogisme hipotetis (kontraposisi)", buat: (p, q, r) => ({ pr: [imp(p, q), imp(q, r)], k: imp(neg(r), neg(p)), why: "Rangkaian “jika p maka r” setara dengan “jika tidak r maka tidak p”." }) },
  { n: "Silogisme disjungtif", buat: (p, q) => ({ pr: [atau(p, q), neg(p)], k: q, why: "Dari dua kemungkinan “atau”, bila satu gugur yang lain pasti terjadi." }) },
  { n: "Rantai modus ponens", buat: (p, q, r) => ({ pr: [imp(p, q), imp(q, r), p], k: r, why: "Terapkan modus ponens dua kali secara berurutan." }) },
  { n: "Rantai modus tollens", buat: (p, q, r) => ({ pr: [imp(p, q), imp(q, r), neg(r)], k: neg(p), why: "Terapkan modus tollens dua kali dari belakang." }) },
];
function kondisional(rng) {
  for (let coba = 0; coba < 300; coba++) {
    const K = rng.pick(TEMA);
    const [p, q, r] = [0, 1, 2].map((v) => lit(v, rng.chance(0.2)));
    const pola = rng.pick(POLA);
    const { pr, k, why } = pola.buat(p, q, r);
    const baris = []; for (let row = 0; row < 8; row++) if (pr.every((f) => nilaiP(f, row))) baris.push(row);
    if (!baris.length) continue;
    const vek = (f) => [0, 1, 2, 3, 4, 5, 6, 7].map((row) => (nilaiP(f, row) ? 1 : 0)).join("");
    const pasti = (f) => baris.every((row) => nilaiP(f, row));
    if (!pasti(k)) continue;
    // kandidat pengecoh: konvers, invers, kebalikan, literal lain
    const kand = [];
    if (k.k === "I") kand.push(imp(k.b, k.a), imp(neg(k.a), neg(k.b)), imp(k.a, neg(k.b)));
    else kand.push(neg(k));
    pr.filter((f) => f.k === "I").forEach((f) => kand.push(imp(f.b, f.a), imp(neg(f.a), neg(f.b))));
    [0, 1, 2].forEach((v) => kand.push(lit(v, false), lit(v, true)));
    for (const a of [p, q, r]) for (const b of [p, q, r]) if (a.v !== b.v) kand.push(imp(a, b), imp(neg(a), neg(b)), imp(b, neg(a)));
    const lihat = new Set([vek(k)]), pengecoh = [];
    const urut = kand.slice(0, 4).concat(rng.shuffle(kand.slice(4)));
    for (const f of urut) {
      if (pengecoh.length >= 4) break;
      const v = vek(f);
      if (lihat.has(v) || pasti(f)) continue;
      lihat.add(v); pengecoh.push(f);
    }
    if (pengecoh.length < 4) continue;
    const q0 = pr.map((f) => teksP(f, K)).join(" ");
    const e = `${pola.n}. ${why} Maka: “${esc(teksP(k, K))}” ` + `Pengecoh seperti “${esc(teksP(pengecoh[0], K))}” tidak dijamin oleh premis.`;
    return { q: `<p class="premis">${esc(q0)}</p><p class="tanya">Kesimpulan yang tepat adalah …</p>`, o: [k].concat(pengecoh).map((f) => esc(teksP(f, K))), e };
  }
  throw new Error("silogisme kondisional gagal");
}

export function silogisme(rng) { return rng.chance(0.58) ? kategoris(rng) : kondisional(rng); }
