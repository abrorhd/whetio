// Kawanan pelatuk kecil di latar: muncul saat pengguna diam, terbang ke sana kemari di belakang konten,
// dan kabur keluar layar begitu ada input. Tidak tampil saat sedang mengerjakan soal (.run-top) atau bila
// pengguna memilih "kurangi animasi".
const DIAM_MS = 6000;
const burungSVG = () => `<svg viewBox="0 0 44 34" aria-hidden="true">
  <path class="kw-g" d="M6 22 l-6 6 l8 -2 z"/>
  <ellipse class="kw-t" cx="18" cy="20" rx="12" ry="9"/>
  <path d="M14 16 q6 -3 10 1 q2 7 -3 11 q-7 0 -8 -5 q-1 -4 1 -7 z" fill="#F4F1EA"/>
  <circle class="kw-t" cx="29" cy="12" r="7.5"/>
  <path d="M23 8 q3 -7 10 -5 q3 1 3 4 q-6 -2 -13 1 z" fill="#D64534"/>
  <circle cx="31" cy="11" r="1.7" fill="#141A22"/><circle cx="31.6" cy="10.4" r=".6" fill="#fff"/>
  <path d="M35.5 11 l8 1.6 l-8 2 z" fill="#C9CFD6"/>
  <g class="kw-sayap"><path class="kw-g" d="M12 17 q4 -14 14 -10 q-4 8 -14 10 z"/></g>
</svg>`;

function mulaiKawanan() {
  if (window.__kawanan) return;
  window.__kawanan = true;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const lapis = document.createElement("div");
  lapis.className = "kawanan";
  lapis.setAttribute("aria-hidden", "true");
  document.body.appendChild(lapis);
  const jumlah = innerWidth < 640 ? 2 : 3;
  const burung = Array.from({ length: jumlah }, (_, i) => {
    const el = document.createElement("div");
    el.className = "kw-burung";
    el.innerHTML = burungSVG();
    el.style.setProperty("--uk", `${26 + i * 6}px`);
    lapis.appendChild(el);
    return { el, x: -80, y: 100 + i * 120, arah: 1, aktif: false };
  });
  let terbang = false, pewaktu = null;

  const boleh = () => !document.hidden && !document.querySelector(".run-top");
  function taruh(b, x, y, dur) {
    b.arah = x >= b.x ? 1 : -1;
    b.x = x; b.y = y;
    b.el.style.transitionDuration = `${dur}s`;
    b.el.style.transform = `translate(${x}px, ${y}px) scaleX(${b.arah})`;
  }
  function tujuanBaru(b) {
    if (!terbang) return;
    const w = innerWidth, h = innerHeight;
    const x = 20 + Math.random() * (w - 80), y = 70 + Math.random() * (h - 140);
    const jarak = Math.hypot(x - b.x, y - b.y);
    taruh(b, x, y, Math.max(2.2, jarak / (70 + Math.random() * 50)));
  }
  burung.forEach((b) => b.el.addEventListener("transitionend", () => {
    if (terbang) setTimeout(() => tujuanBaru(b), 300 + Math.random() * 1500); // sesekali hinggap sebentar
    else b.el.classList.remove("tampak");
  }));
  function lepas() {
    if (terbang || !boleh()) return;
    terbang = true; lapis.classList.add("hidup");
    burung.forEach((b, i) => {
      const kiri = Math.random() < 0.5;
      b.x = kiri ? -60 : innerWidth + 20; b.y = 80 + Math.random() * (innerHeight - 160);
      b.el.style.transitionDuration = "0s";
      b.el.style.transform = `translate(${b.x}px, ${b.y}px) scaleX(${kiri ? 1 : -1})`;
      b.el.classList.add("tampak");
      setTimeout(() => tujuanBaru(b), 60 + i * 700);
    });
  }
  function kabur() {
    if (!terbang) return;
    terbang = false; lapis.classList.remove("hidup");
    burung.forEach((b) => {
      const x = b.x < innerWidth / 2 ? -80 : innerWidth + 40;
      taruh(b, x, b.y - 60 - Math.random() * 80, 0.9);
    });
  }
  function aktivitas() {
    kabur();
    clearTimeout(pewaktu);
    pewaktu = setTimeout(lepas, DIAM_MS);
  }
  ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"].forEach((ev) => addEventListener(ev, aktivitas, { passive: true }));
  document.addEventListener("visibilitychange", () => { if (document.hidden) kabur(); else aktivitas(); });
  aktivitas();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mulaiKawanan);
  else mulaiKawanan();
}
