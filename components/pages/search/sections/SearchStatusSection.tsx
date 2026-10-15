import { AlertTriangle, Clock, Search, X } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { UseSearchLogicResult } from "@/hooks/useSearchLogic";

// 검색어 없음(최근 검색) · 로딩 · 오류 · 결과 0건
export default function SearchStatusSection({ logic, className = "py-20" }: { logic: UseSearchLogicResult; className?: string }) {
  if (logic.status === "idle") {
    return (
      <div className="flex flex-col gap-6">
        {logic.recentSearches.length > 0 && (
          <section aria-label="최근 검색" className="flex flex-col gap-3">
            <h2 className="text-headline text-labels-primary">최근 검색</h2>
            <ul className="flex flex-wrap gap-2">
              {logic.recentSearches.map((term) => (
                <li key={term} className="flex items-center rounded-full border border-chip-border bg-white/80">
                  <button
                    type="button"
                    onClick={() => logic.submit(term)}
                    className="flex items-center gap-1.5 py-[7px] pl-3.5 text-subheadline text-labels-primary"
                  >
                    <Clock aria-hidden className="size-3.5 text-labels-tertiary" />
                    {term}
                  </button>
                  <button
                    type="button"
                    onClick={() => logic.removeRecent(term)}
                    aria-label={`${term} 최근 검색에서 지우기`}
                    className="py-[7px] pr-3 pl-1.5 text-labels-tertiary hover:text-labels-secondary"
                  >
                    <X aria-hidden className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        <EmptyState
          className={className}
          icon={<Search />}
          title="메뉴나 식당을 검색해 보세요"
          description="예: 순두부, 쌀국수, 김치명가"
        />
      </div>
    );
  }
  if (logic.status === "loading") {
    return (
      <div aria-busy aria-label="검색하는 중" className="flex flex-col gap-4">
        <div className="flex gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-[150px] w-[200px] animate-pulse rounded-[22px] bg-surface-placeholder" />
          ))}
        </div>
        <div className="h-[340px] animate-pulse rounded-3xl bg-surface-placeholder" />
      </div>
    );
  }
  if (logic.status === "error") {
    return (
      <EmptyState
        className={className}
        icon={<AlertTriangle />}
        title="검색하지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        primaryAction={{ label: "다시 시도", onClick: logic.retry }}
      />
    );
  }
  return (
    <EmptyState
      className={className}
      icon={<Search />}
      title={`'${logic.query}' 검색 결과가 없어요`}
      description="메뉴 이름이나 식당 이름으로 다시 검색해 보세요."
      primaryAction={{ label: "동네 바꾸기", onClick: logic.openLocationPicker }}
    />
  );
}
