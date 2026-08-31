"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import AudioButton from "@/components/AudioButton";
import { extractQuestion } from "@/lib/tts";

export interface QuizSoal {
  id: string;
  prompt: string;
  tipe: string;
  opsi: string[] | null;
  passageId: string | null;
  jawaban?: string | string[];
  penjelasan?: string;
}

export interface QuizPassage {
  id: string;
  judul: string;
  teks: string;
}

const KUNCI_HINT = "ielts.hint.keyboard.shown";

// UI-REFERENSI.md 2.2 & 4.2 — model interaksi satu-fokus, keyboard-first:
// 1-4 pilih opsi · Enter konfirmasi/lanjut · → soal berikut · hint tombol tampil sekali saja.
export function QuizFlow({
  soal,
  passages,
  skill,
  mode,
  submitting,
  onSubmit,
}: {
  soal: QuizSoal[];
  passages: QuizPassage[];
  skill: string | null;
  mode: "practice" | "diagnostic";
  submitting: boolean;
  onSubmit: (jawaban: Array<{ questionId: string; jawabanUser: string }>) => void;
}) {
  const [index, setIndex] = useState(0);
  const [jawaban, setJawaban] = useState<Record<string, string>>({});
  const [dibuka, setDibuka] = useState(false);
  const [tampilkanHint, setTampilkanHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(KUNCI_HINT)) {
      setTampilkanHint(true);
      window.localStorage.setItem(KUNCI_HINT, "1");
    }
  }, []);

  const soalIni = soal[index];
  const passage = soalIni?.passageId ? passages.find((p) => p.id === soalIni.passageId) : undefined;
  const isGap = !soalIni?.opsi;

  useEffect(() => {
    if (isGap) inputRef.current?.focus();
  }, [index, isGap]);

  function pilih(opsi: string) {
    if (!soalIni) return;
    setJawaban((prev) => ({ ...prev, [soalIni.id]: opsi }));
  }

  function lanjut() {
    if (!soalIni) return;
    if (mode === "practice" && !dibuka) {
      setDibuka(true);
      return;
    }
    setDibuka(false);
    if (index < soal.length - 1) {
      setIndex(index + 1);
    } else {
      onSubmit(soal.map((s) => ({ questionId: s.id, jawabanUser: jawaban[s.id] ?? "" })));
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (submitting || !soalIni) return;
      if (document.activeElement === inputRef.current && e.key !== "Enter") return;

      if (soalIni.opsi && /^[1-4]$/.test(e.key)) {
        const opsi = soalIni.opsi[Number(e.key) - 1];
        if (opsi) pilih(opsi);
        return;
      }
      if (e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        lanjut();
        return;
      }
      if (e.key === " " && mode === "practice" && !dibuka) {
        e.preventDefault();
        setDibuka(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soalIni, jawaban, dibuka, index, submitting]);

  if (!soalIni) return null;

  return (
    <div className="mx-auto w-full max-w-[65ch]">
      {tampilkanHint && (
        <p className="mb-4 text-center text-xs text-muted">
          {soalIni.opsi ? "1–4 pilih opsi · " : ""}Enter atau → lanjut
        </p>
      )}

      <p className="mb-3 text-center text-xs text-muted">
        {index + 1} dari {soal.length}
      </p>

      {passage && (
        <details className="mb-4 rounded-[var(--radius)] border border-card-border p-4 text-sm leading-relaxed">
          <summary className="cursor-pointer font-medium">{passage.judul}</summary>
          <p className="mt-2 whitespace-pre-line font-serif">{passage.teks}</p>
        </details>
      )}

      <Card className="p-6">
        {skill === "listening" && (
          <div className="mb-3">
            <AudioButton text={soalIni.prompt} />
          </div>
        )}
        <p className="text-lg font-medium leading-relaxed">
          {skill === "listening" ? extractQuestion(soalIni.prompt) : soalIni.prompt}
        </p>

        {soalIni.opsi ? (
          <RadioGroup
            value={jawaban[soalIni.id] ?? ""}
            onValueChange={pilih}
            className="mt-5 space-y-3"
          >
            {soalIni.opsi.map((opsi, i) => (
              <label key={opsi} className="flex items-center gap-3 text-base">
                <RadioItem value={opsi} id={`${soalIni.id}-${i}`} />
                <span className="text-xs text-muted">{i + 1}</span>
                {opsi}
              </label>
            ))}
          </RadioGroup>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={jawaban[soalIni.id] ?? ""}
            onChange={(e) => pilih(e.target.value)}
            className="mt-5 w-full rounded-[var(--radius)] border border-card-border bg-background px-4 py-3 text-base outline-none focus:border-accent"
            placeholder="Jawaban Anda"
          />
        )}

        {mode === "practice" && !dibuka && (
          <Button type="button" variant="ghost" className="mt-4 h-auto min-h-0 px-0" onClick={() => setDibuka(true)}>
            Cek jawaban
          </Button>
        )}

        {mode === "practice" && dibuka && soalIni.jawaban && (
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Kunci: <span className="font-medium text-foreground">{Array.isArray(soalIni.jawaban) ? soalIni.jawaban[0] : soalIni.jawaban}</span>
            {soalIni.penjelasan ? ` — ${soalIni.penjelasan}` : ""}
          </p>
        )}
      </Card>

      <div className="mt-6 flex justify-center">
        <Button type="button" disabled={submitting} onClick={() => lanjut()}>
          {index < soal.length - 1 ? "Lanjut" : "Selesai"}
        </Button>
      </div>
    </div>
  );
}
