// 카카오 로컬 API 스파이크: 메뉴 키워드로 근처 식당이 충분히 나오는지, 응답 시간은 어떤지 확인한다.
// 실행: node --env-file=.env.local scripts/spike/kakao.mjs

import { mkdir, writeFile } from "node:fs/promises";

const KEY = process.env.KAKAO_REST_API_KEY;
if (!KEY) {
  console.error("KAKAO_REST_API_KEY가 없어요. .env.local을 확인하세요.");
  process.exit(1);
}

const BASE = "https://dapi.kakao.com/v2/local/search";
const OUT_DIR = new URL("./out/", import.meta.url);

const LOCATIONS = [
  { id: "yeoksam", name: "역삼동", lat: 37.5006, lng: 127.0365 },
  { id: "pangyo", name: "판교테크노밸리", lat: 37.4019, lng: 127.1086 },
  { id: "sejong", name: "세종시청", lat: 36.48, lng: 127.289 },
];

// query: 카카오 검색어, aliases: 식당 이름에 있으면 "이름 일치"로 보는 단어
const MENUS = [
  { query: "순두부찌개", aliases: ["순두부"] },
  { query: "김치찌개", aliases: ["김치찌개"] },
  { query: "국밥", aliases: ["국밥"] },
  { query: "칼국수", aliases: ["칼국수"] },
  { query: "냉면", aliases: ["냉면", "면옥"] },
  { query: "제육볶음", aliases: ["제육"] },
  { query: "쌀국수", aliases: ["쌀국수", "포"] },
  { query: "마라탕", aliases: ["마라"] },
  { query: "돈까스", aliases: ["돈까스", "돈카츠", "카츠"] },
  { query: "초밥", aliases: ["초밥", "스시"] },
  { query: "짬뽕", aliases: ["짬뽕"] },
  { query: "햄버거", aliases: ["버거"] },
];

async function kakao(path, params) {
  const url = `${BASE}/${path}?${new URLSearchParams(params)}`;
  const started = performance.now();
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${KEY}` } });
  const ms = Math.round(performance.now() - started);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const hint =
      res.status === 401 ? "REST API 키가 틀렸어요."
      : res.status === 403 ? "카카오맵 [사용 설정]이 OFF이거나 허용 IP 제한에 걸렸어요."
      : res.status === 429 ? "쿼터를 다 썼어요."
      : "";
    console.error(`카카오 ${res.status} ${hint}`, body);
    process.exit(1);
  }
  return { body, ms };
}

const coord = (loc) => ({ x: String(loc.lng), y: String(loc.lat) });

async function keywordAllPages(loc, query, radius) {
  const docs = [];
  const times = [];
  let meta;
  for (let page = 1; page <= 3; page++) {
    const { body, ms } = await kakao("keyword.json", {
      query, ...coord(loc), radius: String(radius),
      category_group_code: "FD6", sort: "distance", size: "15", page: String(page),
    });
    times.push(ms);
    meta = body.meta;
    docs.push(...body.documents);
    if (body.meta.is_end) break;
  }
  return { meta, docs, times };
}

const avg = (xs) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const allTimes = [];

  for (const loc of LOCATIONS) {
    console.log(`\n=== ${loc.name} (${loc.lat}, ${loc.lng}) ===`);

    const cat1k = await kakao("category.json", { category_group_code: "FD6", ...coord(loc), radius: "1000", size: "15" });
    console.log(`반경 1km 음식점 전체(카테고리 검색): total ${cat1k.body.meta.total_count}, 조회 가능 ${cat1k.body.meta.pageable_count}`);

    const rows = [];
    const raw = {};
    for (const menu of MENUS) {
      const r1k = await keywordAllPages(loc, menu.query, 1000);
      const r3k = await kakao("keyword.json", {
        query: menu.query, ...coord(loc), radius: "3000", category_group_code: "FD6", size: "15",
      });
      allTimes.push(...r1k.times);

      const nameMatched = r1k.docs.filter((d) => menu.aliases.some((a) => d.place_name.includes(a))).length;
      rows.push({
        메뉴: menu.query,
        "1km 전체": r1k.meta.total_count,
        "1km 받은 수": r1k.docs.length,
        "이름 일치": nameMatched,
        "이름 일치 %": r1k.docs.length ? Math.round((nameMatched / r1k.docs.length) * 100) : 0,
        "3km 전체": r3k.body.meta.total_count,
        "가장 가까운 m": r1k.docs[0] ? Number(r1k.docs[0].distance) : null,
        "평균 ms": avg(r1k.times),
      });
      raw[menu.query] = r1k.docs;
    }
    console.table(rows);

    // 추천 1회 비용: 상위 후보 5개 메뉴를 1페이지씩 검색
    const top5 = MENUS.slice(0, 5);
    let t = performance.now();
    for (const m of top5) {
      await kakao("keyword.json", { query: m.query, ...coord(loc), radius: "1000", category_group_code: "FD6", size: "15" });
    }
    const seqMs = Math.round(performance.now() - t);
    t = performance.now();
    await Promise.all(top5.map((m) =>
      kakao("keyword.json", { query: m.query, ...coord(loc), radius: "1000", category_group_code: "FD6", size: "15" })));
    const parMs = Math.round(performance.now() - t);
    console.log(`메뉴 5개 검색: 순차 ${seqMs}ms, 병렬 ${parMs}ms`);

    await writeFile(
      new URL(`kakao-${loc.id}.json`, OUT_DIR),
      JSON.stringify({ location: loc, category1k: cat1k.body.meta, summary: rows, places: raw }, null, 2),
    );
  }

  const sorted = [...allTimes].sort((a, b) => a - b);
  console.log(`\n호출 ${sorted.length}회 응답 시간: 평균 ${avg(sorted)}ms, p50 ${sorted[Math.floor(sorted.length * 0.5)]}ms, p95 ${sorted[Math.floor(sorted.length * 0.95)]}ms, 최대 ${sorted.at(-1)}ms`);
  console.log(`원본 저장: scripts/spike/out/kakao-*.json`);
}

main();
