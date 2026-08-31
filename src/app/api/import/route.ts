import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { DEFAULT_USER_ID } from "@/lib/user";

export async function POST(request: Request) {
  const userId = DEFAULT_USER_ID;
  const dump = await request.json();

  if (!dump || typeof dump !== "object" || dump.versi !== 1) {
    return NextResponse.json({ error: "Format file tidak dikenali." }, { status: 400 });
  }

  await withTransaction(async (client) => {
    await client.query(
      `DELETE FROM diagnostic_answers WHERE session_id IN
       (SELECT id FROM diagnostic_sessions WHERE user_id = $1)`,
      [userId]
    );
    await client.query("DELETE FROM diagnostic_sessions WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM skill_profile WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM band_estimates WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM study_sessions WHERE user_id = $1", [userId]);

    for (const s of dump.diagnosticSessions ?? []) {
      await client.query(
        `INSERT INTO diagnostic_sessions (id, user_id, tahap, status, riwayat, cefr_final, soal_terpakai, started_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          s.id,
          userId,
          s.tahap,
          s.status,
          JSON.stringify(s.riwayat),
          s.cefr_final,
          JSON.stringify(s.soal_terpakai),
          s.started_at,
          s.completed_at,
        ]
      );
    }
    for (const a of dump.diagnosticAnswers ?? []) {
      await client.query(
        `INSERT INTO diagnostic_answers (id, session_id, question_id, jawaban, benar, waktu_detik, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [a.id, a.session_id, a.question_id, JSON.stringify(a.jawaban), a.benar, a.waktu_detik, a.created_at]
      );
    }
    for (const p of dump.skillProfile ?? []) {
      await client.query(
        `INSERT INTO skill_profile (id, user_id, skill, sub_skill, benar, total, status, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [p.id, userId, p.skill, p.sub_skill, p.benar, p.total, p.status, p.updated_at]
      );
    }
    for (const b of dump.bandEstimates ?? []) {
      await client.query(
        `INSERT INTO band_estimates (id, user_id, listening, reading, writing, speaking, overall, cefr_level, sumber, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [b.id, userId, b.listening, b.reading, b.writing, b.speaking, b.overall, b.cefr_level, b.sumber, b.created_at]
      );
    }
    for (const s of dump.studySessions ?? []) {
      await client.query(
        `INSERT INTO study_sessions (id, user_id, hari_belajar, blok, skill, status, planned_seconds, started_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [s.id, userId, s.hari_belajar, s.blok, s.skill, s.status, s.planned_seconds, s.started_at, s.completed_at]
      );
    }
  });

  return NextResponse.json({ ok: true });
}
