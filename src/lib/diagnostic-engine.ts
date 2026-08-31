// Logika deterministik dari SPEC-v0.1.md Bagian 4.

export type Level = "A1" | "A2" | "B1" | "B2" | "C1";
const LEVELS: Level[] = ["A1", "A2", "B1", "B2", "C1"];

export interface BlokHasil {
  level: Level;
  benar: number;
}

function levelNaik(level: Level): Level {
  const idx = LEVELS.indexOf(level);
  return LEVELS[Math.min(idx + 1, LEVELS.length - 1)];
}

function levelTurun(level: Level): Level {
  const idx = LEVELS.indexOf(level);
  return LEVELS[Math.max(idx - 1, 0)];
}

// 4.1 — Tahap 1 Grammar adaptif. Dipanggil setelah setiap blok 10 soal untuk
// menentukan apakah diagnostic tahap 1 selesai, dan kalau belum, level blok berikutnya.
export function keputusanBlokSelanjutnya(riwayat: BlokHasil[]): {
  selesai: boolean;
  levelBerikutnya?: Level;
} {
  const terakhir = riwayat[riwayat.length - 1];

  if (riwayat.length >= 3) return { selesai: true };

  if (terakhir.benar >= 8) {
    const naik = levelNaik(terakhir.level);
    if (naik === terakhir.level) return { selesai: true }; // sudah di C1, jepit di ujung
    return { selesai: false, levelBerikutnya: naik };
  }

  if (terakhir.benar >= 5) return { selesai: true }; // level stabil

  const turun = levelTurun(terakhir.level);
  if (turun === terakhir.level) return { selesai: true }; // sudah di A1, jepit di ujung
  return { selesai: false, levelBerikutnya: turun };
}

// Dipakai untuk menentukan level blok yang SEDANG berjalan, dihitung ulang dari riwayat
// tersimpan di DB (bukan disimpan sebagai field terpisah) — supaya idempoten saat halaman
// dimuat ulang di tengah diagnostic.
export function levelBlokAktif(riwayat: BlokHasil[]): { selesai: boolean; level?: Level } {
  if (riwayat.length === 0) return { selesai: false, level: "A2" }; // level_sekarang default A2
  const keputusan = keputusanBlokSelanjutnya(riwayat);
  if (keputusan.selesai) return { selesai: true };
  return { selesai: false, level: keputusan.levelBerikutnya };
}

// CEFR final = level blok terakhir yang benar >= 5, kalau tidak ada → A1.
export function cefrFinalDari(riwayat: BlokHasil[]): Level {
  for (let i = riwayat.length - 1; i >= 0; i--) {
    if (riwayat[i].benar >= 5) return riwayat[i].level;
  }
  return "A1";
}

// 4.2 — Estimasi band Listening & Reading.
export function raw40Listening(benar: number): number {
  return Math.round(benar * 4);
}

export function raw40Reading(benar: number): number {
  return Math.round((benar * 40) / 13);
}

const LISTENING_TABLE: Array<[number, number, number]> = [
  [35, 40, 8.0],
  [30, 34, 7.0],
  [23, 29, 6.0],
  [16, 22, 5.0],
  [10, 15, 4.0],
  [0, 9, 3.0],
];

const READING_TABLE: Array<[number, number, number]> = [
  [35, 40, 7.0],
  [30, 34, 6.0],
  [23, 29, 5.0],
  [15, 22, 4.0],
  [0, 14, 3.0],
];

function lookupBand(table: Array<[number, number, number]>, raw40: number): number {
  for (const [lo, hi, band] of table) {
    if (raw40 >= lo && raw40 <= hi) return band;
  }
  return table[table.length - 1][2];
}

export function estimasiBandListening(benar: number): number {
  return lookupBand(LISTENING_TABLE, raw40Listening(benar));
}

export function estimasiBandReading(benar: number): number {
  return lookupBand(READING_TABLE, raw40Reading(benar));
}

// 4.3 — Status sub-skill (4 tingkat + belum_diuji).
export type StatusSubSkill = "belum" | "lemah" | "cukup" | "kuat" | "belum_diuji";

export const STATUS_LABEL: Record<StatusSubSkill, string> = {
  belum: "🔴 Belum",
  lemah: "🟠 Lemah",
  cukup: "🟡 Cukup",
  kuat: "🟢 Kuat",
  belum_diuji: "⚪ Belum diuji",
};

export function statusSubSkill(benar: number, total: number): StatusSubSkill {
  if (total < 3) return "belum_diuji";
  const persen = (benar / total) * 100;
  if (persen < 25) return "belum";
  if (persen < 60) return "lemah";
  if (persen < 80) return "cukup";
  return "kuat";
}

// 4.4 — 3 prioritas: belum dulu, lalu lemah, masing-masing dari persen terkecil.
export interface SkillProfileRow {
  subSkill: string;
  benar: number;
  total: number;
  status: StatusSubSkill;
}

export function tigaPrioritas(rows: SkillProfileRow[]): SkillProfileRow[] {
  const persen = (r: SkillProfileRow) => (r.total > 0 ? (r.benar / r.total) * 100 : 0);
  return rows
    .filter((r) => r.status === "belum" || r.status === "lemah")
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "belum" ? -1 : 1;
      return persen(a) - persen(b);
    })
    .slice(0, 3);
}

// Bagian 2 — normalisasi & penilaian jawaban tipe "gap".
export function normalisasiJawaban(nilai: string, caseSensitive: boolean): string {
  let hasil = nilai.trim();
  if (!caseSensitive) hasil = hasil.toLowerCase();
  return hasil.replace(/[.,!?;:]+$/, "");
}

export function cekJawabanBenar(
  jawabanUser: string,
  jawabanBenar: string | string[],
  caseSensitive: boolean
): boolean {
  const user = normalisasiJawaban(jawabanUser, caseSensitive);
  const daftarBenar = Array.isArray(jawabanBenar) ? jawabanBenar : [jawabanBenar];
  return daftarBenar.some((jb) => normalisasiJawaban(String(jb), caseSensitive) === user);
}
