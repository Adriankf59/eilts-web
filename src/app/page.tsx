import Link from "next/link";
import { getHariIniState, getRolling30, tentukanSesiAHariIni } from "@/lib/queries";
import { setelahJendelaTutup } from "@/lib/session-state";
import { mulaiSesi } from "@/lib/actions";
import { DEFAULT_USER_ID } from "@/lib/user";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Halaman ini bergantung pada tanggal/jam saat ini dan state sesi di DB — tidak boleh
// di-prerender statis saat build, harus dirender ulang tiap request.
export const dynamic = "force-dynamic";

// UI-REFERENSI.md 4.1 — layar ini harus terasa kosong, dan itu disengaja. Kartu max-w
// ~480px dipusatkan walau layar lebar; tombol Mulai satu-satunya elemen berwarna kuat.
function Kartu({ children }: { children: React.ReactNode }) {
  return <Card className="w-full max-w-[480px] p-8 text-center">{children}</Card>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs uppercase tracking-wide text-muted">{children}</p>;
}

export default async function HariIniPage() {
  const { hariIniStr, diagnosticDone, sesiA, sesiB } = await getHariIniState();
  const rolling = await getRolling30();
  const tanggal = new Date(`${hariIniStr}T00:00:00.000Z`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <p className="text-sm text-muted">{tanggal}</p>

      {!diagnosticDone && (
        <Kartu>
          <Label>Diagnostic — Tes Penempatan</Label>
          <h1 className="mt-3 text-2xl font-semibold">Cari tahu level Anda sekarang</h1>
          <Button asChild className="mt-6 w-full">
            <Link href="/diagnostic">Mulai</Link>
          </Button>
        </Kartu>
      )}

      {diagnosticDone && !sesiA && <SesiACard hariIniStr={hariIniStr} />}

      {diagnosticDone && sesiA?.status === "JALAN" && (
        <Kartu>
          <h1 className="text-xl font-semibold">Sesi A sedang berjalan</h1>
          <Button asChild className="mt-6 w-full">
            <Link href="/sesi?blok=A">Lanjutkan</Link>
          </Button>
        </Kartu>
      )}

      {diagnosticDone && sesiA?.status === "SELESAI" && !sesiB && (
        <Kartu>
          <Label>Sesi B · 25 menit</Label>
          <h1 className="mt-3 text-2xl font-semibold">Vocab SRS + Error Log</h1>
          <p className="mt-2 text-base text-muted">
            Kartu vocab kalau sudah diimpor, atau Anki di HP/laptop. Tulis error log di buku tulis.
          </p>
          <form action={mulaiSesi.bind(null, "B")}>
            <Button type="submit" className="mt-6 w-full">
              Mulai
            </Button>
          </form>
        </Kartu>
      )}

      {diagnosticDone && sesiA?.status === "SELESAI" && sesiB?.status === "JALAN" && (
        <Kartu>
          <h1 className="text-xl font-semibold">Sesi B sedang berjalan</h1>
          <Button asChild className="mt-6 w-full">
            <Link href="/sesi?blok=B">Lanjutkan</Link>
          </Button>
        </Kartu>
      )}

      {diagnosticDone && sesiA?.status === "SELESAI" && sesiB?.status === "SELESAI" && (
        <Kartu>
          <h1 className="text-xl font-semibold">Selesai. Sampai besok.</h1>
        </Kartu>
      )}

      <p className="text-xs text-muted">{rolling.label}</p>

      <div className="flex gap-4">
        <Link href="/tips" className="text-xs text-muted/60 hover:text-muted">
          tips
        </Link>
        <Link href="/backup" className="text-xs text-muted/60 hover:text-muted">
          backup
        </Link>
      </div>
    </main>
  );
}

async function SesiACard({ hariIniStr }: { hariIniStr: string }) {
  const jendelaTutup = setelahJendelaTutup();

  if (jendelaTutup) {
    return (
      <Kartu>
        <Label>Sesi minimum · 10 menit</Label>
        <h1 className="mt-3 text-2xl font-semibold">Vocab SRS — jendela hari ini sudah tutup</h1>
        <p className="mt-2 text-base text-muted">Ini tetap dihitung selesai. Besok kembali ke jadwal normal.</p>
        <form action={mulaiSesi.bind(null, "A")}>
          <Button type="submit" className="mt-6 w-full">
            Mulai
          </Button>
        </form>
      </Kartu>
    );
  }

  const kartu = await tentukanSesiAHariIni(DEFAULT_USER_ID, hariIniStr);
  return (
    <Kartu>
      <Label>Sesi A · 25 menit</Label>
      <h1 className="mt-3 text-2xl font-semibold">{kartu.judul}</h1>
      <p className="mt-2 text-sm text-muted">{kartu.lokasi}</p>
      <form action={mulaiSesi.bind(null, "A")}>
        <Button type="submit" className="mt-6 w-full">
          Mulai
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">Sesi B terkunci</p>
    </Kartu>
  );
}
