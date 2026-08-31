import { redirect } from "next/navigation";
import Link from "next/link";
import { getLatestBandEstimate, getTigaPrioritas } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { BandRadarChart } from "@/components/BandRadarChart";

export const dynamic = "force-dynamic";

// UI-REFERENSI.md 4.4 — satu-satunya layar yang boleh padat (dibuka sebulan sekali).
// Radar chart 4 skill, label ± 0.5 wajib, hanya 3 prioritas yang tampil.
export default async function HasilPage() {
  const band = await getLatestBandEstimate();
  if (!band) {
    redirect("/diagnostic");
  }

  const prioritas = await getTigaPrioritas();

  return (
    <main className="mx-auto w-full max-w-[65ch] flex-1 p-6 leading-relaxed">
      <h1 className="text-2xl font-semibold">Estimasi Level Kamu Sekarang</h1>

      <Card className="mt-4 p-6">
        <div>
          <p className="text-sm text-muted">CEFR</p>
          <p className="text-2xl font-semibold">{band.cefrLevel ?? "-"}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span>
            <span className="text-muted">Listening </span>
            <span className="font-medium">{band.listening != null ? `${band.listening.toFixed(1)} ± 0.5` : "-"}</span>
          </span>
          <span>
            <span className="text-muted">Reading GT </span>
            <span className="font-medium">{band.reading != null ? `${band.reading.toFixed(1)} ± 0.5` : "-"}</span>
          </span>
        </div>

        <BandRadarChart listening={band.listening} reading={band.reading} writing={band.writing} speaking={band.speaking} />

        <p className="text-sm text-muted">
          Writing & Speaking belum diuji di v0.1 — dinilai sendiri pakai rubrik cetak untuk sementara. Estimasi ini
          bukan pengganti tes resmi.
        </p>
      </Card>

      <Card className="mt-6 p-6">
        <p className="text-base font-medium">3 Prioritas Utama</p>
        {prioritas.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Belum ada sub-skill yang perlu diprioritaskan.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {prioritas.map((p) => (
              <li key={p.subSkill} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  <StatusBadge status={p.status} />
                  {p.subSkill}
                </span>
                <span className="text-muted">{p.total > 0 ? `${Math.round((p.benar / p.total) * 100)}% benar` : "-"}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-8 flex justify-center pb-10">
        <Button asChild>
          <Link href="/">Mulai besok — sesi pertama</Link>
        </Button>
      </div>
    </main>
  );
}
