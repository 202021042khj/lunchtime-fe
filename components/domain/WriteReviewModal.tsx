"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ImageIcon, Plus, Star, X } from "lucide-react";
import { overlay } from "overlay-kit";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { confirm } from "@/components/common/ConfirmDialog";
import FoodImage, { isExampleImage } from "@/components/common/FoodImage";
import SelectChip from "@/components/common/SelectChip";
import Button from "@/components/ui/button";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { openLoginRequired } from "@/components/domain/LoginRequiredModal";
import { notify } from "@/components/ui/notify/notify-utils";
import { RATING_LABELS, REVIEW_LIMITS } from "@/constants/review";
import { ApiError } from "@/lib/api/client";
import { createReview, getReviewForm, requestPhotoUploads, updateReview } from "@/lib/api/reviews";
import { joinMeta, suspendedNotice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Restaurant } from "@/types/restaurant";
import { CreateReviewResponse, Review, ReviewForm } from "@/types/review";

// 모달 머리의 식당 정보. 지도에서는 Restaurant, MY에서는 리뷰의 식당 이름으로 만든다
interface ReviewPlace {
  placeId: string;
  name: string;
  imageUrl: string | null;
  // 음식 종류: 사진이 없을 때 종류별 대체 이미지 (MY에서는 모름)
  cuisine?: string;
  // 식당의 실제 사진이 아니면 "예시" 배지
  example?: boolean;
  meta: string | null;
}

interface WriteReviewModalProps {
  isOpen: boolean;
  place: ReviewPlace;
  // 있으면 수정 모드 (MY의 [수정])
  editing?: Review | null;
  onClose: () => void;
  onDone: (result: CreateReviewResponse) => void;
}

// 새 사진은 파일, 수정 모드에서 그대로 두는 사진은 photoId
interface LocalPhoto {
  key: string;
  file?: File;
  photoId?: string;
  previewUrl: string | null;
}

function openModal(place: ReviewPlace, editing: Review | null, onDone: (result: CreateReviewResponse) => void) {
  overlay.open(({ isOpen, close, unmount }) => (
    <WriteReviewModal
      isOpen={isOpen}
      place={place}
      editing={editing}
      onDone={onDone}
      onClose={() => {
        close();
        window.setTimeout(unmount, 200);
      }}
    />
  ));
}

// 지도 상세의 [리뷰 쓰기]에서 연다
export function openWriteReview(restaurant: Restaurant, onCreated: (result: CreateReviewResponse) => void) {
  openModal(
    {
      placeId: restaurant.placeId,
      name: restaurant.name,
      imageUrl: restaurant.imageUrl,
      cuisine: restaurant.category,
      example: isExampleImage(restaurant),
      meta: joinMeta([restaurant.category, restaurant.mainMenu, neighborhoodOf(restaurant.address)]),
    },
    null,
    onCreated,
  );
}

// MY의 [수정]에서 연다
export function openEditReview(review: Review, onUpdated: (result: CreateReviewResponse) => void) {
  openModal({ placeId: review.placeId, name: review.placeName, imageUrl: null, meta: null }, review, onUpdated);
}

const ERROR_MESSAGES: Partial<Record<string, string>> = {
  REVIEW_DAILY_LIMIT: "이 식당에는 오늘 이미 리뷰를 썼어요. 내일 다시 남겨 주세요.",
  REVIEW_TOO_LONG: "후기는 500자까지 쓸 수 있어요.",
  TOO_MANY_PHOTOS: "사진은 5장까지 올릴 수 있어요.",
};

const PHOTO_UPLOAD_FAILED = "사진을 올리지 못했어요. 사진을 다시 골라 주세요.";
// 서버가 받는 사진 (API.md 리뷰 사진)
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

// "서울 강남구 역삼동 123-45" → "역삼동"
function neighborhoodOf(address: string): string | null {
  return address.split(" ").find((part) => /(동|가|리|읍|면)$/.test(part)) ?? null;
}

