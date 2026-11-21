// Akses Penuh: status, kode pembayaran, pengecekan arsip, dan tindakan admin.
// GET  /api/bayar/                 → { aktif, harga, sampai, tautan, masuk, penuh, berlaku_sampai, kode }
// GET  /api/bayar/?cek=YYYY-MM-DD   → { boleh }  (dipakai middleware untuk paket arsip)
// GET  /api/bayar/?admin=1&status=  → daftar pembayaran (khusus admin)
// POST /api/bayar/ { aksi:"kode" }  → buat/ambil kode pembayaran milik pengguna
// POST /api/bayar/ { aksi:"klaim", nama, waktu, catatan? } → "sudah bayar tapi lupa kode" (masuk ke admin)
// POST /api/bayar/ { aksi:"aktifkan", pembayaran_id?, tujuan:"pelatuk tajam"|email } → aktifkan manual (admin)
// POST /api/bayar/ { aksi:"tandai", pembayaran_id, status } → ubah status pembayaran (admin)
import { sql, pastikanSkema, penggunaDari, bodyJSON, adalahAdmin, aksesDari, berikanAkses, paywallAktif, HARGA, BERLAKU_SAMPAI, TRAKTEER_URL } from "./_lib.js";

import { kodeBaru, calonKode } from "./_kode.js";
const TGL = /^\d{4}-\d{2}-\d{2}$/;
const STATUS = new Set(["cocok", "manual", "tak-cocok", "kurang", "abaikan"]);
let manifes = { t: 0, terbaru: null };

