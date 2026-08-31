import Link from "next/link";
import { getRolling30 } from "@/lib/queries";
import { Button } from "@/components/ui/button";

// UI-REFERENSI.md 4.3 — dilarang: tombol "lanjut ke materi berikutnya", confetti/animasi,
// pujian kosong ("Kamu hebat!"), dan angka apa pun yang bisa turun ke nol.
export default async function SelesaiPage({
  searchParams,
}: {
  searchParams: Promise<{ blok?: string }>;
}) {
  const { blok } = await searchParams;
  const rolling = await getRolling30();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="text-3xl text-accent" aria-hidden>
        ✓
      </span>
      <h1 className="text-2xl font-semibold">Selesai. Sampai besok.</h1>
      {blok === "A" && <p className="text-base text-muted">Sesi B menunggu — vocab & error log.</p>}
      <p className="text-sm text-muted">{rolling.label}</p>
      <Button asChild variant="secondary" className="mt-4">
        <Link href="/">Tutup</Link>
      </Button>
    </main>
  );
}
