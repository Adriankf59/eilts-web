"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function BackupPage() {
  const [status, setStatus] = useState<string | null>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("Mengimpor...");
    try {
      const text = await file.text();
      const res = await fetch("/api/import", { method: "POST", body: text });
      if (!res.ok) throw new Error(await res.text());
      setStatus("Berhasil diimpor. Muat ulang halaman Hari Ini untuk melihat perubahan.");
    } catch (err) {
      setStatus(`Gagal impor: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 p-6">
      <h1 className="text-lg font-semibold">Backup Data</h1>
      <p className="mt-2 text-base leading-relaxed text-muted">
        Seminggu sekali, unduh backup progres Anda. Kalau perlu pindah perangkat, impor file itu di sini.
      </p>

      <Button asChild className="mt-6 w-full">
        <a href="/api/export">Export JSON</a>
      </Button>

      <label className="mt-4 flex min-h-14 w-full cursor-pointer items-center justify-center rounded-[var(--radius)] border border-card-border px-6 text-base font-medium">
        Import JSON
        <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
      </label>

      {status && <p className="mt-4 text-sm text-muted">{status}</p>}

      <Link href="/vocab/import" className="mt-8 block text-center text-xs text-muted/60 hover:text-muted">
        Impor deck Anki (.apkg)
      </Link>
    </main>
  );
}
