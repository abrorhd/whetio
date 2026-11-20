// Webhook Trakteer → aktifkan Akses Penuh.
// Daftarkan di Trakteer (Integrasi → Webhook): https://whetio.com/api/trakteer/
// Keaslian dicek lewat header X-Webhook-Token = env TRAKTEER_WEBHOOK_TOKEN.
// Pembeli menulis kode WH-XXXXX di pesan dukungan; nominal minimal HARGA.
import { createHash, timingSafeEqual } from "node:crypto";
import { sql, pastikanSkema, bodyJSON, berikanAkses, HARGA } from "./_lib.js";

const sama = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); };
// "Rp 10.000" / "10000" / 10000 → 10000
const angka = (v) => typeof v === "number" ? Math.round(v) : typeof v === "string" && /\d/.test(v) ? Number(v.replace(/,\d{1,2}$/, "").replace(/[^\d]/g, "")) : null;

export function uraikan(body) {
  const d = body && typeof body === "object" && body.data && typeof body.data === "object" ? body.data : body || {};
  const pesan = String(d.supporter_message ?? d.message ?? "").slice(0, 500);
  let nominal = angka(d.price ?? d.amount ?? d.total ?? d.gross_amount);
  const qty = angka(d.quantity), satuan = angka(d.unit_price ?? d.price_per_unit);
  if (qty && satuan) nominal = qty * satuan;
  const id = String(d.transaction_id ?? d.order_id ?? d.id ?? "").slice(0, 100)
    || "h-" + createHash("sha256").update(JSON.stringify(body)).digest("hex").slice(0, 24);
  const kode = (pesan.toUpperCase().match(/WH\s*-?\s*([A-HJ-NP-Z2-9]{5})\b/) || [])[1];
  return { id, nama: String(d.supporter_name ?? "").slice(0, 120), pesan, nominal, kode: kode ? "WH-" + kode : null, jenis: String(d.type ?? body.type ?? "") };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ message: "Gunakan POST." });
  const token = process.env.TRAKTEER_WEBHOOK_TOKEN;
  if (!token || !sama(req.headers["x-webhook-token"] || "", token)) return res.status(401).json({ message: "Token tidak valid." });
  const body = await bodyJSON(req);
  if (!body) return res.status(400).json({ message: "Body tidak valid." });
  const b = uraikan(body);
  try {
    await pastikanSkema();
    const q = sql();
    const baru = await q`INSERT INTO pembayaran (id, sumber, nominal, nama, pesan, kode, status, data)
      VALUES (${b.id}, 'trakteer', ${b.nominal}, ${b.nama}, ${b.pesan}, ${b.kode}, 'tak-cocok', ${JSON.stringify(body)}::jsonb)
      ON CONFLICT (id) DO NOTHING RETURNING id`;
    if (!baru.length) return res.status(200).json({ ok: true, ulang: true });
    const [p] = b.kode ? await q`SELECT kode, user_id, email, status FROM pesanan WHERE kode = ${b.kode}` : [];
    if (!p) return res.status(200).json({ ok: true, status: "tak-cocok" });
    if (b.nominal == null || b.nominal < HARGA) {
      await q`UPDATE pembayaran SET status = 'kurang', user_id = ${p.user_id}, diubah = now() WHERE id = ${b.id}`;
      return res.status(200).json({ ok: true, status: "kurang" });
    }
    await berikanAkses(q, p.user_id, p.email, "trakteer", b.id);
    await q`UPDATE pesanan SET status = 'lunas', dibayar = now(), pembayaran_id = ${b.id} WHERE kode = ${p.kode}`;
    await q`UPDATE pembayaran SET status = 'cocok', user_id = ${p.user_id}, diubah = now() WHERE id = ${b.id}`;
    return res.status(200).json({ ok: true, status: "cocok" });
  } catch (e) {
    console.error("trakteer:", e && e.message);
    return res.status(500).json({ message: "Gagal memproses." });   // Trakteer akan mencoba lagi bila mendukung
  }
}
