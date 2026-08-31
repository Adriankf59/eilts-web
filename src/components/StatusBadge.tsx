import type { StatusSubSkill } from "@/lib/diagnostic-engine";

// UI-REFERENSI.md 4.4 — palet status teredam (700 di atas 50), bukan merah-hijau menyala.
// Sub-skill < 3 soal selalu abu-abu netral, jangan pernah merah palsu.
const STATUS_STYLE: Record<StatusSubSkill, { bg: string; fg: string; label: string }> = {
  belum: { bg: "var(--status-belum-bg)", fg: "var(--status-belum-fg)", label: "Belum" },
  lemah: { bg: "var(--status-lemah-bg)", fg: "var(--status-lemah-fg)", label: "Lemah" },
  cukup: { bg: "var(--status-cukup-bg)", fg: "var(--status-cukup-fg)", label: "Cukup" },
  kuat: { bg: "var(--status-kuat-bg)", fg: "var(--status-kuat-fg)", label: "Kuat" },
  belum_diuji: { bg: "var(--status-netral-bg)", fg: "var(--status-netral-fg)", label: "Belum diuji" },
};

export function StatusBadge({ status }: { status: StatusSubSkill }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}
