-- Skema database v0.1 — dijalankan langsung ke Neon (lihat README di root).
-- Tidak pakai ORM (Prisma dilepas karena install-nya sangat berat dan versi 7
-- mengubah cara konfigurasi datasource). Akses DB pakai `pg` biasa, lihat src/lib/db.ts.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  target_band DOUBLE PRECISION NOT NULL DEFAULT 6.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS passages (
  id TEXT PRIMARY KEY,
  section INT NOT NULL,
  judul TEXT NOT NULL,
  teks TEXT NOT NULL,
  sumber TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  skill TEXT NOT NULL,
  sub_skill TEXT NOT NULL,
  level TEXT NOT NULL,
  tipe TEXT NOT NULL,
  prompt TEXT NOT NULL,
  audio TEXT,
  passage_id TEXT REFERENCES passages(id),
  opsi JSONB,
  jawaban JSONB NOT NULL,
  case_sensitive BOOLEAN NOT NULL DEFAULT false,
  penjelasan TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS questions_skill_subskill_level_idx ON questions (skill, sub_skill, level);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  urutan INT NOT NULL,
  judul TEXT NOT NULL,
  konten_md TEXT NOT NULL,
  fase INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS diagnostic_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  tahap INT NOT NULL,
  status TEXT NOT NULL,
  riwayat JSONB NOT NULL DEFAULT '[]',
  cefr_final TEXT,
  soal_terpakai JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS diagnostic_sessions_user_tahap_idx ON diagnostic_sessions (user_id, tahap);

CREATE TABLE IF NOT EXISTS diagnostic_answers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id TEXT NOT NULL REFERENCES diagnostic_sessions (id),
  question_id TEXT NOT NULL,
  jawaban JSONB NOT NULL,
  benar BOOLEAN NOT NULL,
  waktu_detik INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS diagnostic_answers_session_idx ON diagnostic_answers (session_id);

CREATE TABLE IF NOT EXISTS skill_profile (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  skill TEXT NOT NULL,
  sub_skill TEXT NOT NULL,
  benar INT NOT NULL,
  total INT NOT NULL,
  status TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, sub_skill)
);

CREATE TABLE IF NOT EXISTS band_estimates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  listening DOUBLE PRECISION,
  reading DOUBLE PRECISION,
  writing DOUBLE PRECISION,
  speaking DOUBLE PRECISION,
  overall DOUBLE PRECISION,
  cefr_level TEXT,
  sumber TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS band_estimates_user_idx ON band_estimates (user_id);

CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  hari_belajar TEXT NOT NULL,
  blok TEXT NOT NULL,
  skill TEXT,
  status TEXT NOT NULL,
  planned_seconds INT NOT NULL DEFAULT 1500,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, hari_belajar, blok)
);

-- Vocab SRS (v0.2 dipercepat atas permintaan eksplisit — lihat percakapan; awalnya v0.1
-- direncanakan tetap pakai Anki eksternal). Kartu diimpor dari file .apkg Anki.
CREATE TABLE IF NOT EXISTS vocab_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  kata TEXT NOT NULL,
  ipa TEXT,
  arti TEXT,
  contoh TEXT,
  sumber TEXT NOT NULL DEFAULT 'anki-import',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kata)
);

CREATE TABLE IF NOT EXISTS vocab_reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  vocab_id TEXT NOT NULL REFERENCES vocab_items (id),
  interval_hari DOUBLE PRECISION NOT NULL DEFAULT 1,
  next_review DATE NOT NULL DEFAULT CURRENT_DATE,
  jumlah_salah INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, vocab_id)
);
CREATE INDEX IF NOT EXISTS vocab_reviews_due_idx ON vocab_reviews (user_id, next_review);
