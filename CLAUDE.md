# Repo Whetio

Situs statis + fungsi /api. Hosting: Cloudflare Workers di https://whetio.com (`worker.js` + `server/adapter.js` menjalankan handler `api/*.js`; aset statis dari root, pengecualian di `.assetsignore`), auto-deploy dari `main`. `whetio.vercel.app` hanya pengalih. Lihat README untuk struktur.

## Aturan tugas harian Siap Psikotes

- Soal verbal ditulis di luar repo (mis. `/tmp/verbal.json`), lalu terbitkan dengan `node scripts/buat-paket.mjs <YYYY-MM-DD> --verbal /tmp/verbal.json`. Jangan menulis `psikotes/paket/<tanggal>/soal.json` dengan tangan.
- Skrip harus lolos tanpa GAGAL. Jika gagal, perbaiki soal verbal lalu jalankan ulang; jangan melonggarkan aturan di `scripts/cek-verbal.mjs`.
- Jalankan `node scripts/uji-generator.mjs` sebelum menerbitkan; harus LOLOS.
- Jangan mengubah `assets/`, `api/`, `akun/`, `akses/`, `admin/`, `privasi/`, `middleware.js`, `worker.js`, `server/`, `wrangler.jsonc`, `_headers`, `.assetsignore`, `index.html`, halaman lain, `data/`, `package.json`, atau `vercel.json` dalam tugas harian.
- Commit hanya `psikotes/paket/<tanggal>/` dan `psikotes/paket.json`, dengan pesan `Paket <d> <Bulan> <YYYY>`.
- Teks modul psikotes (milik Aorta UPKP, dilarang disebarluaskan) TIDAK boleh masuk ke repo ini. Soal ditulis orisinal.

## Akun & database (Neon)

- Login: Neon Managed Better Auth, dipanggil lewat proxy `api/auth-proxy.js` (`/api/auth-proxy/?jalur=<jalur>`) agar cookie sesi first-party.
- Laporan soal & kritik/saran: `api/laporan.js` (POST tamu boleh, 30/hari per sidik; GET/PATCH khusus email di env `ADMIN_EMAILS`), dibaca di `/admin/`.
- Akses Penuh (Rp10.000, s.d. 2 Des 2026): `api/bayar.js` (status, kode dua kata dari `api/_kode.js` mis. "pelatuk tajam", aktivasi manual admin, cek arsip), `api/trakteer.js` (webhook Trakteer, header `X-Webhook-Token`), `middleware.js` (soal.json arsip → 403 tanpa akses). Paywall aktif hanya bila env `TRAKTEER_WEBHOOK_TOKEN` dan `TRAKTEER_URL` diisi (`PAYWALL=off` untuk mematikan). Tabel `akses`, `pesanan`, `pembayaran`.
- Progres: `api/progres.js` (GET/POST/DELETE) ke Neon Postgres lewat `DATABASE_URL`; tabel `profil`, `hasil`, `latihan` dibuat otomatis oleh `api/_lib.js`.
- Variabel lingkungan diatur di Cloudflare (Worker whetio → Settings → Variables and Secrets). Jangan menaruh connection string di repo. Database Neon berada di organisasi yang dikelola integrasi Vercel: jangan uninstall integrasi Neon di Vercel.
