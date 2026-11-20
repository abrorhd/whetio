// Menjalankan handler bergaya Vercel/Node (req, res) di Cloudflare Workers (Request → Response).
export async function jalankan(handler, request) {
  const url = new URL(request.url);
  const headers = {};
  request.headers.forEach((v, k) => { headers[k] = v; });
  if (!headers["x-forwarded-for"] && headers["cf-connecting-ip"]) headers["x-forwarded-for"] = headers["cf-connecting-ip"];
  if (!headers["x-forwarded-host"]) headers["x-forwarded-host"] = url.host;
  let body;
  if (!["GET", "HEAD"].includes(request.method)) {
    const teks = await request.text();
    if ((headers["content-type"] || "").includes("application/json")) { try { body = teks ? JSON.parse(teks) : undefined; } catch { body = teks; } }
    else body = teks;
  }
  const req = { method: request.method, url: url.pathname + url.search, headers, body, socket: {}, async *[Symbol.asyncIterator]() {} };
  let status = 200, isi = null;
  const h = new Headers();
  const res = {
    setHeader(k, v) { if (Array.isArray(v)) { h.delete(k); v.forEach((x) => h.append(k, String(x))); } else h.set(k, String(v)); return res; },
    getHeader: (k) => h.get(k),
    status(n) { status = n; return res; },
    json(o) { if (!h.has("content-type")) h.set("content-type", "application/json; charset=utf-8"); isi = JSON.stringify(o); return res; },
    send(b) { isi = b; return res; },
    end(b) { isi = b ?? null; return res; },
  };
  await handler(req, res);
  const tanpaIsi = [101, 204, 205, 304].includes(status);
  return new Response(tanpaIsi || isi == null ? null : typeof isi === "string" || isi instanceof Uint8Array || isi instanceof ArrayBuffer ? isi : String(isi), { status, headers: h });
}
