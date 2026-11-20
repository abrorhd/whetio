// Pemuat halaman paket: ambil soal.json lalu jalankan mesin simulasi.
// Tamu dan akun gratis (bila paywall aktif) hanya bisa membuka paket terbaru.
import { mulai, kepalaSitus } from "./kuis.js";
import { tarik } from "./sinkron.js";
import { tingkat, terbatas, ajakan } from "./gerbang.js";
import { muatAkses, bacaAkses, rupiah, tglPendek } from "./akses.js";
import { pelatuk } from "./merek.js";

function kunciArsip(terbaru) {
  const tk = tingkat(), a = bacaAkses() || {};
  const isi = tk === "tamu"
    ? { h: "Arsip paket khusus pengguna yang masuk", p: "Tanpa akun, Anda bisa mengerjakan <b>paket hari ini</b> secara gratis. Masuk untuk menyimpan progres belajar psikotes.", a: `<a class="btn pri" href="/akun/?lanjut=${encodeURIComponent(location.pathname)}">Masuk / Daftar</a>` }
    : { h: "Arsip paket khusus Akses Penuh", p: `Akun gratis bisa mengerjakan <b>paket hari ini</b>. Buka Akses Penuh (${rupiah(a.harga || 10000)}, berlaku sampai ${tglPendek(a.batas)}) untuk semua paket sebelumnya dan latihan tanpa batas.`, a: `<a class="btn spark" href="/akses/">Buka Akses Penuh</a>` };
  app.innerHTML = kepalaSitus("psikotes") + `<main class="wrap"><section class="card kunci-arsip">${pelatuk("ramah", "akun-pl")}
    <h1>${isi.h}</h1><p>${isi.p}</p>
    <div class="cta" style="justify-content:center">${isi.a}${terbaru ? `<a class="btn" href="/psikotes/paket/${terbaru}/">Kerjakan paket hari ini</a>` : ""}</div></section></main>`;
}

const app = document.getElementById("app");
const id = (app.dataset.src.match(/paket\/(\d{4}-\d{2}-\d{2})\//) || [])[1];
(async () => {
  await Promise.race([tarik().catch(() => 0), new Promise((r) => setTimeout(r, 2500))]);
  await muatAkses();
  const list = terbatas() ? await fetch("/psikotes/paket.json", { cache: "no-store" }).then((r) => r.json()).catch(() => []) : [];
  const terbaru = list.length ? list.map((x) => x.id).sort().pop() : null;
  if (terbatas() && terbaru && terbaru !== id) return kunciArsip(terbaru);
  const r = await fetch(app.dataset.src, { cache: "no-store" });
  if (r.status === 403) return kunciArsip(terbaru);
  if (!r.ok) throw new Error(r.status);
  const p = await r.json();
  mulai(app, p, {
    kembali: { href: "/psikotes/", teks: "Persiapan Psikotes" },
    ajak: () => ajakan(),
    catatan: "Simulasi penuh mengikuti urutan, jumlah soal, dan durasi psikotes UPKP; Visual Matching memakai batas 5 detik per soal.",
  });
})().catch(() => { app.innerHTML = '<p class="muat">Paket gagal dimuat. Muat ulang halaman ini.</p>'; });
