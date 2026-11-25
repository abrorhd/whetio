// Halaman /akses/: beli Akses Penuh lewat Trakteer (kode otomatis → salin & buka Trakteer → bayar QRIS → aktif otomatis).
import { kepalaSitus } from "./kuis.js";
import { kaki } from "./beranda.js";
import { pelatuk } from "./merek.js";
import { akun } from "./sinkron.js";
import { BATAS } from "./gerbang.js";
import { muatAkses, mintaKode, bacaAkses, penuh, rupiah, tglPendek } from "./akses.js";

const app = document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
let v = { memuat: true, sibuk: false, galat: "", pesan: "", menunggu: false, klaim: false, klaimTerkirim: false, tersalin: false };
const sekarang = () => { const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };

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
  if (!u) return `<div class="panel">${tabel(a)}</div><section class="panel langkah"><h2>Langkah 1 · Masuk dulu</h2><p>Akses Penuh terpasang ke akun Whetio, jadi berlaku di semua perangkat Anda.</p>
    <a class="btn pri" href="/akun/?lanjut=%2Fakses%2F">Masuk / Daftar</a></section>`;
  const kode = a.kode, harga = rupiah(a.harga || 10000);
  // Satu kartu bayar: kode dibuat otomatis, satu tombol menyalin kode sekaligus membuka Trakteer, lalu bayar dengan scan QRIS.
  let h = `<section class="panel bayar"><h2>Bayar ${harga} lewat Trakteer</h2>
    <p class="hint" style="margin-top:0">Sekali bayar, aktif untuk <b>${esc(u.email)}</b> sampai ${tglPendek(a.batas)}.</p>
    ${kode ? `<div class="kode-bayar"><div><div class="hint">Kode pembayaran Anda</div><span class="kode-kata" id="kode">${esc(kode)}</span></div></div>`
      : `<p>${v.sibuk ? "Menyiapkan kode pembayaran…" : `<button class="btn pri" data-aksi="kode">Buat kode pembayaran</button>`}</p>`}
    ${kode && a.tautan ? `<a class="btn spark besar" href="${esc(a.tautan)}" target="_blank" rel="noopener" data-aksi="trakteer">${v.tersalin ? "Kode tersalin ✓ · buka Trakteer lagi" : "Salin kode &amp; buka Trakteer"}</a>` : ""}
    <ol class="alur">
      <li><span><b>Tempel kode</b> di kolom <i>pesan</i> Trakteer, jumlah <b>1 unit (${harga})</b>.</span></li>
      <li><span><b>Pilih QRIS</b>, lalu scan kodenya dengan aplikasi m-banking atau e-wallet apa pun. Bisa juga pilih e-wallet atau transfer bank.</span></li>
      <li><span><b>Kembali ke halaman ini.</b> Akses terbuka otomatis, biasanya kurang dari satu menit.</span></li>
    </ol>
    <div class="status-bayar">${v.menunggu ? '<span class="tunggu-titik" aria-hidden="true"></span><span>Menunggu pembayaran masuk…</span>' : '<span class="hint">Sudah bayar? Halaman ini mengecek otomatis saat Anda kembali.</span>'}
      <button class="btn kecil" data-aksi="cek"${v.sibuk || !kode ? " disabled" : ""}>Cek status</button></div>
    <p class="hint">Cukup 1 unit. Lebih dari 1 unit dianggap dukungan tambahan dan tidak dikembalikan.</p></section>
  <div class="panel"><h2>Yang Anda dapat</h2>${tabel(a)}</div>
  <details class="panel langkah"${v.klaim || v.klaimTerkirim ? " open" : ""}><summary><b>Sudah bayar tapi lupa menulis kode?</b></summary>
    ${v.klaimTerkirim ? `<p class="ok-t">Klaim terkirim atas akun <b>${esc(u.email)}</b>. Admin akan mencocokkan dengan data Trakteer dan mengaktifkan Akses Penuh secara manual, biasanya di hari yang sama.</p>`
      : v.klaim ? `<form class="klaim-form" data-klaim>
        <label>Nama di Trakteer<input name="nama" required maxlength="120" placeholder="Nama yang tampil saat mentraktir"></label>
        <label>Perkiraan waktu bayar<input name="waktu" type="datetime-local" required value="${sekarang()}"></label>
        <label>Catatan (opsional)<textarea name="catatan" rows="2" maxlength="500" placeholder="Mis. bayar lewat QRIS, pesan yang ditulis: …"></textarea></label>
        <div class="cta" style="margin:0"><button class="btn pri"${v.sibuk ? " disabled" : ""}>Kirim klaim</button><button type="button" class="btn" data-aksi="batal-klaim">Batal</button></div></form>`
      : `<p>Tidak apa-apa. Isi nama Anda di Trakteer dan perkiraan waktu bayar, admin akan mengaktifkan akses untuk akun ini.</p><button class="btn" data-aksi="klaim">Saya sudah bayar</button>`}</details>`;
  return h;
}