// Figma: 04 Write Review (24:480). 모바일은 전체 화면 시트, [등록하기]는 하단 고정 (반응형 규칙)
export default function WriteReviewModal({ isOpen, place, editing = null, onClose, onDone }: WriteReviewModalProps) {
  const [form, setForm] = useState<ReviewForm | null>(null);
  const [rating, setRating] = useState(editing?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [menus, setMenus] = useState<string[]>(editing?.menus ?? []);
  const [extraMenus, setExtraMenus] = useState<string[]>([]); // 직접 입력한 메뉴
  const [customMenu, setCustomMenu] = useState<string | null>(null); // null = 입력칸 닫힘
  const [tags, setTags] = useState<string[]>(editing?.tags ?? []);
  const [content, setContent] = useState(editing?.content ?? "");
  const [photos, setPhotos] = useState<LocalPhoto[]>(
    () => editing?.photos.map((ph) => ({ key: ph.id, photoId: ph.id, previewUrl: ph.url || null })) ?? [],
  );
  const [submitting, setSubmitting] = useState(false);
  const [showRatingHint, setShowRatingHint] = useState(false);
  // 처음 상태와 다르면 닫을 때 확인한다
  const [initialSnapshot] = useState(() =>
    JSON.stringify([editing?.rating ?? 0, editing?.menus ?? [], editing?.tags ?? [], editing?.content ?? "", editing?.photos.length ?? 0]),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef(photos);

  useEffect(() => {
    getReviewForm(place.placeId)
      .then(setForm)
      .catch(() => setForm({ menus: [], tags: [] }));
  }, [place.placeId]);

  // 미리보기 URL 정리
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => p.file && p.previewUrl && URL.revokeObjectURL(p.previewUrl)), []);

  const dirty = JSON.stringify([rating, menus, tags, content, photos.length]) !== initialSnapshot;
  const requestClose = async () => {
    if (!dirty || submitting) return onClose();
    const ok = await confirm({
      title: editing ? "수정한 내용이 사라져요" : "작성 중인 리뷰가 사라져요",
      description: "그래도 닫을까요?",
      confirmLabel: "닫기",
      cancelLabel: "계속 쓰기",
    });
    if (ok) onClose();
  };

  const toggle = (list: string[], setList: (v: string[]) => void, value: string, max: number) => {
    if (list.includes(value)) setList(list.filter((v) => v !== value));
    else if (list.length >= max) notify.error(`${max}개까지 고를 수 있어요.`);
    else setList([...list, value]);
  };

  const addCustomMenu = () => {
    const name = customMenu?.trim();
    if (!name) return setCustomMenu(null);
    if (![...(form?.menus ?? []), ...extraMenus].includes(name)) setExtraMenus((m) => [...m, name]);
    if (!menus.includes(name)) toggle(menus, setMenus, name, REVIEW_LIMITS.menus);
    setCustomMenu(null);
  };

  const addPhotos = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    const files = picked.filter((f) => PHOTO_TYPES.includes(f.type) && f.size <= PHOTO_MAX_BYTES);
    if (files.length < picked.length) notify.error("JPG · PNG · WEBP 사진, 5MB까지 올릴 수 있어요.");
    const room = REVIEW_LIMITS.photos - photos.length;
    if (files.length > room) notify.error("사진은 5장까지 올릴 수 있어요.");
    setPhotos((prev) => [
      ...prev,
      ...files.slice(0, room).map((file) => ({ key: `${file.name}-${file.lastModified}-${Math.random()}`, file, previewUrl: URL.createObjectURL(file) })),
    ]);
  };

  const removePhoto = (key: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.key === key);
      if (target?.file && target.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.key !== key);
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setShowRatingHint(true);
      return;
    }
    setSubmitting(true);
    try {
      // 사진은 받은 업로드 주소(서명된 URL)에 먼저 올리고, 받은 id만 리뷰에 담는다
      const keptIds = photos.flatMap((ph) => (ph.photoId ? [ph.photoId] : []));
      const newFiles = photos.flatMap((ph) => (ph.file ? [ph.file] : []));
      let newIds: string[] = [];
      if (newFiles.length) {
        const { items } = await requestPhotoUploads(newFiles.length);
        const uploaded = await Promise.all(
          items.map((slot, i) =>
            slot.uploadUrl.startsWith("https://upload.mock")
              ? true
              : fetch(slot.uploadUrl, { method: "PUT", body: newFiles[i] }).then((res) => res.ok, () => false),
          ),
        );
        if (uploaded.includes(false)) throw new ApiError(400, "VALIDATION_FAILED", PHOTO_UPLOAD_FAILED);
        newIds = items.map((slot) => slot.photoId);
      }
      const input = { rating, menus, tags, content: content.trim() || null, photoIds: [...keptIds, ...newIds] };
      const result = editing ? await updateReview(editing.id, input) : await createReview(place.placeId, input);
      notify.success(editing ? "리뷰를 수정했어요." : "리뷰를 등록했어요.");
      onDone(result);
      onClose();
    } catch (error) {
      const code = error instanceof ApiError ? error.code : "";
      // 세션이 끝났으면 로그인 팝업을 모달 위에 띄운다 ("다음에 할게요"면 쓰던 내용이 그대로 남는다)
      if (code === "UNAUTHORIZED") return openLoginRequired("review");
      // 올리기 실패, 또는 서버가 사진 id를 받지 않음(주소 만료 등)
      if (error instanceof ApiError && (error.message === PHOTO_UPLOAD_FAILED || error.fields?.photoIds)) return notify.error(PHOTO_UPLOAD_FAILED);
      if (error instanceof ApiError && code === "USER_SUSPENDED") return notify.error(suspendedNotice(error.message, error.until, "리뷰를 쓸"));
      notify.error(ERROR_MESSAGES[code] ?? `리뷰를 ${editing ? "수정" : "등록"}하지 못했어요. 잠시 후 다시 시도해 주세요.`);
    } finally {
      setSubmitting(false);
    }
  };

  const shownRating = hoverRating || rating;
  const menuOptions = [...new Set([...(form?.menus ?? []), ...(editing?.menus ?? []), ...extraMenus])];

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && requestClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-[rgba(31,20,13,0.4)]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed z-dialog flex flex-col bg-white outline-none",
            "inset-0 pt-[env(safe-area-inset-top)]",
            "md:inset-auto md:top-1/2 md:left-1/2 md:max-h-[90vh] md:w-[min(880px,calc(100vw-48px))] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[32px] md:border md:border-white md:bg-white/94 md:pt-0 md:shadow-[0_24px_64px_rgba(51,26,13,0.25)] md:backdrop-blur-[20px]",
          )}
        >
          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 md:px-8 md:pt-7 md:pb-0">
              <DialogPrimitive.Title className="text-title-2 font-bold text-labels-primary">{editing ? "리뷰 수정" : "리뷰 쓰기"}</DialogPrimitive.Title>
              <button
                type="button"
                aria-label="닫기"
                onClick={requestClose}
                className="flex size-8 items-center justify-center rounded-full bg-[rgba(117,117,128,0.12)] text-labels-secondary hover:text-labels-primary"
              >
                <X aria-hidden className="size-4" strokeWidth={2.25} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 md:px-8 md:pt-6">
              <div className="flex items-center gap-3 rounded-[18px] bg-brand-primary-tint p-3">
                <FoodImage src={place.imageUrl} alt={place.name} compact cuisine={place.cuisine} exampleNotice={place.example && "badge"} className="size-12 shrink-0 rounded-xl" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="truncate text-headline text-labels-primary">{place.name}</p>
                  {place.meta && <p className="truncate text-footnote text-labels-secondary">{place.meta}</p>}
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2 md:gap-8">
                <div className="flex flex-col gap-6">
                  <section className="flex flex-col gap-2.5">
                    <h3 className="text-headline text-labels-primary">식사는 어떠셨나요?</h3>
                    <div role="radiogroup" aria-label="별점" className="flex gap-2.5" onMouseLeave={() => setHoverRating(0)}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={rating === n}
                          aria-label={`${n}점 ${RATING_LABELS[n]}`}
                          onClick={() => {
                            setRating(n);
                            setShowRatingHint(false);
                          }}
                          onMouseEnter={() => setHoverRating(n)}
                          className="text-brand-primary transition-transform hover:scale-110"
                        >
                          <Star aria-hidden className={cn("size-9", n <= shownRating ? "fill-current" : "text-brand-primary/40")} strokeWidth={1.5} />
                        </button>
                      ))}
                    </div>
                    <p className={cn("min-h-5 text-subheadline font-semibold", showRatingHint && !rating ? "text-accents-red" : "text-brand-primary")}>
                      {shownRating ? RATING_LABELS[shownRating] : showRatingHint ? "별점을 골라 주세요" : ""}
                    </p>
                  </section>

                  <section className="flex flex-col gap-3">
                    <h3 className="flex items-center gap-1.5">
                      <span className="text-headline text-labels-primary">무엇을 드셨나요?</span>
                      <span className="text-footnote text-labels-tertiary">여러 개 선택 가능</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {!form && <span className="h-10 w-48 animate-pulse rounded-full bg-surface-placeholder" />}
                      {menuOptions.map((menu) => (
                        <SelectChip
                          key={menu}
                          label={menu}
                          selected={menus.includes(menu)}
                          onToggle={() => toggle(menus, setMenus, menu, REVIEW_LIMITS.menus)}
                        />
                      ))}
                      {form &&
                        (customMenu === null ? (
                          <button
                            type="button"
                            onClick={() => setCustomMenu("")}
                            className="inline-flex items-center gap-1 rounded-full border border-dashed border-chip-border px-4 py-[9px] text-subheadline text-labels-secondary hover:text-labels-primary"
                          >
                            <Plus aria-hidden className="size-4" />
                            직접 입력
                          </button>
                        ) : (
                          <input
                            autoFocus
                            value={customMenu}
                            maxLength={20}
                            onChange={(e) => setCustomMenu(e.target.value)}
                            onBlur={addCustomMenu}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addCustomMenu();
                              }
                            }}
                            placeholder="목록에 없는 메뉴"
                            aria-label="목록에 없는 메뉴"
                            className="h-10 w-40 rounded-full border border-brand-primary bg-white px-4 text-subheadline outline-none"
                          />
                        ))}
                    </div>
                  </section>

                  <section className="flex flex-col gap-3">
                    <h3 className="text-headline text-labels-primary">이런 점이 좋았어요</h3>
                    <div className="flex flex-wrap gap-2">
                      {form?.tags.map((tag) => (
                        <SelectChip key={tag} label={tag} selected={tags.includes(tag)} onToggle={() => toggle(tags, setTags, tag, REVIEW_LIMITS.tags)} />
                      ))}
                    </div>
                  </section>
                </div>

                <div className="flex flex-col gap-6">
                  <section className="flex flex-1 flex-col gap-3">
                    <h3 className="flex items-center gap-1.5">
                      <label htmlFor="review-content" className="text-headline text-labels-primary">
                        자세한 후기
                      </label>
                      <span className="text-footnote text-labels-tertiary">선택</span>
                    </h3>
                    <div className="flex min-h-[160px] flex-1 flex-col rounded-2xl border border-separators-non-opaque bg-white px-4 pt-3.5 pb-3 focus-within:border-brand-primary">
                      <textarea
                        id="review-content"
                        value={content}
                        maxLength={REVIEW_LIMITS.content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="맛, 양, 분위기 등 다른 사람에게 도움이 될 이야기를 남겨주세요."
                        className="min-h-0 flex-1 resize-none bg-transparent text-subheadline text-labels-primary outline-none placeholder:text-labels-tertiary"
                      />
                      <p className="text-right text-footnote text-labels-tertiary">
                        {content.length} / {REVIEW_LIMITS.content}
                      </p>
                    </div>
                  </section>

                  <section className="flex flex-col gap-3">
                    <h3 className="flex items-center gap-1.5">
                      <span className="text-headline text-labels-primary">사진</span>
                      <span className="text-footnote text-labels-tertiary">최대 {REVIEW_LIMITS.photos}장</span>
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                      {photos.length < REVIEW_LIMITS.photos && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex size-[88px] flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] border-dashed border-brand-primary bg-brand-primary-tint text-brand-primary"
                        >
                          <Plus aria-hidden className="size-5" />
                          <span className="text-footnote font-semibold">
                            {photos.length} / {REVIEW_LIMITS.photos}
                          </span>
                        </button>
                      )}
                      {photos.map((photo) => (
                        <div key={photo.key} className="relative size-[88px] overflow-hidden rounded-2xl bg-surface-placeholder">
                          {photo.previewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- 로컬 미리보기(blob URL) · 기존 사진
                            <img src={photo.previewUrl} alt="" className="size-full object-cover" />
                          ) : (
                            <span className="flex size-full items-center justify-center text-labels-tertiary">
                              <ImageIcon aria-hidden className="size-5" />
                            </span>
                          )}
                          <button
                            type="button"
                            aria-label="사진 빼기"
                            onClick={() => removePhoto(photo.key)}
                            className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/55 text-white"
                          >
                            <X aria-hidden className="size-3.5" strokeWidth={2.5} />
                          </button>
                        </div>
                      ))}
                      {!photos.length && (
                        <div aria-hidden className="flex size-[88px] items-center justify-center rounded-2xl bg-surface-placeholder text-labels-tertiary">
                          <ImageIcon className="size-5" />
                        </div>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept={PHOTO_TYPES.join(",")} multiple hidden onChange={addPhotos} />
                  </section>
                </div>
              </div>
            </div>

            {/* 모바일은 하단 고정, 데스크톱은 구분선 아래 */}
            <div className="flex items-center gap-2.5 border-t-[0.5px] border-separators-non-opaque px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] md:mx-8 md:px-0 md:pt-6 md:pb-7">
              <p className="hidden flex-1 text-footnote text-labels-secondary md:block">작성한 리뷰는 식당 별점에 바로 반영돼요.</p>
              <Button
                type="button"
                variant="outlined"
                color="brand"
                shape="round"
                className="hidden px-5 text-[17px] font-medium md:inline-flex"
                onClick={requestClose}
              >
                취소
              </Button>
              <Button type="submit" color="brand" shape="round" isLoading={submitting} className="flex-1 px-5 text-[17px] font-medium md:flex-none">
                {editing ? "수정하기" : "등록하기"}
              </Button>
            </div>
          </form>

        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}
