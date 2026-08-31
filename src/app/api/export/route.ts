import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { DEFAULT_USER_ID } from "@/lib/user";

// Backup manual — SPEC-v0.1.md Bagian 7: "localStorage bisa hilang kapan saja... backup
// manual ke file, seminggu sekali, cukup." Di sini datanya di Postgres (lebih tahan lama),
// tapi tombol export tetap disediakan sesuai kriteria terima Bagian 8.
export async function GET() {
  const userId = DEFAULT_USER_ID;

  const [user, diagnosticSessions, diagnosticAnswers, skillProfile, bandEstimates, studySessions] =
    await Promise.all([
      query("SELECT * FROM users WHERE id = $1", [userId]),
      query("SELECT * FROM diagnostic_sessions WHERE user_id = $1", [userId]),
      query(
        `SELECT da.* FROM diagnostic_answers da
         JOIN diagnostic_sessions ds ON ds.id = da.session_id WHERE ds.user_id = $1`,
        [userId]
      ),
      query("SELECT * FROM skill_profile WHERE user_id = $1", [userId]),
      query("SELECT * FROM band_estimates WHERE user_id = $1", [userId]),
      query("SELECT * FROM study_sessions WHERE user_id = $1", [userId]),
    ]);

  const dump = {
    versi: 1,
    diexpor: new Date().toISOString(),
    user: user[0] ?? null,
    diagnosticSessions,
    diagnosticAnswers,
    skillProfile,
    bandEstimates,
    studySessions,
  };

  return new NextResponse(JSON.stringify(dump, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="belajar-ielts-backup-${dump.diexpor.slice(0, 10)}.json"`,
    },
  });
}
