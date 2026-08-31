"use client";

import { useState } from "react";
import { extractTranscript } from "@/lib/tts";

export default function AudioButton({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false);

  function handleClick() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(extractTranscript(text));
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-card-border px-3 py-1.5 text-xs font-medium transition-colors duration-150 hover:bg-black/[0.03]"
    >
      <span aria-hidden>{playing ? "🔊" : "▶️"}</span> {playing ? "Memutar..." : "Dengarkan (TTS sementara)"}
    </button>
  );
}
