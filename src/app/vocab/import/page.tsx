"use client";

import { useState } from "react";

export default function ImportVocabPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setStatus("Membaca file...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/vocab/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mengimpor.");
      setStatus(`Selesai: ${data.total} kartu ditemukan, ${data.ditambahkan} baru ditambahkan (${data.duplikat} sudah ada).`);
    } catch (err) {
      setStatus(`Gagal: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 p-6">
      <h1 className="text-lg font-semibold">Impor Deck Anki</h1>
      <p className="mt-2 text-base leading-relaxed text-muted">
        Unggah file <code>.apkg</code>. Kata, arti, dan contoh kalimat dibaca dari nama field Anki-nya (bukan
        posisi field), jadi cocok untuk deck dengan susunan field yang beda-beda. Jadwal pengulangan Anki tidak
        dipakai — semua kartu mulai dari 1 hari dan diatur ulang oleh algoritma SM-2 sederhana di sini.
      </p>

      <label className="mt-6 flex min-h-14 w-full cursor-pointer items-center justify-center rounded-[var(--radius)] border border-card-border px-6 text-base font-medium">
        {loading ? "Memproses..." : "Pilih file .apkg"}
        <input type="file" accept=".apkg" onChange={handleUpload} disabled={loading} className="hidden" />
      </label>

      {status && <p className="mt-4 text-sm text-muted">{status}</p>}
    </main>
  );
}
