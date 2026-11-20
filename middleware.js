// Paket arsip (bukan paket terbaru) hanya untuk pemilik Akses Penuh, bila paywall aktif.
// Keputusan diambil oleh /api/bayar/?cek=<tanggal>; bila gagal, permintaan diteruskan.
export const config = { matcher: ["/psikotes/paket/:tanggal/soal.json"] };

export default async function middleware(request) {
  const url = new URL(request.url);
  const m = url.pathname.match(/^\/psikotes\/paket\/(\d{4}-\d{2}-\d{2})\/soal\.json$/);
  if (!m) return;
  try {
    const r = await fetch(new URL(`/api/bayar/?cek=${m[1]}`, url.origin), { headers: { cookie: request.headers.get("cookie") || "" } });
    const d = await r.json();
    if (d && d.boleh === false) {
      return new Response(JSON.stringify({ message: "Paket arsip khusus Akses Penuh.", alasan: d.alasan || "akses" }), {
        status: 403, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
    }
  } catch (e) { /* teruskan */ }
}
