// Subtes 9 — Visual Matching: cocokkan tiap gambar dengan salah satu dari 6 referensi (A–F), 3–5 detik per soal.
const G = {
  T: [[0, 0, 2, 0], [1, 0, 1, 2]], TB: [[0, 2, 2, 2], [1, 0, 1, 2]], TK: [[0, 0, 0, 2], [0, 1, 2, 1]], TKa: [[2, 0, 2, 2], [0, 1, 2, 1]], PLUS: [[1, 0, 1, 2], [0, 1, 2, 1]],
  SKA: [[0, 0, 2, 0], [2, 0, 2, 2]], SKI: [[0, 0, 2, 0], [0, 0, 0, 2]], SBK: [[0, 0, 0, 2], [0, 2, 2, 2]], SBA: [[2, 0, 2, 2], [0, 2, 2, 2]],
  II: [[0.7, 0, 0.7, 2], [1.3, 0, 1.3, 2]], SAMA: [[0, 0.7, 2, 0.7], [0, 1.3, 2, 1.3]], III: [[0.4, 0, 0.4, 2], [1, 0, 1, 2], [1.6, 0, 1.6, 2]], TIGA: [[0, 0.4, 2, 0.4], [0, 1, 2, 1], [0, 1.6, 2, 1.6]],
  PI: [[0, 0, 2, 0], [0, 0, 0, 2], [2, 0, 2, 2]], U: [[0, 0, 0, 2], [0, 2, 2, 2], [2, 0, 2, 2]], KK: [[0, 0, 2, 0], [0, 0, 0, 2], [0, 2, 2, 2]], KKa: [[0, 0, 2, 0], [2, 0, 2, 2], [0, 2, 2, 2]],
  Z: [[0, 0, 2, 0], [2, 0, 0, 2], [0, 2, 2, 2]], ZB: [[0, 0, 2, 0], [0, 0, 2, 2], [0, 2, 2, 2]],
  ATAP: [[0, 2, 1, 0], [1, 0, 2, 2]], LEMBAH: [[0, 0, 1, 2], [1, 2, 2, 0]], KURANG: [[2, 0, 0, 1], [0, 1, 2, 2]], LEBIH: [[0, 0, 2, 1], [2, 1, 0, 2]],
  X: [[0, 0, 2, 2], [2, 0, 0, 2]], TL: [[0, 0, 2, 0], [1, 0, 1, 1]], BL: [[0, 2, 2, 2], [1, 1, 1, 2]],
};
const KELOMPOK = [["T", "TB", "TK", "TKa", "PLUS", "TL", "BL"], ["SKA", "SKI", "SBK", "SBA"], ["II", "SAMA", "III", "TIGA"], ["PI", "U", "KK", "KKa"], ["Z", "ZB", "X"], ["ATAP", "LEMBAH", "KURANG", "LEBIH"]];

export function glyph(id, uk = 48) {
  const s = G[id].map(([a, b, c, d]) => `<line x1="${10 + a * 20}" y1="${10 + b * 20}" x2="${10 + c * 20}" y2="${10 + d * 20}"/>`).join("");
  return `<svg class="glyph" viewBox="0 0 60 60" width="${uk}" height="${uk}" aria-hidden="true"><g stroke="var(--ink)" stroke-width="4" stroke-linecap="square">${s}</g></svg>`;
}

// Satu set referensi berisi bentuk yang mirip satu sama lain (diambil dari 2–3 kelompok).
export function visualSet(rng, n) {
  const kel = rng.sample(KELOMPOK, rng.pick([2, 3]));
  let ref = rng.shuffle(kel.flatMap((k) => rng.sample(k, Math.min(k.length, 4))));
  if (ref.length < 6) ref = ref.concat(rng.sample(Object.keys(G).filter((g) => !ref.includes(g)), 6 - ref.length));
  ref = ref.slice(0, 6);
  const per = Array.from({ length: n }, (_, i) => i % 6);
  const urut = rng.shuffle(per);
  for (let i = 2; i < urut.length; i++) if (urut[i] === urut[i - 1] && urut[i] === urut[i - 2]) { const j = rng.int(0, urut.length - 1); [urut[i], urut[j]] = [urut[j], urut[i]]; }
  return { ref: ref.map((id) => glyph(id, 40)), soal: urut.map((k) => ({ g: glyph(ref[k], 72), k })) };
}
