"use client";

import { ImagePlus } from "lucide-react";
import { ChangeEvent, useId, useRef, useState } from "react";
import Button from "@/components/ui/button";
import { uploadAdminImage } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { AdminImagePurpose } from "@/types/admin";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

interface ImageUploadFieldProps {
  value: string | null;
  onChange: (imageUrl: string | null) => void;
  purpose: AdminImagePurpose;
  // 미리보기 · 버튼 이름에 쓰는 말 (예: "메뉴 사진", "식당 사진")
  label: string;
  // 올리는 동안 저장 버튼을 막을 수 있게 알린다
  onUploadingChange?: (uploading: boolean) => void;
}

// 어드민 사진 칸: 미리보기 + [사진 올리기 · 바꾸기] [빼기]. 고르면 바로 저장소에 올리고 주소를 받는다
// (메뉴 · 광고를 저장해야 반영된다). 형식 · 크기는 여기서 먼저 보고, 서버가 파일 내용으로 다시 확인한다
export default function ImageUploadField({
  value,
  onChange,
  purpose,
  label,
  onUploadingChange,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setBusy = (busy: boolean) => {
    setUploading(busy);
    onUploadingChange?.(busy);
  };

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 같은 파일을 다시 골라도 change가 오게 비운다
    e.target.value = "";
    if (!file) return;
    if (!ACCEPT.includes(file.type))
      return setError("JPG · PNG · WEBP 사진만 올릴 수 있어요.");
    if (file.size > MAX_BYTES)
      return setError("사진은 5MB까지 올릴 수 있어요.");
    setError(null);
    setBusy(true);
    try {
      const { imageUrl } = await uploadAdminImage(file, purpose);
      onChange(imageUrl);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "사진을 올리지 못했어요. 다시 시도해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex size-[88px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-separators-non-opaque bg-surface-placeholder",
          uploading && "animate-pulse",
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- 저장소 주소(개발 RustFS, 운영 CDN)가 정해지기 전까지 img
          <img
            src={value}
            alt={`${label} 미리보기`}
            className="size-full object-cover"
          />
        ) : (
          <ImagePlus
            aria-hidden
            className="size-6 text-labels-tertiary"
            strokeWidth={1.5}
          />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outlined"
            color="brand"
            shape="round"
            size="sm"
            isLoading={uploading}
            onClick={() => inputRef.current?.click()}
            className="font-semibold"
          >
            {value ? "바꾸기" : `${label} 올리기`}
          </Button>
          {value && !uploading && (
            <Button
              type="button"
              variant="text"
              color="black"
              shape="round"
              size="sm"
              onClick={() => onChange(null)}
              className="font-semibold"
            >
              빼기
            </Button>
          )}
        </div>
        {error ? (
          <p role="alert" className="text-footnote text-accents-red">
            {error}
          </p>
        ) : (
          <p className="text-footnote text-labels-tertiary">
            JPG · PNG · WEBP, 5MB까지
          </p>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT.join(",")}
          onChange={onPick}
          aria-label={`${label} 파일 고르기`}
          className="sr-only"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
