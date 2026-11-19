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
let filter = "baru", data = null;

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

function render(pesan) {
  let h = kepalaSitus("admin") + `<main class="wrap"><div class="pk-head"><h1>Laporan masuk</h1><div class="sub">Soal keliru, kunci salah, dan kritik &amp; saran dari pengguna.</div></div>`;
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

render(); muat();
