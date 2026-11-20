// Halaman /akun/: daftar, masuk, verifikasi kode email, lupa password, sinkron, keluar, hapus akun.
import { kepalaSitus } from "./kuis.js";
import { pelatuk } from "./merek.js";
import { kaki } from "./beranda.js";
import * as A from "./sinkron.js";
import { paywall, penuh, bacaAkses, muatAkses, rupiah, tglPendek } from "./akses.js";
import { BATAS } from "./gerbang.js";

const app = document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const lanjut = (() => { const x = new URLSearchParams(location.search).get("lanjut") || ""; return /^\/(?!\/)[\w\-./?=&%]*$/.test(x) && !x.startsWith("/akun") ? x : ""; })();
let v = { layar: "muat", email: "", pesan: "", galat: "", sibuk: false, user: null };

const PESAN_GALAT = [
  [/invalid email or password|invalid_email_or_password|INVALID_EMAIL_OR_PASSWORD/i, "Email atau password salah."],
  [/already exists|USER_ALREADY_EXISTS/i, "Email ini sudah terdaftar. Silakan masuk, atau pakai Lupa password."],
  [/not verified|EMAIL_NOT_VERIFIED/i, "Email belum diverifikasi. Kami kirimkan kode verifikasi."],
  [/password.*(short|least)|PASSWORD_TOO_SHORT/i, "Password minimal 8 karakter."],
  [/invalid otp|INVALID_OTP|otp.*(expired|invalid)/i, "Kode salah atau sudah kedaluwarsa. Minta kode baru."],
  [/too many|rate/i, "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi."],
];
const terjemah = (e) => { const m = String((e && (e.kode || "")) + " " + ((e && e.message) || "")); for (const [r, t] of PESAN_GALAT) if (r.test(m)) return t; return (e && e.message) || "Terjadi kesalahan. Coba lagi."; };

function form(isi, tombol, aksi) {
  return `<form data-aksi="${aksi}" class="panel" style="max-width:440px;margin:14px auto">${pelatuk(v.galat ? "marah" : "fokus", "akun-pl")}${isi}
    ${v.galat ? `<p class="no-t" role="alert">${esc(v.galat)}</p>` : ""}${v.pesan ? `<p class="ok-t">${esc(v.pesan)}</p>` : ""}
    <button class="btn pri" type="submit" style="width:100%;margin-top:6px"${v.sibuk ? " disabled" : ""}>${v.sibuk ? "Memproses…" : tombol}</button></form>`;
}
const fld = (nama, label, tipe = "text", extra = "") => `<label style="display:block;margin:10px 0 4px;font-weight:700;font-size:13.5px" for="f-${nama}">${label}</label><input id="f-${nama}" name="${nama}" type="${tipe}" ${extra} style="width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font:inherit">`;
const tab = () => `<div class="tabs" style="max-width:440px;margin:14px auto 0">${[["masuk", "Masuk"], ["daftar", "Daftar"]].map(([k, t]) => `<button data-layar="${k}" aria-selected="${v.layar === k}">${t}</button>`).join("")}</div>`;

