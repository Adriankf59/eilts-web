import Link from "next/link";
import { Card } from "@/components/ui/card";

// RANCANGAN-WEBSITE-BELAJAR-IELTS.md, Fase 2 — "Soal tips and trick: perlu, tapi ada
// syaratnya". Hanya 8 aturan mekanis yang ditampilkan di sini (boleh diketahui hari
// pertama, tidak digerbangi CEFR). Strategi lengkap per tipe soal tetap di Batch 3,
// dibuka manual setelah Fase 1 tuntas — bukan lewat halaman ini.
const ATURAN = [
  {
    judul: "Tidak ada penalti untuk jawaban salah",
    isi: "Jangan pernah mengosongkan apa pun. Kosong = pasti nol; tebakan = mungkin benar.",
  },
  {
    judul: "Batas kata itu mutlak",
    isi: '"NO MORE THAN TWO WORDS" lalu Anda tulis tiga kata → salah, walau isinya benar. Angka dihitung satu kata; kata bertanda hubung (part-time) dihitung satu.',
  },
  {
    judul: "Ejaan salah = jawaban salah",
    isi: "Di Listening dan Reading, tanpa pengecualian.",
  },
  {
    judul: "Bentuk jamak dihitung",
    isi: "child vs children — salah bentuk, salah jawaban.",
  },
  {
    judul: "Jawaban completion harus kata persis dari teks/audio",
    isi: "Sinonim buatan sendiri dihitung salah.",
  },
  {
    judul: "Writing: Task 2 dikerjakan lebih dulu",
    isi: "Bobotnya ±2× Task 1, dan Anda mengerjakannya saat masih paling segar. Ini keputusan strategi paling bernilai di seluruh tes.",
  },
  {
    judul: "Panjang minimum: 150 kata (T1), 250 kata (T2)",
    isi: "Penalti otomatis Band 5 yang dulu ada sudah dihapus — tapi tulisan pendek tetap jatuh lewat deskriptor Task Response (\"ide tidak cukup dikembangkan\"). Sasaran aman Task 2: 270–290 kata.",
  },
  {
    judul: "Listening diputar sekali",
    isi: "Ketinggalan satu jawaban? Lepaskan, langsung ke soal berikut. Menahan diri di soal yang lewat biasanya menghilangkan dua soal berikutnya.",
  },
];

const SAH_VS_MITOS: Array<[string, string]> = [
  ["Baca soal saat jeda audio", "“Kalau ragu, jawab B”"],
  ["Alokasi waktu per section", "“Ada ‘all’ atau ‘never’ → pasti FALSE”"],
  ["Prediksi tipe jawaban (angka? nama?)", "Template esai hafalan untuk semua soal"],
  ["Logika TFNG vs YNNG", "Jawaban Speaking yang dihafal kata per kata"],
  ["Patuhi batas kata jawaban", "“Pakai kata sulit biar band naik”"],
  ["Task 2 dikerjakan lebih dulu", "“Panjang esai = band tinggi”"],
];

export default function TipsPage() {
  return (
    <main className="mx-auto w-full max-w-[65ch] flex-1 p-6 leading-relaxed">
      <h1 className="text-2xl font-semibold">8 Aturan Sebelum Mulai</h1>
      <p className="mt-2 text-base text-muted">
        Bukan strategi — ini aturan mekanis yang membuang poin apa pun level bahasa Anda. Berlaku di setiap sesi
        latihan, jadi perlu diketahui sejak hari pertama, bukan nanti di Fase 2.
      </p>

      <div className="mt-6 space-y-4">
        {ATURAN.map((a, i) => (
          <Card key={a.judul} className="p-5">
            <p className="font-medium">
              {i + 1}. {a.judul}
            </p>
            <p className="mt-1 text-sm text-muted">{a.isi}</p>
          </Card>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold">Strategi Sah vs Mitos</h2>
      <p className="mt-2 text-base text-muted">
        Strategi yang benar bernilai kira-kira 0,5–1 band — tapi ia pengali, bukan pengganti kemampuan bahasa.
        Konten persiapan IELTS di YouTube dan blog penuh yang sebelah kanan.
      </p>
      <Card className="mt-4 overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border text-left">
              <th className="p-3 font-medium">✅ Strategi sah</th>
              <th className="p-3 font-medium">❌ Mitos / trik palsu</th>
            </tr>
          </thead>
          <tbody>
            {SAH_VS_MITOS.map(([sah, mitos]) => (
              <tr key={sah} className="border-b border-card-border last:border-0">
                <td className="p-3">{sah}</td>
                <td className="p-3 text-muted">{mitos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="mt-6 text-sm text-muted">
        Hafalan justru dihukum — British Council menaruhnya nomor satu dalam daftar larangan Speaking: penguji
        mengenali jawaban yang dihafal dan akan menaikkan kesulitan pertanyaan begitu terdeteksi. Aturan yang sama:
        kalau tidak 100% yakin arti sebuah kata, jangan dipakai.
      </p>
      <p className="mt-2 text-sm text-muted">
        Yang paling bernilai dari semua ini bukan tips umum, melainkan error log Anda sendiri — tips generik
        menaikkan skor semua orang sedikit, mengetahui pola kesalahan Anda sendiri menaikkan skor Anda banyak.
      </p>

      <Link href="/" className="mt-8 inline-block text-sm text-accent underline underline-offset-2">
        Kembali ke Hari Ini
      </Link>
    </main>
  );
}
