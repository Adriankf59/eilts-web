import { query, queryOne } from "./db";
import { DEFAULT_USER_ID } from "./user";
import { hariBelajar, rolling30 } from "./hari-belajar";
import { statusSubSkill, tigaPrioritas, type SkillProfileRow } from "./diagnostic-engine";
import { KARTU_BARU_PER_HARI } from "./spaced-repetition";

export interface QuestionRow {
  id: string;
  skill: string;
  subSkill: string;
  level: string;
  tipe: string;
  prompt: string;
  audio: string | null;
  passageId: string | null;
  opsi: string[] | null;
  jawaban: string | string[];
  caseSensitive: boolean;
  penjelasan: string;
}

export interface PassageRow {
  id: string;
  section: number;
  judul: string;
  teks: string;
  sumber: string;
}

export interface StudySessionRow {
  id: string;
  userId: string;
  hariBelajar: string;
  blok: string;
  skill: string | null;
  status: string;
  plannedSeconds: number;
  startedAt: Date | null;
  completedAt: Date | null;
}

function mapQuestion(r: Record<string, unknown>): QuestionRow {
  return {
    id: r.id as string,
    skill: r.skill as string,
    subSkill: r.sub_skill as string,
    level: r.level as string,
    tipe: r.tipe as string,
    prompt: r.prompt as string,
    audio: (r.audio as string | null) ?? null,
    passageId: (r.passage_id as string | null) ?? null,
    opsi: (r.opsi as string[] | null) ?? null,
    jawaban: r.jawaban as string | string[],
    caseSensitive: r.case_sensitive as boolean,
    penjelasan: r.penjelasan as string,
  };
}

function mapPassage(r: Record<string, unknown>): PassageRow {
  return {
    id: r.id as string,
    section: r.section as number,
    judul: r.judul as string,
    teks: r.teks as string,
    sumber: r.sumber as string,
  };
}

function mapStudySession(r: Record<string, unknown>): StudySessionRow {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    hariBelajar: r.hari_belajar as string,
    blok: r.blok as string,
    skill: (r.skill as string | null) ?? null,
    status: r.status as string,
    plannedSeconds: r.planned_seconds as number,
    startedAt: (r.started_at as Date | null) ?? null,
    completedAt: (r.completed_at as Date | null) ?? null,
  };
}

const TAHAP_DIAGNOSTIC = [1, 2, 3] as const;

export async function diagnosticSelesai(userId: string = DEFAULT_USER_ID): Promise<boolean> {
  const rows = await query<{ tahap: number }>(
    "SELECT DISTINCT tahap FROM diagnostic_sessions WHERE user_id = $1 AND status = 'selesai' AND tahap = ANY($2)",
    [userId, TAHAP_DIAGNOSTIC as unknown as number[]]
  );
  return rows.length === TAHAP_DIAGNOSTIC.length;
}

export async function getRolling30(userId: string = DEFAULT_USER_ID) {
  const rows = await query<{ hari_belajar: string }>(
    "SELECT hari_belajar FROM study_sessions WHERE user_id = $1 AND status IN ('SELESAI', 'TURUN_MINIMUM')",
    [userId]
  );
  return rolling30(rows.map((r) => r.hari_belajar));
}

export async function getSkillProfileRows(userId: string = DEFAULT_USER_ID): Promise<SkillProfileRow[]> {
  const rows = await query<{ sub_skill: string; benar: number; total: number }>(
    "SELECT sub_skill, benar, total FROM skill_profile WHERE user_id = $1",
    [userId]
  );
  return rows.map((r) => ({
    subSkill: r.sub_skill,
    benar: r.benar,
    total: r.total,
    status: statusSubSkill(r.benar, r.total),
  }));
}

export async function getTigaPrioritas(userId: string = DEFAULT_USER_ID) {
  return tigaPrioritas(await getSkillProfileRows(userId));
}

