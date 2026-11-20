// Halaman admin: membaca dan menindaklanjuti laporan soal & kritik/saran.
import { kepalaSitus } from "./kuis.js";
import { kaki } from "./beranda.js";
import { pelatuk } from "./merek.js";
import { KATEGORI } from "./laporan.js";

const API = "/api/laporan/";
const app = document.getElementById("app");
const HURUF = "ABCDEF";
const LABEL = Object.fromEntries([...KATEGORI.soal, ...KATEGORI.umum]);
const STATUS = [["baru", "Baru"], ["ditinjau", "Ditinjau"], ["selesai", "Selesai"], ["ditolak", "Ditolak"], ["", "Semua"]];
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// SVG dari laporan adalah masukan pengguna: tampilkan sebagai <img> (skrip di dalamnya tidak dijalankan), teks lain di-escape.
const aman = (h) => String(h ?? "").split(/(<svg[\s\S]*?<\/svg>)/).map((b) => b.startsWith("<svg") ? `<img class="lp-svg" alt="gambar" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(b)}">` : esc(b.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "))).join("");
let filter = "baru", data = null, tab = new URLSearchParams(location.search).get("tab") === "bayar" ? "bayar" : "laporan", bayar = null, filterBayar = "tak-cocok";
const ST_BAYAR = [["tak-cocok", "Tak cocok"], ["kurang", "Kurang bayar"], ["cocok", "Otomatis"], ["manual", "Manual"], ["abaikan", "Diabaikan"], ["", "Semua"]];
const rupiah = (n) => (n == null ? "–" : "Rp" + Number(n).toLocaleString("id-ID"));

const waktu = (t) => new Date(t).toLocaleString("id-ID", { timeZone: "Asia/Makassar", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + " WITA";

function kartu(r) {
  const k = r.konteks || {};
  const asal = r.paket_id ? (r.paket_id === "latihan" ? "Latihan bebas" : `<a href="/psikotes/paket/${esc(r.paket_id)}/" target="_blank">Paket ${esc(r.paket_id)}</a>`) : `<span class="mono">${esc(r.halaman || "-")}</span>`;
  const opsi = Array.isArray(k.opsi) ? `<ol class="lp-opsi">${k.opsi.map((o, i) => `<li${HURUF[i] === k.kunci ? ' class="ok"' : ""}><b>${HURUF[i]}</b> ${aman(o)}</li>`).join("")}</ol>` : "";
  const ref = Array.isArray(k.ref) ? `<div class="lp-ref">${k.ref.map((g, i) => `<span><b>${HURUF[i]}</b>${aman(g)}</span>`).join("")}</div>` : "";
  return `<article class="card lp" data-id="${r.id}">
    <div class="meta"><span class="qno">#${r.id}</span><span class="tag ${r.kategori === "kunci" ? "no" : r.jenis === "soal" ? "spark" : "o"}">${esc(LABEL[r.kategori] || r.kategori)}</span><span class="tag">${esc(r.status)}</span><span class="hint">${waktu(r.dibuat)} · ${r.email ? esc(r.email) : "tamu"}</span></div>
    <div class="lp-asal">${asal}${k.subtes ? ` · ${esc(k.subtes)}` : ""}${r.no ? ` no. ${r.no}` : ""}</div>
    ${k.soal ? `<div class="stem">${aman(k.soal)}</div>` : ""}${ref}${opsi}
    ${k.kunci != null ? `<p class="lp-kunci">Kunci situs: <b>${esc(k.kunci)}</b>${k.relasi ? ` (${k.relasi === "S" ? "sinonim" : "antonim"})` : ""} · Jawaban pelapor: <b>${esc(k.jawaban ?? "–")}</b>${r.usulan != null ? ` · Usulan kunci: <b>${HURUF[r.usulan]}</b>` : ""}</p>` : r.usulan != null ? `<p class="lp-kunci">Usulan kunci: <b>${HURUF[r.usulan]}</b></p>` : ""}
    ${k.pembahasan ? `<details><summary>Pembahasan situs</summary><p>${esc(k.pembahasan)}</p></details>` : ""}
    <blockquote class="lp-pesan">${esc(r.pesan || "(tanpa penjelasan)")}</blockquote>
    ${r.catatan ? `<p class="hint">Catatan admin: ${esc(r.catatan)}</p>` : ""}
    <div class="nav lp-aksi">${STATUS.filter(([s]) => s && s !== r.status).map(([s, t]) => `<button class="btn kecil" data-status="${s}">${t}</button>`).join("")}<button class="btn kecil" data-salin>Salin untuk Claude</button></div>
  </article>`;
}

function kartuBayar(p) {
  const perlu = p.status === "tak-cocok" || p.status === "kurang";
  return `<article class="card lp" data-bayar="${esc(p.id)}">
    <div class="meta"><span class="qno">${rupiah(p.nominal)}</span><span class="tag ${perlu ? "no" : p.status === "abaikan" ? "" : "ok"}">${esc((ST_BAYAR.find(([s]) => s === p.status) || [, p.status])[1])}</span><span class="hint">${waktu(p.dibuat)} · ${esc(p.nama || "tanpa nama")}</span></div>
    <blockquote class="lp-pesan">${esc(p.pesan || "(tanpa pesan)")}</blockquote>
    <p class="hint">Kode terbaca: <b class="mono">${esc(p.kode || "–")}</b> · ID: <span class="mono">${esc(p.id)}</span></p>
    ${perlu ? `<div class="nav lp-aksi"><input class="isian-admin" placeholder="Kode WH-XXXXX atau email akun" value="${esc(p.kode || "")}"><button class="btn kecil pri" data-aktifkan>Aktifkan</button><button class="btn kecil" data-tandai="abaikan">Abaikan</button></div>` : ""}
    <details><summary>Data mentah</summary><pre class="mono" style="white-space:pre-wrap;font-size:12px">${esc(JSON.stringify(p.data, null, 2))}</pre></details>
  </article>`;
}
function renderBayar(h) {
  if (!bayar) return h + '<p class="muat">Memuat…</p>';
  const j = bayar.jumlah || {}, semua = Object.values(j).reduce((a, b) => a + b, 0);
  h += `<p class="panel">Paywall: <b>${bayar.aktif ? "aktif" : "belum aktif"}</b> · Akses Penuh aktif: <b>${bayar.aksesAktif}</b> akun</p>`;
  h += `<div class="modebar"><div class="seg">${ST_BAYAR.map(([s, t]) => `<button data-filter-bayar="${s}" aria-pressed="${filterBayar === s}">${t} <span class="mono">${s ? j[s] || 0 : semua}</span></button>`).join("")}</div></div>`;
  h += `<section class="panel"><h2>Aktifkan manual</h2><div class="nav lp-aksi"><input class="isian-admin" id="manual" placeholder="Kode WH-XXXXX atau email akun"><button class="btn kecil pri" data-manual>Aktifkan</button></div></section>`;
  return h + (bayar.pembayaran.length ? bayar.pembayaran.map(kartuBayar).join("") : '<p class="panel">Tidak ada pembayaran di sini.</p>');
}
async function muatBayar() {
  const r = await fetch(`/api/bayar/?admin=1${filterBayar ? `&status=${filterBayar}` : ""}`, { credentials: "same-origin" }).catch(() => null);
  if (!r) return render("Gagal memuat. Periksa koneksi.");
  if (r.status === 401) return render(`Masuk dulu dengan akun admin. <a href="/akun/?lanjut=/admin/">Masuk</a>`);
  if (r.status === 403) return render("Akun ini bukan admin. Email admin diatur lewat variabel ADMIN_EMAILS di Vercel.");
  if (!r.ok) return render("Database sedang bermasalah. Coba lagi sebentar lagi.");
  bayar = await r.json(); render();
}
async function aktifkan(tujuan, pembayaran_id, tombol) {
  if (!tujuan) return;
  tombol.disabled = true;
  const r = await fetch("/api/bayar/", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ aksi: "aktifkan", tujuan, pembayaran_id }) }).catch(() => null);
  const d = r ? await r.json().catch(() => ({})) : {};
  if (r && r.ok) { tombol.textContent = `Aktif: ${d.email || "✓"}`; setTimeout(muatBayar, 900); } else { tombol.disabled = false; tombol.textContent = d.message ? "Gagal" : "Gagal, coba lagi"; if (d.message) alert(d.message); }
}

function render(pesan) {
  let h = kepalaSitus("admin") + `<main class="wrap"><div class="pk-head"><h1>${tab === "bayar" ? "Pembayaran" : "Laporan masuk"}</h1><div class="sub">${tab === "bayar" ? "Pembayaran Trakteer untuk Akses Penuh." : "Soal keliru, kunci salah, dan kritik &amp; saran dari pengguna."}</div></div>
    <div class="modebar"><div class="seg"><button data-tab="laporan" aria-pressed="${tab === "laporan"}">Laporan</button><button data-tab="bayar" aria-pressed="${tab === "bayar"}">Pembayaran</button></div></div>`;
  if (!pesan && tab === "bayar") { app.innerHTML = renderBayar(h) + "</main>" + kaki(); return; }
  if (pesan) h += `<section class="card hasil"><div class="hasil-atas">${pelatuk("ramah")}<div class="gelembung">${pesan}</div></div></section>`;
  else if (!data) h += '<p class="muat">Memuat…</p>';
  else {
    const j = data.jumlah || {}, semua = Object.values(j).reduce((a, b) => a + b, 0);
    h += `<div class="modebar"><div class="seg">${STATUS.map(([s, t]) => `<button data-filter="${s}" aria-pressed="${filter === s}">${t} <span class="mono">${s ? j[s] || 0 : semua}</span></button>`).join("")}</div></div>`;
    h += data.laporan.length ? data.laporan.map(kartu).join("") : '<p class="panel">Tidak ada laporan di sini.</p>';
  }
  app.innerHTML = h + "</main>" + kaki();
}

async function muat() {
  const r = await fetch(API + (filter ? `?status=${filter}` : ""), { credentials: "same-origin" }).catch(() => null);
  if (!r) return render("Gagal memuat. Periksa koneksi.");
  if (r.status === 401) return render(`Masuk dulu dengan akun admin. <a href="/akun/?lanjut=/admin/">Masuk</a>`);
  if (r.status === 403) return render("Akun ini bukan admin. Email admin diatur lewat variabel ADMIN_EMAILS di Vercel.");
  if (!r.ok) return render("Database sedang bermasalah. Coba lagi sebentar lagi.");
  data = await r.json(); render();
}

function teksClaude(r) {
  const k = r.konteks || {}, polos = (x) => String(x ?? "").replace(/<svg[\s\S]*?<\/svg>/g, "[gambar]").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return [`Laporan #${r.id} (${LABEL[r.kategori] || r.kategori}) — ${r.paket_id ? (r.paket_id === "latihan" ? "latihan bebas" : "paket " + r.paket_id) : r.halaman}${k.subtes ? ", " + k.subtes : ""}${r.no ? " no. " + r.no : ""}`,
    k.soal ? "Soal: " + polos(k.soal) : "", Array.isArray(k.opsi) ? "Opsi: " + k.opsi.map((o, i) => `${HURUF[i]}. ${polos(o)}`).join(" | ") : "",
    k.kunci != null ? `Kunci situs: ${k.kunci} · Jawaban pelapor: ${k.jawaban ?? "-"}${r.usulan != null ? " · Usulan: " + HURUF[r.usulan] : ""}` : "",
    "Pesan: " + (r.pesan || "-"), "Mohon cek apakah soal/kunci ini keliru dan perbaiki di paket berikutnya."].filter(Boolean).join("\n");
}

app.addEventListener("click", async (e) => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.tab) { tab = b.dataset.tab; history.replaceState(null, "", tab === "bayar" ? "?tab=bayar" : location.pathname); render(); return tab === "bayar" ? muatBayar() : muat(); }
  if (b.dataset.filterBayar !== undefined) { filterBayar = b.dataset.filterBayar; bayar = null; render(); return muatBayar(); }
  if (b.dataset.manual !== undefined) return aktifkan(document.getElementById("manual").value.trim(), null, b);
  const kb = b.closest("[data-bayar]");
  if (kb && b.dataset.aktifkan !== undefined) return aktifkan(kb.querySelector("input").value.trim(), kb.dataset.bayar, b);
  if (kb && b.dataset.tandai) {
    b.disabled = true;
    const r = await fetch("/api/bayar/", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ aksi: "tandai", pembayaran_id: kb.dataset.bayar, status: b.dataset.tandai }) }).catch(() => null);
    return r && r.ok ? muatBayar() : (b.disabled = false);
  }
  if (b.dataset.filter !== undefined) { filter = b.dataset.filter; data = null; render(); return muat(); }
  const kartuEl = b.closest(".lp"), id = kartuEl && Number(kartuEl.dataset.id), r = data && data.laporan.find((x) => x.id === id);
  if (!r) return;
  if (b.dataset.salin !== undefined) {
    try { await navigator.clipboard.writeText(teksClaude(r)); b.textContent = "Tersalin ✓"; } catch { b.textContent = "Gagal menyalin"; }
    return;
  }
  if (b.dataset.status) {
    b.disabled = true;
    const res = await fetch(API, { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: b.dataset.status }) }).catch(() => null);
    if (res && res.ok) muat(); else { b.disabled = false; b.textContent = "Gagal, coba lagi"; }
  }
});

render(); tab === "bayar" ? muatBayar() : muat();
