// Penyimpanan progres pengguna di Neon Postgres.
// GET  /api/progres/?sejak=<ms>   → { email, profil, hasil:[{paket_id,kode,data,t}], latihan:[{t,data}], waktu }
// POST /api/progres/  { profil?:{tgl_ujian}, hasil?:[{paket_id,kode,data,t}], latihan?:[{t,data}] } → upsert (yang lebih baru menang)
// DELETE /api/progres/ → hapus seluruh data progres pengguna (laporan yang pernah dikirim dianonimkan)
import { sql, pastikanSkema, penggunaDari, bodyJSON } from "./_lib.js";

const PAKET = /^(\d{4}-\d{2}-\d{2}|latihan)$/;
const KODE = /^[A-Z]{2,4}$/;
const TGL = /^\d{4}-\d{2}-\d{2}$/;
const MAKS_BARIS = 60, MAKS_DATA = 60 * 1024, MAKS_BODY = 900 * 1024;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  let u;
  try { u = await penggunaDari(req); } catch (e) { console.error("sesi:", e && e.message); return res.status(502).json({ message: "Gagal memeriksa sesi." }); }
  if (!u) return res.status(401).json({ message: "Silakan masuk terlebih dahulu." });
  try {
    await pastikanSkema();
    const q = sql();
    if (req.method === "GET") {
      const sejak = Number(new URL(req.url, "http://x").searchParams.get("sejak")) || 0;
      const waktu = Date.now();
      const [profil] = await q`SELECT tgl_ujian::text AS tgl_ujian FROM profil WHERE user_id = ${u.id}`;
      const hasil = sejak
        ? await q`SELECT paket_id, kode, data, t FROM hasil WHERE user_id = ${u.id} AND diubah > to_timestamp(${sejak / 1000})`
        : await q`SELECT paket_id, kode, data, t FROM hasil WHERE user_id = ${u.id}`;
      const latihan = sejak
        ? await q`SELECT t, data FROM latihan WHERE user_id = ${u.id} AND diubah > to_timestamp(${sejak / 1000}) ORDER BY t`
        : await q`SELECT t, data FROM latihan WHERE user_id = ${u.id} ORDER BY t DESC LIMIT 200`;
      const tgl = profil && profil.tgl_ujian ? String(profil.tgl_ujian).slice(0, 10) : null;
      return res.status(200).json({ email: u.email, profil: { tgl_ujian: tgl }, hasil: hasil.map((r) => ({ ...r, t: Number(r.t) })), latihan: latihan.map((r) => ({ ...r, t: Number(r.t) })), waktu });
    }
    if (req.method === "POST") {
      const b = await bodyJSON(req);
      if (!b || typeof b !== "object") return res.status(400).json({ message: "Format data tidak valid." });
      if (JSON.stringify(b).length > MAKS_BODY) return res.status(413).json({ message: "Data terlalu besar." });
      const hasil = Array.isArray(b.hasil) ? b.hasil : [], latihan = Array.isArray(b.latihan) ? b.latihan : [];
      if (hasil.length > MAKS_BARIS || latihan.length > 200) return res.status(413).json({ message: "Terlalu banyak baris dalam satu kiriman." });
      const ops = [];
      const tgl = b.profil && TGL.test(String(b.profil.tgl_ujian || "")) ? b.profil.tgl_ujian : null;
      ops.push(q`INSERT INTO profil (user_id, email, tgl_ujian) VALUES (${u.id}, ${u.email}, ${tgl})
        ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, tgl_ujian = COALESCE(EXCLUDED.tgl_ujian, profil.tgl_ujian), diubah = now()`);
      for (const h of hasil) {
        const s = JSON.stringify(h && h.data);
        const t = Number(h && h.t);
        if (!PAKET.test(String(h.paket_id)) || !KODE.test(String(h.kode)) || !s || s.length > MAKS_DATA || !Number.isFinite(t)) continue;
        ops.push(q`INSERT INTO hasil (user_id, paket_id, kode, data, t) VALUES (${u.id}, ${h.paket_id}, ${h.kode}, ${s}::jsonb, ${t})
          ON CONFLICT (user_id, paket_id, kode) DO UPDATE SET data = EXCLUDED.data, t = EXCLUDED.t, diubah = now() WHERE hasil.t <= EXCLUDED.t`);
      }
      for (const l of latihan) {
        const s = JSON.stringify(l && l.data), t = Number(l && l.t);
        if (!s || s.length > 4096 || !Number.isFinite(t)) continue;
        ops.push(q`INSERT INTO latihan (user_id, t, data) VALUES (${u.id}, ${t}, ${s}::jsonb) ON CONFLICT (user_id, t) DO NOTHING`);
      }
      await q.transaction(ops);
      return res.status(200).json({ ok: true, hasil: ops.length - 1 - latihan.length, waktu: Date.now() });
    }
    if (req.method === "DELETE") {
      await q.transaction([q`DELETE FROM hasil WHERE user_id = ${u.id}`, q`DELETE FROM latihan WHERE user_id = ${u.id}`, q`DELETE FROM profil WHERE user_id = ${u.id}`, q`UPDATE laporan SET user_id = NULL, email = NULL WHERE user_id = ${u.id}`,
        q`DELETE FROM akses WHERE user_id = ${u.id}`, q`UPDATE pesanan SET email = NULL WHERE user_id = ${u.id}`, q`UPDATE pembayaran SET user_id = NULL WHERE user_id = ${u.id}`]);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ message: "Metode tidak didukung." });
  } catch (e) {
    console.error("progres:", e && e.message);
    return res.status(503).json({ message: "Database sedang bermasalah. Progres tetap tersimpan di browser ini." });
  }
}
