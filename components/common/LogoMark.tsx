import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
}

// Figma: Logo Mark (21:361) — 32px, Brand/Primary 배경, 포크·나이프
export default function LogoMark({ className }: LogoMarkProps) {
  return (
    <span
      className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-brand-primary", className)}
    >
      <Image src="/logo-fork-knife.svg" alt="lunchtime" width={20} height={20} unoptimized />
    </span>
  );
}
