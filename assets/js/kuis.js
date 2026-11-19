// Mesin simulasi & latihan psikotes Whetio. Dipakai halaman paket (/psikotes/paket/<tgl>/) dan latihan bebas.
import { KODE as META } from "./gen/index.js";
import { logo, pelatuk } from "./merek.js";
import { akun, kirimHasil } from "./sinkron.js";

const SKALA = ["Sangat tidak menggambarkan", "Tidak menggambarkan", "Agak menggambarkan", "Menggambarkan", "Sangat menggambarkan"];
const HURUF = "ABCDEF";
const REPO_ISSUE = "https://github.com/abrorhd/whetio/issues/new";
export const KUNCI_RINGKAS = "whetio:psikotes:ringkas";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const polos = (h) => String(h).replace(/<svg[\s\S]*?<\/svg>/g, "[gambar]").replace(/<td>/g, " ").replace(/<\/tr>/g, " / ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const fmtDetik = (x) => (x >= 60 ? `${Math.floor(x / 60)}:${String(Math.round(x % 60)).padStart(2, "0")}` : `${Math.round(x)} dtk`);
const jamStr = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
function baca(k) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
function tulis(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
let kbAktif = null; // satu pendengar papan ketik per halaman

export function kepalaSitus(aktif) {
  const nav = [["/psikotes/", "Siap Psikotes", "psikotes"], ["/psikotes/latihan/", "Latihan", "latihan"], ["/psikotes/metode/", "Metode", "metode"], ["/tip/", "Tip", "tip"], ["/akun/", akun() ? "Akun ✓" : "Masuk", "akun"]];
  return `<header class="topbar"><div class="wrap"><a class="merek" href="/">${logo(34)}<span>Whetio</span></a><nav>${nav.map(([h, t, k]) => `<a href="${h}"${k === aktif ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</nav></div></header>`;
}

export function mulai(app, paket, opsi = {}) {
  const KEY = opsi.kunci === undefined ? paket.kunci : opsi.kunci;
  const SUB = paket.subtes;
  const BY = Object.fromEntries(SUB.map((s) => [s.kode, s]));
  let st = (KEY && baca(KEY)) || {};
  st = Object.assign({ mode: opsi.modeAwal || "simulasi", hasil: {}, aktif: null, penuh: false, view: "daftar", tab: "subtes", kode: null, i: 0, filter: "salah" }, st);
  let timer = null, pilihSA = [];
  const simpan = () => { if (KEY) tulis(KEY, st); };

  // ---------- penilaian ----------
  const benar = (s, j, jw) => (s.jenis === "pasangan" ? Array.isArray(jw) && jw[0] === j.k[0] && jw[1] === j.k[1] : jw === j.k);
  function nilai(kode) {
    const s = BY[kode], h = st.hasil[kode];
    if (!h) return null;
    if (s.jenis === "likert") return nilaiLikert(s, h);
    let b = 0, k = 0, dtS = 0, dtN = 0;
    s.soal.forEach((q, i) => { const jw = h.jw[i]; if (jw == null) k++; else { if (benar(s, q, jw)) b++; dtS += h.dt[i] || 0; dtN++; } });
    const dt = dtN ? dtS / dtN : 0;
    const vonis = !dtN ? null : dt <= s.target ? "cepat" : dt <= (s.batas || s.target * 1.5) ? "pas" : "lambat";
    return { b, k, salah: s.n - b - k, n: s.n, dt, vonis };
  }
  function nilaiLikert(s, h) {
    const per = {}, n = s.soal.length;
    let agak = 0, ekstrem = 0, dijawab = 0;
    const byId = {};
    s.soal.forEach((q, i) => {
      const v = h.jw[i]; if (v == null) return;
      dijawab++; if (v === 3) agak++; if (v === 1 || v === 5) ekstrem++;
      const sk = q.r ? 6 - v : v;
      (per[q.d] = per[q.d] || []).push(sk);
      (byId[q.id] = byId[q.id] || []).push(v);
    });
    const dev = [];
    Object.entries(byId).forEach(([id, vs]) => { if (vs.length > 1) dev.push({ t: "ulang", id, d: Math.abs(vs[0] - vs[1]) }); });
    (s.pasangan || []).forEach(([a, b]) => { if (byId[a] && byId[b]) dev.push({ t: "lawan", id: a + "/" + b, d: Math.abs(byId[a][0] - (6 - byId[b][0])) }); });
    const kons = dev.length ? Math.round(100 - (dev.reduce((x, y) => x + y.d, 0) / dev.length) * 25) : null;
    const profil = Object.entries(per).map(([d, xs]) => [d, xs.reduce((a, b) => a + b, 0) / xs.length]).sort((a, b) => b[1] - a[1]);
    return { n, dijawab, agak: pct(agak, dijawab), ekstrem: pct(ekstrem, dijawab), kons, profil, dev };
  }
  function catatRingkas(kode) {
    if (opsi.drill) { opsi.drill(kode, nilai(kode), st.hasil[kode]); return; }
    const semua = baca(KUNCI_RINGKAS) || {};
    const x = (semua[paket.id] = semua[paket.id] || {});
    const n = nilai(kode), s = BY[kode];
    x[kode] = s.jenis === "likert" ? { n: n.n, kons: n.kons, agak: n.agak, ekstrem: n.ekstrem, mode: st.hasil[kode].mode, t: Date.now() }
      : { b: n.b, n: n.n, k: n.k, dt: Math.round(n.dt * 10) / 10, mode: st.hasil[kode].mode, t: Date.now() };
    tulis(KUNCI_RINGKAS, semua);
    kirimHasil(paket.id, kode, st.hasil[kode], x[kode]);
  }

  // ---------- alur ----------
  function bukaIntro(kode) { stopTimer(); st.view = "intro"; st.kode = kode; simpan(); render(); window.scrollTo(0, 0); }
  function mulaiSubtes(kode) {
    const s = BY[kode], now = Date.now();
    st.hasil[kode] = { jw: Array(s.n).fill(null), dt: Array(s.n).fill(0), selesai: false, mode: st.mode, t: now };
    st.aktif = { kode, i: 0, akhir: st.mode === "simulasi" ? now + s.durasi * 1000 : null, soal: now };
    st.view = "run"; st.kode = kode; st.i = 0; pilihSA = []; simpan(); render(); window.scrollTo(0, 0);
  }
  function selesaiSubtes() {
    stopTimer();
    const a = st.aktif; if (!a) return;
    const h = st.hasil[a.kode]; h.selesai = true; h.dur = Math.round((Date.now() - h.t) / 1000);
    st.aktif = null; st.view = "hasil"; st.kode = a.kode; simpan(); catatRingkas(a.kode); render(); window.scrollTo(0, 0);
  }
  function berikut() {
    const a = st.aktif, s = BY[a.kode];
    if (a.i + 1 >= s.n) return selesaiSubtes();
    a.i++; a.soal = Date.now(); pilihSA = []; simpan(); render();
  }
  function jawab(val) {
    const a = st.aktif; if (!a) return;
    const s = BY[a.kode], h = st.hasil[a.kode];
    if (st.mode === "latihan" && h.jw[a.i] != null && s.jenis !== "likert") return;
    h.jw[a.i] = val; h.dt[a.i] = Math.round((Date.now() - a.soal) / 100) / 10;
    simpan();
    if (st.mode === "simulasi" || s.jenis === "likert") return berikut();
    render();
  }
  function lompat(i) { const a = st.aktif; if (!a) return; a.i = i; a.soal = Date.now(); pilihSA = []; simpan(); render(); }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function tick() {
    const a = st.aktif; if (!a || st.view !== "run" || st.mode !== "simulasi") return stopTimer();
    const s = BY[a.kode], now = Date.now();
    if (a.akhir && now >= a.akhir) return selesaiSubtes();
    if (s.batas && now - a.soal >= s.batas * 1000) { st.hasil[a.kode].dt[a.i] = s.batas; return berikut(); }
    const jam = app.querySelector("#jam"), bar = app.querySelector("#bar-soal i");
    if (jam) { jam.textContent = jamStr(a.akhir - now); jam.classList.toggle("kritis", a.akhir - now < 60000); }
    if (bar && s.batas) bar.style.transform = `scaleX(${Math.max(0, 1 - (now - a.soal) / (s.batas * 1000))})`;
  }

  // ---------- tampilan ----------
  function render() {
    stopTimer();
    const v = st.view;
    let h = opsi.tanpaKepala ? "" : kepalaSitus(opsi.drill ? "latihan" : "psikotes");
    h += '<main class="wrap">';
    if (v === "intro") h += vIntro();
    else if (v === "run") h += vRun();
    else if (v === "hasil") h += vHasil();
    else if (v === "bahas") h += vBahas();
    else h += vDaftar();
    app.innerHTML = h + "</main>";
    if (v === "run" && st.mode === "simulasi") { timer = setInterval(tick, 200); tick(); }
  }
  function kepalaPaket() {
    return `<div class="pk-head">${opsi.kembali ? `<a class="hint" href="${opsi.kembali.href}">&larr; ${esc(opsi.kembali.teks)}</a>` : ""}<h1>${esc(paket.judul)}</h1><div class="sub">${esc(paket.subjudul || `${SUB.length} subtes · ${paket.jumlah} butir · format & waktu seperti psikotes UPKP`)}</div></div>`;
  }
  function vDaftar() {
    let h = kepalaPaket();
    if (SUB.length > 1) h += `<div class="tabs" role="tablist">${[["subtes", "Subtes"], ["kunci", "Kunci"], ["rekap", "Rekap"]].map(([k, t]) => `<button role="tab" data-tab="${k}" aria-selected="${st.tab === k}">${t}</button>`).join("")}</div>`;
    if (st.tab === "kunci" && SUB.length > 1) return h + vKunci();
    if (st.tab === "rekap" && SUB.length > 1) return h + vRekap();
    h += `<div class="modebar"><div class="seg" role="group" aria-label="Mode">${[["simulasi", "Simulasi berwaktu"], ["latihan", "Latihan bebas"]].map(([m, t]) => `<button data-mode="${m}" aria-pressed="${st.mode === m}">${t}</button>`).join("")}</div>
      <span class="hint">${st.mode === "simulasi" ? "Timer per subtes & per soal, tanpa kembali ke soal sebelumnya, pembahasan setelah selesai." : "Tanpa timer, pembahasan langsung muncul setelah menjawab."}</span></div>`;
    const sisa = SUB.filter((s) => !(st.hasil[s.kode] && st.hasil[s.kode].selesai));
    if (SUB.length > 1) h += `<div class="cta" style="margin:4px 0 14px"><button class="btn spark" data-act="penuh">${sisa.length === SUB.length ? "Mulai simulasi penuh" : sisa.length ? `Lanjutkan simulasi penuh (${sisa.length} subtes lagi)` : "Simulasi selesai — lihat rekap"}</button></div>`;
    h += '<div class="daftar-st">' + SUB.map((s) => {
      const hs = st.hasil[s.kode], sel = hs && hs.selesai, n = sel ? nilai(s.kode) : null;
      const ket = `${s.n} soal · ${s.jenis === "likert" ? Math.round(s.durasi / 60) + " menit" : `${Math.round(s.durasi / 6) / 10} menit · maks ${s.batas} dtk/soal`}`;
      const skor = !n ? "" : s.jenis === "likert" ? ` · konsistensi ${n.kons ?? "–"}%` : ` · <b>${n.b}/${n.n}</b> benar · ${fmtDetik(n.dt)}/soal`;
      return `<div class="st${sel ? " selesai" : ""}"><span class="no">${s.no}</span><div><div class="nm">${esc(s.nama)}</div><div class="ket">${ket}${skor}${hs && !sel ? " · belum selesai" : ""}</div></div>
        <div class="aksi">${sel ? `<button class="btn kecil" data-bahas="${s.kode}">${s.jenis === "likert" ? "Hasil" : "Pembahasan"}</button>` : ""}<button class="btn kecil${sel ? "" : " pri"}" data-intro="${s.kode}">${sel ? "Ulangi" : hs ? "Mulai lagi" : "Mulai"}</button></div></div>`;
    }).join("") + "</div>";
    if (opsi.catatan) h += `<p class="foot">${opsi.catatan}</p>`;
    return h;
  }
  function vIntro() {
    const s = BY[st.kode], m = META[s.kode] || {};
    const angka = s.jenis === "likert" ? [`${s.n} pernyataan`, `${Math.round(s.durasi / 60)} menit`, "skala 1–5"] : [`${s.n} soal`, `${Math.round(s.durasi / 6) / 10} menit`, `maks ${s.batas} dtk/soal`, `target ${s.target} dtk/soal`];
    const ref = s.jenis === "vm" ? `<p class="hint">Referensi paket ini:</p>${refVM(s)}` : "";
    return `<section class="card intro"><span class="tag">Subtes ${s.no}</span><h2>${esc(s.nama)}</h2><p>${esc(m.petunjuk || "")}</p>
      <div class="angka">${angka.map((a) => `<span class="tag o">${a}</span>`).join("")}<span class="tag spark">${st.mode === "simulasi" ? "Simulasi berwaktu" : "Latihan bebas"}</span></div>
      ${m.kiat ? `<b>Kiat cepat</b><ul>${m.kiat.map((k) => `<li>${esc(k)}</li>`).join("")}</ul>` : ""}${ref}
      ${st.mode === "simulasi" && s.jenis !== "likert" ? `<p class="hint">Soal berganti otomatis setelah Anda menjawab atau saat batas waktu soal habis. Tidak ada nilai minus — jangan biarkan soal kosong.</p>` : ""}
      <div class="nav"><button class="btn" data-act="daftar">Kembali</button><button class="btn pri" data-mulai="${s.kode}">Mulai</button></div></section>`;
  }
  function refVM(s) { return `<div class="ref-vm">${s.ref.map((g, i) => `<div><b>${HURUF[i]}</b>${g}</div>`).join("")}</div>`; }
  function vRun() {
    const a = st.aktif, s = BY[a.kode], q = s.soal[a.i], h = st.hasil[a.kode], jw = h.jw[a.i];
    const lat = st.mode === "latihan", tampil = lat && jw != null && s.jenis !== "likert";
    let out = `<div class="run-top"><div class="r1"><span class="nm">${s.no}. ${esc(s.nama)}</span><span class="qno">${a.i + 1}/${s.n}</span>${lat ? "" : `<span class="jam" id="jam">${jamStr(a.akhir - Date.now())}</span>`}
      <button class="btn kecil" data-act="akhiri">${lat ? "Selesai" : "Akhiri"}</button></div>
      <div class="bar-prog"><i style="width:${pct(a.i, s.n)}%"></i></div>${!lat && s.batas ? '<div class="bar-waktu" id="bar-soal"><i></i></div>' : ""}</div>`;
    out += `<article class="card" aria-live="polite">`;
    if (s.jenis === "vm") {
      out += refVM(s) + `<div class="vm-g">${q.g}</div><ol class="opts vm">${HURUF.split("").map((L, j) => `<li><button class="opt${tampil ? (j === q.k ? " ok" : j === jw ? " no" : "") : ""}" data-o="${j}"${tampil ? " disabled" : ""}><span class="L">${L}</span>${L}</button></li>`).join("")}</ol>`;
    } else if (s.jenis === "likert") {
      out += (q.s ? `<div class="ilustrasi"><b>Ilustrasi.</b> ${esc(q.s)}</div>` : "") + `<p class="stem">${esc(q.q)}</p><ol class="opts likert">${SKALA.map((t, j) => `<li><button class="opt" data-o="${j + 1}" aria-pressed="${jw === j + 1}"><span class="L">${HURUF[j]}</span><span>${t}</span></button></li>`).join("")}</ol>`;
    } else if (s.jenis === "pasangan") {
      const pil = tampil ? jw : pilihSA;
      out += `<p class="stem">Pilih <b>dua</b> kata yang bersinonim atau berantonim.</p><ol class="opts kata-sa">${q.w.map((w, j) => {
        let c = "opt"; if (tampil) { if (q.k.includes(j)) c += " ok"; else if (jw.includes(j)) c += " no"; } else if (pil.includes(j)) c += " pilih";
        return `<li><button class="${c}" data-sa="${j}"${tampil ? " disabled" : ""}><span class="L">${HURUF[j]}</span><span>${esc(w)}</span></button></li>`;
      }).join("")}</ol>`;
    } else {
      const gbr = q.o.some((o) => o.includes("<svg"));
      out += `<div class="stem">${q.q}</div><ol class="opts${gbr ? " gambar" : ""}">${q.o.map((o, j) => `<li><button class="opt${tampil ? (j === q.k ? " ok" : j === jw ? " no" : "") : ""}" data-o="${j}" aria-pressed="${jw === j}"${tampil ? " disabled" : ""}><span class="L">${HURUF[j]}</span><span>${o}</span></button></li>`).join("")}</ol>`;
    }
    if (tampil) out += umpan(s, q, jw, a.i);
    out += "</article>";
    if (lat && s.jenis !== "likert") {
      out += `<div class="nav"><button class="btn" data-go="${a.i - 1}"${a.i ? "" : " disabled"}>&larr; Sebelumnya</button><button class="btn pri" data-go="${a.i + 1}">${a.i + 1 >= s.n ? "Selesai" : "Berikutnya &rarr;"}</button></div>`;
      out += `<div class="peta">${s.soal.map((qq, i) => { const x = h.jw[i]; const c = x == null ? "" : benar(s, qq, x) ? "ok" : "no"; return `<button class="${c}${i === a.i ? " kini" : ""}" data-go="${i}">${i + 1}</button>`; }).join("")}</div>`;
    }
    if (s.jenis === "likert") out += `<div class="nav"><button class="btn" data-go="${a.i - 1}"${a.i ? "" : " disabled"}>&larr; Sebelumnya</button><span class="hint" style="flex:2;align-self:center">Bisa kembali, tetapi sebaiknya jangan mengubah jawaban.</span></div>`;
    out += `<p class="hint">Papan ketik: ${s.jenis === "vm" ? "A–F atau 1–6" : "A–E atau 1–5"}${lat ? ", panah kanan untuk lanjut" : ""}.</p>`;
    return out;
  }
  function lapor(s, q, i, jw) {
    const kunci = s.jenis === "pasangan" ? q.k.map((k) => q.w[k]).join(" – ") : s.jenis === "vm" ? HURUF[q.k] : polos(q.o[q.k]);
    const body = `Paket: ${paket.id} · ${s.nama} no. ${i + 1}\n\nSoal: ${polos(q.q || "")}\n${q.o ? "Opsi: " + q.o.map((o, j) => HURUF[j] + ". " + polos(o)).join(" | ") : q.w ? "Kata: " + q.w.join(", ") : ""}\n\nKunci situs: ${kunci}\nJawaban saya: ${jw == null ? "-" : Array.isArray(jw) ? jw.map((x) => q.w[x]).join(" – ") : HURUF[jw]}\n\nAlasan saya:`;
    return `<a class="lapor" target="_blank" rel="noopener" href="${REPO_ISSUE}?title=${encodeURIComponent(`Kunci keliru? ${paket.id} ${s.kode} no ${i + 1}`)}&body=${encodeURIComponent(body.slice(0, 1800))}&labels=lapor-kunci">Kunci terasa keliru? Laporkan</a>`;
  }
  function umpan(s, q, jw, i) {
    const ok = jw != null && benar(s, q, jw);
    const kunci = s.jenis === "pasangan" ? `${q.k.map((k) => esc(q.w[k])).join(" – ")} (${q.r === "S" ? "sinonim" : "antonim"})` : HURUF[q.k];
    const e = s.jenis === "vm" ? `Gambar ini sama persis dengan referensi ${HURUF[q.k]}.` : q.e;
    return `<div class="fb"><div class="v ${ok ? "ok" : "no"}">${jw == null ? "Tidak dijawab." : ok ? "Benar." : "Kurang tepat."} Kunci: ${kunci}.</div><p>${e}</p>${s.jenis === "vm" ? "" : `<p>${lapor(s, q, i, jw)}</p>`}</div>`;
  }
  function vHasil() {
    const s = BY[st.kode], n = nilai(st.kode), idx = SUB.indexOf(s), lanjut = SUB.slice(idx + 1).find((x) => !(st.hasil[x.kode] && st.hasil[x.kode].selesai));
    let h = `<section class="card hasil">`;
    if (s.jenis === "likert") {
      h += `${pelatuk("senang")}<div class="tag">Subtes ${s.no} selesai</div><h2>${esc(s.nama)}</h2>` + panelLikert(s, n);
    } else {
      const mood = n.b / n.n >= 0.8 ? "senang" : "fokus";
      const vt = { cepat: ["cepat", "Tempo sudah sesuai target"], pas: ["pas", "Masih dalam batas waktu, belum secepat target"], lambat: ["lambat", "Lebih lambat dari batas — latih tempo"] }[n.vonis] || null;
      h += `${pelatuk(mood)}<div class="tag">Subtes ${s.no} selesai · ${st.hasil[s.kode].mode === "simulasi" ? "simulasi" : "latihan"}</div><h2>${esc(s.nama)}</h2>
        <div class="skor">${n.b}<span class="hint" style="font-size:20px">/${n.n}</span></div>
        <div class="stat-row" style="margin-top:12px"><div class="stat"><b>${pct(n.b, n.n)}%</b><span>ketepatan</span></div><div class="stat"><b>${n.salah}</b><span>salah</span></div><div class="stat"><b>${n.k}</b><span>kosong</span></div><div class="stat"><b>${n.dt ? n.dt.toFixed(1) : "–"}</b><span>dtk/soal (target ${s.target})</span></div></div>
        ${vt ? `<span class="vonis ${vt[0]}">${vt[1]}</span>` : ""}${n.k ? `<p class="hint">Ingat: tidak ada nilai minus. ${n.k} soal kosong = poin yang hilang percuma.</p>` : ""}`;
    }
    h += `<div class="nav">${s.jenis !== "likert" || n.dev.length ? `<button class="btn" data-bahas="${s.kode}">${s.jenis === "likert" ? "Rincian" : "Pembahasan"}</button>` : ""}`;
    h += st.penuh && lanjut ? `<button class="btn pri" data-intro="${lanjut.kode}">Lanjut: ${esc(lanjut.nama)} &rarr;</button>` : `<button class="btn pri" data-act="daftar">${SUB.length > 1 ? "Daftar subtes" : "Selesai"}</button>`;
    return h + "</div></section>";
  }
  function panelLikert(s, n) {
    const saran = [];
    if (n.kons != null && n.kons < 85) saran.push("Konsistensi di bawah 85%: jawaban untuk pernyataan yang sama/berlawanan masih berbeda.");
    if (n.agak > 15) saran.push(`Pilihan “Agak menggambarkan” ${n.agak}% — modul menyarankan meminimalkan jawaban ragu-ragu.`);
    if (n.ekstrem > 85) saran.push(`Jawaban ekstrem (A/E) ${n.ekstrem}% — terlalu ideal bisa terbaca tidak realistis.`);
    if (!saran.length) saran.push("Pola jawaban stabil: konsisten, tegas, dan tidak berlebihan.");
    return `<div class="stat-row" style="margin-top:12px"><div class="stat"><b>${n.kons ?? "–"}${n.kons != null ? "%" : ""}</b><span>konsistensi</span></div><div class="stat"><b>${n.agak}%</b><span>“Agak”</span></div><div class="stat"><b>${n.ekstrem}%</b><span>jawaban ekstrem</span></div><div class="stat"><b>${n.dijawab}/${n.n}</b><span>dijawab</span></div></div>
      <div class="panel" style="text-align:left"><h3 style="margin-top:0">Arah profil per dimensi (1–5)</h3><table class="tbl"><tbody>${n.profil.map(([d, v]) => `<tr><td>${esc(d)}</td><td class="n">${v.toFixed(1)}</td><td style="width:55%"><div class="meter${v < 3.5 ? " spark" : ""}"><i style="width:${pct(v - 1, 4)}%"></i></div></td></tr>`).join("")}</tbody></table>
      <ul>${saran.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><p class="hint">Tidak ada jawaban benar/salah. Angka tinggi berarti jawaban Anda searah dengan profil pegawai yang dicari (berintegritas, profesional, bersinergi, melayani, terus memperbaiki, siap memimpin).</p></div>`;
  }
  function vBahas() {
    const s = BY[st.kode], h = st.hasil[st.kode];
    let out = kepalaPaket() + `<div class="modebar"><button class="btn kecil" data-act="daftar">&larr; Daftar subtes</button><b>${esc(s.nama)}</b></div>`;
    if (s.jenis === "likert") {
      const n = nilai(st.kode), byId = {};
      s.soal.forEach((q) => (byId[q.id] = q));
      out += `<div class="panel"><h2>Pernyataan yang dijawab tidak konsisten</h2>${n.dev.filter((d) => d.d >= 2).map((d) => { const ids = d.id.split("/"); return `<p><span class="tag spark">${d.t === "ulang" ? "pernyataan berulang" : "pernyataan berlawanan"}</span><br>${ids.map((x) => esc(byId[x] ? byId[x].q : x)).join("<br>")}</p>`; }).join("") || '<p class="hint">Tidak ada selisih ≥ 2 poin. Bagus.</p>'}</div>`;
      return out;
    }
    out += `<div class="modebar"><div class="seg">${[["salah", "Salah & kosong"], ["semua", "Semua"]].map(([f, t]) => `<button data-filter="${f}" aria-pressed="${st.filter === f}">${t}</button>`).join("")}</div></div>`;
    const daftar = s.soal.map((q, i) => [q, i]).filter(([q, i]) => st.filter === "semua" || !benar(s, q, h.jw[i]));
    if (!daftar.length) return out + '<p class="panel">Tidak ada soal yang salah atau kosong. Mantap.</p>';
    if (s.jenis === "vm") {
      return out + `<div class="panel">${refVM(s)}<table class="tbl" style="margin-top:10px"><thead><tr><th>No</th><th>Gambar</th><th>Kunci</th><th>Anda</th></tr></thead><tbody>${daftar.map(([q, i]) => `<tr><td class="n">${i + 1}</td><td>${q.g.replace(/width="72" height="72"/, 'width="40" height="40"')}</td><td class="mono">${HURUF[q.k]}</td><td class="mono ${h.jw[i] == null ? "" : "no-t"}">${h.jw[i] == null ? "–" : HURUF[h.jw[i]]}</td></tr>`).join("")}</tbody></table></div>`;
    }
    return out + daftar.map(([q, i]) => {
      const jw = h.jw[i];
      let body;
      if (s.jenis === "pasangan") body = `<ol class="opts kata-sa">${q.w.map((w, j) => `<li><button class="opt${q.k.includes(j) ? " ok" : Array.isArray(jw) && jw.includes(j) ? " no" : ""}" disabled><span class="L">${HURUF[j]}</span><span>${esc(w)}</span></button></li>`).join("")}</ol>`;
      else body = `<div class="stem">${q.q}</div><ol class="opts${q.o.some((o) => o.includes("<svg")) ? " gambar" : ""}">${q.o.map((o, j) => `<li><button class="opt${j === q.k ? " ok" : j === jw ? " no" : ""}" disabled><span class="L">${HURUF[j]}</span><span>${o}</span></button></li>`).join("")}</ol>`;
      return `<article class="card"><div class="meta"><span class="qno">${i + 1}/${s.n}</span>${jw == null ? '<span class="tag spark">kosong</span>' : benar(s, q, jw) ? '<span class="tag ok">benar</span>' : '<span class="tag no">salah</span>'}${h.dt[i] ? `<span class="tag o">${h.dt[i]} dtk</span>` : ""}</div>${body}${umpan(s, q, jw, i)}</article>`;
    }).join("");
  }
  function vKunci() {
    return SUB.filter((s) => s.jenis !== "likert").map((s) => {
      const hs = st.hasil[s.kode], buka = (hs && hs.selesai) || st.bukaKunci === s.kode;
      if (!buka) return `<div class="panel"><h2>${s.no}. ${esc(s.nama)}</h2><p class="hint">Kunci terbuka setelah subtes ini selesai.</p><button class="btn kecil" data-buka="${s.kode}">Buka kunci sekarang</button></div>`;
      const hit = Array(s.jenis === "vm" ? 6 : 5).fill(0);
      const k = s.soal.map((q, i) => { const kk = s.jenis === "pasangan" ? q.k.map((x) => HURUF[x]).join("") : HURUF[q.k]; if (s.jenis !== "pasangan") hit[q.k]++; return `<span>${i + 1}. <b>${kk}</b></span>`; }).join("");
      return `<div class="panel"><h2>${s.no}. ${esc(s.nama)}</h2><div class="kunci-baris">${k}</div>${s.jenis === "pasangan" ? "" : `<p class="hint">Sebaran kunci: ${hit.map((x, i) => HURUF[i] + " " + x).join(" · ")}</p>`}</div>`;
    }).join("");
  }
  function vRekap() {
    let tb = 0, tn = 0;
    const baris = SUB.filter((s) => s.jenis !== "likert").map((s) => {
      const hs = st.hasil[s.kode]; if (!hs || !hs.selesai) return `<tr><td>${s.no}. ${esc(s.nama)}</td><td class="n" colspan="3"><span class="hint">belum</span></td></tr>`;
      const n = nilai(s.kode); tb += n.b; tn += n.n;
      return `<tr class="go" data-bahas="${s.kode}"><td>${s.no}. ${esc(s.nama)}<div class="meter"><i style="width:${pct(n.b, n.n)}%"></i></div></td><td class="n">${n.b}/${n.n}</td><td class="n">${n.k}</td><td class="n">${n.dt ? n.dt.toFixed(1) : "–"} / ${s.target}</td></tr>`;
    }).join("");
    let h = `<div class="panel"><h2>Subtes kognitif</h2><table class="tbl"><thead><tr><th>Subtes</th><th class="n">Benar</th><th class="n">Kosong</th><th class="n">dtk/soal / target</th></tr></thead><tbody>${baris}</tbody></table>${tn ? `<p><b>Total: ${tb}/${tn} (${pct(tb, tn)}%)</b> dari subtes yang sudah dikerjakan.</p>` : ""}</div>`;
    SUB.filter((s) => s.jenis === "likert").forEach((s) => {
      const hs = st.hasil[s.kode];
      h += `<div class="panel"><h2>${s.no}. ${esc(s.nama)}</h2>${hs && hs.selesai ? panelLikert(s, nilai(s.kode)) : '<p class="hint">Belum dikerjakan.</p>'}</div>`;
    });
    return h + `<div class="panel"><h2>Ulangi paket</h2><p class="hint">Menghapus semua jawaban paket ini di browser ini.</p><button class="btn kecil" data-act="reset">Hapus jawaban &amp; mulai ulang</button></div>`;
  }

  // ---------- interaksi ----------
  app.addEventListener("click", (ev) => {
    const t = ev.target.closest("button,tr.go"); if (!t || t.disabled) return;
    const d = t.dataset;
    if (d.tab) { st.tab = d.tab; simpan(); render(); return; }
    if (d.mode) { st.mode = d.mode; simpan(); render(); return; }
    if (d.intro) { bukaIntro(d.intro); return; }
    if (d.mulai) { mulaiSubtes(d.mulai); return; }
    if (d.bahas) { st.view = "bahas"; st.kode = d.bahas; simpan(); render(); window.scrollTo(0, 0); return; }
    if (d.filter) { st.filter = d.filter; simpan(); render(); return; }
    if (d.buka) { st.bukaKunci = d.buka; simpan(); render(); return; }
    if (d.o !== undefined) { const v = Number(d.o); jawab(v); return; }
    if (d.sa !== undefined) {
      const j = Number(d.sa);
      pilihSA = pilihSA.includes(j) ? pilihSA.filter((x) => x !== j) : pilihSA.concat(j);
      if (pilihSA.length === 2) { const p = pilihSA.slice().sort((a, b) => a - b); pilihSA = []; jawab(p); } else render();
      return;
    }
    if (d.go !== undefined) {
      const i = Number(d.go), s = BY[st.aktif.kode];
      if (i >= s.n) return selesaiSubtes();
      if (i >= 0) lompat(i);
      return;
    }
    const act = d.act;
    if (act === "daftar") { stopTimer(); st.view = "daftar"; st.penuh = st.penuh && SUB.some((s) => !(st.hasil[s.kode] && st.hasil[s.kode].selesai)); simpan(); render(); window.scrollTo(0, 0); }
    if (act === "penuh") {
      const s = SUB.find((x) => !(st.hasil[x.kode] && st.hasil[x.kode].selesai));
      if (!s) { st.tab = "rekap"; simpan(); render(); return; }
      st.penuh = true; st.mode = "simulasi"; bukaIntro(s.kode);
    }
    if (act === "akhiri") {
      if (t.dataset.yakin !== "1") { t.dataset.yakin = "1"; t.textContent = "Yakin? Klik lagi"; return; }
      selesaiSubtes();
    }
    if (act === "reset") {
      if (t.dataset.yakin !== "1") { t.dataset.yakin = "1"; t.textContent = "Klik sekali lagi untuk menghapus"; return; }
      st.hasil = {}; st.aktif = null; st.penuh = false; st.tab = "subtes"; simpan(); render();
    }
  });
  if (kbAktif) document.removeEventListener("keydown", kbAktif);
  document.addEventListener("keydown", (kbAktif = (ev) => {
    if (st.view !== "run" || !st.aktif || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const s = BY[st.aktif.kode], k = ev.key.toUpperCase();
    let j = HURUF.indexOf(k); if (j < 0 && /^[1-6]$/.test(k)) j = Number(k) - 1;
    const maks = s.jenis === "vm" ? 6 : 5;
    if (j >= 0 && j < maks) {
      ev.preventDefault();
      const tombol = app.querySelector(s.jenis === "pasangan" ? `[data-sa="${j}"]` : `[data-o="${s.jenis === "likert" ? j + 1 : j}"]`);
      if (tombol && !tombol.disabled) tombol.click();
    } else if (ev.key === "ArrowRight" && st.mode === "latihan") { const b = app.querySelector('.nav [data-go="' + (st.aktif.i + 1) + '"]'); if (b) b.click(); }
    else if (ev.key === "ArrowLeft" && (st.mode === "latihan" || s.jenis === "likert") && st.aktif.i > 0) lompat(st.aktif.i - 1);
  }));

  // lanjutkan sesi yang terputus (muat ulang halaman)
  if (st.view === "run" && st.aktif) {
    const s = BY[st.aktif.kode];
    if (!s || !st.hasil[st.aktif.kode]) { st.aktif = null; st.view = "daftar"; }
    else if (st.aktif.akhir && Date.now() >= st.aktif.akhir) { st.view = "run"; selesaiSubtes(); return; }
    else st.aktif.soal = Date.now();
  } else if (st.view === "run") st.view = "daftar";
  if (opsi.langsung && !st.aktif) { st.view = "intro"; st.kode = opsi.langsung; }
  render();
  return { render };
}