export async function getLatestBandEstimate(userId: string = DEFAULT_USER_ID) {
  return queryOne<{
    listening: number | null;
    reading: number | null;
    writing: number | null;
    speaking: number | null;
    overall: number | null;
    cefr_level: string | null;
  }>(
    `SELECT listening, reading, writing, speaking, overall, cefr_level
     FROM band_estimates WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [userId]
  ).then((r) =>
    r
      ? {
          listening: r.listening,
          reading: r.reading,
          writing: r.writing,
          speaking: r.speaking,
          overall: r.overall,
          cefrLevel: r.cefr_level,
        }
      : null
  );
}

// Rotasi mingguan disederhanakan dari README/RANCANGAN Bagian 6.1: v0.1 hanya punya bank
// grammar/reading/listening (Writing & Speaking belum dibangun), jadi rotasi dipangkas ke
// tiga skill itu. Sabtu tetap "skill terlemah", sesuai dokumen.
async function skillTerlemah(userId: string): Promise<"grammar" | "reading" | "listening"> {
  const rows = await query<{ skill: string; benar: string; total: string }>(
    "SELECT skill, SUM(benar)::int as benar, SUM(total)::int as total FROM skill_profile WHERE user_id = $1 GROUP BY skill",
    [userId]
  );
  if (rows.length === 0) return "grammar";
  const bySkill = new Map(rows.map((r) => [r.skill, { benar: Number(r.benar), total: Number(r.total) }]));

  let terlemah: "grammar" | "reading" | "listening" = "grammar";
  let persenTerendah = Infinity;
  for (const skill of ["grammar", "reading", "listening"] as const) {
    const acc = bySkill.get(skill);
    const persen = acc && acc.total > 0 ? (acc.benar / acc.total) * 100 : 0;
    if (persen < persenTerendah) {
      persenTerendah = persen;
      terlemah = skill;
    }
  }
  return terlemah;
}

const SKILL_JUDUL: Record<string, string> = {
  grammar: "Grammar — Drilling",
  reading: "Reading GT — Latihan Bertimer",
  listening: "Listening — Latihan Soal",
};

// Tag lokasi per aktivitas — RANCANGAN-WEBSITE-BELAJAR-IELTS.md 2.8. Reading bertimer
// butuh fokus penuh di meja; grammar & listening cukup fleksibel dikerjakan di mana saja.
const SKILL_LOKASI: Record<string, string> = {
  grammar: "📍 bisa di mana saja",
  reading: "📍 butuh meja",
  listening: "🎧 bisa di mana saja",
};

export interface KartuSesiA {
  skill: "grammar" | "reading" | "listening";
  judul: string;
  jumlahSoal: number;
  lokasi: string;
}

export async function tentukanSesiAHariIni(userId: string, hariIniStr: string): Promise<KartuSesiA> {
  const weekday = new Date(`${hariIniStr}T00:00:00.000Z`).getUTCDay(); // 0=Minggu..6=Sabtu
  let skill: "grammar" | "reading" | "listening";
  switch (weekday) {
    case 1: // Senin
      skill = "listening";
      break;
    case 2: // Selasa
      skill = "reading";
      break;
    case 3: // Rabu
      skill = "grammar";
      break;
    case 4: // Kamis
      skill = "listening";
      break;
    case 5: // Jumat
      skill = "grammar";
      break;
    case 6: // Sabtu — skill terlemah
      skill = await skillTerlemah(userId);
      break;
    default: // Minggu — mini-review
      skill = "reading";
  }
  const jumlahSoal = skill === "reading" ? 13 : 10;
  return { skill, judul: SKILL_JUDUL[skill], jumlahSoal, lokasi: SKILL_LOKASI[skill] };
}

export async function getStudySession(
  userId: string,
  hariIniStr: string,
  blok: "A" | "B"
): Promise<StudySessionRow | null> {
  const row = await queryOne(
    "SELECT * FROM study_sessions WHERE user_id = $1 AND hari_belajar = $2 AND blok = $3",
    [userId, hariIniStr, blok]
  );
  return row ? mapStudySession(row) : null;
}

// Soal latihan Sesi A: prioritaskan sub-skill yang berstatus belum/lemah, isi sisanya acak.
// Tidak menulis jawaban individu ke DB — pelacakan kesalahan harian tetap di buku error log
// (RANCANGAN-WEBSITE-BELAJAR-IELTS.md 2.12), bukan didigitalkan di v0.1.
export async function getSoalSesiA(userId: string, skill: "grammar" | "reading" | "listening", jumlah: number) {
  const profil = await query<{ sub_skill: string; benar: number; total: number }>(
    "SELECT sub_skill, benar, total FROM skill_profile WHERE user_id = $1 AND skill = $2",
    [userId, skill]
  );
  const subSkillLemah = profil
    .filter((p) => statusSubSkill(p.benar, p.total) === "belum" || statusSubSkill(p.benar, p.total) === "lemah")
    .map((p) => p.sub_skill);

  const prioritasRows =
    subSkillLemah.length > 0
      ? await query(
          "SELECT * FROM questions WHERE skill = $1 AND sub_skill = ANY($2) LIMIT $3",
          [skill, subSkillLemah, jumlah]
        )
      : [];
  const prioritas = prioritasRows.map(mapQuestion);

  const sisa = jumlah - prioritas.length;
  const tambahanRows =
    sisa > 0
      ? await query(
          "SELECT * FROM questions WHERE skill = $1 AND NOT (id = ANY($2)) LIMIT $3",
          [skill, prioritas.map((p) => p.id), sisa]
        )
      : [];
  const tambahan = tambahanRows.map(mapQuestion);

  const soal = [...prioritas, ...tambahan];
  const passageIds = Array.from(new Set(soal.map((s) => s.passageId).filter((id): id is string => !!id)));
  const passageRows = passageIds.length > 0 ? await query("SELECT * FROM passages WHERE id = ANY($1)", [passageIds]) : [];

  return { soal, passages: passageRows.map(mapPassage) };
}

export async function getHariIniState(userId: string = DEFAULT_USER_ID) {
  const hariIniStr = hariBelajar();
  const [diagnosticDone, sesiA, sesiB] = await Promise.all([
    diagnosticSelesai(userId),
    getStudySession(userId, hariIniStr, "A"),
    getStudySession(userId, hariIniStr, "B"),
  ]);

  return { hariIniStr, diagnosticDone, sesiA, sesiB };
}

export async function getQuestionsByIds(ids: string[]): Promise<QuestionRow[]> {
  if (ids.length === 0) return [];
  const rows = await query("SELECT * FROM questions WHERE id = ANY($1)", [ids]);
  return rows.map(mapQuestion);
}

export async function getQuestionsBySkillLevel(
  skill: string,
  level: string,
  excludeIds: string[],
  take: number
): Promise<QuestionRow[]> {
  const rows = await query(
    "SELECT * FROM questions WHERE skill = $1 AND level = $2 AND NOT (id = ANY($3)) LIMIT $4",
    [skill, level, excludeIds, take]
  );
  return rows.map(mapQuestion);
}

export async function getQuestionsBySkill(skill: string, take: number): Promise<QuestionRow[]> {
  const rows = await query("SELECT * FROM questions WHERE skill = $1 LIMIT $2", [skill, take]);
  return rows.map(mapQuestion);
}

export async function getAllPassages(): Promise<PassageRow[]> {
  const rows = await query("SELECT * FROM passages");
  return rows.map(mapPassage);
}

export interface DiagnosticSessionRow {
  id: string;
  tahap: number;
  status: string;
  riwayat: Array<{ level: string; benar: number; total?: number; band?: number }>;
  cefrFinal: string | null;
  soalTerpakai: string[];
}

function mapDiagnosticSession(r: Record<string, unknown>): DiagnosticSessionRow {
  return {
    id: r.id as string,
    tahap: r.tahap as number,
    status: r.status as string,
    riwayat: (r.riwayat as DiagnosticSessionRow["riwayat"]) ?? [],
    cefrFinal: (r.cefr_final as string | null) ?? null,
    soalTerpakai: (r.soal_terpakai as string[]) ?? [],
  };
}

export interface VocabCardRow {
  id: string;
  kata: string;
  arti: string | null;
  contoh: string | null;
}

function mapVocabCard(r: Record<string, unknown>): VocabCardRow {
  return {
    id: r.id as string,
    kata: r.kata as string,
    arti: (r.arti as string | null) ?? null,
    contoh: (r.contoh as string | null) ?? null,
  };
}

// Antrian Vocab SRS hari ini: kartu yang jatuh tempo direview dulu, sisanya diisi kartu
// baru sampai batas 15/hari (RANCANGAN-WEBSITE-BELAJAR-IELTS.md 7.1 — jangan naikkan
// batas ini, beban review kartu lama akan menumpuk kalau dipaksa lebih banyak).
export async function getKartuVocabHariIni(userId: string): Promise<VocabCardRow[]> {
  const jatuhTempo = await query(
    `SELECT vi.id, vi.kata, vi.arti, vi.contoh
     FROM vocab_reviews vr JOIN vocab_items vi ON vi.id = vr.vocab_id
     WHERE vr.user_id = $1 AND vr.next_review <= CURRENT_DATE
     ORDER BY vr.next_review ASC`,
    [userId]
  );

  const sisaBaru = Math.max(0, KARTU_BARU_PER_HARI - jatuhTempo.length);
  const kartuBaru =
    sisaBaru > 0
      ? await query(
          `SELECT vi.id, vi.kata, vi.arti, vi.contoh FROM vocab_items vi
           WHERE NOT EXISTS (SELECT 1 FROM vocab_reviews vr WHERE vr.user_id = $1 AND vr.vocab_id = vi.id)
           ORDER BY vi.created_at ASC LIMIT $2`,
          [userId, sisaBaru]
        )
      : [];

  return [...jatuhTempo, ...kartuBaru].map(mapVocabCard);
}

export async function countVocabItems(): Promise<number> {
  const row = await queryOne<{ n: string }>("SELECT COUNT(*)::text as n FROM vocab_items");
  return row ? Number(row.n) : 0;
}

export async function getLatestDiagnosticSession(
  userId: string,
  tahap: number
): Promise<DiagnosticSessionRow | null> {
  const row = await queryOne(
    "SELECT * FROM diagnostic_sessions WHERE user_id = $1 AND tahap = $2 ORDER BY started_at DESC LIMIT 1",
    [userId, tahap]
  );
  return row ? mapDiagnosticSession(row) : null;
}
