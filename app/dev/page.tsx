"use client";

// 개발용: 공용 부품을 목 데이터로 한눈에 확인하는 페이지 (/dev). 실제 화면이 아니다.
import { MapPin, Sun, Flame, Ban } from "lucide-react";
import { useEffect, useState } from "react";
import Chip from "@/components/common/Chip";
import EmptyState from "@/components/common/EmptyState";
import LogoMark from "@/components/common/LogoMark";
import SelectChip from "@/components/common/SelectChip";
import MenuCard from "@/components/domain/MenuCard";
import RestaurantCard from "@/components/domain/RestaurantCard";
import RestaurantRow from "@/components/domain/RestaurantRow";
import { getRecommendations } from "@/lib/api/recommendations";
import { getRestaurants } from "@/lib/api/restaurants";
import { RecommendationResponse } from "@/types/recommendation";
import { Restaurant } from "@/types/restaurant";

const HOME = { lat: 37.5006, lng: 127.0365 };
const INGREDIENTS = ["오이", "고수", "가지", "버섯", "당근"];

export default function DevComponentsPage() {
  const [reco, setReco] = useState<RecommendationResponse | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selected, setSelected] = useState<string[]>(["고수"]);

  useEffect(() => {
    getRecommendations(HOME).then(setReco);
    getRestaurants({ ...HOME, menuId: "m_12" }).then((res) => setRestaurants(res.items));
  }, []);

  const toggleFavorite = (r: Restaurant) =>
    setRestaurants((list) => list.map((x) => (x.placeId === r.placeId ? { ...x, isFavorite: !x.isFavorite } : x)));

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 py-10">
      <header className="flex items-center gap-3">
        <LogoMark />
        <h1 className="text-title-1 font-bold">공용 부품</h1>
      </header>

      <Section title="Chip">
        <div className="flex flex-wrap gap-2">
          <Chip icon={<Sun />} label="쌀쌀한 날씨" />
          <Chip icon={<Flame />} label="매운맛 좋아함" />
          <Chip icon={<Ban />} label="오이·고수 제외" />
          <Chip icon={<MapPin />} label="주변 7곳" />
        </div>
      </Section>

      <Section title="Select Chip">
        <div className="flex flex-wrap gap-2">
          {INGREDIENTS.map((name) => (
            <SelectChip
              key={name}
              label={name}
              selected={selected.includes(name)}
              onToggle={() => setSelected((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]))}
            />
          ))}
        </div>
      </Section>

      <Section title="Menu Card">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {reco?.alternatives.map((a) => (
            <MenuCard key={a.menu.id} menu={a.menu} matchPercent={a.matchPercent} popularRank={a.popularRank} />
          ))}
        </div>
      </Section>

      <Section title="Restaurant Row (순두부찌개 검색, 근거 순 정렬)">
        <div className="flex max-w-[420px] flex-col rounded-3xl border border-glass-border bg-glass-card p-2 shadow-glass">
          {restaurants.map((r) => (
            <RestaurantRow key={r.placeId} restaurant={r} onSelect={() => {}} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      </Section>

      <Section title="Restaurant Card">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.slice(0, 3).map((r) => (
            <RestaurantCard key={r.placeId} restaurant={r} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      </Section>

      <Section title="Empty State">
        <EmptyState
          icon={<MapPin />}
          title="위치를 알 수 없어요"
          description="동네를 고르거나 위치 권한을 허용하면 근처 메뉴를 추천해 드려요."
          primaryAction={{ label: "동네 선택하기", onClick: () => {} }}
          secondaryAction={{ label: "위치 권한 허용하기", onClick: () => {} }}
        />
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-title-3 font-semibold text-labels-secondary">{title}</h2>
      {children}
    </section>
  );
}
