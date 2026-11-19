# Repo Whetio

Situs statis (Vercel, auto-deploy dari `main`). Lihat README untuk struktur.

## Aturan tugas harian Siap Psikotes

- Soal verbal ditulis di luar repo (mis. `/tmp/verbal.json`), lalu terbitkan dengan `node scripts/buat-paket.mjs <YYYY-MM-DD> --verbal /tmp/verbal.json`. Jangan menulis `psikotes/paket/<tanggal>/soal.json` dengan tangan.
- Skrip harus lolos tanpa GAGAL. Jika gagal, perbaiki soal verbal lalu jalankan ulang; jangan melonggarkan aturan di `scripts/cek-verbal.mjs`.
- Jalankan `node scripts/uji-generator.mjs` sebelum menerbitkan; harus LOLOS.
- Jangan mengubah `assets/`, `api/`, `akun/`, `privasi/`, `index.html`, halaman lain, `data/`, `package.json`, atau `vercel.json` dalam tugas harian.
- Commit hanya `psikotes/paket/<tanggal>/` dan `psikotes/paket.json`, dengan pesan `Paket <d> <Bulan> <YYYY>`.
- Teks modul psikotes (milik Aorta UPKP, dilarang disebarluaskan) TIDAK boleh masuk ke repo ini. Soal ditulis orisinal.

## Akun & database (Neon)

- Login: Neon Managed Better Auth, dipanggil lewat proxy `api/auth-proxy.js` (`/api/auth-proxy/?jalur=<jalur>`) agar cookie sesi first-party.
- Progres: `api/progres.js` (GET/POST/DELETE) ke Neon Postgres lewat `DATABASE_URL`; tabel `profil`, `hasil`, `latihan` dibuat otomatis oleh `api/_lib.js`.
- Variabel lingkungan (`DATABASE_URL`, `NEON_AUTH_BASE_URL`) diisi integrasi Vercel–Neon. Jangan menaruh connection string di repo.
