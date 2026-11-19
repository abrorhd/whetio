// Laporan soal dan kritik/saran.
// POST  /api/laporan/  { jenis, kategori, pesan, usulan?, paket_id?, kode?, no?, konteks?, halaman? } → simpan (tamu boleh; dibatasi 30/hari)
// GET   /api/laporan/?status=baru|ditinjau|selesai|ditolak  → daftar (khusus admin: email di ADMIN_EMAILS)
// PATCH /api/laporan/  { id, status, catatan? } → ubah status (khusus admin)
import { createHash } from "node:crypto";
import { sql, pastikanSkema, penggunaDari, bodyJSON } from "./_lib.js";

const KATEGORI = new Set(["soal", "kunci", "bahas", "tampilan", "lain", "saran", "bug", "materi"]);
const STATUS = new Set(["baru", "ditinjau", "selesai", "ditolak"]);
const PAKET = /^(\d{4}-\d{2}-\d{2}|latihan)$/, KODE = /^[A-Z]{2,4}$/;
const MAKS_HARI = 30, MAKS_KONTEKS = 32 * 1024;

const adalahAdmin = (u) => {
  const daftar = (process.env.ADMIN_EMAILS || "").toLowerCase().split(/[\s,;]+/).filter(Boolean);
  return !!(u && u.verified && u.email && daftar.includes(u.email.toLowerCase()));
};
// Sidik anti-spam: hash IP + tanggal + rahasia server, berganti tiap hari, tidak bisa dibalik.
function sidik(req) {
  const ip = String(req.headers["x-forwarded-for"] || (req.socket && req.socket.remoteAddress) || "").split(",")[0].trim();
  return createHash("sha256").update(`${ip}|${new Date().toISOString().slice(0, 10)}|${process.env.DATABASE_URL || ""}`).digest("hex").slice(0, 32);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  let u = null;
  try { u = await penggunaDari(req); } catch (e) { console.error("sesi:", e && e.message); }
  try {
    await pastikanSkema();
    const q = sql();
    if (req.method === "POST") {
      const b = await bodyJSON(req);
      if (!b || typeof b !== "object") return res.status(400).json({ message: "Format laporan tidak valid." });
      const jenis = b.jenis === "soal" ? "soal" : "umum";
      const kategori = String(b.kategori || "");
      if (!KATEGORI.has(kategori)) return res.status(400).json({ message: "Pilih jenis masalahnya." });
      const pesan = String(b.pesan || "").trim().slice(0, 1500);
      const usulan = Number.isInteger(b.usulan) && b.usulan >= 0 && b.usulan < 6 ? b.usulan : null;
      if (pesan.length < 5 && usulan == null) return res.status(400).json({ message: "Tulis penjelasan singkat (minimal 5 karakter)." });
      const paket = PAKET.test(String(b.paket_id || "")) ? b.paket_id : null;
      const kode = KODE.test(String(b.kode || "")) ? b.kode : null;
      const no = Number.isInteger(b.no) && b.no > 0 && b.no <= 300 ? b.no : null;
      const konteks = b.konteks && typeof b.konteks === "object" ? JSON.stringify(b.konteks) : null;
      if (konteks && konteks.length > MAKS_KONTEKS) return res.status(413).json({ message: "Data soal terlalu besar." });
      const halaman = String(b.halaman || "").slice(0, 200);
      const sid = sidik(req);
      const [{ n }] = u
        ? await q`SELECT count(*)::int AS n FROM laporan WHERE dibuat > now() - interval '1 day' AND (ip_hash = ${sid} OR user_id = ${u.id})`
        : await q`SELECT count(*)::int AS n FROM laporan WHERE dibuat > now() - interval '1 day' AND ip_hash = ${sid}`;
      if (n >= MAKS_HARI) return res.status(429).json({ message: "Batas laporan hari ini tercapai. Coba lagi besok." });
      const [r] = await q`INSERT INTO laporan (jenis, kategori, paket_id, kode, no, usulan, pesan, konteks, halaman, user_id, email, ip_hash)
        VALUES (${jenis}, ${kategori}, ${paket}, ${kode}, ${no}, ${usulan}, ${pesan}, ${konteks}::jsonb, ${halaman}, ${u ? u.id : null}, ${u ? u.email : null}, ${sid})
        RETURNING id`;
      return res.status(200).json({ ok: true, id: Number(r.id) });
    }
    if (!adalahAdmin(u)) return res.status(u ? 403 : 401).json({ message: u ? "Akun ini bukan admin." : "Silakan masuk dengan akun admin." });
    if (req.method === "GET") {
      const st = new URL(req.url, "http://x").searchParams.get("status");
      const rows = STATUS.has(st)
        ? await q`SELECT id, dibuat, diubah, jenis, kategori, paket_id, kode, no, usulan, pesan, konteks, halaman, email, status, catatan FROM laporan WHERE status = ${st} ORDER BY dibuat DESC LIMIT 300`
        : await q`SELECT id, dibuat, diubah, jenis, kategori, paket_id, kode, no, usulan, pesan, konteks, halaman, email, status, catatan FROM laporan ORDER BY dibuat DESC LIMIT 300`;
      const jumlah = await q`SELECT status, count(*)::int AS n FROM laporan GROUP BY status`;
      return res.status(200).json({ laporan: rows.map((r) => ({ ...r, id: Number(r.id) })), jumlah: Object.fromEntries(jumlah.map((r) => [r.status, r.n])) });
    }
    if (req.method === "PATCH") {
      const b = await bodyJSON(req);
      const id = Number(b && b.id), status = String((b && b.status) || "");
      if (!Number.isInteger(id) || !STATUS.has(status)) return res.status(400).json({ message: "Data tidak valid." });
      const catatan = b.catatan == null ? null : String(b.catatan).slice(0, 1000);
      const r = await q`UPDATE laporan SET status = ${status}, catatan = COALESCE(${catatan}, catatan), diubah = now() WHERE id = ${id} RETURNING id`;
      return r.length ? res.status(200).json({ ok: true }) : res.status(404).json({ message: "Laporan tidak ditemukan." });
    }
    return res.status(405).json({ message: "Metode tidak didukung." });
  } catch (e) {
    console.error("laporan:", e && e.message);
    return res.status(503).json({ message: "Laporan gagal disimpan. Coba lagi sebentar lagi." });
  }
}
