import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { parseApkg, type KartuAnki } from "@/lib/anki-import";
import { query } from "@/lib/db";

const UKURAN_BATCH = 1000;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let kartu: KartuAnki[];
  try {
    kartu = parseApkg(buffer);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membaca file .apkg." },
      { status: 400 }
    );
  }

  // Dedupe dalam satu batch dulu — kalau "kata" yang sama muncul dua kali di baris VALUES
  // yang sama, ON CONFLICT bisa gagal atau berperilaku tidak terduga.
  const unikMap = new Map<string, KartuAnki>();
  for (const k of kartu) unikMap.set(k.kata, k);
  const unik = Array.from(unikMap.values());

  let ditambahkan = 0;
  for (let i = 0; i < unik.length; i += UKURAN_BATCH) {
    const batch = unik.slice(i, i + UKURAN_BATCH);
    const rows = await query(
      `INSERT INTO vocab_items (id, kata, arti, contoh)
       SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[])
       ON CONFLICT (kata) DO NOTHING RETURNING id`,
      [
        batch.map(() => randomUUID()),
        batch.map((k) => k.kata),
        batch.map((k) => k.arti),
        batch.map((k) => k.contoh),
      ]
    );
    ditambahkan += rows.length;
  }

  return NextResponse.json({
    ok: true,
    total: kartu.length,
    unik: unik.length,
    ditambahkan,
    duplikat: unik.length - ditambahkan,
  });
}
