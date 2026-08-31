"use client";

import { useState } from "react";
import { submitBlokGrammar, submitTahapListeningReading } from "@/lib/actions";
import { QuizFlow, type QuizSoal, type QuizPassage } from "@/components/QuizFlow";

export default function DiagnosticQuiz({
  tahap,
  sessionId,
  judul,
  soal,
  passages,
  catatan,
}: {
  tahap: 1 | 2 | 3;
  sessionId: string;
  judul: string;
  soal: QuizSoal[];
  passages: QuizPassage[];
  catatan?: string;
}) {
  const [mengirim, setMengirim] = useState(false);

  async function submit(jawabanList: Array<{ questionId: string; jawabanUser: string }>) {
    setMengirim(true);
    if (tahap === 1) {
      await submitBlokGrammar(sessionId, jawabanList);
    } else {
      await submitTahapListeningReading(tahap, sessionId, jawabanList);
    }
  }

  return (
    <main className="flex-1 p-6">
      <div className="mx-auto mb-6 w-full max-w-[65ch] text-center">
        <p className="text-xs uppercase tracking-wide text-muted">Diagnostic — Tahap {tahap}</p>
        <h1 className="mt-1 text-xl font-semibold">{judul}</h1>
        {catatan && <p className="mt-1 text-xs text-amber-700">{catatan}</p>}
      </div>

      {soal.length > 0 ? (
        <QuizFlow soal={soal} passages={passages} skill={tahap === 2 ? "listening" : null} mode="diagnostic" submitting={mengirim} onSubmit={submit} />
      ) : (
        <p className="text-center text-sm text-muted">Tidak ada soal tersedia.</p>
      )}
    </main>
  );
}
