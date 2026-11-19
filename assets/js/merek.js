// Identitas Whetio: logo W geometris berujung runcing + percikan, dan maskot burung pelatuk (orisinal).
export function logo(uk = 40, kelas = "logo") {
  return `<svg class="${kelas}" viewBox="0 -6 66 56" width="${uk}" height="${Math.round(uk * 0.85)}" role="img" aria-label="Whetio">
  <polyline points="5,9 16,40 27,19 38,40 47,16" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="miter" stroke-miterlimit="10"/>
  <polygon points="43.6,14.9 50.4,17.1 55,3" fill="currentColor"/>
  <g stroke="var(--spark,#F29F3D)" stroke-width="2.6" stroke-linecap="round"><line x1="57" y1="7" x2="62" y2="9"/><line x1="58" y1="1.5" x2="62.5" y2="-0.5"/><line x1="53" y1="0" x2="52.5" y2="-4"/></g>
</svg>`;
}

// Si Pelatuk. Semua ekspresi ada di satu SVG; CSS memilih yang tampil lewat atribut data-mood.
// mood: "fokus" | "senyum" | "ramah" | "marah" | "patuk" | "ngopi"   (alias lama: "senang" → "senyum")
export function pelatuk(mood = "fokus", kelas = "") {
  if (mood === "senang") mood = "senyum";
  const kd = (-Math.random() * 5).toFixed(2);
  return `<svg class="pelatuk ${kelas}" data-mood="${mood}" viewBox="0 0 200 200" style="--kd:${kd}s" role="img" aria-label="Si Pelatuk, maskot Whetio">
  <g class="pl-batang"><rect x="160" y="0" width="34" height="200" rx="6" fill="#B9A58A"/><path d="M168 20 v40 M184 70 v50 M170 130 v50" stroke="#9C8669" stroke-width="3" stroke-linecap="round"/></g>
  <g class="pl-tubuh">
    <path d="M104 150 l40 48 l16 -2 l-30 -50 z" fill="#1E252E"/>
    <ellipse cx="112" cy="116" rx="40" ry="50" fill="#2B3440"/>
    <path d="M96 92 q16 -6 30 4 q8 30 -6 62 q-24 4 -30 -14 q-8 -28 6 -52 z" fill="#F4F1EA"/>
    <g class="pl-sayap"><path d="M84 104 q-6 26 8 50 q-20 -6 -22 -28 q0 -14 14 -22 z" fill="#1E252E"/><g fill="#FFFFFF" opacity=".9"><circle cx="80" cy="122" r="3"/><circle cx="86" cy="134" r="3"/><circle cx="78" cy="140" r="2.5"/></g></g>
    <path d="M146 152 q10 4 14 0 M146 162 q10 4 14 0" stroke="#F29F3D" stroke-width="5" stroke-linecap="round" fill="none"/>
  </g>
  <g class="pl-kepala">
    <circle cx="122" cy="66" r="30" fill="#2B3440"/>
    <path class="pl-jambul" d="M98 50 q8 -24 34 -20 q12 3 14 14 q-22 -6 -48 6 z" fill="#D64534"/>
    <path class="pl-jambul-marah" d="M98 50 l2 -24 l9 13 l5 -21 l7 17 l9 -15 l2 18 l14 4 q-22 -6 -48 8 z" fill="#E8382B"/>
    <path d="M104 74 q20 4 40 -4" stroke="#F4F1EA" stroke-width="7" stroke-linecap="round" fill="none"/>
    <ellipse class="pl-pipi" cx="139" cy="80" rx="7" ry="3.6"/>
    <g class="m-buka"><circle cx="123" cy="62" r="6.5" fill="#141A22"/><circle cx="125.5" cy="59.5" r="2.2" fill="#fff"/><circle class="m-kilau" cx="120.5" cy="65" r="1.2" fill="#fff"/></g>
    <path class="m-senyum" d="M116 64 q7 -9 14 0" fill="none" stroke="#141A22" stroke-width="4" stroke-linecap="round"/>
    <g class="m-marah"><circle cx="124" cy="64" r="5.5" fill="#141A22"/><circle cx="126" cy="62.5" r="1.6" fill="#fff"/><path d="M113 53 L135 59 L135 63 L113 58 Z" fill="#2B3440"/></g>
    <path class="pl-alis" d="M112 51 L135 58" stroke="#141A22" stroke-width="4.5" stroke-linecap="round"/>
    <ellipse class="m-kelopak" cx="123" cy="62" rx="8.5" ry="8.5" fill="#2B3440"/>
    <path d="M148 62 l34 6 l-34 8 z" fill="#C9CFD6" stroke="#141A22" stroke-width="2.5" stroke-linejoin="round"/>
    <g class="pl-uap" fill="#C3CBD3"><g class="u1"><circle cx="98" cy="30" r="5"/><circle cx="104" cy="26" r="6"/><circle cx="110" cy="30" r="4.5"/></g><g class="u2"><circle cx="140" cy="22" r="4"/><circle cx="145" cy="18" r="5"/><circle cx="150" cy="22" r="3.6"/></g></g>
  </g>
  <g class="pl-percik" stroke="var(--spark,#F29F3D)" stroke-width="4" stroke-linecap="round"><line x1="178" y1="58" x2="190" y2="52"/><line x1="180" y1="70" x2="193" y2="70"/><line x1="178" y1="82" x2="190" y2="88"/></g>
  <g class="pl-kopi" transform="translate(14 150)"><path d="M0 0 h34 l-4 34 h-26 z" fill="#F4F1EA" stroke="#141A22" stroke-width="3.5" stroke-linejoin="round"/><path d="M33 8 q12 2 9 12 q-3 8 -11 7" fill="none" stroke="#141A22" stroke-width="3.5"/><path d="M4 9 h26" stroke="#6B4A2E" stroke-width="5"/>
    <g class="uap" fill="none" stroke="#9AA7B2" stroke-width="3" stroke-linecap="round"><path d="M10 -8 q-5 -7 0 -14"/><path d="M20 -6 q-5 -8 0 -16"/></g></g>
</svg>`;
}

export function ubahMood(el, mood) { if (el && el.dataset.mood !== mood) el.dataset.mood = mood; }
function sementara(el, mood, ms) {
  if (!el._asal) el._asal = el.dataset.mood;
  el.dataset.mood = mood; clearTimeout(el._t);
  el._t = setTimeout(() => { el.dataset.mood = el._asal; el._asal = null; }, ms);
}
function picu(el, kelas, ms) { el.classList.remove(kelas); void el.getBoundingClientRect(); el.classList.add(kelas); setTimeout(() => el.classList.remove(kelas), ms); }

// Kawanan pelatuk kecil di latar (saat pengguna diam).
if (typeof document !== "undefined") { import("./kawanan.js"); import("./laporan.js"); }

// Reaksi: kursor mendekat → menyapa (ramah), disentuh/diklik → mematuk. Dipasang sekali per halaman.
if (typeof document !== "undefined" && !window.__pelatukHidup) {
  window.__pelatukHidup = true;
  const tenang = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.addEventListener("pointerover", (e) => {
    const p = e.target.closest && e.target.closest("svg.pelatuk");
    if (!p || tenang() || p._sapa || !["fokus", "patuk"].includes(p.dataset.mood)) return;
    p._sapa = true; setTimeout(() => (p._sapa = false), 5000);
    sementara(p, "ramah", 1800);
  });
  document.addEventListener("click", (e) => {
    const p = e.target.closest && e.target.closest("svg.pelatuk");
    if (p && !tenang()) picu(p, "anim-patuk", 950);
  });
}
