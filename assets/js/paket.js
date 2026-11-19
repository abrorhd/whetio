// Pemuat halaman paket: ambil soal.json lalu jalankan mesin simulasi.
// Tamu hanya bisa membuka paket terbaru; arsip paket sebelumnya perlu masuk.
import { mulai, kepalaSitus } from "./kuis.js";
import { tarik } from "./sinkron.js";
import { tamu, ajakMasuk } from "./gerbang.js";
import { pelatuk } from "./merek.js";

const app = document.getElementById("app");
const id = (app.dataset.src.match(/paket\/(\d{4}-\d{2}-\d{2})\//) || [])[1];
(async () => {
  await Promise.race([tarik().catch(() => 0), new Promise((r) => setTimeout(r, 2500))]);
  if (tamu()) {
    const list = await fetch("/psikotes/paket.json", { cache: "no-store" }).then((r) => r.json()).catch(() => []);
    if (list.length && list[0].id !== id) {
      app.innerHTML = kepalaSitus("psikotes") + `<main class="wrap"><section class="card kunci-arsip">${pelatuk("ramah", "akun-pl")}
        <h1>Arsip paket khusus pengguna yang masuk</h1><p>Tanpa akun, Anda bisa mengerjakan <b>paket hari ini</b> secara gratis. Masuk untuk membuka semua paket sebelumnya dan menyimpan progres belajar psikotes.</p>
        <div class="cta" style="justify-content:center"><a class="btn pri" href="/akun/?lanjut=${encodeURIComponent(location.pathname)}">Masuk / Daftar</a><a class="btn" href="/psikotes/paket/${list[0].id}/">Kerjakan paket hari ini</a></div></section></main>`;
      return;
    }
  }
  const p = await fetch(app.dataset.src, { cache: "no-store" }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
  mulai(app, p, {
    kembali: { href: "/psikotes/", teks: "Siap Psikotes" },
    ajak: () => (tamu() ? ajakMasuk() : ""),
    catatan: "Simulasi penuh mengikuti urutan, jumlah soal, dan durasi psikotes UPKP; Visual Matching memakai batas 5 detik per soal.",
  });
})().catch(() => { app.innerHTML = '<p class="muat">Paket gagal dimuat. Muat ulang halaman ini.</p>'; });
