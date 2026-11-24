#!/usr/bin/env python3
"""Uji halaman paket dengan Playwright. Pakai: python3 scripts/uji-paket.py <YYYY-MM-DD>
Menjalankan server statis lokal, lalu: jawaban benar/salah memunculkan .fb, pasangan SA, PK, timer VM,
kepribadian selesai, tab Kunci, beranda & latihan bebas tanpa error JS. Keluar 1 bila ada yang gagal."""
import json, os, subprocess, sys, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = sys.argv[1]
P = json.load(open(f"{ROOT}/psikotes/paket/{T}/soal.json"))
SUB = {s["kode"]: s for s in P["subtes"]}
srv = subprocess.Popen([sys.executable, "-m", "http.server", "8799", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
B = "http://localhost:8799"
errs, gagal = [], []
def cek(c, m): print(("OK    " if c else "GAGAL ") + m); (None if c else gagal.append(m))
try:
    with sync_playwright() as pw:
        br = pw.chromium.launch(); ctx = br.new_context(viewport={"width": 1200, "height": 900})
        ctx.route("**/fonts.g*/**", lambda r: r.abort())
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(f"{B}/psikotes/paket/{T}/"); pg.wait_for_timeout(500)
        cek(pg.locator(".st").count() == 11, "11 subtes tampil")
        pg.click('[data-mode="latihan"]')
        for kode in ["LPI", "SIL", "DR", "PK", "OM", "AS", "BP"]:
            pg.click(f'[data-intro="{kode}"]'); pg.click(f'[data-mulai="{kode}"]'); pg.wait_for_timeout(120)
            k = SUB[kode]["soal"][0]["k"]; pg.click(f'.opts [data-o="{k}"]'); pg.wait_for_timeout(80)
            cek(pg.locator(".fb .v.ok").count() == 1, f"{kode}: jawaban benar → umpan balik benar")
            pg.click('.nav [data-go="1"]'); k1 = SUB[kode]["soal"][1]["k"]; pg.click(f'.opts [data-o="{(k1 + 1) % 5}"]'); pg.wait_for_timeout(80)
            cek(pg.locator(".fb .v.no").count() == 1, f"{kode}: jawaban salah → umpan balik salah")
            pg.click('[data-act="akhiri"]'); pg.click('[data-act="akhiri"]'); pg.wait_for_timeout(80); pg.click('[data-act="daftar"]')
        pg.click('[data-intro="SA"]'); pg.click('[data-mulai="SA"]'); pg.wait_for_timeout(100)
        kk = SUB["SA"]["soal"][0]["k"]; pg.click(f'[data-sa="{kk[0]}"]'); pg.click(f'[data-sa="{kk[1]}"]'); pg.wait_for_timeout(80)
        cek(pg.locator(".fb .v.ok").count() == 1, "SA: pasangan kunci → benar")
        pg.click('[data-act="akhiri"]'); pg.click('[data-act="akhiri"]'); pg.click('[data-act="daftar"]')
        pg.click('[data-mode="simulasi"]'); pg.click('[data-intro="VM"]'); pg.click('[data-mulai="VM"]'); pg.wait_for_timeout(150)
        cek(pg.locator(".ref-vm.besar svg").count() == 6, "VM: tahap hafal menampilkan 6 referensi")
        pg.click('[data-act="hafal-selesai"]'); pg.wait_for_timeout(150)
        cek(pg.locator(".ref-vm").count() == 0, "VM: referensi disembunyikan saat menjawab")
        for i in range(3): pg.keyboard.press("ABCDEF"[SUB["VM"]["soal"][i]["k"]]); pg.wait_for_timeout(50)
        cek(pg.inner_text(".run-top .qno").startswith("4/"), "VM: papan ketik + pindah otomatis")
        pg.click('[data-act="akhiri"]'); pg.click('[data-act="akhiri"]'); pg.click('[data-act="daftar"]')
        pg.click('[data-intro="PD"]'); pg.click('[data-mulai="PD"]'); pg.wait_for_timeout(100)
        for i in range(SUB["PD"]["n"]): pg.keyboard.press("4"); pg.wait_for_timeout(10)
        pg.wait_for_timeout(200); cek(pg.locator(".hasil").count() == 1, "PD: selesai → hasil kepribadian")
        pg.click('[data-act="daftar"]'); pg.click('[data-tab="kunci"]'); pg.wait_for_timeout(100)
        for kode in ["LPI", "SIL", "DR", "PK", "OM", "AS", "BP", "VM"]:
            h = [0] * (6 if kode == "VM" else 5)
            for q in SUB[kode]["soal"]: h[q["k"]] += 1
            cek(max(h) - min(h) <= 1, f"{kode}: kunci rata {h}")
        for path in ["/", "/psikotes/", "/psikotes/metode/", "/psikotes/latihan/", "/tip/"]:
            pg.goto(B + path); pg.wait_for_timeout(300)
        br.close()
finally:
    srv.terminate()
cek(not errs, "tanpa error JavaScript" + ("" if not errs else ": " + "; ".join(errs[:3])))
print("LOLOS" if not gagal else f"{len(gagal)} GAGAL")
sys.exit(1 if gagal else 0)
