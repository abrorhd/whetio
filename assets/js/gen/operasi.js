// Subtes 6 — Operasi Matematika: mencari angka (?) atau mencari tanda operasi.
import { unikkan } from "./rng.js";

const SIM = { "+": "+", "-": "−", "*": "×", "/": ":" };
const hit = (a, op, b) => (op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : b !== 0 && a % b === 0 ? a / b : NaN);

// ekspresi bernilai T dalam gaya modul, mis. "(10 : 2) + 2"
function ekspresi(rng, T) {
  for (let i = 0; i < 100; i++) {
    const v = rng.int(1, 4);
    if (v === 1) { const a = rng.int(2, 9), b = rng.int(2, 12); const c = T - a * b; if (c >= 1 && c <= 60) return `(${a} × ${b}) + ${c}`; }
    if (v === 2) { const a = rng.int(2, 9), b = rng.int(2, 12); const c = a * b - T; if (c >= 1 && c <= 60) return `(${a} × ${b}) − ${c}`; }
    if (v === 3) { const b = rng.int(2, 9), q = rng.int(2, 12), c = T - q; if (c >= 1 && c <= 60) return `(${b * q} : ${b}) + ${c}`; }
    if (v === 4) { const a = rng.int(T + 1, T + 40), c = a - T; if (T > 0) return `${a} − ${c}`; }
  }
  return String(T);
}

function cariAngka(rng) {
  for (let i = 0; i < 200; i++) {
    const x = rng.int(2, 40), d = rng.int(2, 12), e = rng.int(1, 20);
    const pola = rng.pick([
      { t: `? + ${d}`, L: x + d, sal: [x + 2 * d] },
      { t: `? − ${d}`, L: x - d, sal: [x - 2 * d] },
      { t: `? × ${d}`, L: x * d, sal: [x * d * d, x + d] },
      { t: `(? × ${d}) + ${e}`, L: x * d + e, sal: [x + e, (x * d + 2 * e) / d] },
      { t: `(? + ${e}) × ${d}`, L: (x + e) * d, sal: [x + e, x * d] },
      { t: `${d} × ? − ${e}`, L: d * x - e, sal: [(d * x - 2 * e) / d] },
    ]);
    if (pola.L <= 0 || pola.L > 160) continue;
    const kanan = ekspresi(rng, pola.L);
    if (kanan === String(pola.L) && rng.chance(0.7)) continue;
    const tukar = rng.chance(0.3);
    const q = tukar ? `${kanan} = ${pola.t}` : `${pola.t} = ${kanan}`;
    const sal = pola.sal.filter((v) => Number.isInteger(v) && v > 0);
    const opsi = [x].concat(unikkan(x, sal.concat([x + 1, x - 1, x + 2, x - 2, x + 10].filter((v) => v > 0)), 4, (r) => x + r.int(-6, 6) || x + 7, rng));
    const e2 = (kanan === String(pola.L) ? "" : `Hitung sisi yang lengkap: ${kanan} = ${pola.L}. `) + `Lalu ${pola.t} = ${pola.L}, sehingga ? = ${x}. Cek: substitusikan ${x} ke soal, kedua sisi bernilai ${pola.L}.`;
    return { q: `<p class="persamaan">${q}</p><p class="tanya">? = …</p>`, o: opsi.map(String), e: e2 };
  }
  throw new Error("operasi angka gagal");
}

function cariTanda(rng) {
  for (let i = 0; i < 400; i++) {
    const op = rng.pick(["+", "-", "*", "/"]);
    let a = rng.int(2, 12), b = rng.int(2, 9);
    if (op === "/") a = b * rng.int(2, 9);
    if (op === "-" && a <= b) continue;
    const op2 = rng.pick(["+", "-"]), c = rng.int(1, 9);
    const L = hit(hit(a, op, b), op2, c);
    if (!(L > 0)) continue;
    const cocok = ["+", "-", "*", "/"].filter((o) => hit(hit(a, o, b), op2, c) === L);
    if (cocok.length !== 1) continue;
    const kanan = ekspresi(rng, L);
    const kiri = `(${a} ? ${b}) ${SIM[op2]} ${c}`;
    const q = rng.chance(0.3) ? `${kanan} = ${kiri}` : `${kiri} = ${kanan}`;
    const sisa = ["+", "-", "*", "/"].filter((o) => o !== op).map((o) => SIM[o]);
    const e = `Sisi lain bernilai ${L}. Maka (${a} ? ${b}) = ${L} ${op2 === "+" ? "−" : "+"} ${c} = ${hit(a, op, b)}, dan hanya ${a} ${SIM[op]} ${b} = ${hit(a, op, b)}.`;
    return { q: `<p class="persamaan">${q}</p><p class="tanya">? = …</p>`, o: [SIM[op]].concat(sisa, ["="]), e };
  }
  throw new Error("operasi tanda gagal");
}

export function operasi(rng) { return rng.chance(0.6) ? cariAngka(rng) : cariTanda(rng); }
