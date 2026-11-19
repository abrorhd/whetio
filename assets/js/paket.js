// Pemuat halaman paket: ambil soal.json lalu jalankan mesin simulasi.
import { mulai } from "./kuis.js";
import { tarik } from "./sinkron.js";

const app = document.getElementById("app");
Promise.race([tarik().catch(() => 0), new Promise((r) => setTimeout(r, 2500))])
  .then(() => fetch(app.dataset.src, { cache: "no-store" }))
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then((p) => mulai(app, p, {
    kembali: { href: "/psikotes/", teks: "Siap Psikotes" },
    catatan: "Jawaban tersimpan di browser ini. Simulasi penuh mengikuti urutan, jumlah soal, dan durasi psikotes UPKP; Visual Matching memakai batas 5 detik per soal.",
  }))
  .catch(() => { app.innerHTML = '<p class="muat">Paket gagal dimuat. Muat ulang halaman ini.</p>'; });
