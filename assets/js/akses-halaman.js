// Halaman /akses/: beli Akses Penuh lewat Trakteer.
import { kepalaSitus } from "./kuis.js";
import { kaki } from "./beranda.js";
import { pelatuk } from "./merek.js";
import { akun } from "./sinkron.js";
import { BATAS } from "./gerbang.js";
import { muatAkses, mintaKode, bacaAkses, penuh, rupiah, tglPendek } from "./akses.js";

const app = document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
let v = { memuat: true, sibuk: false, galat: "", pesan: "", menunggu: false };

const tabel = (a) => `<table class="tbl tbl-akses"><thead><tr><th></th><th>Tamu</th><th>Akun gratis</th><th>Akses Penuh</th></tr></thead><tbody>
  <tr><td>Paket simulasi hari ini</td><td>✓</td><td>✓</td><td>✓</td></tr>
  <tr><td>Arsip paket sebelumnya</td><td>–</td><td>–</td><td>✓</td></tr>
  <tr><td>Latihan bebas</td><td>${BATAS.tamu.sesi} sesi/hari</td><td>${BATAS.gratis.sesi} sesi/hari</td><td>tanpa batas</td></tr>
  <tr><td>Jumlah soal per latihan</td><td>10</td><td>10</td><td>10 · 20 · seperti ujian</td></tr>
  <tr><td>Progres di semua perangkat</td><td>–</td><td>✓</td><td>✓</td></tr>
  <tr><td>Harga</td><td>gratis</td><td>gratis</td><td><b>${rupiah(a.harga || 10000)}</b> sekali, s.d. ${tglPendek(a.batas)}</td></tr></tbody></table>`;

function isi() {
  const a = bacaAkses() || {}, u = akun();
  if (v.memuat) return '<p class="muat">Memeriksa status…</p>';
  if (!a.aktif) return `<section class="card kunci-arsip">${pelatuk("ramah", "akun-pl")}<h1>Akses Penuh belum dibuka</h1>
    <p>Saat ini semua fitur masih gratis untuk akun yang masuk. Pembayaran Akses Penuh akan diumumkan di halaman ini.</p>
    <div class="cta" style="justify-content:center"><a class="btn spark" href="/psikotes/">Ke Persiapan Psikotes</a>${u ? "" : '<a class="btn pri" href="/akun/?lanjut=%2Fakses%2F">Masuk / Daftar</a>'}</div></section>`;
  if (u && penuh()) return `<section class="card kunci-arsip">${pelatuk("senyum", "akun-pl anim-masuk")}<h1>Akses Penuh aktif</h1>
    <p>Berlaku sampai <b>${tglPendek(a.sampai)}</b>. Semua arsip paket dan latihan bebas tanpa batas sudah terbuka untuk <b>${esc(u.email)}</b>.</p>
    <div class="cta" style="justify-content:center"><a class="btn spark" href="/psikotes/">Ke Persiapan Psikotes</a><a class="btn" href="/psikotes/latihan/">Latihan bebas</a></div></section>`;
  let h = `<div class="panel">${tabel(a)}</div>`;
  if (!u) return h + `<section class="panel langkah"><h2>Langkah 1 · Masuk dulu</h2><p>Akses Penuh terpasang ke akun Whetio, jadi berlaku di semua perangkat Anda.</p>
    <a class="btn pri" href="/akun/?lanjut=%2Fakses%2F">Masuk / Daftar</a></section>`;
  const kode = a.kode;
  h += `<section class="panel langkah"><h2>Langkah 1 · Ambil kode pembayaran</h2>
    ${kode ? `<div class="kode-bayar"><span class="kode-kata" id="kode">${esc(kode)}</span><button class="btn kecil" data-aksi="salin">Salin</button></div>
      <p class="hint">Kode ini milik <b>${esc(u.email)}</b>. Tulis dua kata ini di kolom pesan Trakteer. Huruf besar/kecil dan tanda baca tidak berpengaruh, dan boleh ditambah ucapan lain.</p>`
      : `<p class="hint" style="margin-top:0">Kode berupa dua kata, misalnya <i>pelatuk tajam</i>.</p><button class="btn pri" data-aksi="kode"${v.sibuk ? " disabled" : ""}>Ambil kode</button>`}</section>
  <section class="panel langkah${kode ? "" : " redup"}"><h2>Langkah 2 · Bayar ${rupiah(a.harga || 10000)} di Trakteer</h2>
    <ol><li>Buka halaman Trakteer Whetio, pilih <b>1 unit (${rupiah(a.harga || 10000)})</b>.</li><li>Di kolom <b>pesan</b>, tulis kode <b>${kode ? `“${esc(kode)}”` : "dua kata dari langkah 1"}</b>.</li><li>Bayar dengan QRIS, e-wallet, atau transfer bank.</li></ol>
    <p class="hint">Cukup 1 unit. Lebih dari 1 unit dianggap dukungan tambahan dan tidak dikembalikan.</p>
    ${kode && a.tautan ? `<a class="btn spark" href="${esc(a.tautan)}" target="_blank" rel="noopener" data-aksi="trakteer">Buka Trakteer</a>` : ""}</section>
  <section class="panel langkah${kode ? "" : " redup"}"><h2>Langkah 3 · Akses terbuka otomatis</h2>
    <p>Biasanya kurang dari satu menit setelah pembayaran berhasil. ${v.menunggu ? '<span class="hint">Menunggu konfirmasi pembayaran…</span>' : ""}</p>
    <button class="btn" data-aksi="cek"${v.sibuk || !kode ? " disabled" : ""}>Cek status</button>
    <p class="hint" style="margin-top:10px">Lupa menulis kode atau akses belum terbuka setelah 10 menit? Kirim lewat <button type="button" class="tautan" data-saran>Kritik &amp; saran</button>: nama di Trakteer, waktu bayar, dan email akun Anda. Admin akan mengaktifkan secara manual.</p></section>`;
  return h;
}

