// Kawanan pelatuk kecil di latar, di belakang konten.
// - Kondisi biasa: beberapa burung terbang santai dan sesekali hinggap.
// - Saat pengguna diam: lebih banyak burung datang dan terbang lebih lincah; pergi lagi begitu ada input.
// - Kursor mendekati burung: burung berkedip lalu menghindar.
// - Tidak tampil saat mengerjakan soal (.run-top) atau bila pengguna memilih "kurangi animasi".
const DIAM_MS = 5000;
const burungSVG = () => `<svg viewBox="0 0 44 34" aria-hidden="true">
  <path class="kw-g" d="M6 22 l-6 6 l8 -2 z"/>
  <ellipse class="kw-t" cx="18" cy="20" rx="12" ry="9"/>
  <path d="M14 16 q6 -3 10 1 q2 7 -3 11 q-7 0 -8 -5 q-1 -4 1 -7 z" fill="#F4F1EA"/>
  <circle class="kw-t" cx="29" cy="12" r="7.5"/>
  <path d="M23 8 q3 -7 10 -5 q3 1 3 4 q-6 -2 -13 1 z" fill="#D64534"/>
  <g class="kw-mata"><circle cx="31" cy="11" r="1.9" fill="#141A22"/><circle cx="31.7" cy="10.3" r=".65" fill="#fff"/></g>
  <path d="M35.5 11 l8 1.6 l-8 2 z" fill="#C9CFD6"/>
  <g class="kw-sayap"><path class="kw-g" d="M12 17 q4 -14 14 -10 q-4 8 -14 10 z"/></g>
</svg>`;

function mulaiKawanan() {
  if (window.__kawanan) return;
  window.__kawanan = true;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const kecil = innerWidth < 640;
  const BIASA = kecil ? 3 : 5, TAMBAH = kecil ? 4 : 7;
  const lapis = document.createElement("div");
  lapis.className = "kawanan";
  lapis.setAttribute("aria-hidden", "true");
  document.body.appendChild(lapis);
  const acak = (a, b) => a + Math.random() * (b - a);

  const burung = Array.from({ length: BIASA + TAMBAH }, (_, i) => {
    const el = document.createElement("div");
    el.className = "kw-burung";
    el.innerHTML = burungSVG();
    el.style.setProperty("--uk", `${Math.round(acak(20, 38))}px`);
    el.style.setProperty("--kd", `${(-Math.random() * 4).toFixed(2)}s`);
    lapis.appendChild(el);
    const b = { el, x: -80, y: 0, arah: 1, aktif: false, pergi: false, tamu: i >= BIASA, jeda: null, kaget: 0 };
    el.addEventListener("transitionend", (e) => { if (e.propertyName === "transform") tiba(b); });
    return b;
  });
  let diam = false, pewaktu = null;

  const boleh = () => !document.hidden && !document.querySelector(".run-top");
  const harusAda = (b) => boleh() && (!b.tamu || diam);
  function taruh(b, x, y, dur) {
    if (Math.abs(x - b.x) > 2) b.arah = x > b.x ? 1 : -1;
    b.x = x; b.y = y;
    b.el.style.transitionDuration = `${dur}s`;
    b.el.style.transform = `translate(${x}px, ${y}px) scaleX(${b.arah})`;
  }
  function terbang(b) {
    clearTimeout(b.jeda); b.el.classList.remove("hinggap");
    const w = innerWidth, h = innerHeight;
    const x = acak(10, w - 50), y = acak(64, h - 60);
    const laju = diam ? acak(70, 120) : acak(35, 60);
    taruh(b, x, y, Math.max(1.8, Math.hypot(x - b.x, y - b.y) / laju));
  }
  function masuk(b) {
    if (b.aktif) return;
    b.aktif = true; b.pergi = false;
    const kiri = Math.random() < 0.5;
    b.x = kiri ? -60 : innerWidth + 20; b.y = acak(70, innerHeight - 90); b.arah = kiri ? 1 : -1;
    b.el.style.transitionDuration = "0s";
    b.el.style.transform = `translate(${b.x}px, ${b.y}px) scaleX(${b.arah})`;
    b.el.classList.add("tampak");
    clearTimeout(b.jeda);
    b.jeda = setTimeout(() => { if (b.aktif && !b.pergi) terbang(b); }, acak(50, 1400));
  }
  function keluar(b) {
    if (!b.aktif || b.pergi) return;
    b.pergi = true; clearTimeout(b.jeda); b.el.classList.remove("hinggap");
    taruh(b, b.x < innerWidth / 2 ? -80 : innerWidth + 40, b.y - acak(40, 120), acak(0.8, 1.3));
  }
  function tiba(b) {
    if (b.pergi) { b.aktif = false; b.pergi = false; b.el.classList.remove("tampak"); return; }
    if (!b.aktif) return;
    b.el.classList.remove("kaget");
    if (!harusAda(b)) return keluar(b);
    if (Math.random() < (diam ? 0.2 : 0.4)) {          // hinggap sebentar, sayap terlipat
      b.el.classList.add("hinggap");
      b.jeda = setTimeout(() => terbang(b), acak(1500, 4000));
    } else b.jeda = setTimeout(() => terbang(b), acak(150, 900));
  }
  function selaraskan() {
    burung.forEach((b) => (harusAda(b) ? masuk(b) : keluar(b)));
  }

  // Kursor mendekati burung → berkedip lalu menghindar.
  let rafKursor = 0, px = -999, py = -999;
  function cekKursor() {
    rafKursor = 0;
    const kini = performance.now();
    for (const b of burung) {
      if (!b.aktif || b.pergi || kini - b.kaget < 1200) continue;
      const r = b.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const jarak = Math.hypot(px - cx, py - cy);
      if (jarak > Math.max(40, r.width * 1.3)) continue;
      b.kaget = kini;
      clearTimeout(b.jeda);
      b.el.classList.remove("hinggap", "kedip"); void b.el.offsetWidth;
      b.el.classList.add("kedip", "kaget");
      setTimeout(() => b.el.classList.remove("kedip"), 420);
      const ux = (cx - px) / (jarak || 1), uy = (cy - py) / (jarak || 1), d = acak(90, 150);
      b.x = cx - r.width / 2; b.y = cy - r.height / 2;      // mulai dari posisi yang terlihat sekarang
      const x = Math.min(innerWidth - 40, Math.max(6, b.x + ux * d)), y = Math.min(innerHeight - 40, Math.max(60, b.y + uy * d - 20));
      taruh(b, x, y, 0.55);
    }
  }

  function aktivitas() {
    if (diam) { diam = false; selaraskan(); }
    clearTimeout(pewaktu);
    pewaktu = setTimeout(() => { diam = true; selaraskan(); }, DIAM_MS);
  }
  ["pointerdown", "keydown", "wheel", "touchstart", "scroll"].forEach((ev) => addEventListener(ev, aktivitas, { passive: true }));
  addEventListener("pointermove", (e) => {
    aktivitas();
    if (e.pointerType === "mouse") { px = e.clientX; py = e.clientY; if (!rafKursor) rafKursor = requestAnimationFrame(cekKursor); }
  }, { passive: true });
  document.addEventListener("visibilitychange", selaraskan);
  setInterval(selaraskan, 1000);   // mis. saat mulai/selesai mengerjakan soal
  aktivitas();
  selaraskan();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mulaiKawanan);
  else mulaiKawanan();
}
