// Whetio di Cloudflare Workers: aset statis + fungsi /api/* (handler yang sama dengan versi Vercel).
import { jalankan } from "./server/adapter.js";
import { muatEnv } from "./api/_lib.js";
import authProxy from "./api/auth-proxy.js";
import progres from "./api/progres.js";
import laporan from "./api/laporan.js";
import bayar from "./api/bayar.js";
import trakteer from "./api/trakteer.js";

const API = { "auth-proxy": authProxy, progres, laporan, bayar, trakteer };
const json = (o, status) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export default {
  async fetch(request, env) {
    muatEnv(env);
    globalThis.__ASSETS = env.ASSETS;
    const url = new URL(request.url);
    if (url.hostname === "www.whetio.com") return Response.redirect(`https://whetio.com${url.pathname}${url.search}`, 301);

    const api = url.pathname.match(/^\/api\/([a-z-]+)\/?$/);
    if (api) {
      const h = API[api[1]];
      if (!h) return json({ message: "Tidak ditemukan." }, 404);
      const r = await jalankan(h, request);
      if (!r.headers.has("cache-control")) r.headers.set("cache-control", "no-store");
      return r;
    }

    // Paket arsip hanya untuk pemilik Akses Penuh (bila paywall aktif); keputusan dari /api/bayar/?cek=.
    const soal = url.pathname.match(/^\/psikotes\/paket\/(\d{4}-\d{2}-\d{2})\/soal\.json$/);
    if (soal) {
      try {
        const cek = new Request(new URL(`/api/bayar/?cek=${soal[1]}`, url.origin), { headers: { cookie: request.headers.get("cookie") || "" } });
        const d = await (await jalankan(bayar, cek)).json();
        if (d && d.boleh === false) return json({ message: "Paket arsip khusus Akses Penuh.", alasan: d.alasan || "akses" }, 403);
      } catch (e) { /* gagal memeriksa → teruskan */ }
    }
    return env.ASSETS.fetch(request);
  },
};
