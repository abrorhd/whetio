# Whetio

**Asah sedikit, tajam tiap hari.** Latihan ujian harian yang singkat, berwaktu, dan terukur.
Maskot: burung pelatuk — mematuk rutin, cepat, tepat sasaran.

Program pertama: **Siap Psikotes** (psikotes UPKP Kemenkeu 2026) di `/psikotes/`.

## Isi situs

| Path | Isi |
| --- | --- |
| `/` | Halaman depan Whetio |
| `/psikotes/` | Beranda Siap Psikotes: pilih tanggal ujian (30 Nov – 2 Des), paket hari ini, fokus latihan, progres |
| `/psikotes/paket/<tanggal>/` | Simulasi penuh 11 subtes (mode simulasi berwaktu / latihan bebas), tab Kunci dan Rekap |
| `/psikotes/latihan/` | Latihan bebas tanpa batas: pilih subtes, jumlah soal, tempo 150/100/80% |
| `/psikotes/metode/` | Metode belajar, teknik per subtes, panduan kepribadian, rencana harian sampai hari H |
| `/tip/` | Tip ke Admin buat beli kopi (GoPay) |
| `/akun/` | Daftar/masuk (email + password, verifikasi kode email), sinkron progres, keluar, hapus akun |
| `/privasi/` | Kebijakan privasi |

## Susunan paket simulasi penuh

| No | Subtes | Soal | Waktu | Batas/soal | Sumber soal |
| --- | --- | --- | --- | --- | --- |
| 1 | Logika Penalaran Instruksi | 20 | 14 mnt | 45 dtk | generator |
| 2 | Penalaran Silogisme | 24 | 20 mnt | 60 dtk | generator (dibuktikan lewat semua model Venn / tabel kebenaran) |
| 3 | Diagram Reasoning | 20 | 18 mnt | 60 dtk | generator SVG |
| 4 | Sinonim-Antonim | 30 | 10 mnt | 30 dtk | ditulis Claude tiap hari |
| 5 | Pengelompokan Kata | 25 | 8 mnt | 30 dtk | ditulis Claude tiap hari |
| 6 | Operasi Matematika | 20 | 12 mnt | 45 dtk | generator |
| 7 | Aritmatika Sosial | 20 | 12 mnt | 45 dtk | generator |
| 8 | Block Pattern | 30 | 4 mnt | 10 dtk | generator SVG |
| 9 | Visual Matching | 150 | 12,5 mnt | 5 dtk | generator SVG |
| 10 | Tes Penilaian Diri | 61 | 30 mnt | – | bank `data/kepribadian.json` (6 butir berulang + pasangan berlawanan) |
| 11 | Tes Kepribadian (Kantor & Lingkungan) | 68 | 40 mnt | – | bank `data/kepribadian.json` |

Generator memakai benih tanggal, jadi paket sebuah tanggal selalu sama. Kunci pilihan ganda diratakan A–E per subtes.

## Struktur kode

| Path | Isi |
| --- | --- |
| `assets/js/gen/*.js` | Generator per subtes + metadata (`index.js`); dipakai browser (latihan bebas) dan Node (penerbit paket) |
| `assets/js/kuis.js` | Mesin simulasi: timer subtes & per soal, 4 jenis jawaban, hasil, pembahasan, kunci, rekap |
| `assets/js/beranda.js`, `latihan.js`, `paket.js`, `rencana.js`, `merek.js` | Beranda, latihan bebas, pemuat paket, rencana belajar, logo & maskot |
| `scripts/buat-paket.mjs` | Terbitkan paket: `node scripts/buat-paket.mjs <YYYY-MM-DD> --verbal <verbal.json>` |
| `scripts/cek-verbal.mjs` | Validasi soal verbal (jumlah, format, tidak mengulang 7 paket terakhir, panjang kata tidak jadi petunjuk) |
| `scripts/uji-generator.mjs` | Uji tahan banting generator di banyak benih |

## Format soal verbal (`verbal.json`, di luar repo)

```json
[
  {"t":"SA","w":["KUNCI1","KUNCI2","pengecoh","pengecoh","pengecoh"],"r":"S","e":"pembahasan"},
  {"t":"PK","f":"L","q":["kata1","kata2","kata3"],"o":["KUNCI","pengecoh","pengecoh","pengecoh","pengecoh"],"g":"nama kelompok","e":"pembahasan"},
  {"t":"PK","f":"B","o":["KATA_PALING_BERBEDA","anggota","anggota","anggota","anggota"],"g":"nama kelompok","e":"pembahasan"}
]
```

30 SA (sinonim dan antonim masing-masing ≥12) + 25 PK (format L dan B masing-masing ≥10).

## Akun & database

- Neon (lewat Vercel Marketplace, region Singapura). Login memakai Neon Managed Better Auth; proxy `api/auth-proxy.js` membuat cookie sesi menjadi milik domain situs.
- `api/progres.js` menyimpan progres per pengguna (`profil`, `hasil` per paket×subtes, `latihan`). Progres tetap utama di browser; bila masuk, otomatis dikirim setiap subtes selesai dan ditarik saat membuka beranda/paket.
- Akses tabel hanya lewat fungsi server yang memeriksa sesi; `DATABASE_URL` tidak pernah dikirim ke browser.

## Deploy

Situs statis tanpa build. Repo terhubung ke Vercel (preset Other); setiap push ke `main` langsung terbit.
Laporan kunci keliru masuk sebagai issue berlabel `lapor-kunci` di repo ini.
