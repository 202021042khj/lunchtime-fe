// 카카오 지도 CustomOverlay에 넣는 핀 DOM. 클래스는 Tailwind가 이 파일에서 읽어 간다
const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

function star(size: number): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${STAR_PATH}"/></svg>`;
}

// 홈 미리보기(Figma 01 Home Map Preview): 강조 핀은 큰 브랜드 색, 나머지는 작은 흰 핀
export function previewPin(primary: boolean): HTMLElement {
  const el = document.createElement("div");
  el.className = primary
    ? "flex size-[34px] items-center justify-center rounded-full border-2 border-white bg-brand-primary text-white shadow-[0_2px_6px_rgba(0,0,0,0.18)]"
    : "flex size-[26px] items-center justify-center rounded-full border-2 border-white bg-white text-brand-primary shadow-[0_2px_6px_rgba(0,0,0,0.18)]";
  el.innerHTML = star(primary ? 16 : 12);
  return el;
}

// 지도 화면(Figma 03 Map Pin / Pin · Selected): 흰 바탕 + 브랜드 테두리, 선택하면 이름이 붙은 브랜드 알약
export function mapPin(name: string, selected: boolean, onClick: () => void): HTMLElement {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", name);
  if (selected) {
    el.className =
      "flex cursor-pointer items-center gap-1.5 rounded-full bg-brand-primary py-2 pr-3.5 pl-2.5 text-footnote font-semibold whitespace-nowrap text-white shadow-[0_4px_12px_rgba(64,38,20,0.3)]";
    el.innerHTML = `${star(14)}<span></span>`;
    el.querySelector("span")!.textContent = name;
  } else {
    el.className =
      "flex size-7 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-brand-primary bg-white text-brand-primary shadow-[0_2px_6px_rgba(64,38,20,0.2)]";
    el.innerHTML = star(14);
  }
  el.addEventListener("click", onClick);
  return el;
}

// 내 위치 점. halo는 지도 화면용(푸른 번짐 포함)
export function mePin(halo = false): HTMLElement {
  const el = document.createElement("img");
  el.src = halo ? "/map-me-halo.svg" : "/map-me.svg";
  el.alt = "내 위치";
  el.width = halo ? 38 : 16;
  el.height = halo ? 38 : 16;
  // Tailwind 기본 스타일(img { max-width: 100% })이 폭 없는 오버레이 안에서 이미지를 0px로 줄이므로 해제한다
  el.style.maxWidth = "none";
  return el;
}
