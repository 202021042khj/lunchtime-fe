// 기상청 단기예보 스파이크: 위경도 → 격자 변환, 현재 날씨·최고/최저 조회, 응답 시간 확인.
// 실행: node --env-file=.env.local scripts/spike/kma.mjs

import { mkdir, writeFile } from "node:fs/promises";

const RAW_KEY = process.env.KMA_SERVICE_KEY;
if (!RAW_KEY) {
  console.error("KMA_SERVICE_KEY가 없어요. .env.local을 확인하세요.");
  process.exit(1);
}
// 이미 인코딩된 키(%2B 등)를 넣었어도 URLSearchParams가 한 번만 인코딩하도록 먼저 디코딩
const SERVICE_KEY = RAW_KEY.includes("%") ? decodeURIComponent(RAW_KEY) : RAW_KEY;
const BASE = (process.env.KMA_BASE_URL || "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0").replace(/\/$/, "");
const OUT_DIR = new URL("./out/", import.meta.url);

const LOCATIONS = [
  { id: "yeoksam", name: "역삼동", lat: 37.5006, lng: 127.0365 },
  { id: "pangyo", name: "판교테크노밸리", lat: 37.4019, lng: 127.1086 },
  { id: "sejong", name: "세종시청", lat: 36.48, lng: 127.289 },
];

// 기상청 LCC 격자 변환 (단기예보 활용가이드 기준 파라미터)
function toGrid(lat, lng) {
  const RE = 6371.00877, GRID = 5.0, SLAT1 = 30.0, SLAT2 = 60.0, OLON = 126.0, OLAT = 38.0, XO = 43, YO = 136;
  const DEG = Math.PI / 180.0;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEG, slat2 = SLAT2 * DEG, olon = OLON * DEG, olat = OLAT * DEG;
  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);
  let ra = Math.tan(Math.PI * 0.25 + lat * DEG * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lng * DEG - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;
  return { nx: Math.floor(ra * Math.sin(theta) + XO + 0.5), ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5) };
}

// 컴퓨터 시간대와 관계없이 KST로 계산
function kstNow() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}
const ymd = (d) => d.toISOString().slice(0, 10).replaceAll("-", "");
const hh = (d) => String(d.getUTCHours()).padStart(2, "0");
const minus = (d, minutes) => new Date(d.getTime() - minutes * 60 * 1000);

// 초단기실황: 매시 정각 자료, 40분 이후 제공 → 여유 있게 45분 전 시각의 정각
function ncstBase(now) {
  const d = minus(now, 45);
  return { base_date: ymd(d), base_time: `${hh(d)}00` };
}
// 초단기예보: 매시 30분 자료, 45분 이후 제공
function ultraFcstBase(now) {
  const d = minus(now, 45);
  return { base_date: ymd(d), base_time: `${hh(d)}30` };
}
// 오늘 최고/최저: 오늘 02시 발표(02:10 이후 제공)에 TMN·TMX가 모두 있다. 그 전이면 어제 23시 발표
function dailyBase(now) {
  const twoTen = new Date(now);
  twoTen.setUTCHours(2, 10, 0, 0);
  if (now >= twoTen) return { base_date: ymd(now), base_time: "0200" };
  return { base_date: ymd(minus(now, 24 * 60)), base_time: "2300" };
}

async function kma(op, base, grid) {
  const params = new URLSearchParams({
    serviceKey: SERVICE_KEY, pageNo: "1", numOfRows: "1000", dataType: "JSON",
    ...base, nx: String(grid.nx), ny: String(grid.ny),
  });
  const started = performance.now();
  const res = await fetch(`${BASE}/${op}?${params}`);
  const ms = Math.round(performance.now() - started);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    // 키 오류 등은 JSON이 아니라 XML로 온다
    const msg = text.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/)?.[1] ?? text.slice(0, 200);
    return { ok: false, ms, error: `HTTP ${res.status} ${msg}` };
  }
  const header = body.response?.header;
  if (header?.resultCode !== "00") return { ok: false, ms, error: `${header?.resultCode} ${header?.resultMsg}` };
  return { ok: true, ms, items: body.response.body.items.item };
}

const SKY = { 1: ["clear", "맑음"], 3: ["cloudy", "구름많음"], 4: ["overcast", "흐림"] };
const PTY = { 1: ["rain", "비"], 2: ["sleet", "비/눈"], 3: ["snow", "눈"], 5: ["rain", "빗방울"], 6: ["sleet", "빗방울눈날림"], 7: ["snow", "눈날림"] };

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const now = kstNow();
  console.log(`기준 시각(KST): ${now.toISOString().slice(0, 16).replace("T", " ")}`);
  console.log(`End Point: ${BASE}`);

  const rows = [];
  const raw = {};
  for (const loc of LOCATIONS) {
    const grid = toGrid(loc.lat, loc.lng);
    const [ncst, ultra, daily] = await Promise.all([
      kma("getUltraSrtNcst", ncstBase(now), grid),
      kma("getUltraSrtFcst", ultraFcstBase(now), grid),
      kma("getVilageFcst", dailyBase(now), grid),
    ]);
    raw[loc.id] = { location: loc, grid, ncst, ultra, daily };

    const errors = [ncst, ultra, daily].filter((r) => !r.ok).map((r) => r.error);
    let weather = null;
    if (!errors.length) {
      const obs = Object.fromEntries(ncst.items.map((i) => [i.category, i.obsrValue]));
      // 초단기예보에서 가장 가까운 시각의 SKY
      const sky = ultra.items.filter((i) => i.category === "SKY").sort((a, b) =>
        (a.fcstDate + a.fcstTime).localeCompare(b.fcstDate + b.fcstTime))[0]?.fcstValue;
      const today = ymd(now);
      const pick = (cat) => daily.items.find((i) => i.category === cat && i.fcstDate === today)?.fcstValue;
      const [condition, label] = PTY[obs.PTY] ?? SKY[sky] ?? [null, null];
      weather = {
        tempC: Math.round(Number(obs.T1H)),
        condition, label,
        highC: pick("TMX") != null ? Math.round(Number(pick("TMX"))) : null,
        lowC: pick("TMN") != null ? Math.round(Number(pick("TMN"))) : null,
      };
      raw[loc.id].weather = weather;
    }

    rows.push({
      위치: loc.name,
      격자: `${grid.nx},${grid.ny}`,
      "실황 ms": ncst.ms, "초단기예보 ms": ultra.ms, "단기예보 ms": daily.ms,
      결과: errors.length ? `실패: ${errors[0]}` : JSON.stringify(weather),
    });
  }
  console.table(rows);

  if (rows.some((r) => String(r.결과).includes("SERVICE_KEY"))) {
    console.log("인증키 오류: 승인 직후면 1~2시간 뒤 다시 시도하고, 계속되면 .env.local의 키를 확인하세요.");
  }
  await writeFile(new URL("kma.json", OUT_DIR), JSON.stringify(raw, null, 2));
  console.log("원본 저장: scripts/spike/out/kma.json");
}

main();