function layar() {
  const L = v.layar;
  if (L === "muat") return '<p class="muat">Memeriksa sesi…</p>';
  if (L === "masuk") return tab() + form(fld("email", "Email", "email", `autocomplete="email" required value="${esc(v.email)}"`) + fld("password", "Password", "password", 'autocomplete="current-password" required minlength="8"') +
    `<p style="margin:8px 0 0"><a href="#" data-layar="lupa">Lupa password?</a></p>`, "Masuk", "masuk");
  if (L === "daftar") return tab() + form(fld("nama", "Nama panggilan (opsional)", "text", 'autocomplete="nickname" maxlength="40"') + fld("email", "Email", "email", `autocomplete="email" required value="${esc(v.email)}"`) +
    fld("password", "Password (minimal 8 karakter)", "password", 'autocomplete="new-password" required minlength="8"') +
    `<label style="display:flex;gap:8px;align-items:flex-start;margin-top:12px;font-size:13.5px"><input type="checkbox" name="setuju" required style="margin-top:3px"> <span>Saya setuju dengan <a href="/privasi/" target="_blank">kebijakan privasi</a> Whetio.</span></label>`, "Buat akun", "daftar");
  if (L === "verifikasi") return form(`<h2 style="margin-top:0">Verifikasi email</h2><p class="hint" style="font-size:14px">Kode 6 digit dikirim ke <b>${esc(v.email)}</b> dari <b>auth@mail.myneon.app</b>. Cek juga folder Spam/Promosi.</p>` +
    fld("otp", "Kode verifikasi", "text", 'inputmode="numeric" autocomplete="one-time-code" required pattern="[0-9]{6}" maxlength="6"') +
    `<p style="margin:8px 0 0"><a href="#" data-aksi-link="kirim-ulang">Kirim ulang kode</a></p>`, "Verifikasi", "verifikasi");
  if (L === "lupa") return form(`<h2 style="margin-top:0">Lupa password</h2><p class="hint" style="font-size:14px">Kami kirimkan kode 6 digit untuk membuat password baru.</p>` + fld("email", "Email", "email", `autocomplete="email" required value="${esc(v.email)}"`) +
    `<p style="margin:8px 0 0"><a href="#" data-layar="masuk">Kembali ke Masuk</a></p>`, "Kirim kode", "lupa");
  if (L === "reset") return form(`<h2 style="margin-top:0">Buat password baru</h2><p class="hint" style="font-size:14px">Masukkan kode yang dikirim ke <b>${esc(v.email)}</b>.</p>` + fld("otp", "Kode", "text", 'inputmode="numeric" autocomplete="one-time-code" required pattern="[0-9]{6}" maxlength="6"') +
    fld("password", "Password baru (minimal 8 karakter)", "password", 'autocomplete="new-password" required minlength="8"'), "Simpan password baru", "reset");
  // profil
  const a = A.akun() || {};
  return `<section class="panel" style="max-width:520px;margin:14px auto;text-align:center">${pelatuk("ramah", "akun-pl anim-masuk")}
    <h2 style="margin:4px 0">${esc(v.user && v.user.name ? v.user.name : "Akun Whetio")}</h2><p class="hint" style="font-size:14px;margin:0">${esc(a.email || (v.user && v.user.email) || "")}</p>
    <p style="margin:12px 0 4px">${a.sinkron ? `Sinkron terakhir: <b>${new Date(a.sinkron).toLocaleString("id-ID")}</b>` : "Belum pernah sinkron."}</p>
    ${v.pesan ? `<p class="ok-t">${esc(v.pesan)}</p>` : ""}${v.galat ? `<p class="no-t">${esc(v.galat)}</p>` : ""}
    <div class="cta" style="justify-content:center;margin-top:12px"><button class="btn pri" data-aksi-link="sinkron"${v.sibuk ? " disabled" : ""}>Sinkronkan sekarang</button><a class="btn" href="${esc(lanjut || "/psikotes/")}">Ke Siap Psikotes</a><button class="btn" data-aksi-link="keluar">Keluar</button></div>
    <p class="hint" style="margin-top:14px">Progres otomatis tersimpan ke akun setiap kali satu subtes selesai, dan diambil lagi saat Anda membuka situs di perangkat lain.</p></section>
    ${paywall() ? `<section class="panel akses-ringkas" style="max-width:520px;margin:14px auto"><h2>Akses Penuh</h2>${penuh() ? `<p style="margin:0"><span class="tag ok">aktif</span> sampai <b>${tglPendek((bacaAkses() || {}).sampai)}</b>. Semua arsip paket dan latihan tanpa batas terbuka.</p>`
      : `<p style="margin:0 0 10px">Akun gratis: paket hari ini dan ${BATAS.gratis.sesi} sesi latihan bebas per hari.</p><a class="btn spark kecil" href="/akses/">Buka Akses Penuh · ${rupiah((bacaAkses() || {}).harga || 10000)}</a>`}</section>` : ""}
    <section class="panel" style="max-width:520px;margin:14px auto"><h2>Hapus akun</h2><p class="hint" style="font-size:13.5px">Menghapus semua progres yang tersimpan di server beserta akun Anda. Progres di browser ini tidak ikut terhapus.${paywall() && penuh() ? " <b>Akses Penuh yang sudah dibayar ikut hilang.</b>" : ""}</p><button class="btn kecil" data-aksi-link="hapus">Hapus akun &amp; data</button></section>`;
}
function render() {
  const ajak = lanjut && v.layar !== "profil" ? `<p class="panel" style="max-width:440px;margin:10px auto 0;text-align:center"><b>Silakan masuk untuk menyimpan progres belajar psikotes.</b><br><span class="hint">Belum punya akun? Pilih tab Daftar — gratis.</span></p>` : "";
  app.innerHTML = kepalaSitus("akun") + `<main class="wrap"><div class="pk-head" style="text-align:center"><h1>Akun</h1><div class="sub">${paywall() ? "Akun gratis untuk menyimpan progres di semua perangkat. Arsip paket dan latihan tanpa batas tersedia lewat Akses Penuh." : "Akun gratis untuk menyimpan progres, membuka arsip paket, dan latihan tanpa batas di semua perangkat."}</div></div>${ajak}${layar()}</main>` + kaki();
  const f = app.querySelector("form input"); if (f && v.layar !== "profil") f.focus();
}
function set(o) { Object.assign(v, o); render(); }

