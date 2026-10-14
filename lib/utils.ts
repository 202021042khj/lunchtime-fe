import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const CUSTOM_FONT_SIZES = [
  "font-40-500",
  "font-24-700",
  "font-24-600",
  "font-24-500",
  "font-24-400",
  "font-24-300",
  "font-20-700",
  "font-20-600",
  "font-20-500",
  "font-20-400",
  "font-20-300",
  "font-18-700",
  "font-18-600",
  "font-18-500",
  "font-18-400",
  "font-18-300",
  "font-16-700",
  "font-16-600",
  "font-16-500",
  "font-16-400",
  "font-16-300",
  "font-14-700",
  "font-14-600",
  "font-14-500",
  "font-14-400",
  "font-14-300",
  "font-12-700",
  "font-12-600",
  "font-12-500",
  "font-12-400",
  "font-12-300",
  "font-10-700",
  "font-10-600",
  "font-10-500",
  "font-10-400",
  "font-10-300",
] as const;

// globals.css의 iOS 글자 스타일. 등록하지 않으면 tailwind-merge가 글자 색으로 보고 text-labels-* 와 충돌 처리한다
const IOS_TEXT_STYLES = [
  "large-title",
  "title-1",
  "title-2",
  "title-3",
  "headline",
  "body",
  "subheadline",
  "footnote",
  "caption-1",
  "caption-2",
] as const;

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...CUSTOM_FONT_SIZES, ...IOS_TEXT_STYLES] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
