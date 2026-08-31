// State machine sesi (SPEC-v0.1.md Bagian 5).
import { jamJakarta } from "./hari-belajar";

export type SesiStatus = "BELUM" | "JALAN" | "JEDA" | "SELESAI" | "TURUN_MINIMUM";

export const DURASI_SESI_DETIK = 25 * 60;
export const DURASI_MINIMUM_DETIK = 10 * 60;
export const MENIT_MINIMUM_UNTUK_SELESAI_MANUAL = 10;
export const JENDELA_TUTUP_JAM = 21;

// Timer dipulihkan dari startedAt + plannedSeconds (bukan heartbeat tiap detik ke DB),
// supaya "tutup tab menit ke-12, buka lagi" otomatis lanjut dari sisa waktu yang benar.
export function sisaWaktuDetik(startedAt: Date, plannedSeconds: number, sekarang: Date = new Date()): number {
  const berlaluDetik = Math.floor((sekarang.getTime() - startedAt.getTime()) / 1000);
  return Math.max(0, plannedSeconds - berlaluDetik);
}

export function menitBerjalan(startedAt: Date, sekarang: Date = new Date()): number {
  return (sekarang.getTime() - startedAt.getTime()) / 1000 / 60;
}

// "Selesai" kalau timer habis, atau sudah >= 10 menit lalu ditutup manual.
export function bolehSelesaiManual(startedAt: Date, sekarang: Date = new Date()): boolean {
  return menitBerjalan(startedAt, sekarang) >= MENIT_MINIMUM_UNTUK_SELESAI_MANUAL;
}

// Jendela tutup jam 21:00 WIB — setelah itu sesi otomatis turun ke mode minimum.
export function setelahJendelaTutup(sekarang: Date = new Date()): boolean {
  return jamJakarta(sekarang) >= JENDELA_TUTUP_JAM;
}