async function setelahMasuk() {
  v.user = await A.sesi();
  if (!v.user) { set({ layar: "masuk", sibuk: false, galat: "Sesi tidak terbentuk. Pastikan cookie tidak diblokir, lalu coba lagi." }); return; }
  set({ layar: "profil", sibuk: true, galat: "", pesan: "Menyinkronkan progres…" });
  try { const r = await A.sinkronPenuh(); set({ sibuk: false, pesan: `Sinkron selesai${r.berubah ? ` — ${r.berubah} hasil subtes diambil dari akun` : ""}.` }); }
  catch (e) { set({ sibuk: false, pesan: "", galat: "Masuk berhasil, tetapi sinkron gagal: " + terjemah(e) }); }
  await muatAkses(); render();
  if (lanjut) location.replace(lanjut);
}

app.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const fd = Object.fromEntries(new FormData(ev.target)), aksi = ev.target.dataset.aksi;
  if (fd.email) v.email = fd.email.trim().toLowerCase();
  set({ sibuk: true, galat: "", pesan: "" });
  try {
    if (aksi === "masuk") {
      try { await A.masuk(v.email, fd.password); }
      catch (e) { if (/not verified|EMAIL_NOT_VERIFIED/i.test((e.kode || "") + e.message) || e.status === 403) { await A.kirimKodeVerifikasi(v.email).catch(() => {}); v._pw = fd.password; return set({ layar: "verifikasi", sibuk: false, pesan: "Email belum diverifikasi. Kode baru sudah dikirim." }); } throw e; }
      return setelahMasuk();
    }
    if (aksi === "daftar") {
      await A.daftar(v.email, fd.password, fd.nama);
      v._pw = fd.password;
      const s = await A.sesi();
      if (s && s.emailVerified !== false) return setelahMasuk();
      await A.kirimKodeVerifikasi(v.email).catch(() => {});
      return set({ layar: "verifikasi", sibuk: false });
    }
    if (aksi === "verifikasi") {
      await A.verifikasiEmail(v.email, fd.otp.trim());
      if (!(await A.sesi()) && v._pw) await A.masuk(v.email, v._pw);
      v._pw = null;
      if (await A.sesi()) return setelahMasuk();
      return set({ layar: "masuk", sibuk: false, pesan: "Email terverifikasi. Silakan masuk." });
    }
    if (aksi === "lupa") { await A.kirimKodeReset(v.email); return set({ layar: "reset", sibuk: false, pesan: "" }); }
    if (aksi === "reset") { await A.resetPassword(v.email, fd.otp.trim(), fd.password); await A.masuk(v.email, fd.password); return setelahMasuk(); }
  } catch (e) { set({ sibuk: false, galat: terjemah(e) }); }
});
app.addEventListener("click", async (ev) => {
  const t = ev.target.closest("[data-layar],[data-aksi-link]"); if (!t) return;
  ev.preventDefault();
  if (t.dataset.layar) return set({ layar: t.dataset.layar, galat: "", pesan: "" });
  const a = t.dataset.aksiLink;
  if (a === "kirim-ulang") { try { await A.kirimKodeVerifikasi(v.email); set({ pesan: "Kode baru sudah dikirim.", galat: "" }); } catch (e) { set({ galat: terjemah(e) }); } }
  if (a === "sinkron") { set({ sibuk: true, galat: "", pesan: "Menyinkronkan…" }); try { const r = await A.sinkronPenuh(); set({ sibuk: false, pesan: `Sinkron selesai${r.berubah ? ` — ${r.berubah} hasil diambil` : ""}.` }); } catch (e) { set({ sibuk: false, pesan: "", galat: terjemah(e) }); } }
  if (a === "keluar") { await A.keluar(); set({ layar: "masuk", user: null, pesan: "Anda sudah keluar. Masuk lagi untuk melanjutkan latihan.", galat: "" }); }
  if (a === "hapus") {
    if (t.dataset.yakin !== "1") { t.dataset.yakin = "1"; t.textContent = "Yakin? Klik sekali lagi — tidak bisa dibatalkan"; return; }
    set({ sibuk: true });
    try { const r = await A.hapusAkun(); set({ layar: "masuk", user: null, sibuk: false, pesan: r.akunTerhapus ? "Akun dan semua data progres di server sudah dihapus." : "Data progres di server sudah dihapus. Akun login belum dapat dihapus otomatis — admin akan menghapusnya." }); }
    catch (e) { set({ sibuk: false, galat: terjemah(e) }); }
  }
});

(async () => {
  render();
  const adaSalinan = !!(A.akun() && A.akun().sinkron);
  v.user = await A.sesi();
  if (v.user && !adaSalinan) return setelahMasuk(); // perangkat baru dengan sesi aktif: tarik progres otomatis
  if (v.user && lanjut) return location.replace(lanjut);
  set({ layar: v.user ? "profil" : "masuk" });
  if (v.user) { await muatAkses(); render(); }
})();