function render() {
  app.innerHTML = kepalaSitus("akses") + `<main class="wrap"><div class="pk-head"><h1>Akses Penuh</h1><div class="sub">Sekali bayar untuk semua arsip paket Siap Psikotes dan latihan bebas tanpa batas sampai hari H.</div></div>
    ${v.pesan ? `<p class="ok-t">${esc(v.pesan)}</p>` : ""}${v.galat ? `<p class="no-t">${esc(v.galat)}</p>` : ""}${isi()}</main>` + kaki();
}

let poll = null;
function tunggu(menit = 3) {
  clearInterval(poll); v.menunggu = true; render();
  const akhir = Date.now() + menit * 60_000;
  poll = setInterval(async () => {
    await muatAkses();
    if (penuh() || Date.now() > akhir) { clearInterval(poll); v.menunggu = false; if (penuh()) v.pesan = "Pembayaran diterima. Akses Penuh aktif!"; render(); }
  }, 5000);
}

app.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-aksi]"); if (!b) return;
  const aksi = b.dataset.aksi;
  if (aksi === "kode") {
    v.sibuk = true; v.galat = ""; render();
    try { await mintaKode(); } catch (err) { v.galat = err.message; }
    v.sibuk = false; render();
  } else if (aksi === "salin") {
    try { await navigator.clipboard.writeText(document.getElementById("kode").textContent); b.textContent = "Tersalin ✓"; } catch (err) { b.textContent = "Salin manual"; }
  } else if (aksi === "trakteer") {
    tunggu(10);
  } else if (aksi === "cek") {
    v.sibuk = true; render();
    await muatAkses(4000);
    v.sibuk = false; v.pesan = penuh() ? "Akses Penuh aktif!" : ""; v.galat = penuh() ? "" : "Pembayaran belum tercatat. Tunggu sebentar lalu cek lagi.";
    render();
  }
});

render();
muatAkses(4000).then(() => { v.memuat = false; render(); });
