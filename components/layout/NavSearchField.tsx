"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { ROUTES } from "@/constants/navigation";
import { cn } from "@/lib/utils";

const GLASS_CONTROL = "border border-white/90 bg-white/60 shadow-[0_2px_8px_rgba(31,26,89,0.06)] transition-colors hover:bg-white/80";

function NavSearchForm({ initial, active }: { initial: string; active: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`${ROUTES.search}?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <form
      onSubmit={submit}
      role="search"
      className={cn(
        "flex h-[38px] w-[300px] items-center gap-2 rounded-full px-3.5",
        GLASS_CONTROL,
        // 검색 결과 화면에서는 브랜드 테두리 (Figma 10 Search Field 35:1446)
        active && "border-[1.5px] border-brand-primary",
      )}
    >
      <Search aria-hidden className="size-4 shrink-0 text-labels-secondary" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="메뉴, 식당 검색"
        aria-label="메뉴, 식당 검색"
        className="min-w-0 flex-1 bg-transparent text-subheadline text-labels-primary outline-none placeholder:text-labels-tertiary"
      />
    </form>
  );
}

// 검색 결과 화면이면 지금 검색어를 채워 둔다 (검색어가 바뀌면 key로 새로 그림)
function NavSearchWithParams() {
  const pathname = usePathname();
  const params = useSearchParams();
  const active = pathname.startsWith(ROUTES.search);
  const current = active ? (params.get("q") ?? "") : "";
  return <NavSearchForm key={`${active}:${current}`} initial={current} active={active} />;
}

// 메뉴바 검색창 (데스크톱 lg 이상). useSearchParams 때문에 Suspense로 감싼다
export default function NavSearchField() {
  return (
    <Suspense fallback={<NavSearchForm initial="" active={false} />}>
      <NavSearchWithParams />
    </Suspense>
  );
}
