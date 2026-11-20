// Beranda Siap Psikotes: tanggal ujian, paket hari ini, fokus latihan, progres, daftar paket.
import { SUBTES, KODE } from "./gen/index.js";
import { kepalaSitus, KUNCI_RINGKAS } from "./kuis.js";
import { pelatuk } from "./merek.js";
import { tarik, akun } from "./sinkron.js";
import { tingkat, ajakMasuk, ajakBuka, batasSesi } from "./gerbang.js";
import { muatAkses, paywall } from "./akses.js";
import { PILIHAN_TGL, tglUjian, setTglUjian, sisaHari, fase, teksTgl } from "./rencana.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const baca = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
const KOG = SUBTES.filter((s) => s.jenis !== "likert");
const app = document.getElementById("app");

function hero() {
  const t = tglUjian(), h = sisaHari(t), f = fase(h);
  const hitung = t == null ? "Pilih tanggal psikotes Anda:" : h > 0 ? `H-${h} menuju psikotes · ${teksTgl(t)}` : h === 0 ? "Hari ini psikotes. Tenang dan tajam!" : `Psikotes ${teksTgl(t)} sudah lewat`;
  return `<section class="hero"><div><span class="slogan">Asah sedikit, tajam tiap hari.</span><h1>Siap Psikotes</h1>
    <p class="lead">Simulasi penuh psikotes UPKP setiap pagi — 11 subtes, jumlah soal dan waktu seperti aslinya — plus latihan bebas${paywall() ? "" : " tanpa batas"} untuk mengejar tempo.</p>
    <div class="hitung" id="hitung">${hitung}</div>
    <div class="tgl-uji" role="group" aria-label="Tanggal psikotes">${PILIHAN_TGL.map(([v, l]) => `<button class="chip" data-tgl="${v}" aria-pressed="${t === v}">${l}</button>`).join("")}</div>
    ${f ? `<div class="panel" style="margin-top:6px"><b>${esc(f.judul)}</b><ul style="margin:6px 0 0;padding-left:18px">${f.tugas.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><a class="hint" href="/psikotes/metode/">Lihat rencana lengkap &rarr;</a></div>` : ""}
    </div>${pelatuk("ramah", "anim-masuk")}</section>`;
}

function statusPaket(p) {
  const st = baca(p.kunci), hs = (st && st.hasil) || {};
  const sel = Object.values(hs).filter((x) => x && x.selesai).length;
  return { sel, total: Object.keys(p.subtes).length };
}

function ringkasPerSubtes() {
  const semua = baca(KUNCI_RINGKAS) || {}, drill = baca("whetio:psikotes:drill") || [];
  const per = {};
  Object.entries(semua).sort(([a], [b]) => (a < b ? -1 : 1)).forEach(([id, x]) => Object.entries(x).forEach(([k, v]) => { if (v.b != null) (per[k] = per[k] || []).push({ ...v, sumber: id }); }));
  drill.forEach((d) => (per[d.kode] = per[d.kode] || []).push({ b: d.b, n: d.n, dt: d.dt, k: d.k || 0, t: d.t, sumber: "latihan" }));
  Object.values(per).forEach((xs) => xs.sort((a, b) => a.t - b.t));
  return per;
}

function fokus(per) {
  const skor = KOG.map((s) => {
    const xs = (per[s.kode] || []).slice(-3);
    if (!xs.length) return { s, nilai: 2, alasan: "belum pernah dicoba" };
    const ak = xs.reduce((a, x) => a + x.b, 0) / xs.reduce((a, x) => a + x.n, 0);
    const dt = xs.reduce((a, x) => a + (x.dt || 0), 0) / xs.length;
    const tempo = dt / s.target;
    return { s, nilai: (1 - ak) * 2 + Math.max(0, tempo - 1), ak, dt, alasan: `${Math.round(ak * 100)}% benar · ${dt.toFixed(1)} dtk/soal (target ${s.target})`, mode: ak < 0.75 ? "latihan" : "tempo" };
  }).sort((a, b) => b.nilai - a.nilai);
  return skor.slice(0, 3);
}

function render(list) {
  const per = ringkasPerSubtes(), adaData = Object.keys(per).length > 0;
  let h = kepalaSitus("psikotes") + '<main class="wrap">' + hero() + (tingkat() === "tamu" ? ajakMasuk("Silakan masuk untuk menyimpan progres belajar psikotes.", `Tanpa akun Anda tetap bisa latihan gratis: paket hari ini dan ${batasSesi()} sesi latihan bebas per hari. Masuk untuk menyimpan progres di semua perangkat.`) : tingkat() === "gratis" ? ajakBuka() : "");
  const kini = list[0];
  if (kini) {
    const s = statusPaket(kini);
    h += `<div class="panel"><h2>Paket hari ini · ${esc(kini.judul)}</h2><p class="hint" style="margin:0 0 8px">${Object.keys(kini.subtes).length} subtes · ${kini.jumlah} butir · ${s.sel ? `${s.sel}/${s.total} subtes selesai` : "belum dimulai"}</p>
      <div class="bar-prog"><i style="width:${pct(s.sel, s.total)}%"></i></div><div class="cta" style="margin-top:12px"><a class="btn spark" href="/psikotes/paket/${kini.id}/">${s.sel ? (s.sel >= s.total ? "Lihat hasil" : "Lanjutkan simulasi") : "Mulai simulasi penuh"}</a><a class="btn" href="/psikotes/latihan/">Latihan bebas</a></div></div>`;
  }
  const fk = fokus(per);
  h += `<div class="panel"><h2>Fokus hari ini</h2>${adaData ? "" : '<p class="hint">Belum ada data. Kerjakan simulasi penuh pertama sebagai diagnostik; setelah itu bagian ini menunjukkan subtes yang paling perlu diasah.</p>'}
    <div class="kartu-grid">${fk.map((x) => `<a class="kartu" href="/psikotes/latihan/?s=${x.s.kode}&mode=${x.mode || "latihan"}"><span class="tag ${x.mode === "tempo" ? "spark" : ""}">${x.mode === "tempo" ? "drill tempo" : "drill latihan"}</span><b>${esc(x.s.nama)}</b><p>${esc(x.alasan)}</p></a>`).join("")}</div></div>`;
  if (adaData) {
    h += `<div class="panel"><h2>Progres per subtes</h2><table class="tbl"><thead><tr><th>Subtes</th><th class="n">Terakhir</th><th class="n">dtk/soal</th><th class="n">Target</th></tr></thead><tbody>${KOG.map((s) => {
      const xs = per[s.kode] || [], x = xs[xs.length - 1], y = xs[xs.length - 2];
      if (!x) return `<tr><td>${s.no}. ${esc(s.nama)}</td><td class="n" colspan="3"><span class="hint">belum</span></td></tr>`;
      const p = pct(x.b, x.n), arah = y ? (p > pct(y.b, y.n) ? " ▲" : p < pct(y.b, y.n) ? " ▼" : "") : "";
      return `<tr><td>${s.no}. ${esc(s.nama)}<div class="meter"><i style="width:${p}%"></i></div></td><td class="n">${p}%${arah}</td><td class="n${x.dt > s.target ? " no-t" : " ok-t"}">${(x.dt || 0).toFixed(1)}</td><td class="n">${s.target}</td></tr>`;
    }).join("")}</tbody></table><p class="hint">Dari simulasi dan latihan bebas di browser ini. Merah = lebih lambat dari target tempo.</p></div>`;
  }
  h += `<h2 style="font-size:18px;margin:22px 0 10px">Semua paket</h2><div class="pk-list">${list.map((p, i) => {
    const s = statusPaket(p), r = (baca(KUNCI_RINGKAS) || {})[p.id] || {};
    if (i > 0 && tingkat() === "tamu") return `<a class="pk terkunci" href="/akun/?lanjut=${encodeURIComponent("/psikotes/paket/" + p.id + "/")}"><span class="t">${esc(p.judul)}</span><span class="mono">🔒</span><span class="s">Masuk untuk membuka arsip paket</span></a>`;
    if (i > 0 && tingkat() === "gratis") return `<a class="pk terkunci" href="/akses/"><span class="t">${esc(p.judul)}</span><span class="mono">🔒</span><span class="s">Khusus Akses Penuh</span></a>`;
    let b = 0, n = 0; Object.values(r).forEach((x) => { if (x.b != null) { b += x.b; n += x.n; } });
    return `<a class="pk" href="/psikotes/paket/${p.id}/"><span class="t">${esc(p.judul)}</span><span class="mono">${s.sel}/${s.total}</span><span class="s">${p.jumlah} butir${n ? ` · kognitif ${b}/${n} benar (${pct(b, n)}%)` : ""}</span><span class="bar-prog"><i style="width:${pct(s.sel, s.total)}%"></i></span></a>`;
  }).join("") || '<p class="hint">Belum ada paket.</p>'}</div>
  <p class="foot">Paket baru terbit setiap pagi sekitar pukul 04.00 WITA sampai 2 Desember 2026. Progres tersimpan di browser yang Anda pakai.</p></main>` + kaki();
  app.innerHTML = h;
}
export function kaki() {
  return `<footer class="situs"><div class="wrap">Whetio · Asah sedikit, tajam tiap hari. · Soal disusun orisinal mengikuti format psikotes UPKP; bukan materi resmi BPPK. · <button type="button" class="tautan" data-saran>Kritik &amp; saran</button> · <a href="/tip/">Tip ke Admin buat beli kopi</a> · <a href="/privasi/">Privasi</a></div></footer>`;
}

if (app && app.dataset.halaman === "beranda") {
  app.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tgl]"); if (!b) return;
    setTglUjian(b.dataset.tgl); muatUlang();
  });
  let LIST = [];
  const muatUlang = () => render(LIST);
  fetch("/psikotes/paket.json", { cache: "no-store" }).then((r) => r.json()).then((l) => { LIST = l; render(l); tarik().then((n) => { if (n) render(LIST); }); muatAkses().then(() => render(LIST)); })
    .catch(() => { render([]); });
}
