"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RestaurantSort } from "@/types/restaurant";

const SORT_LABELS: Record<RestaurantSort, string> = { distance: "거리순", reviews: "리뷰 많은 순" };

interface SortMenuProps {
  sort: RestaurantSort;
  onChange: (sort: RestaurantSort) => void;
  className?: string;
}

// "거리순 ⌄" 정렬 선택
export default function SortMenu({ sort, onChange, className = "text-footnote" }: SortMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={`flex items-center gap-1 font-semibold text-labels-primary ${className}`}>
        {SORT_LABELS[sort]}
        <ChevronDown aria-hidden className="size-3.5 text-labels-secondary" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 rounded-2xl border-white/80 bg-white p-1.5 shadow-glass">
        {(Object.keys(SORT_LABELS) as RestaurantSort[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              onChange(value);
              setOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-subheadline text-labels-primary hover:bg-fills-quaternary"
          >
            {SORT_LABELS[value]}
            {sort === value && <Check aria-hidden className="size-4 text-brand-primary" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
