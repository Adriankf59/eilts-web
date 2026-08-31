// Parser file .apkg Anki (zip berisi database SQLite "collection.anki2"/"collection.anki21").
// Diambil hanya isi kartu (flds — field dipisah karakter \x1f); tidak mengambil jadwal
// pengulangan Anki karena kita jalankan algoritma SM-2 kita sendiri (lib/spaced-repetition.ts).
//
// Deck Anki punya field BERNAMA (mis. "Word"/"IPA"/"Meaning"/"Arti") yang urutannya beda-beda
// antar deck dan bahkan antar note type dalam satu deck yang sama — tidak bisa diasumsikan
// field ke-0/1/2 selalu kata/arti/contoh. Nama field per note type disimpan di kolom
// `col.models` (JSON), dipetakan lewat `notes.mid`. Kalau model tidak ditemukan (jarang),
// baru jatuh ke asumsi posisi field 0/1/2.
import AdmZip from "adm-zip";
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface KartuAnki {
  kata: string;
  arti: string;
  contoh: string | null;
}

function bersihkanTeks(text: string): string {
  return text
    .replace(/\[sound:[^\]]*\]/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const POLA_KATA = [/^(word|english|front|term)$/i, /^(word|english|front|term)/i];
// Diurutkan berdasarkan prioritas: field "Arti"/"Indonesia" harus menang lebih dulu daripada
// "Meaning"/"Translation" yang generik — beberapa deck (mis. "4000 Essential Words EN-ID")
// punya field "Meaning" (definisi bahasa Inggris) DAN "Arti" (terjemahan Indonesia) sekaligus;
// findIndex akan salah pilih "Meaning" kalau pola-nya digabung jadi satu regex.
const POLA_ARTI = [/^(arti|indonesia)$/i, /(arti|indonesia)/i, /(meaning|translation|back)/i];
const POLA_CONTOH = [/^(contoh|example)$/i, /(contoh|example|sentence)/i];
const POLA_BUKAN_TEKS = /(sound|audio|image|img|transcription|ipa|phonetic|pengucapan)/i;

function cariField(namaField: string[], nilai: string[], polaBertingkat: RegExp[]): string | undefined {
  for (const pola of polaBertingkat) {
    const idx = namaField.findIndex((n) => pola.test(n) && !POLA_BUKAN_TEKS.test(n));
    if (idx >= 0) return nilai[idx];
  }
  return undefined;
}

interface ModelInfo {
  fieldNames: string[];
}

export function parseApkg(buffer: Buffer): KartuAnki[] {
  const zip = new AdmZip(buffer);
  const entry = zip.getEntry("collection.anki21") ?? zip.getEntry("collection.anki2");
  if (!entry) {
    throw new Error("File .apkg tidak valid — tidak ditemukan database collection di dalamnya.");
  }

  const tmpPath = join(tmpdir(), `anki-${randomUUID()}.sqlite`);
  writeFileSync(tmpPath, entry.getData());

  try {
    const db = new Database(tmpPath, { readonly: true });
    try {
      const modelById = new Map<string, ModelInfo>();
      try {
        const colRow = db.prepare("SELECT models FROM col LIMIT 1").get() as { models: string } | undefined;
        if (colRow?.models) {
          const models = JSON.parse(colRow.models) as Record<
            string,
            { flds: Array<{ name: string }> }
          >;
          for (const [mid, model] of Object.entries(models)) {
            modelById.set(mid, { fieldNames: model.flds.map((f) => f.name) });
          }
        }
      } catch {
        // Kolom `col.models` tidak terbaca — lanjut dengan fallback posisi field.
      }

      const rows = db.prepare("SELECT flds, mid FROM notes").all() as Array<{ flds: string; mid: number }>;
      const kartu: KartuAnki[] = [];

      for (const row of rows) {
        const nilai = row.flds.split("\x1f").map(bersihkanTeks);
        const model = modelById.get(String(row.mid));

        let kata: string | undefined;
        let arti: string | undefined;
        let contoh: string | undefined;

        if (model) {
          kata = cariField(model.fieldNames, nilai, POLA_KATA);
          arti = cariField(model.fieldNames, nilai, POLA_ARTI);
          contoh = cariField(model.fieldNames, nilai, POLA_CONTOH);
        }

        // Fallback: model tidak dikenali, atau field yang dicari tidak ketemu namanya.
        if (!kata) kata = nilai[0];
        if (!arti) arti = nilai[1];

        if (!kata || !arti || kata === arti) continue;
        kartu.push({ kata, arti, contoh: contoh || null });
      }
      return kartu;
    } finally {
      db.close();
    }
  } finally {
    unlinkSync(tmpPath);
  }
}
