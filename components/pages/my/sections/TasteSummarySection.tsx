import { SPICE_LABELS } from "@/constants/user";
import { hasTaste } from "@/lib/taste";
import { Preferences } from "@/types/preferences";

const CARD = "rounded-[28px] border border-glass-border bg-glass-card shadow-[0_8px_32px_rgba(64,38,20,0.08)]";

interface TasteSummarySectionProps {
  preferences: Preferences | null;
  onEdit: () => void;
}

// Figma: 07 MY Taste Card (26:932) — 내 취향 요약 + [수정] → 취향 설정
export default function TasteSummarySection({ preferences, onEdit }: TasteSummarySectionProps) {
  const p = preferences;
  const empty = !p || !hasTaste(p);
  const rows = p
    ? [
        { label: "못 먹는 재료", value: p.dislikedIngredients.join(", ") || "없음" },
        { label: "알레르기", value: p.allergies.join(", ") || "없음" },
        { label: "맵기", value: p.spiceLevel === null ? "선택 안 함" : SPICE_LABELS[p.spiceLevel] },
        { label: "좋아하는 음식", value: p.favoriteCuisines.join(" · ") || "선택 안 함" },
      ]
    : [];

  return (
    <section className={`flex flex-col gap-4 p-6 ${CARD}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-headline text-labels-primary">내 취향</h2>
        <button type="button" onClick={onEdit} className="text-subheadline font-semibold text-brand-primary">
          {empty ? "알려주기" : "수정"}
        </button>
      </div>
      {empty ? (
        <p className="text-subheadline text-labels-secondary">아직 취향을 알려주지 않았어요. 알려주면 나에게 맞춰 추천해요.</p>
      ) : (
        <dl className="flex flex-col gap-4">
          {rows.map((row) => (
            <div key={row.label} className="flex gap-3 text-subheadline">
              <dt className="w-[110px] shrink-0 text-labels-secondary">{row.label}</dt>
              <dd className="min-w-0 flex-1 font-semibold text-labels-primary">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
