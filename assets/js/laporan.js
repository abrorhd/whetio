// Laporan soal & kritik/saran: dialog kecil yang mengirim ke /api/laporan/.
import { pelatuk } from "./merek.js";
import { akun } from "./sinkron.js";

const API = "/api/laporan/";
const HURUF = "ABCDEF";
export const KATEGORI = {
  soal: [["soal", "Soal keliru / tidak jelas"], ["kunci", "Kunci jawaban salah"], ["bahas", "Pembahasan keliru"], ["tampilan", "Gambar / tampilan bermasalah"], ["lain", "Lainnya"]],
  umum: [["saran", "Saran fitur"], ["bug", "Bug / tampilan"], ["materi", "Materi / metode belajar"], ["lain", "Lainnya"]],
};
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
let dlg = null;

export function bukaLapor(k = { jenis: "umum" }) {
  if (dlg) dlg.remove();
  const jenis = k.jenis === "soal" ? "soal" : "umum";
  dlg = document.createElement("dialog");
  dlg.className = "lapor-dlg";
  dlg.setAttribute("aria-label", jenis === "soal" ? "Laporkan soal" : "Kritik dan saran");
  dlg.innerHTML = `<form class="lapor-form" novalidate>
    <div class="lapor-kepala">${pelatuk("ramah", "mini")}<div><h2>${jenis === "soal" ? "Laporkan soal" : "Kritik &amp; saran"}</h2>${k.label ? `<div class="hint">${esc(k.label)}</div>` : ""}</div><button type="button" class="tutup" data-tutup aria-label="Tutup">&times;</button></div>
    <fieldset class="lapor-kat"><legend>${jenis === "soal" ? "Apa yang tidak sesuai?" : "Tentang apa?"}</legend>${KATEGORI[jenis].map(([v, t], i) => `<label class="chip"><input type="radio" name="kategori" value="${v}"${i === 0 ? " checked" : ""}><span>${t}</span></label>`).join("")}</fieldset>
    ${jenis === "soal" && k.opsi ? `<label class="lapor-usulan" hidden>Menurut saya kunci yang benar <select name="usulan"><option value="">pilih</option>${HURUF.slice(0, k.opsi).split("").map((h, i) => `<option value="${i}">${h}</option>`).join("")}</select></label>` : ""}
    <label class="lapor-isi">${jenis === "soal" ? "Jelaskan singkat" : "Tulis kritik atau saran Anda"}<textarea name="pesan" rows="4" maxlength="1500" placeholder="${jenis === "soal" ? "Mis. opsi C dan D sama-sama benar karena…" : "Mis. tolong tambahkan…"}"></textarea></label>
    <p class="hint">${akun() ? "Laporan tercatat atas akun Anda." : "Anda belum masuk, jadi laporan dikirim tanpa nama."}${jenis === "soal" ? " Isi soal ikut terkirim supaya mudah dicek." : ""}</p>
    <div class="lapor-status" role="status" aria-live="polite"></div>
    <div class="nav"><button type="button" class="btn" data-tutup>Batal</button><button type="submit" class="btn pri">Kirim</button></div>
  </form>`;
  document.body.appendChild(dlg);
  const f = dlg.querySelector("form"), stat = dlg.querySelector(".lapor-status"), usul = dlg.querySelector(".lapor-usulan");
  const tutup = () => { if (dlg && dlg.open) dlg.close(); };
  dlg.addEventListener("close", () => { const d = dlg; dlg = null; if (d) setTimeout(() => d.remove(), 0); });
  dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-tutup]")) tutup(); });
  f.addEventListener("change", () => { if (usul) usul.hidden = f.kategori.value !== "kunci"; });
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pesan = f.pesan.value.trim(), usulan = f.usulan && f.usulan.value !== "" && f.kategori.value === "kunci" ? Number(f.usulan.value) : null;
    if (pesan.length < 5 && usulan == null) { stat.className = "lapor-status no"; stat.textContent = "Tulis penjelasan singkat (minimal 5 karakter)."; f.pesan.focus(); return; }
    const kirim = f.querySelector('[type="submit"]');
    kirim.disabled = true; kirim.textContent = "Mengirim…"; stat.className = "lapor-status"; stat.textContent = "";
    let konteks = k.konteks || null;
    if (konteks && JSON.stringify(konteks).length > 30000) konteks = { ...konteks, opsi: null, ref: null };
    try {
      const r = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ jenis, kategori: f.kategori.value, pesan, usulan, paket_id: k.paket_id || null, kode: k.kode || null, no: k.no || null, konteks, halaman: location.pathname }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || "Gagal mengirim.");
      f.innerHTML = `<div class="lapor-terima">${pelatuk("senyum")}<h2>Terima kasih!</h2><p>${jenis === "soal" ? "Laporan soal sudah diterima dan akan dicek. Soal yang terbukti keliru diperbaiki di paket berikutnya." : "Masukan Anda sudah diterima."}</p><button type="button" class="btn pri" data-tutup>Tutup</button></div>`;
    } catch (err) {
      kirim.disabled = false; kirim.textContent = "Kirim";
      stat.className = "lapor-status no";
      stat.textContent = err && err.message && !/fetch|network/i.test(err.message) ? err.message : "Gagal mengirim. Periksa koneksi lalu coba lagi.";
    }
  });
  dlg.showModal();
  const ta = f.pesan; if (ta && !matchMedia("(pointer:coarse)").matches) ta.focus();
}

// Tautan "Kritik & saran" di kaki halaman.
if (typeof document !== "undefined" && !window.__laporHidup) {
  window.__laporHidup = true;
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-saran]");
    if (!b) return;
    e.preventDefault();
    bukaLapor({ jenis: "umum", label: document.title.replace(/\s*[·|–-]\s*Whetio.*$/, "") });
  });
}
