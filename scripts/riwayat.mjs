#!/usr/bin/env node
// Ringkasan satu paket untuk doc riwayat di Project: pasangan SA dan kelompok PK yang sudah dipakai.
// Pakai: node scripts/riwayat.mjs <YYYY-MM-DD>
import fs from "node:fs";
import path from "node:path";
const t = process.argv[2];
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const p = JSON.parse(fs.readFileSync(path.join(root, "psikotes", "paket", t, "soal.json"), "utf8"));
const by = Object.fromEntries(p.subtes.map((s) => [s.kode, s]));
const un = (s) => s.replace(/&amp;/g, "&").replace(/<[^>]+>/g, "");
const sa = by.SA.soal.map((q) => `${q.w[q.k[0]]}–${q.w[q.k[1]]} (${q.r})`);
const pk = by.PK.soal.map((q) => `${q.f === "L" ? "L" : "B"}: ${un(q.o[q.k])} [${q.g}${q.kk ? ` · ${q.kk}/${q.dasar}/${q.d}` : ""}]`);
console.log(`## ${t}\n- SA (${sa.length}): ${sa.join("; ")}\n- PK (${pk.length}): ${pk.join("; ")}\n- Generator (benih tanggal): LPI ${by.LPI.n}, SIL ${by.SIL.n}, DR ${by.DR.n}, OM ${by.OM.n}, AS ${by.AS.n}, BP ${by.BP.n}, VM ${by.VM.n}; kepribadian PD ${by.PD.n}, KK ${by.KK.n} dari bank.\n`);
