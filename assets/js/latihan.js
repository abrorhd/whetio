// Latihan bebas: soal baru tanpa batas dari generator (atau bank verbal paket terbit), mode latihan atau tempo.
import { SUBTES, buatSubtes } from "./gen/index.js";
import { mulai, kepalaSitus } from "./kuis.js";
import { kaki } from "./beranda.js";
import { kirimLatihan } from "./sinkron.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const KOG = SUBTES.filter((s) => s.jenis !== "likert");
const LOG = "whetio:psikotes:drill";
const baca = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
const app = document.getElementById("app");
const q = new URLSearchParams(location.search);
let pil = { kode: KOG.some((s) => s.kode === q.get("s")) ? q.get("s") : "VM", n: "10", mode: q.get("mode") === "tempo" ? "t100" : "latihan" };
const MODE = [["latihan", "Latihan (tanpa timer)"], ["t150", "Tempo 150%"], ["t100", "Tempo 100%"], ["t80", "Tempo 80%"]];

function setelan() {
  const s = KOG.find((x) => x.kode === pil.kode);
  const nAsli = s.n;
  const log = (baca(LOG) || []).slice(-8).reverse();
  return kepalaSitus("latihan") + `<main class="wrap"><div class="pk-head"><h1>Latihan bebas</h1><div class="sub">Soal baru setiap kali mulai. Mode tempo memakai batas per soal = target × persentase, tanpa pembahasan sampai selesai.</div></div>
    <div class="panel"><h2>Subtes</h2><div class="tgl-uji">${KOG.map((x) => `<button class="chip" data-k="${x.kode}" aria-pressed="${pil.kode === x.kode}">${x.no}. ${esc(x.nama)}</button>`).join("")}</div>
    <h2 style="margin-top:14px">Jumlah soal</h2><div class="tgl-uji">${["10", "20", "asli"].map((n) => `<button class="chip" data-n="${n}" aria-pressed="${pil.n === n}">${n === "asli" ? `seperti ujian (${nAsli})` : n}</button>`).join("")}</div>
    <h2 style="margin-top:14px">Mode</h2><div class="tgl-uji">${MODE.map(([m, t]) => `<button class="chip" data-m="${m}" aria-pressed="${pil.mode === m}">${t}</button>`).join("")}</div>
    <p class="hint">Target tempo ${esc(s.nama)}: ${s.target} dtk/soal · batas ujian ${s.batas} dtk/soal${pil.mode.startsWith("t") ? ` · batas latihan ini ${Math.max(2, Math.round(s.target * Number(pil.mode.slice(1)) / 100))} dtk/soal` : ""}.</p>
    <div class="cta"><button class="btn spark" data-act="mulai">Mulai latihan</button></div></div>
    ${log.length ? `<div class="panel"><h2>Riwayat latihan bebas</h2><table class="tbl"><thead><tr><th>Subtes</th><th>Mode</th><th class="n">Benar</th><th class="n">dtk/soal</th></tr></thead><tbody>${log.map((d) => `<tr><td>${esc((KOG.find((x) => x.kode === d.kode) || {}).nama || d.kode)}</td><td>${esc(d.mode)}</td><td class="n">${d.b}/${d.n}</td><td class="n">${(d.dt || 0).toFixed(1)}</td></tr>`).join("")}</tbody></table></div>` : ""}
    </main>` + kaki();
}

async function bankVerbal(kode) {
  const list = await fetch("/psikotes/paket.json", { cache: "no-store" }).then((r) => r.json());
  const semua = [];
  for (const p of list.slice(0, 14)) {
    const d = await fetch(`/psikotes/paket/${p.id}/soal.json`).then((r) => r.json()).catch(() => null);
    if (d) d.subtes.filter((s) => s.kode === kode).forEach((s) => semua.push(...s.soal));
  }
  for (let i = semua.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [semua[i], semua[j]] = [semua[j], semua[i]]; }
  return semua;
}

async function mulaiLatihan() {
  const s = KOG.find((x) => x.kode === pil.kode);
  const n = pil.n === "asli" ? s.n : Number(pil.n);
  const tempo = pil.mode.startsWith("t") ? Number(pil.mode.slice(1)) / 100 : null;
  const batas = tempo ? Math.max(2, Math.round(s.target * tempo)) : s.batas;
  let isi;
  if (s.kode === "SA" || s.kode === "PK") { const b = await bankVerbal(s.kode); isi = { soal: b.slice(0, n) }; }
  else isi = buatSubtes(s.kode, "latihan-" + Date.now() + "-" + Math.random(), n);
  const sub = { kode: s.kode, no: s.no, nama: s.nama, n: isi.soal.length, durasi: tempo ? isi.soal.length * batas : s.durasi, batas, target: s.target, jenis: s.jenis, ...isi };
  const paket = { id: "latihan", judul: `Latihan bebas · ${s.nama}`, subjudul: `${sub.n} soal · ${MODE.find((m) => m[0] === pil.mode)[1]}`, jumlah: sub.n, subtes: [sub] };
  const wadah = document.createElement("div");
  app.replaceWith(wadah); wadah.id = "app";
  mulai(wadah, paket, {
    kunci: null, langsung: s.kode, modeAwal: tempo ? "simulasi" : "latihan",
    kembali: { href: "/psikotes/latihan/?s=" + s.kode + "&mode=" + (tempo ? "tempo" : "latihan"), teks: "Atur latihan" },
    drill: (kode, nilai) => {
      const log = baca(LOG) || [];
      const rec = { kode, n: nilai.n, b: nilai.b, k: nilai.k, dt: Math.round(nilai.dt * 10) / 10, mode: MODE.find((m) => m[0] === pil.mode)[1], t: Date.now() };
      log.push(rec); kirimLatihan(rec);
      try { localStorage.setItem(LOG, JSON.stringify(log.slice(-200))); } catch (e) {}
    },
  });
}

function render() { app.innerHTML = setelan(); }
app.addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.k) pil.kode = b.dataset.k;
  if (b.dataset.n) pil.n = b.dataset.n;
  if (b.dataset.m) pil.mode = b.dataset.m;
  if (b.dataset.act === "mulai") { b.disabled = true; b.textContent = "Menyiapkan soal…"; mulaiLatihan(); return; }
  render();
});
render();
