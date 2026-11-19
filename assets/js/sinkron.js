// Akun & sinkron progres Whetio. Progres tetap utama di browser (localStorage); bila masuk, disalin ke Neon.
const AUTH = "/api/auth";
const API = "/api/progres/";
export const K_AKUN = "whetio:akun";         // {email, nama, sinkron: ms}
const K_ANTRE = "whetio:antrean";            // kiriman yang gagal, dicoba lagi
const K_RINGKAS = "whetio:psikotes:ringkas";
const K_DRILL = "whetio:psikotes:drill";
const K_TGL = "whetio:psikotes:tgl";
const baca = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
const tulis = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
export const kunciPaket = (id) => `whetio-psikotes-${id.replace(/-/g, "")}-v1`;

export function akun() { return baca(K_AKUN); }

async function panggil(url, { method = "GET", body } = {}) {
  const r = await fetch(url, { method, credentials: "same-origin", headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
  let d = null; try { d = await r.json(); } catch (e) {}
  if (!r.ok) { const e = new Error((d && (d.message || (d.error && d.error.message) || d.code)) || `Galat ${r.status}`); e.status = r.status; e.kode = d && (d.code || (d.error && d.error.code)); throw e; }
  return d;
}
const auth = (jalur, body) => panggil(`${AUTH}/${jalur}/`, body ? { method: "POST", body } : {});

// ---------- autentikasi (Neon Managed Better Auth, lewat proxy domain sendiri) ----------
export const daftar = (email, password, name) => auth("sign-up/email", { email, password, name: name || email.split("@")[0] });
export const masuk = (email, password) => auth("sign-in/email", { email, password });
export const kirimKodeVerifikasi = (email) => auth("email-otp/send-verification-otp", { email, type: "email-verification" });
export const verifikasiEmail = (email, otp) => auth("email-otp/verify-email", { email, otp });
export const kirimKodeReset = (email) => auth("email-otp/send-verification-otp", { email, type: "forget-password" });
export const resetPassword = (email, otp, password) => auth("email-otp/reset-password", { email, otp, password });
export async function sesi() {
  const d = await auth("get-session").catch(() => null);
  if (d && d.user) { const a = akun() || {}; tulis(K_AKUN, { ...a, email: d.user.email, nama: d.user.name || "" }); return d.user; }
  return null;
}
export async function keluar() {
  try { await auth("sign-out", {}); } catch (e) {}
  try { localStorage.removeItem(K_AKUN); localStorage.removeItem(K_ANTRE); } catch (e) {}
}
export async function hapusAkun() {
  await panggil(API, { method: "DELETE" });
  let akunTerhapus = false;
  try { await auth("delete-user", {}); akunTerhapus = true; } catch (e) {}
  await keluar();
  return { akunTerhapus };
}

// ---------- sinkron ----------
function kumpulkanLokal() {
  const ringkas = baca(K_RINGKAS) || {}, hasil = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i), m = /^whetio-psikotes-(\d{4})(\d{2})(\d{2})-v1$/.exec(k || "");
    if (!m) continue;
    const id = `${m[1]}-${m[2]}-${m[3]}`, st = baca(k);
    Object.entries((st && st.hasil) || {}).forEach(([kode, h]) => { if (h && h.selesai) hasil.push({ paket_id: id, kode, t: h.t || 0, data: { h, r: (ringkas[id] || {})[kode] || null } }); });
  }
  const latihan = (baca(K_DRILL) || []).filter((d) => d && d.t).map((d) => ({ t: d.t, data: d }));
  let tgl = null; try { tgl = localStorage.getItem(K_TGL); } catch (e) {}
  return { hasil, latihan, profil: { tgl_ujian: tgl } };
}
async function kirim(isi) {
  for (let i = 0; i < Math.max(1, isi.hasil.length); i += 50) {
    await panggil(API, { method: "POST", body: { profil: i === 0 ? isi.profil : undefined, hasil: isi.hasil.slice(i, i + 50), latihan: i === 0 ? isi.latihan.slice(-200) : [] } });
  }
}
function gabungkan(d) {
  const ringkas = baca(K_RINGKAS) || {};
  let berubah = 0;
  for (const row of d.hasil || []) {
    const key = kunciPaket(row.paket_id), st = baca(key) || {};
    st.hasil = st.hasil || {};
    const lokal = st.hasil[row.kode];
    if (lokal && lokal.selesai && (lokal.t || 0) >= row.t) continue;
    if (lokal && !lokal.selesai && st.aktif && st.aktif.kode === row.kode) continue; // jangan ganggu sesi yang sedang berjalan
    st.hasil[row.kode] = row.data.h;
    tulis(key, st);
    if (row.data.r) { (ringkas[row.paket_id] = ringkas[row.paket_id] || {})[row.kode] = row.data.r; }
    berubah++;
  }
  tulis(K_RINGKAS, ringkas);
  if (d.latihan && d.latihan.length) {
    const log = baca(K_DRILL) || [], ada = new Set(log.map((x) => x.t));
    d.latihan.forEach((l) => { if (!ada.has(l.t)) log.push(l.data); });
    log.sort((a, b) => a.t - b.t);
    tulis(K_DRILL, log.slice(-200));
  }
  if (d.profil && d.profil.tgl_ujian) { try { if (!localStorage.getItem(K_TGL)) localStorage.setItem(K_TGL, d.profil.tgl_ujian); } catch (e) {} }
  return berubah;
}
// Tarik dari server lalu dorong semua yang lokal (dipakai saat masuk dan tombol "Sinkronkan sekarang").
export async function sinkronPenuh() {
  const d = await panggil(API);
  const berubah = gabungkan(d);
  await kirim(kumpulkanLokal());
  tulis(K_AKUN, { ...(akun() || {}), email: d.email, sinkron: Date.now() });
  try { localStorage.removeItem(K_ANTRE); } catch (e) {}
  return { berubah };
}
// Tarik perubahan terbaru (dipanggil saat membuka beranda/paket). Diam bila belum masuk.
export async function tarik() {
  const a = akun(); if (!a) return 0;
  try {
    await kirimAntrean();
    const d = await panggil(API + (a.sinkron ? `?sejak=${a.sinkron - 60000}` : ""));
    const n = gabungkan(d);
    tulis(K_AKUN, { ...a, email: d.email, sinkron: d.waktu || Date.now() });
    return n;
  } catch (e) { if (e.status === 401) { try { localStorage.removeItem(K_AKUN); } catch (x) {} } return 0; }
}
async function kirimAntrean() {
  const q = baca(K_ANTRE); if (!q || !(q.hasil || []).length && !(q.latihan || []).length && !q.profil) return;
  await kirim({ hasil: q.hasil || [], latihan: q.latihan || [], profil: q.profil || {} });
  try { localStorage.removeItem(K_ANTRE); } catch (e) {}
}
function antre(isi) {
  const q = baca(K_ANTRE) || { hasil: [], latihan: [] };
  q.hasil = (q.hasil || []).concat(isi.hasil || []).slice(-200); q.latihan = (q.latihan || []).concat(isi.latihan || []).slice(-200);
  if (isi.profil) q.profil = isi.profil;
  tulis(K_ANTRE, q);
}
async function dorong(isi) {
  if (!akun()) return;
  try { await kirim({ hasil: isi.hasil || [], latihan: isi.latihan || [], profil: isi.profil || {} }); } catch (e) { if (e.status !== 401) antre(isi); }
}
export const kirimHasil = (paketId, kode, h, r) => dorong({ hasil: [{ paket_id: paketId, kode, t: h.t || 0, data: { h, r } }] });
export const kirimLatihan = (d) => dorong({ latihan: [{ t: d.t, data: d }] });
export const kirimTgl = (tgl) => dorong({ profil: { tgl_ujian: tgl } });
