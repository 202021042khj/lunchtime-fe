import { User as UserIcon } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/navigation";
import { PROVIDER_LABELS } from "@/constants/user";
import { User } from "@/types/user";

const CARD = "rounded-[28px] border border-glass-border bg-glass-card shadow-[0_8px_32px_rgba(64,38,20,0.08)]";

// Figma: 07 MY Profile Card (26:915) — 이름 · 로그인 방식 · 가입일, 숫자 3개
export default function ProfileSection({ user }: { user: User }) {
  const joined = new Date(user.createdAt);
  const stats = [
    { label: "내 리뷰", value: user.stats.reviewCount, href: "#my-reviews" },
    { label: "찜한 식당", value: user.stats.favoriteCount, href: ROUTES.favorites },
    { label: "받은 추천", value: user.stats.recommendationCount, href: null },
  ];

  return (
    <section className={`flex flex-col gap-4 p-6 ${CARD}`}>
      <div className="flex items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-surface-placeholder text-labels-tertiary">
          <UserIcon aria-hidden className="size-7 fill-current" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="truncate text-title-2 font-bold text-labels-primary">{user.name}</h1>
          <p className="text-footnote text-labels-secondary">
            {PROVIDER_LABELS[user.provider]} 로그인 · {joined.getFullYear()}년 {joined.getMonth() + 1}월 가입
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {stats.map((s) => {
          const body = (
            <>
              <span className="text-title-3 font-semibold text-labels-primary">{s.value.toLocaleString("ko-KR")}</span>
              <span className="text-footnote text-labels-secondary">{s.label}</span>
            </>
          );
          const cls = "flex flex-1 flex-col items-center gap-0.5 rounded-2xl bg-brand-primary-tint py-3";
          return s.href ? (
            <Link key={s.label} href={s.href} className={`${cls} hover:brightness-[0.98]`}>
              {body}
            </Link>
          ) : (
            <div key={s.label} className={cls}>
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}
