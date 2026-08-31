// Satu hari belajar = 04:00 WIB hari ini s/d 03:59 WIB besok (SPEC-v0.1.md 5.1).
// Server bisa berjalan di UTC, jadi offset WIB (UTC+7) diterapkan eksplisit di sini,
// bukan mengandalkan timezone environment.
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export function toJakarta(waktu: Date): Date {
  return new Date(waktu.getTime() + WIB_OFFSET_MS);
}

export function jamJakarta(waktu: Date = new Date()): number {
  return toJakarta(waktu).getUTCHours();
}

export function hariBelajar(waktu: Date = new Date()): string {
  const j = toJakarta(waktu);
  if (j.getUTCHours() < 4) {
    j.setUTCDate(j.getUTCDate() - 1);
  }
  return j.toISOString().slice(0, 10);
}

// Penghitung bergulir (SPEC 6). Tidak pernah reset ke 0 secara "dramatis" —
// hanya turun/naik mengikuti jumlah hari selesai dalam 30 hari terakhir.
export function rolling30(tanggalSelesai: string[], sekarang: Date = new Date()) {
  const hariIni = hariBelajar(sekarang);
  const batas = new Date(`${hariIni}T00:00:00.000Z`);
  batas.setUTCDate(batas.getUTCDate() - 29);
  const unik = Array.from(new Set(tanggalSelesai));
  const n = unik.filter((d) => new Date(`${d}T00:00:00.000Z`) >= batas).length;
  return { n, label: `${n} dari 30 hari terakhir` };
}
