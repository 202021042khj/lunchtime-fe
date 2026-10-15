// 어드민 목 데이터. 앞쪽 유저 · 신고는 Figma A1(27:834) · A4(30:920) 시안과 같게 맞췄다.
import { AdminUser, ReportGroup } from "@/types/admin";
import { LoginProvider } from "@/types/user";

// 목 어드민 계정: admin / admin1234 + OTP 123456
export const MOCK_ADMIN = { id: "a_1", loginId: "admin", password: "admin1234", name: "운영자" };
export const MOCK_ADMIN_OTP = "123456";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

interface Seed {
  id: string;
  name: string;
  email: string;
  provider: LoginProvider;
  createdAt: string;
  lastActiveAgoMs: number | null;
  reviewCount: number;
  favoriteCount: number;
  reportCount: number;
  status: AdminUser["status"];
}

const FIGMA_USERS: Seed[] = [
  { id: "u_a1", name: "김지민", email: "ji***@kakao.com", provider: "kakao", createdAt: "2026-09-03T10:00:00+09:00", lastActiveAgoMs: 0, reviewCount: 12, favoriteCount: 6, reportCount: 0, status: "active" },
  { id: "u_a2", name: "이서준", email: "se***@gmail.com", provider: "google", createdAt: "2026-09-11T10:00:00+09:00", lastActiveAgoMs: 10 * MIN, reviewCount: 3, favoriteCount: 14, reportCount: 0, status: "active" },
  { id: "u_a3", name: "박하은", email: "ha***@icloud.com", provider: "apple", createdAt: "2026-09-20T10:00:00+09:00", lastActiveAgoMs: DAY + HOUR, reviewCount: 0, favoriteCount: 2, reportCount: 0, status: "active" },
  { id: "u_a4", name: "최도윤", email: "do***@kakao.com", provider: "kakao", createdAt: "2026-08-29T10:00:00+09:00", lastActiveAgoMs: 3 * DAY, reviewCount: 27, favoriteCount: 9, reportCount: 4, status: "suspended" },
  { id: "u_a5", name: "정서연", email: "sy***@naver.com", provider: "email", createdAt: "2026-10-01T10:00:00+09:00", lastActiveAgoMs: HOUR, reviewCount: 1, favoriteCount: 0, reportCount: 0, status: "active" },
  { id: "u_a6", name: "한유진", email: "yj***@gmail.com", provider: "google", createdAt: "2026-07-15T10:00:00+09:00", lastActiveAgoMs: 14 * DAY, reviewCount: 8, favoriteCount: 21, reportCount: 1, status: "active" },
  { id: "u_a7", name: "오민재", email: "mj***@kakao.com", provider: "kakao", createdAt: "2026-06-02T10:00:00+09:00", lastActiveAgoMs: 45 * DAY, reviewCount: 0, favoriteCount: 0, reportCount: 0, status: "withdrawn" },
];

// 나머지는 규칙대로 만든다 (페이지 넘김 · 검색 확인용)
const FAMILY = ["강", "윤", "임", "신", "조", "장", "권", "황", "송", "류"];
const GIVEN = ["하준", "서윤", "도현", "지우", "예린", "시우", "수빈", "민서", "건우", "다은", "태윤", "나연"];
const PROVIDERS: LoginProvider[] = ["kakao", "kakao", "google", "apple", "email"];
const DOMAINS: Record<LoginProvider, string> = { kakao: "kakao.com", google: "gmail.com", apple: "icloud.com", email: "naver.com" };

const GENERATED: Seed[] = Array.from({ length: 41 }, (_, i) => {
  const provider = PROVIDERS[i % PROVIDERS.length];
  const name = FAMILY[i % FAMILY.length] + GIVEN[(i * 5) % GIVEN.length];
  return {
    id: `u_g${i + 1}`,
    name,
    email: `u${String(i + 1).padStart(2, "0")}***@${DOMAINS[provider]}`,
    provider,
    // 최근 가입이 많도록: 앞쪽 몇 명은 이번 주 · 지난주
    createdAt: ago(i < 6 ? (i + 1) * DAY : i < 10 ? (i + 2) * DAY : (20 + i * 4) * DAY),
    lastActiveAgoMs: i % 7 === 6 ? null : (i % 5) * 5 * HOUR,
    reviewCount: (i * 7) % 15,
    favoriteCount: (i * 3) % 11,
    reportCount: i === 9 ? 2 : 0,
    status: i === 13 || i === 27 ? "suspended" : i % 19 === 18 ? "withdrawn" : "active",
  };
});

export const MOCK_ADMIN_USERS: AdminUser[] = [...FIGMA_USERS, ...GENERATED].map((s) => ({
  id: s.id,
  name: s.name,
  maskedEmail: s.email,
  provider: s.provider,
  createdAt: s.createdAt,
  lastActiveAt: s.lastActiveAgoMs === null ? null : ago(s.lastActiveAgoMs),
  reviewCount: s.reviewCount,
  favoriteCount: s.favoriteCount,
  reportCount: s.reportCount,
  status: s.status,
  suspendedUntil: s.status === "suspended" ? new Date(Date.now() + 4 * DAY).toISOString() : null,
}));

