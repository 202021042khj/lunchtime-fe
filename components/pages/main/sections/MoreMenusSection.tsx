import Link from "next/link";
import MenuCard from "@/components/domain/MenuCard";
import { ROUTES } from "@/constants/navigation";
import { AlternativeRecommendation } from "@/types/recommendation";

interface MoreMenusSectionProps {
  alternatives: AlternativeRecommendation[];
  onSelectMenu: (menuId: string) => void;
}

// 다른 추천 메뉴 4개. 데스크톱은 4열 유리 카드, 모바일은 1줄 가로 스크롤 (반응형 규칙)
export default function MoreMenusSection({ alternatives, onSelectMenu }: MoreMenusSectionProps) {
  if (!alternatives.length) return null;

  return (
    <section className="flex flex-col gap-3 pl-4 md:gap-3.5 md:pl-0">
      <div className="flex items-center justify-between pr-5 pl-1 md:px-0">
        <h2 className="text-title-3 font-semibold text-labels-primary md:text-title-2 md:font-bold">이런 메뉴는 어때요?</h2>
        <Link href={`${ROUTES.search}?type=menu`} className="text-subheadline font-semibold text-brand-primary">
          <span className="md:hidden">더보기</span>
          <span className="hidden md:inline">전체 보기</span>
        </Link>
      </div>
      <ul className="flex gap-2.5 overflow-x-auto pr-4 pb-1 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:pr-0">
        {alternatives.map((a) => (
          <li key={a.menu.id} className="shrink-0 md:min-w-0">
            <MenuCard
              menu={a.menu}
              matchPercent={a.matchPercent}
              popularRank={a.popularRank}
              onSelect={(menu) => onSelectMenu(menu.id)}
              className="md:w-full md:border md:border-white/80 md:bg-glass-card md:shadow-glass"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
