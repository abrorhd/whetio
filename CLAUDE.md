# Repo Whetio

Situs statis (Vercel, auto-deploy dari `main`). Lihat README untuk struktur.

## Aturan tugas harian Siap Psikotes

- Soal verbal ditulis di luar repo (mis. `/tmp/verbal.json`), lalu terbitkan dengan `node scripts/buat-paket.mjs <YYYY-MM-DD> --verbal /tmp/verbal.json`. Jangan menulis `psikotes/paket/<tanggal>/soal.json` dengan tangan.
- Skrip harus lolos tanpa GAGAL. Jika gagal, perbaiki soal verbal lalu jalankan ulang; jangan melonggarkan aturan di `scripts/cek-verbal.mjs`.
- Jalankan `node scripts/uji-generator.mjs` sebelum menerbitkan; harus LOLOS.
- Jangan mengubah `assets/`, `index.html`, halaman lain, `data/`, atau `vercel.json` dalam tugas harian.
- Commit hanya `psikotes/paket/<tanggal>/` dan `psikotes/paket.json`, dengan pesan `Paket <d> <Bulan> <YYYY>`.
- Teks modul psikotes (milik Aorta UPKP, dilarang disebarluaskan) TIDAK boleh masuk ke repo ini. Soal ditulis orisinal.