const counts = (abuse: number, ad: number, falseInfo: number, irrelevant: number) => ({ abuse, ad, false_info: falseInfo, irrelevant });

function group(
  id: string,
  placeName: string,
  author: { id: string; name: string },
  rating: number,
  content: string,
  reasonCounts: ReportGroup["reasonCounts"],
  lastReportedAt: string,
  memos: string[],
  authorHistory: ReportGroup["authorHistory"],
  status: ReportGroup["status"] = "pending",
  resolution: ReportGroup["resolution"] = null,
): ReportGroup {
  const reportCount = Object.values(reasonCounts).reduce((a, b) => a + b, 0);
  return {
    review: { id, placeId: `p_${id}`, placeName, author, rating, menus: [], tags: [], content, photos: [], createdAt: "2026-10-08T12:00:00+09:00", isMine: false },
    status,
    resolution,
    reasonCounts,
    reportCount,
    firstReportedAt: lastReportedAt,
    lastReportedAt,
    memos,
    authorHistory,
  };
}

const DOYUN = { id: "u_a4", name: "최도윤" };

export const MOCK_REPORT_GROUPS: ReportGroup[] = [
  group("rv_101", "소공동 뚝배기", DOYUN, 1, "사장 태도가 ○○ 같아요. 이런 집은 망해야 함. 다시는 안 갑니다.", counts(4, 0, 0, 1), "2026-10-08T11:42:00+09:00",
    ["특정인을 향한 욕설이 포함되어 있어요.", "식당과 상관없는 비방이에요."], { reviewCount: 27, reportCount: 4, deletedCount: 2 }),
  group("rv_102", "포 하노이", { id: "u_g3", name: "임도현" }, 5, "여기 말고 OO역 OO식당 가세요 링크 → ...", counts(0, 3, 0, 0), "2026-10-08T09:15:00+09:00",
    ["다른 가게 홍보 링크예요."], { reviewCount: 2, reportCount: 3, deletedCount: 0 }),
  group("rv_103", "카츠 공방", { id: "u_g5", name: "조지우" }, 1, "음식에서 이물질 나왔는데 환불 거부함", counts(0, 0, 2, 0), "2026-10-07T20:03:00+09:00",
    ["사진도 없이 단정적으로 써요."], { reviewCount: 5, reportCount: 2, deletedCount: 0 }),
  group("rv_104", "전주집 비빔밥", { id: "u_g8", name: "황예린" }, 3, "주차하기 힘들어요 ㅠ 근데 맛은 안 먹어봄", counts(0, 0, 0, 1), "2026-10-07T13:27:00+09:00",
    [], { reviewCount: 1, reportCount: 1, deletedCount: 0 }),
  group("rv_105", "라쿤 마라탕", { id: "u_g10", name: "류다은" }, 2, "직원이 너무 불친절하고 ○○ 같음", counts(2, 0, 0, 0), "2026-10-06T18:50:00+09:00",
    ["욕설이 섞여 있어요."], { reviewCount: 9, reportCount: 2, deletedCount: 1 }),
  group("rv_106", "강남 돼지집", { id: "u_g12", name: "신하준" }, 1, "여기 위생 최악. 바퀴벌레 봤다는 소문 있음", counts(0, 0, 3, 0), "2026-10-05T12:11:00+09:00",
    ["소문을 사실처럼 써요."], { reviewCount: 3, reportCount: 3, deletedCount: 0 }),
  group("rv_107", "김치명가 역삼", { id: "u_g15", name: "권시우" }, 4, "할인 쿠폰 받으려면 DM 주세요", counts(0, 2, 0, 0), "2026-10-04T15:40:00+09:00",
    [], { reviewCount: 4, reportCount: 2, deletedCount: 0 }),
  // 처리 완료
  group("rv_108", "스시 하루", { id: "u_g17", name: "송민서" }, 2, "밥이 좀 질었어요.", counts(0, 0, 1, 0), "2026-10-03T12:30:00+09:00",
    ["맛 평가라 문제없어 보여요."], { reviewCount: 6, reportCount: 1, deletedCount: 0 }, "resolved", "dismissed"),
  group("rv_109", "든든밥상", { id: "u_g20", name: "강건우" }, 1, "주인 ○○○ 진짜 ○○", counts(3, 0, 0, 0), "2026-10-02T19:05:00+09:00",
    [], { reviewCount: 2, reportCount: 3, deletedCount: 1 }, "resolved", "deleted"),
];

// 이번 달 처리 · 삭제 비율 계산에 더할 지난 처리 기록 (목록에는 없는 예전 건)
export const MOCK_PAST_RESOLVED = { dismissed: 25, deleted: 14 };
