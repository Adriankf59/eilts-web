// TTS sementara untuk soal Listening yang belum punya file audio asli (lihat catatan
// keterbatasan di db/seed.ts dan RANCANGAN-WEBSITE-BELAJAR-IELTS.md 11.4). Prompt soal
// listening ditulis dengan format "[Transkrip sementara...] "dialog..." pertanyaan ID?" —
// fungsi ini memisahkan bagian dialog (yang perlu dibacakan) dari pertanyaan Indonesia di
// akhir (yang tidak perlu dibacakan).
export function extractTranscript(prompt: string): string {
  const tanpaCatatan = prompt.replace(/^\[[^\]]*\]\s*/, "");
  const kutipTerakhir = tanpaCatatan.lastIndexOf('"');
  if (kutipTerakhir === -1) return tanpaCatatan;
  return tanpaCatatan.slice(0, kutipTerakhir + 1);
}

// Bagian pertanyaan (Indonesia) setelah dialog — ini yang ditampilkan sebagai teks ke
// pengguna. Dialognya sendiri TIDAK ditampilkan, hanya dibacakan lewat TTS (meniru IELTS
// asli: audio hanya diputar sekali, tidak ada transkrip di layar).
export function extractQuestion(prompt: string): string {
  const tanpaCatatan = prompt.replace(/^\[[^\]]*\]\s*/, "");
  const kutipTerakhir = tanpaCatatan.lastIndexOf('"');
  if (kutipTerakhir === -1) return tanpaCatatan;
  return tanpaCatatan.slice(kutipTerakhir + 1).trim();
}

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}
