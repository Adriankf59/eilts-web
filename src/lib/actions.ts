"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { query, queryOne, withTransaction } from "./db";
import { DEFAULT_USER_ID } from "./user";
import { hariBelajar } from "./hari-belajar";
import {
  DURASI_MINIMUM_DETIK,
  DURASI_SESI_DETIK,
  bolehSelesaiManual,
  setelahJendelaTutup,
} from "./session-state";
import {
  cekJawabanBenar,
  cefrFinalDari,
  keputusanBlokSelanjutnya,
  levelBlokAktif,
  estimasiBandListening,
  estimasiBandReading,
  statusSubSkill,
  type BlokHasil,
} from "./diagnostic-engine";
import { tentukanSesiAHariIni, getQuestionsByIds } from "./queries";
import { ulangKartu, tanggalReviewBerikutnya, type HasilReview } from "./spaced-repetition";

// ---------- Sesi harian (Hari Ini / Sesi Berjalan / Selesai) — SPEC Bagian 5 ----------

export async function mulaiSesi(blok: "A" | "B") {
  const userId = DEFAULT_USER_ID;
  const hariIniStr = hariBelajar();

  if (blok === "B") {
    const sesiA = await queryOne<{ status: string }>(
      "SELECT status FROM study_sessions WHERE user_id = $1 AND hari_belajar = $2 AND blok = 'A'",
      [userId, hariIniStr]
    );
    if (!sesiA || sesiA.status !== "SELESAI") {
      throw new Error("Sesi B terkunci sampai Sesi A selesai.");
    }
  }

  const existing = await queryOne(
    "SELECT id FROM study_sessions WHERE user_id = $1 AND hari_belajar = $2 AND blok = $3",
    [userId, hariIniStr, blok]
  );

  if (existing) {
    // Sudah pernah dimulai (atau sudah selesai) — tidak reset startedAt, cukup lanjut.
    redirect(`/sesi?blok=${blok}`);
  }

  const jendelaTutup = setelahJendelaTutup();
  const plannedSeconds = jendelaTutup ? DURASI_MINIMUM_DETIK : DURASI_SESI_DETIK;

  let skill: string | null = null;
  if (blok === "A" && !jendelaTutup) {
    const kartu = await tentukanSesiAHariIni(userId, hariIniStr);
    skill = kartu.skill;
  }

  await query(
    `INSERT INTO study_sessions (id, user_id, hari_belajar, blok, skill, status, planned_seconds, started_at)
     VALUES ($1, $2, $3, $4, $5, 'JALAN', $6, now())`,
    [randomUUID(), userId, hariIniStr, blok, skill, plannedSeconds]
  );

  redirect(`/sesi?blok=${blok}`);
}

export async function selesaikanSesi(blok: "A" | "B", cara: "otomatis" | "manual") {
  const userId = DEFAULT_USER_ID;
  const hariIniStr = hariBelajar();

  const sesi = await queryOne<{ id: string; status: string; started_at: Date | null }>(
    "SELECT id, status, started_at FROM study_sessions WHERE user_id = $1 AND hari_belajar = $2 AND blok = $3",
    [userId, hariIniStr, blok]
  );
  if (!sesi || sesi.status !== "JALAN" || !sesi.started_at) {
    redirect("/");
  }

  // "Berhenti di menit ke-6 → tidak dihitung, tanpa pesan menyalahkan" (SPEC 8) —
  // kalau belum >= 10 menit dan bukan timer habis, jangan tandai selesai.
  if (cara === "manual" && !bolehSelesaiManual(sesi.started_at)) {
    redirect("/");
  }

  await query("UPDATE study_sessions SET status = 'SELESAI', completed_at = now() WHERE id = $1", [sesi.id]);

  redirect(`/selesai?blok=${blok}`);
}

// ---------- Vocab SRS — RANCANGAN-WEBSITE-BELAJAR-IELTS.md 7.1 ----------

