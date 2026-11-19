// Identitas Whetio: logo W geometris berujung runcing + percikan, dan maskot burung pelatuk (orisinal).
export function logo(uk = 40, kelas = "logo") {
  return `<svg class="${kelas}" viewBox="0 -6 66 56" width="${uk}" height="${Math.round(uk * 0.85)}" role="img" aria-label="Whetio">
  <polyline points="5,9 16,40 27,19 38,40 47,16" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="miter" stroke-miterlimit="10"/>
  <polygon points="43.6,14.9 50.4,17.1 55,3" fill="currentColor"/>
  <g stroke="var(--spark,#F29F3D)" stroke-width="2.6" stroke-linecap="round"><line x1="57" y1="7" x2="62" y2="9"/><line x1="58" y1="1.5" x2="62.5" y2="-0.5"/><line x1="53" y1="0" x2="52.5" y2="-4"/></g>
</svg>`;
}

// mood: "fokus" | "senang" | "patuk" | "ngopi"
export function pelatuk(mood = "fokus", kelas = "pelatuk") {
  const mata = mood === "senang"
    ? '<path d="M117 62 q6 -7 12 0" fill="none" stroke="#141A22" stroke-width="4" stroke-linecap="round"/>'
    : '<circle cx="123" cy="62" r="6.5" fill="#141A22"/><circle cx="125.5" cy="59.5" r="2.2" fill="#fff"/>';
  const gerak = mood === "patuk" ? '<g stroke="var(--spark,#F29F3D)" stroke-width="4" stroke-linecap="round"><line x1="178" y1="58" x2="190" y2="52"/><line x1="180" y1="70" x2="193" y2="70"/><line x1="178" y1="82" x2="190" y2="88"/></g>' : "";
  const kopi = mood === "ngopi" ? `<g transform="translate(14 150)"><path d="M0 0 h34 l-4 34 h-26 z" fill="#F4F1EA" stroke="#141A22" stroke-width="3.5" stroke-linejoin="round"/><path d="M33 8 q12 2 9 12 q-3 8 -11 7" fill="none" stroke="#141A22" stroke-width="3.5"/><path d="M4 9 h26" stroke="#6B4A2E" stroke-width="5"/>
    <g class="uap" fill="none" stroke="#9AA7B2" stroke-width="3" stroke-linecap="round"><path d="M10 -8 q-5 -7 0 -14"/><path d="M20 -6 q-5 -8 0 -16"/></g></g>` : "";
  return `<svg class="${kelas}" viewBox="0 0 200 200" role="img" aria-label="Si Pelatuk, maskot Whetio">
  <rect x="160" y="0" width="34" height="200" rx="6" fill="#B9A58A"/><path d="M168 20 v40 M184 70 v50 M170 130 v50" stroke="#9C8669" stroke-width="3" stroke-linecap="round"/>
  <path d="M104 150 l40 48 l16 -2 l-30 -50 z" fill="#1E252E"/>
  <ellipse cx="112" cy="116" rx="40" ry="50" fill="#2B3440"/>
  <path d="M96 92 q16 -6 30 4 q8 30 -6 62 q-24 4 -30 -14 q-8 -28 6 -52 z" fill="#F4F1EA"/>
  <path d="M84 104 q-6 26 8 50 q-20 -6 -22 -28 q0 -14 14 -22 z" fill="#1E252E"/>
  <g fill="#FFFFFF" opacity=".9"><circle cx="80" cy="122" r="3"/><circle cx="86" cy="134" r="3"/><circle cx="78" cy="140" r="2.5"/></g>
  <circle cx="122" cy="66" r="30" fill="#2B3440"/>
  <path d="M98 50 q8 -24 34 -20 q12 3 14 14 q-22 -6 -48 6 z" fill="#D64534"/>
  <path d="M104 74 q20 4 40 -4" stroke="#F4F1EA" stroke-width="7" stroke-linecap="round" fill="none"/>
  ${mata}
  <path d="M148 62 l34 6 l-34 8 z" fill="#C9CFD6" stroke="#141A22" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M146 152 q10 4 14 0 M146 162 q10 4 14 0" stroke="#F29F3D" stroke-width="5" stroke-linecap="round" fill="none"/>
  ${gerak}${kopi}
</svg>`;
}