function render() {
  app.innerHTML = kepalaSitus("akses") + `<main class="wrap"><div class="pk-head"><h1>Akses Penuh</h1><div class="sub">Sekali bayar untuk semua arsip paket Siap Psikotes dan latihan bebas tanpa batas sampai hari H.</div></div>
    ${v.pesan ? `<p class="ok-t">${esc(v.pesan)}</p>` : ""}${v.galat ? `<p class="no-t">${esc(v.galat)}</p>` : ""}${isi()}</main>` + kaki();
}

// Salin teks ke papan klip secara sinkron (tetap dalam gestur klik), dengan Clipboard API sebagai tambahan.
function salin(t) {
  if (!t) return false;
  let ok = false;
  try {
    const ta = document.createElement("textarea");
    ta.value = t; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, t.length);
    ok = document.execCommand("copy"); ta.remove();
  } catch (e) {}
  try { if (navigator.clipboard) { navigator.clipboard.writeText(t).catch(() => {}); ok = true; } } catch (e) {}
  return ok;
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
  } else if (aksi === "trakteer") {
    // Salin kode lalu buka Trakteer di tab baru, dalam satu ketukan. Salin dulu selagi halaman ini masih fokus.
    e.preventDefault();
    v.tersalin = salin((bacaAkses() || {}).kode);
    window.open(b.href, "_blank", "noopener");
    tunggu(15);
  } else if (aksi === "klaim" || aksi === "batal-klaim") {
    v.klaim = aksi === "klaim"; v.galat = ""; render();
  } else if (aksi === "cek") {
    v.sibuk = true; render();
    await muatAkses(4000);
    v.sibuk = false; v.pesan = penuh() ? "Akses Penuh aktif!" : ""; v.galat = penuh() ? "" : "Pembayaran belum tercatat. Tunggu sebentar lalu cek lagi.";
    render();
  }
});

// Kode dibuat otomatis begitu pengguna yang masuk membuka halaman ini (tidak perlu tombol "Ambil kode").
async function siapkanKode() {
  const a = bacaAkses() || {};
  if (!a.aktif || !akun() || penuh() || a.kode) return;
  v.sibuk = true; render();
  try { await mintaKode(); } catch (err) { v.galat = err.message; }
  v.sibuk = false; render();
}
// Kembali dari tab Trakteer → langsung cek status pembayaran.
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState !== "visible" || v.memuat || penuh() || !(bacaAkses() || {}).kode) return;
  await muatAkses(4000);
  if (penuh()) { clearInterval(poll); v.menunggu = false; v.pesan = "Pembayaran diterima. Akses Penuh aktif!"; render(); }
});

render();
muatAkses(4000).then(() => { v.memuat = false; render(); return siapkanKode(); });

app.addEventListener("submit", async (e) => {
  const f = e.target.closest("[data-klaim]"); if (!f) return;
  e.preventDefault();
  const d = Object.fromEntries(new FormData(f));
  const t = d.waktu ? new Date(d.waktu) : null;
  const waktu = t && !isNaN(t) ? t.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " (waktu perangkat)" : d.waktu;
  v.sibuk = true; v.galat = ""; render();
  try {
    const r = await fetch("/api/bayar/", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ aksi: "klaim", nama: d.nama, waktu, catatan: d.catatan }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok || r.status === 429) { v.klaimTerkirim = true; v.klaim = false; } else v.galat = j.message || "Gagal mengirim klaim. Coba lagi.";
  } catch (err) { v.galat = "Gagal mengirim klaim. Periksa koneksi."; }
  v.sibuk = false; render();
});