export async function reviewVocab(vocabId: string, hasil: HasilReview) {
  const userId = DEFAULT_USER_ID;
  const existing = await queryOne<{ interval_hari: number; jumlah_salah: number }>(
    "SELECT interval_hari, jumlah_salah FROM vocab_reviews WHERE user_id = $1 AND vocab_id = $2",
    [userId, vocabId]
  );
  const stateLama = existing
    ? { intervalHari: existing.interval_hari, jumlahSalah: existing.jumlah_salah }
    : { intervalHari: 1, jumlahSalah: 0 };
  const stateBaru = ulangKartu(stateLama, hasil);
  const nextReview = tanggalReviewBerikutnya(stateBaru.intervalHari);

  await query(
    `INSERT INTO vocab_reviews (id, user_id, vocab_id, interval_hari, next_review, jumlah_salah)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, vocab_id)
     DO UPDATE SET interval_hari = EXCLUDED.interval_hari, next_review = EXCLUDED.next_review,
                    jumlah_salah = EXCLUDED.jumlah_salah, updated_at = now()`,
    [randomUUID(), userId, vocabId, stateBaru.intervalHari, nextReview, stateBaru.jumlahSalah]
  );
}

// ---------- Diagnostic Engine — SPEC Bagian 4 ----------

export async function mulaiDiagnosticTahap(tahap: 1 | 2 | 3) {
  const userId = DEFAULT_USER_ID;
  const existing = await queryOne(
    "SELECT id FROM diagnostic_sessions WHERE user_id = $1 AND tahap = $2 AND status = 'berjalan'",
    [userId, tahap]
  );
  if (!existing) {
    const sudahSelesai = await queryOne(
      "SELECT id FROM diagnostic_sessions WHERE user_id = $1 AND tahap = $2 AND status = 'selesai'",
      [userId, tahap]
    );
    if (!sudahSelesai) {
      await query(
        `INSERT INTO diagnostic_sessions (id, user_id, tahap, status, riwayat, soal_terpakai)
         VALUES ($1, $2, $3, 'berjalan', '[]', '[]')`,
        [randomUUID(), userId, tahap]
      );
    }
  }
  redirect("/diagnostic");
}

interface JawabanMasuk {
  questionId: string;
  jawabanUser: string;
  waktuDetik?: number;
}

