// SM-2 sederhana — RANCANGAN-WEBSITE-BELAJAR-IELTS.md Bagian 7.1.
// Interval awal: 1 hari. Mudah → ×2.5. Sulit → ×1.3. Salah → reset ke 1 hari,
// masuk antrian "leech" kalau sudah salah 5×.
export type HasilReview = "mudah" | "sulit" | "salah";

export const KARTU_BARU_PER_HARI = 15;
export const AMBANG_LEECH = 5;

export interface StateReview {
  intervalHari: number;
  jumlahSalah: number;
}

export function ulangKartu(state: StateReview, hasil: HasilReview): StateReview {
  if (hasil === "mudah") return { intervalHari: state.intervalHari * 2.5, jumlahSalah: state.jumlahSalah };
  if (hasil === "sulit") return { intervalHari: state.intervalHari * 1.3, jumlahSalah: state.jumlahSalah };
  return { intervalHari: 1, jumlahSalah: state.jumlahSalah + 1 };
}

export function isLeech(jumlahSalah: number): boolean {
  return jumlahSalah >= AMBANG_LEECH;
}

export function tanggalReviewBerikutnya(intervalHari: number, dariTanggal: Date = new Date()): string {
  const hasil = new Date(dariTanggal);
  hasil.setDate(hasil.getDate() + Math.max(1, Math.round(intervalHari)));
  return hasil.toISOString().slice(0, 10);
}
