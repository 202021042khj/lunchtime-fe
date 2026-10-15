import { AlertTriangle } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { ADMIN_CARD, AdminPagination, AdminStatusBadge } from "@/components/domain/admin/AdminWidgets";
import { PROVIDER_LABELS } from "@/constants/user";
import { ADMIN_PAGE_SIZE, UseAdminUsersLogicResult } from "@/hooks/useAdminUsersLogic";
import { formatDotDate } from "@/lib/format";
import { formatAgo } from "@/lib/recentLocations";
import { cn } from "@/lib/utils";
import { AdminUser, UserStatus } from "@/types/admin";

// Figma A1 Users Table (27:908) 열 너비
const COLS = "grid grid-cols-[250px_96px_110px_110px_64px_64px_84px_96px_minmax(80px,1fr)] items-center gap-3 px-5";
const HEADERS = ["유저", "로그인", "가입일", "최근 접속", "리뷰", "찜", "받은 신고", "상태", ""];

const STATUS: Record<UserStatus, { label: string; tone: "green" | "red" | "gray" }> = {
  active: { label: "정상", tone: "green" },
  suspended: { label: "정지", tone: "red" },
  withdrawn: { label: "탈퇴", tone: "gray" },
};

function UserRow({ user, logic }: { user: AdminUser; logic: UseAdminUsersLogicResult }) {
  const status = STATUS[user.status];
  return (
    <li className={cn(COLS, "py-3 text-subheadline")}>
      <div className="flex min-w-0 items-center gap-2.5">
        <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-placeholder text-footnote font-semibold text-labels-secondary">
          {user.name[1] ?? user.name[0]}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-semibold text-labels-primary">{user.name}</span>
          <span className="truncate text-footnote text-labels-tertiary">{user.maskedEmail}</span>
        </div>
      </div>
      <span className="text-labels-primary">{PROVIDER_LABELS[user.provider]}</span>
      <span className="text-labels-secondary">{formatDotDate(user.createdAt)}</span>
      <span className="text-labels-secondary">{user.lastActiveAt ? formatAgo(user.lastActiveAt).replace(/^방금$/, "방금 전") : "—"}</span>
      <span className="text-labels-primary">{user.reviewCount}</span>
      <span className="text-labels-primary">{user.favoriteCount}</span>
      <span className={user.reportCount ? "font-semibold text-accents-red" : "text-labels-tertiary"}>{user.reportCount}</span>
      <span title={user.status === "suspended" ? (user.suspendedUntil ? `${formatDotDate(user.suspendedUntil)}까지` : "무기한") : undefined}>
        <AdminStatusBadge label={status.label} tone={status.tone} />
      </span>
      <span className="text-right">
        {user.status === "active" && (
          <button type="button" onClick={() => logic.suspend(user)} className="font-semibold text-accents-red hover:underline">
            정지
          </button>
        )}
        {user.status === "suspended" && (
          <button type="button" onClick={() => logic.unsuspend(user)} className="font-semibold text-brand-primary hover:underline">
            정지 해제
          </button>
        )}
        {user.status === "withdrawn" && <span className="text-labels-tertiary">—</span>}
      </span>
    </li>
  );
}

// 유저 표 + 페이지 넘김. 좁은 폭에서는 표만 가로로 스크롤
export default function UsersTableSection({ logic }: { logic: UseAdminUsersLogicResult }) {
  if (logic.listStatus === "error") {
    return (
      <EmptyState
        icon={<AlertTriangle />}
        title="유저 목록을 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        primaryAction={{ label: "다시 시도", onClick: logic.retry }}
      />
    );
  }
  const list = logic.list;
  return (
    <section aria-label="유저 목록" className={cn("overflow-hidden", ADMIN_CARD)}>
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          <div className={cn(COLS, "bg-[rgba(117,117,128,0.06)] py-3 text-footnote font-semibold text-labels-secondary")}>
            {HEADERS.map((h, i) => (
              <span key={i}>{h}</span>
            ))}
          </div>
          {logic.listStatus === "loading" && !list ? (
            <div aria-busy className="flex flex-col gap-2 p-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-surface-placeholder" />
              ))}
            </div>
          ) : list && list.items.length ? (
            <ul className={cn("divide-y-[0.5px] divide-separators-non-opaque border-t-[0.5px] border-separators-non-opaque", logic.listStatus === "loading" && "opacity-60")}>
              {list.items.map((u) => (
                <UserRow key={u.id} user={u} logic={logic} />
              ))}
            </ul>
          ) : (
            <p className="px-5 py-12 text-center text-subheadline text-labels-secondary">
              {logic.query ? `'${logic.query}'에 맞는 유저가 없어요.` : "해당하는 유저가 없어요."}
            </p>
          )}
        </div>
      </div>
      {list && <AdminPagination page={list.page} total={list.total} size={ADMIN_PAGE_SIZE} onChange={logic.setPage} />}
    </section>
  );
}