async function simpanJawaban(sessionId: string, jawabanList: JawabanMasuk[]) {
  const questions = await getQuestionsByIds(jawabanList.map((j) => j.questionId));
  const byId = new Map(questions.map((q) => [q.id, q]));

  let benarCount = 0;
  for (const j of jawabanList) {
    const q = byId.get(j.questionId);
    if (!q) continue;
    const benar = cekJawabanBenar(j.jawabanUser, q.jawaban, q.caseSensitive);
    if (benar) benarCount++;
    await query(
      `INSERT INTO diagnostic_answers (id, session_id, question_id, jawaban, benar, waktu_detik)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [randomUUID(), sessionId, j.questionId, JSON.stringify(j.jawabanUser), benar, j.waktuDetik ?? null]
    );
  }
  return { benarCount };
}

// Tahap 1 — submit satu blok (10 jawaban) grammar adaptif.
export async function submitBlokGrammar(sessionId: string, jawabanList: JawabanMasuk[]) {
  const session = await queryOne<{ riwayat: BlokHasil[]; soal_terpakai: string[] }>(
    "SELECT riwayat, soal_terpakai FROM diagnostic_sessions WHERE id = $1",
    [sessionId]
  );
  if (!session) redirect("/diagnostic");

  const { benarCount } = await simpanJawaban(sessionId, jawabanList);

  const riwayatLama = session!.riwayat ?? [];
  const keputusanBlokIni = levelBlokAktif(riwayatLama);
  if (keputusanBlokIni.selesai || !keputusanBlokIni.level) {
    // Sesi ini seharusnya sudah ditandai selesai sebelum blok baru disubmit — jangan lanjut.
    redirect("/diagnostic");
  }
  const riwayatBaru: BlokHasil[] = [...riwayatLama, { level: keputusanBlokIni.level, benar: benarCount }];

  const soalTerpakaiLama = session!.soal_terpakai ?? [];
  const soalTerpakaiBaru = [...soalTerpakaiLama, ...jawabanList.map((j) => j.questionId)];

  const keputusan = keputusanBlokSelanjutnya(riwayatBaru);

  if (keputusan.selesai) {
    const cefrFinal = cefrFinalDari(riwayatBaru);
    await query(
      `UPDATE diagnostic_sessions
       SET riwayat = $1, soal_terpakai = $2, status = 'selesai', cefr_final = $3, completed_at = now()
       WHERE id = $4`,
      [JSON.stringify(riwayatBaru), JSON.stringify(soalTerpakaiBaru), cefrFinal, sessionId]
    );
    await mungkinFinalisasiHasil();
  } else {
    await query("UPDATE diagnostic_sessions SET riwayat = $1, soal_terpakai = $2 WHERE id = $3", [
      JSON.stringify(riwayatBaru),
      JSON.stringify(soalTerpakaiBaru),
      sessionId,
    ]);
  }

  redirect("/diagnostic");
}

// Tahap 2 (listening) / Tahap 3 (reading) — satu blok saja, tidak adaptif.
export async function submitTahapListeningReading(
  tahap: 2 | 3,
  sessionId: string,
  jawabanList: JawabanMasuk[]
) {
  const { benarCount } = await simpanJawaban(sessionId, jawabanList);
  const total = jawabanList.length;
  const bandEstimasi = tahap === 2 ? estimasiBandListening(benarCount) : estimasiBandReading(benarCount);

  await query(
    `UPDATE diagnostic_sessions
     SET riwayat = $1, soal_terpakai = $2, status = 'selesai', completed_at = now()
     WHERE id = $3`,
    [
      JSON.stringify([{ level: "-", benar: benarCount, total, band: bandEstimasi }]),
      JSON.stringify(jawabanList.map((j) => j.questionId)),
      sessionId,
    ]
  );

  await mungkinFinalisasiHasil();
  redirect("/diagnostic");
}

// Setelah tahap 1-3 semua selesai: hitung SkillProfile per sub-skill (4.3) dan BandEstimate.
async function mungkinFinalisasiHasil() {
  const userId = DEFAULT_USER_ID;
  const sesiSelesai = await Promise.all(
    [1, 2, 3].map((tahap) =>
      queryOne<{ id: string; riwayat: Array<{ band: number }>; cefr_final: string | null }>(
        "SELECT id, riwayat, cefr_final FROM diagnostic_sessions WHERE user_id = $1 AND tahap = $2 AND status = 'selesai'",
        [userId, tahap]
      )
    )
  );
  if (!sesiSelesai.every(Boolean)) return;

  const sudahAda = await queryOne(
    "SELECT id FROM band_estimates WHERE user_id = $1 AND sumber = 'diagnostic'",
    [userId]
  );
  if (sudahAda) return; // sudah difinalisasi sebelumnya

  const semuaJawaban = await query<{ question_id: string; benar: boolean }>(
    `SELECT da.question_id, da.benar
     FROM diagnostic_answers da
     JOIN diagnostic_sessions ds ON ds.id = da.session_id
     WHERE ds.user_id = $1 AND ds.status = 'selesai'`,
    [userId]
  );
  const questionIds = Array.from(new Set(semuaJawaban.map((a) => a.question_id)));
  const questions = await getQuestionsByIds(questionIds);
  const questionById = new Map(questions.map((q) => [q.id, q]));

  const perSubSkill = new Map<string, { skill: string; benar: number; total: number }>();
  for (const jawaban of semuaJawaban) {
    const q = questionById.get(jawaban.question_id);
    if (!q) continue;
    const acc = perSubSkill.get(q.subSkill) ?? { skill: q.skill, benar: 0, total: 0 };
    acc.total += 1;
    if (jawaban.benar) acc.benar += 1;
    perSubSkill.set(q.subSkill, acc);
  }

  await withTransaction(async (client) => {
    for (const [subSkill, acc] of perSubSkill.entries()) {
      await client.query(
        `INSERT INTO skill_profile (id, user_id, skill, sub_skill, benar, total, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id, sub_skill)
         DO UPDATE SET skill = EXCLUDED.skill, benar = EXCLUDED.benar, total = EXCLUDED.total,
                        status = EXCLUDED.status, updated_at = now()`,
        [randomUUID(), userId, acc.skill, subSkill, acc.benar, acc.total, statusSubSkill(acc.benar, acc.total)]
      );
    }
  });

  const [sesiTahap1, sesiTahap2, sesiTahap3] = sesiSelesai as NonNullable<(typeof sesiSelesai)[number]>[];

  await query(
    `INSERT INTO band_estimates (id, user_id, listening, reading, writing, speaking, overall, cefr_level, sumber)
     VALUES ($1, $2, $3, $4, NULL, NULL, NULL, $5, 'diagnostic')`,
    [
      randomUUID(),
      userId,
      sesiTahap2.riwayat[0]?.band ?? null,
      sesiTahap3.riwayat[0]?.band ?? null,
      sesiTahap1.cefr_final,
    ]
  );
}