async function paketTerbaru(req) {
  if (Date.now() - manifes.t < 60_000 && manifes.terbaru) return manifes.terbaru;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const alamat = `https://${host || "whetio"}/psikotes/paket.json`;
  // Di Cloudflare, baca langsung dari aset statis (tanpa memanggil domain sendiri).
  const list = await (globalThis.__ASSETS ? globalThis.__ASSETS.fetch(new Request(alamat)) : fetch(alamat, { cache: "no-store" })).then((r) => r.json());
  manifes = { t: Date.now(), terbaru: list.map((p) => p.id).sort().pop() || null };
  return manifes.terbaru;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const url = new URL(req.url, "http://x");
  const aktif = paywallAktif();
  let u = null;
  try { u = await penggunaDari(req); } catch (e) { console.error("sesi:", e && e.message); }
  try {
    // Pengecekan arsip oleh middleware: gagal → tetap izinkan (jangan sampai pembeli terkunci karena gangguan).
    const cek = url.searchParams.get("cek");
    if (req.method === "GET" && cek !== null) {
      if (!aktif || !TGL.test(cek)) return res.status(200).json({ boleh: true });
      const terbaru = await paketTerbaru(req).catch(() => null);
      if (!terbaru || cek >= terbaru) return res.status(200).json({ boleh: true });
      if (!u) return res.status(200).json({ boleh: false, alasan: "masuk" });
      await pastikanSkema();
      return res.status(200).json({ boleh: !!(await aksesDari(sql(), u)), alasan: "akses" });
    }
    await pastikanSkema();
    const q = sql();

    if (req.method === "GET" && url.searchParams.get("admin")) {
      if (!adalahAdmin(u)) return res.status(u ? 403 : 401).json({ message: u ? "Akun ini bukan admin." : "Silakan masuk dengan akun admin." });
      const st = url.searchParams.get("status");
      const rows = STATUS.has(st)
        ? await q`SELECT id, dibuat, nominal, nama, pesan, kode, status, data FROM pembayaran WHERE status = ${st} ORDER BY dibuat DESC LIMIT 300`
        : await q`SELECT id, dibuat, nominal, nama, pesan, kode, status, data FROM pembayaran ORDER BY dibuat DESC LIMIT 300`;
      const jumlah = await q`SELECT status, count(*)::int AS n FROM pembayaran GROUP BY status`;
      const [{ n: aksesAktif }] = await q`SELECT count(*)::int AS n FROM akses WHERE berlaku_sampai > now()`;
      // Bahan pencocokan manual: kode yang diambil tapi belum dibayar, dan klaim "lupa kode".
      const menunggu = await q`SELECT p.kode, p.email, p.dibuat FROM pesanan p WHERE p.status = 'menunggu'
        AND NOT EXISTS (SELECT 1 FROM akses a WHERE a.user_id = p.user_id AND a.berlaku_sampai > now()) ORDER BY p.dibuat DESC LIMIT 200`;
      const klaim = await q`SELECT l.id, l.dibuat, l.email, l.pesan, l.konteks, l.status FROM laporan l WHERE l.kategori = 'bayar' AND l.status IN ('baru', 'ditinjau')
        AND NOT EXISTS (SELECT 1 FROM akses a WHERE a.user_id = l.user_id AND a.berlaku_sampai > now()) ORDER BY l.dibuat DESC LIMIT 100`;
      return res.status(200).json({ aktif, pembayaran: rows, jumlah: Object.fromEntries(jumlah.map((r) => [r.status, r.n])), aksesAktif, menunggu, klaim });
    }

    if (req.method === "GET") {
      const dasar = { aktif, harga: HARGA, sampai: BERLAKU_SAMPAI, tautan: TRAKTEER_URL || null, masuk: !!u };
      if (!u) return res.status(200).json(dasar);
      const a = await aksesDari(q, u);
      const [p] = await q`SELECT kode FROM pesanan WHERE user_id = ${u.id} AND status = 'menunggu' AND kode NOT LIKE 'WH-%' ORDER BY dibuat DESC LIMIT 1`;
      return res.status(200).json({ ...dasar, penuh: !aktif || !!a, berlaku_sampai: a ? a.sampai : null, kode: p ? p.kode : null });
    }

    if (req.method === "POST") {
      const b = (await bodyJSON(req)) || {};
      if (b.aksi === "kode") {
        if (!u) return res.status(401).json({ message: "Silakan masuk terlebih dahulu." });
        if (!aktif) return res.status(409).json({ message: "Pembayaran belum dibuka." });
        const [ada] = await q`SELECT kode FROM pesanan WHERE user_id = ${u.id} AND status = 'menunggu' AND kode NOT LIKE 'WH-%' ORDER BY dibuat DESC LIMIT 1`;
        if (ada) return res.status(200).json({ kode: ada.kode });
        for (let i = 0; i < 25; i++) {
          const kode = kodeBaru();
          const r = await q`INSERT INTO pesanan (kode, user_id, email) VALUES (${kode}, ${u.id}, ${u.email}) ON CONFLICT (kode) DO NOTHING RETURNING kode`;
          if (r.length) return res.status(200).json({ kode });
        }
        return res.status(503).json({ message: "Gagal membuat kode. Coba lagi." });
      }
      if (b.aksi === "klaim") {
        if (!u) return res.status(401).json({ message: "Silakan masuk terlebih dahulu." });
        const nama = String(b.nama || "").trim().slice(0, 120), wkt = String(b.waktu || "").trim().slice(0, 40), cat = String(b.catatan || "").trim().slice(0, 500);
        if (!nama || !wkt) return res.status(400).json({ message: "Isi nama di Trakteer dan perkiraan waktu bayar." });
        const [{ n }] = await q`SELECT count(*)::int AS n FROM laporan WHERE kategori = 'bayar' AND user_id = ${u.id} AND dibuat > now() - interval '1 day'`;
        if (n >= 3) return res.status(429).json({ message: "Klaim sudah terkirim. Admin akan segera mengecek." });
        const pesan = `Sudah bayar tapi lupa kode. Nama di Trakteer: ${nama}. Waktu bayar: ${wkt}.${cat ? " Catatan: " + cat : ""}`;
        await q`INSERT INTO laporan (jenis, kategori, pesan, konteks, halaman, user_id, email)
          VALUES ('umum', 'bayar', ${pesan}, ${JSON.stringify({ nama_trakteer: nama, waktu_bayar: wkt })}::jsonb, '/akses/', ${u.id}, ${u.email})`;
        return res.status(200).json({ ok: true });
      }
      if (!adalahAdmin(u)) return res.status(u ? 403 : 401).json({ message: "Khusus admin." });
      if (b.aksi === "aktifkan") {
        const tujuan = String(b.tujuan || "").trim();
        let target = null;
        const calon = tujuan.includes("@") ? [] : calonKode(tujuan);
        if (calon.length) [target] = await q`SELECT user_id, email FROM pesanan WHERE kode = ANY(${calon}) ORDER BY (status = 'menunggu') DESC, dibuat DESC LIMIT 1`;
        if (!target && tujuan.includes("@")) {
          [target] = await q`SELECT user_id, email FROM pesanan WHERE lower(email) = lower(${tujuan}) ORDER BY dibuat DESC LIMIT 1`;
          if (!target) [target] = await q`SELECT user_id, email FROM profil WHERE lower(email) = lower(${tujuan}) LIMIT 1`;
          if (!target) [target] = await q`SELECT user_id, email FROM laporan WHERE user_id IS NOT NULL AND lower(email) = lower(${tujuan}) ORDER BY dibuat DESC LIMIT 1`;
        }
        if (!target) return res.status(404).json({ message: "Kode atau email tidak ditemukan. Pengguna perlu masuk ke Whetio dan membuka halaman Akses Penuh sekali." });
        const pid = b.pembayaran_id ? String(b.pembayaran_id) : null;
        await berikanAkses(q, target.user_id, target.email, "manual", pid);
        await q`UPDATE pesanan SET status = 'lunas', dibayar = now(), pembayaran_id = ${pid} WHERE user_id = ${target.user_id} AND status = 'menunggu'`;
        if (pid) await q`UPDATE pembayaran SET status = 'manual', user_id = ${target.user_id}, diubah = now() WHERE id = ${pid}`;
        await q`UPDATE laporan SET status = 'selesai', catatan = 'Akses Penuh diaktifkan manual', diubah = now() WHERE kategori = 'bayar' AND user_id = ${target.user_id} AND status IN ('baru', 'ditinjau')`;
        return res.status(200).json({ ok: true, email: target.email });
      }
      if (b.aksi === "tandai") {
        const st = String(b.status || "");
        if (!STATUS.has(st) || !b.pembayaran_id) return res.status(400).json({ message: "Data tidak valid." });
        await q`UPDATE pembayaran SET status = ${st}, diubah = now() WHERE id = ${String(b.pembayaran_id)}`;
        return res.status(200).json({ ok: true });
      }
      return res.status(400).json({ message: "Aksi tidak dikenal." });
    }
    return res.status(405).json({ message: "Metode tidak didukung." });
  } catch (e) {
    console.error("bayar:", e && e.message);
    if (url.searchParams.get("cek") !== null) return res.status(200).json({ boleh: true });
    return res.status(503).json({ message: "Layanan pembayaran sedang bermasalah. Coba lagi sebentar lagi." });
  }
}
