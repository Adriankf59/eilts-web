"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { selesaikanSesi, reviewVocab } from "@/lib/actions";
import type { HasilReview } from "@/lib/spaced-repetition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuizFlow, type QuizSoal, type QuizPassage } from "@/components/QuizFlow";

interface VocabCard {
  id: string;
  kata: string;
  arti: string | null;
  contoh: string | null;
}

const MENIT_MINIMUM_UNTUK_SELESAI_MANUAL = 10;
const AMBANG_WAKTU_KRITIS_DETIK = 120;

function formatWaktu(totalDetik: number) {
  const menit = Math.floor(totalDetik / 60);
  const detik = totalDetik % 60;
  return `${String(menit).padStart(2, "0")}:${String(detik).padStart(2, "0")}`;
}

// UI-REFERENSI.md 4.2 — fullscreen sungguhan, timer kecil & tak berwarna sampai sisa
// 2 menit, tanpa navigasi apa pun. Satu-satunya jalan keluar: "Sudah cukup" yang ditaruh
// agak jauh dari alur utama.
export default function SesiClient({
  blok,
  startedAtIso,
  plannedSeconds,
  skill,
  soal,
  passages,
  vocab,
}: {
  blok: "A" | "B";
  startedAtIso: string;
  plannedSeconds: number;
  skill: string | null;
  soal: QuizSoal[];
  passages: QuizPassage[];
  vocab: VocabCard[];
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [fullscreenAktif, setFullscreenAktif] = useState(false);

  const startedAtMs = useMemo(() => new Date(startedAtIso).getTime(), [startedAtIso]);
  const [sisaDetik, setSisaDetik] = useState(() =>
    Math.max(0, plannedSeconds - Math.floor((Date.now() - startedAtMs) / 1000))
  );
  const [sudahSelesaiOtomatis, setSudahSelesaiOtomatis] = useState(false);

  useEffect(() => {
    void rootRef.current?.requestFullscreen?.().catch(() => {});
    function onChange() {
      setFullscreenAktif(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onChange);
    onChange();
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSisaDetik(Math.max(0, plannedSeconds - Math.floor((Date.now() - startedAtMs) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [plannedSeconds, startedAtMs]);

  useEffect(() => {
    if (sisaDetik === 0 && !sudahSelesaiOtomatis) {
      setSudahSelesaiOtomatis(true);
      void selesaikanSesi(blok, "otomatis");
    }
  }, [sisaDetik, sudahSelesaiOtomatis, blok]);

  const menitBerjalan = (Date.now() - startedAtMs) / 1000 / 60;
  const bolehSelesaiManual = menitBerjalan >= MENIT_MINIMUM_UNTUK_SELESAI_MANUAL;
  const kritis = sisaDetik <= AMBANG_WAKTU_KRITIS_DETIK;

  const [mengirim, setMengirim] = useState(false);
  const submitPraktik = useCallback(() => {
    // Latihan harian tidak dinilai/disimpan per-jawaban (error log tetap di buku tulis —
    // lihat RANCANGAN-WEBSITE-BELAJAR-IELTS.md 2.12) — submit di sini cuma menutup putaran.
    setMengirim(true);
    setMengirim(false);
  }, []);

  return (
    <div ref={rootRef} className="fixed inset-0 flex flex-col overflow-y-auto bg-background">
      <div className="flex items-center justify-between px-6 py-4">
        <p
          className={`font-mono text-sm tabular-nums ${kritis ? "font-semibold text-[var(--status-belum-fg)]" : "text-muted"}`}
        >
          {formatWaktu(sisaDetik)}
        </p>
        <p className="text-xs text-muted">
          Sesi {blok} {skill ? `· ${skill}` : ""}
        </p>
      </div>

      {!fullscreenAktif && (
        <button
          type="button"
          onClick={() => void rootRef.current?.requestFullscreen?.().catch(() => {})}
          className="mx-6 mb-2 rounded-[var(--radius)] px-4 py-2 text-left text-xs"
          style={{ backgroundColor: "var(--status-lemah-bg)", color: "var(--status-lemah-fg)" }}
        >
          Keluar dari fullscreen menjeda fokus Anda — klik untuk kembali.
        </button>
      )}

      <div className="flex-1 px-6 pb-10">
        {blok === "B" && vocab.length > 0 && <VocabReview kartuAwal={vocab} />}

        {blok === "B" && vocab.length === 0 && (
          <Card className="mx-auto max-w-[480px] p-6 text-center">
            <p className="text-lg font-medium">Belum ada kartu Vocab</p>
            <p className="mt-2 text-base text-muted">
              Impor deck Anki (.apkg) dulu, atau pakai Anki di HP/laptop untuk sesi ini. Jangan lupa tulis error log
              di buku tulis.
            </p>
            <Link href="/vocab/import" className="mt-3 inline-block text-sm text-accent underline underline-offset-2">
              Impor deck Anki
            </Link>
          </Card>
        )}

        {blok === "A" && !skill && (
          <Card className="mx-auto max-w-[480px] p-6 text-center">
            <p className="text-lg font-medium">Sesi minimum — jendela hari ini sudah tutup</p>
            <p className="mt-2 text-base text-muted">
              Buka Anki di HP/laptop untuk Vocab SRS 10 menit. Ini tetap dihitung selesai.
            </p>
          </Card>
        )}

        {blok === "A" && soal.length > 0 && (
          <QuizFlow soal={soal} passages={passages} skill={skill} mode="practice" submitting={mengirim} onSubmit={submitPraktik} />
        )}
      </div>

      <div className="flex justify-center pb-10">
        <Button
          type="button"
          variant="secondary"
          disabled={!bolehSelesaiManual}
          onClick={() => void selesaikanSesi(blok, "manual")}
        >
          Sudah cukup
        </Button>
      </div>
    </div>
  );
}

function VocabReview({ kartuAwal }: { kartuAwal: VocabCard[] }) {
  const [antrian, setAntrian] = useState(kartuAwal);
  const [dibuka, setDibuka] = useState(false);
  const [mengirim, setMengirim] = useState(false);
  const kartu = antrian[0];

  const nilai = useCallback(
    async (hasil: HasilReview) => {
      if (!kartu || mengirim) return;
      setMengirim(true);
      await reviewVocab(kartu.id, hasil);
      setAntrian((prev) => prev.slice(1));
      setDibuka(false);
      setMengirim(false);
    },
    [kartu, mengirim]
  );

  // UI-REFERENSI.md 4.5 — Space buka jawaban, 1-4 menilai, tanpa mouse sama sekali.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!kartu || mengirim) return;
      if (e.key === " " && !dibuka) {
        e.preventDefault();
        setDibuka(true);
        return;
      }
      if (!dibuka) return;
      if (e.key === "1") void nilai("salah");
      if (e.key === "2") void nilai("sulit");
      if (e.key === "3") void nilai("mudah");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [kartu, mengirim, dibuka, nilai]);

  if (!kartu) {
    return (
      <Card className="mx-auto max-w-[480px] p-6 text-center">
        <p className="text-lg font-medium">Kartu hari ini selesai</p>
        <p className="mt-2 text-base text-muted">Lanjutkan dengan menulis error log di buku tulis.</p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-[480px] p-8 text-center">
      <p className="text-xs text-muted">{antrian.length} kartu tersisa</p>
      <p className="mt-4 text-2xl font-semibold">{kartu.kata}</p>

      {!dibuka ? (
        <Button type="button" className="mt-6" onClick={() => setDibuka(true)}>
          Tampilkan arti <span className="ml-2 text-xs opacity-60">Space</span>
        </Button>
      ) : (
        <>
          {kartu.arti && <p className="mt-3 text-base text-muted">{kartu.arti}</p>}
          {kartu.contoh && <p className="mt-1 text-sm italic text-muted">{kartu.contoh}</p>}
          <div className="mt-6 flex justify-center gap-3">
            <Button type="button" variant="secondary" disabled={mengirim} onClick={() => void nilai("salah")}>
              Salah <span className="ml-1.5 text-xs opacity-60">1</span>
            </Button>
            <Button type="button" variant="secondary" disabled={mengirim} onClick={() => void nilai("sulit")}>
              Sulit <span className="ml-1.5 text-xs opacity-60">2</span>
            </Button>
            <Button type="button" variant="secondary" disabled={mengirim} onClick={() => void nilai("mudah")}>
              Mudah <span className="ml-1.5 text-xs opacity-60">3</span>
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
