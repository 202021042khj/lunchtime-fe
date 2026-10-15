"use client";

import { Search, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { UseSearchLogicResult } from "@/hooks/useSearchLogic";

// 화면 안의 검색창 (모바일 · 태블릿 — 메뉴바 검색창이 없는 폭).
// 검색어가 바뀌면 부모가 key로 다시 그려 입력값을 맞춘다
export default function SearchBoxSection({ logic }: { logic: UseSearchLogicResult }) {
  const [value, setValue] = useState(logic.query);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    logic.submit(value);
  };

  return (
    <form
      onSubmit={submit}
      role="search"
      className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-white/90 bg-white/70 px-4 shadow-[0_2px_8px_rgba(31,26,89,0.06)]"
    >
      <Search aria-hidden className="size-4 shrink-0 text-labels-secondary" />
      <input
        type="search"
        enterKeyHint="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="메뉴, 식당 검색"
        aria-label="메뉴, 식당 검색"
        autoFocus={!logic.query}
        className="min-w-0 flex-1 bg-transparent text-body text-labels-primary outline-none placeholder:text-labels-tertiary [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => setValue("")} aria-label="검색어 지우기" className="text-labels-tertiary">
          <X aria-hidden className="size-4" />
        </button>
      )}
    </form>
  );
}
