import { AlertTriangle, Plus } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { ADMIN_CARD, AdminPageHeader, AdminStatCard, AdminStatSkeleton, AdminStatusBadge } from "@/components/domain/admin/AdminWidgets";
import Button from "@/components/ui/button";
import { SPONSORED_STATUS } from "@/constants/admin";
import { UseAdminSponsoredLogicResult } from "@/hooks/useAdminSponsoredLogic";
import { formatRadius } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Sponsored } from "@/types/admin";

// Figma A2 Sponsored Table (28:1160) 열 너비
const COLS = "grid grid-cols-[210px_160px_64px_140px_44px_110px_130px_80px_minmax(52px,1fr)] items-center gap-3 px-5";
const HEADERS = ["식당", "노출 메뉴·카테고리", "반경", "기간", "순위", "노출 / 클릭", "광고료", "상태", ""];

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
const md = (iso: string) => iso.slice(5).replace("-", ".");
// "서울 강남구 역삼동 123-45" → 역삼동
const dong = (address: string) => address.split(" ").find((w) => /동$|가$/.test(w)) ?? "";

function SponsoredRow({ s, logic }: { s: Sponsored; logic: UseAdminSponsoredLogicResult }) {
  const status = SPONSORED_STATUS[s.status];
  return (
    <li className={cn(COLS, "py-3 text-subheadline")}>
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-semibold text-labels-primary">{s.place.name}</span>
        <span className="truncate text-footnote text-labels-tertiary">
          {dong(s.place.address)} · 장소 ID {s.place.placeId.slice(0, 4)}…
        </span>
      </span>
      <span className="truncate text-labels-primary">{[...s.targetMenuNames, ...s.targetCategories].join(" · ")}</span>
      <span className="text-labels-primary">{formatRadius(s.radiusM)}</span>
      <span className="text-labels-secondary tabular-nums">
        {md(s.startDate)} ~ {md(s.endDate)}
      </span>
      <span className="text-labels-primary">{s.priority}</span>
      <span className="text-labels-secondary tabular-nums">
        {s.impressions ? `${s.impressions.toLocaleString("ko-KR")} / ${s.clicks.toLocaleString("ko-KR")}` : "—"}
      </span>
      <span className="flex flex-col">
        <span className="text-labels-primary">{won(s.feeKrw)}</span>
        <span className={cn("text-footnote", s.paymentStatus === "paid" ? "text-labels-tertiary" : "font-semibold text-[#b25e00]")}>
          {s.paymentStatus === "paid" ? "결제 완료" : "입금 대기"}
        </span>
      </span>
      <span className="flex flex-col items-start gap-0.5">
        <AdminStatusBadge label={status.label} tone={status.tone} />
        {s.canceled && <span className="text-caption-1 text-labels-tertiary">취소됨</span>}
      </span>
      <span className="text-right">
        {s.status === "ended" ? (
          <button type="button" onClick={() => logic.open("renew", s)} className="font-semibold text-brand-primary hover:underline">
            재등록
          </button>
        ) : (
          <button type="button" onClick={() => logic.open("edit", s)} className="font-semibold text-brand-primary hover:underline">
            수정
          </button>
        )}
      </span>
    </li>
  );
}

// Figma: A2 Admin · 광고 식당 고정 (28:849)
export default function SponsoredPage(logic: UseAdminSponsoredLogicResult) {
  const s = logic.summary;
  const list = logic.list;
  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title="광고 식당 고정"
        description="광고료를 받은 식당을 조건에 맞는 추천 목록 맨 위에 고정해요."
        actions={
          <Button type="button" color="brand" shape="round" size="md" onClick={() => logic.open("new")} leftIcon={<Plus aria-hidden className="size-4" />} className="gap-1 font-semibold">
            광고 고정 추가
          </Button>
        }
      />

      <div className="flex flex-wrap gap-4">
        {s ? (
          <>
            <AdminStatCard label="진행 중" value={`${s.active}곳`} />
            <AdminStatCard label="이번 달 광고 매출" value={won(s.monthRevenueKrw)} />
            <AdminStatCard label="평균 클릭률" value={s.avgCtrPercent === null ? "—" : `${s.avgCtrPercent}%`} />
            <AdminStatCard label="입금 대기" value={`${s.pendingPayment}곳`} tone={s.pendingPayment ? "alert" : "default"} />
          </>
        ) : (
          [0, 1, 2, 3].map((i) => <AdminStatSkeleton key={i} />)
        )}
      </div>

      {logic.listStatus === "error" ? (
        <EmptyState icon={<AlertTriangle />} title="광고 목록을 불러오지 못했어요" description="잠시 후 다시 시도해 주세요." primaryAction={{ label: "다시 시도", onClick: logic.retry }} />
      ) : (
        <section aria-label="광고 목록" className={cn("overflow-hidden", ADMIN_CARD)}>
          <div className="overflow-x-auto">
            <div className="min-w-[1080px]">
              <div className={cn(COLS, "bg-[rgba(117,117,128,0.06)] py-3 text-footnote font-semibold text-labels-secondary")}>
                {HEADERS.map((h, i) => (
                  <span key={i}>{h}</span>
                ))}
              </div>
              {!list ? (
                <div aria-busy className="flex flex-col gap-2 p-5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-placeholder" />
                  ))}
                </div>
              ) : list.items.length ? (
                <ul className={cn("divide-y-[0.5px] divide-separators-non-opaque border-t-[0.5px] border-separators-non-opaque", logic.listStatus === "loading" && "opacity-60")}>
                  {list.items.map((item) => (
                    <SponsoredRow key={item.id} s={item} logic={logic} />
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-12 text-center text-subheadline text-labels-secondary">아직 고정한 광고가 없어요.</p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
