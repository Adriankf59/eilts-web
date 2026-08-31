import { redirect } from "next/navigation";
import { DEFAULT_USER_ID } from "@/lib/user";
import { hariBelajar } from "@/lib/hari-belajar";
import { getSoalSesiA, getStudySession, getKartuVocabHariIni } from "@/lib/queries";
import SesiClient from "./SesiClient";

export default async function SesiPage({
  searchParams,
}: {
  searchParams: Promise<{ blok?: string }>;
}) {
  const { blok: blokParam } = await searchParams;
  const blok = blokParam === "B" ? "B" : "A";
  const userId = DEFAULT_USER_ID;
  const hariIniStr = hariBelajar();

  const sesi = await getStudySession(userId, hariIniStr, blok);

  if (!sesi || sesi.status !== "JALAN" || !sesi.startedAt) {
    redirect("/");
  }

  let soal: Awaited<ReturnType<typeof getSoalSesiA>>["soal"] = [];
  let passages: Awaited<ReturnType<typeof getSoalSesiA>>["passages"] = [];
  if (blok === "A" && sesi.skill) {
    const jumlah = sesi.skill === "reading" ? 13 : 10;
    const hasil = await getSoalSesiA(userId, sesi.skill as "grammar" | "reading" | "listening", jumlah);
    soal = hasil.soal;
    passages = hasil.passages;
  }

  const vocab = blok === "B" ? await getKartuVocabHariIni(userId) : [];

  return (
    <SesiClient
      blok={blok}
      startedAtIso={sesi.startedAt.toISOString()}
      plannedSeconds={sesi.plannedSeconds}
      skill={sesi.skill}
      soal={soal.map((s) => ({
        id: s.id,
        prompt: s.prompt,
        tipe: s.tipe,
        opsi: s.opsi,
        jawaban: s.jawaban,
        penjelasan: s.penjelasan,
        passageId: s.passageId,
      }))}
      passages={passages.map((p) => ({ id: p.id, judul: p.judul, teks: p.teks }))}
      vocab={vocab}
    />
  );
}
