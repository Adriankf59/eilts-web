import { redirect } from "next/navigation";
import { DEFAULT_USER_ID } from "@/lib/user";
import { levelBlokAktif, type BlokHasil } from "@/lib/diagnostic-engine";
import { mulaiDiagnosticTahap } from "@/lib/actions";
import { getLatestDiagnosticSession, getQuestionsBySkillLevel, getQuestionsBySkill, getAllPassages } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import DiagnosticQuiz from "./DiagnosticQuiz";

export const dynamic = "force-dynamic";

function MulaiCard({ tahap, judul, deskripsi }: { tahap: 1 | 2 | 3; judul: string; deskripsi: string }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-xs uppercase tracking-wide text-muted">Diagnostic — Tahap {tahap}</p>
      <h1 className="text-xl font-semibold">{judul}</h1>
      <p className="max-w-[50ch] text-base leading-relaxed text-muted">{deskripsi}</p>
      <form action={mulaiDiagnosticTahap.bind(null, tahap)}>
        <Button type="submit" className="mt-2">
          Mulai
        </Button>
      </form>
    </main>
  );
}

export default async function DiagnosticPage() {
  const tahap1 = await getLatestDiagnosticSession(DEFAULT_USER_ID, 1);

  if (!tahap1 || tahap1.status === "berjalan") {
    if (!tahap1) {
      return (
        <MulaiCard
          tahap={1}
          judul="Grammar & Vocabulary Adaptif"
          deskripsi="Blok 10 soal, maksimal 3 blok. Level naik/turun mengikuti jawaban Anda."
        />
      );
    }

    const keputusan = levelBlokAktif(tahap1.riwayat as BlokHasil[]);
    if (keputusan.selesai || !keputusan.level) {
      // Riwayat sudah menunjukkan selesai tapi status DB belum ter-update (jarang terjadi) — muat ulang.
      redirect("/diagnostic");
    }

    const soal = await getQuestionsBySkillLevel("grammar", keputusan.level, tahap1.soalTerpakai, 10);
    const soalKurang = soal.length < 10;

    return (
      <DiagnosticQuiz
        tahap={1}
        sessionId={tahap1.id}
        judul={`Blok ${tahap1.riwayat.length + 1} — Level ${keputusan.level}`}
        soal={soal.map((s) => ({ id: s.id, prompt: s.prompt, tipe: s.tipe, opsi: s.opsi, passageId: s.passageId }))}
        passages={[]}
        catatan={soalKurang ? "Bank soal di level ini terbatas — memakai soal yang tersedia." : undefined}
      />
    );
  }

  const tahap2 = await getLatestDiagnosticSession(DEFAULT_USER_ID, 2);
  if (!tahap2 || tahap2.status === "berjalan") {
    if (!tahap2) {
      return (
        <MulaiCard
          tahap={2}
          judul="Listening Mini-test"
          deskripsi="10 soal gaya IELTS Listening — form completion, multiple choice, note completion."
        />
      );
    }
    const soal = await getQuestionsBySkill("listening", 10);
    return (
      <DiagnosticQuiz
        tahap={2}
        sessionId={tahap2.id}
        judul="Listening Mini-test"
        soal={soal.map((s) => ({ id: s.id, prompt: s.prompt, tipe: s.tipe, opsi: s.opsi, passageId: s.passageId }))}
        passages={[]}
      />
    );
  }

  const tahap3 = await getLatestDiagnosticSession(DEFAULT_USER_ID, 3);
  if (!tahap3 || tahap3.status === "berjalan") {
    if (!tahap3) {
      return (
        <MulaiCard
          tahap={3}
          judul="Reading GT Mini-test"
          deskripsi="13 soal dari 3 passage gaya IELTS General Training."
        />
      );
    }
    const [soal, passages] = await Promise.all([getQuestionsBySkill("reading", 13), getAllPassages()]);
    return (
      <DiagnosticQuiz
        tahap={3}
        sessionId={tahap3.id}
        judul="Reading GT Mini-test"
        soal={soal.map((s) => ({ id: s.id, prompt: s.prompt, tipe: s.tipe, opsi: s.opsi, passageId: s.passageId }))}
        passages={passages.map((p) => ({ id: p.id, judul: p.judul, teks: p.teks }))}
      />
    );
  }

  redirect("/hasil");
}
