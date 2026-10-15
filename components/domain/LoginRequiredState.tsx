import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/common/EmptyState";
import { ROUTES } from "@/constants/navigation";

// 로그인해야 볼 수 있는 화면(찜 · MY)을 비로그인으로 열었을 때. 로그인 화면(09)은 다음 단계에서 만든다
export default function LoginRequiredState({ description, className = "py-20" }: { description: string; className?: string }) {
  const router = useRouter();
  return (
    <EmptyState
      className={className}
      icon={<User className="fill-current" />}
      title="로그인이 필요해요"
      description={description}
      primaryAction={{ label: "로그인하기", onClick: () => router.push(ROUTES.login) }}
      secondaryAction={{ label: "추천 보러 가기", onClick: () => router.push(ROUTES.home) }}
    />
  );
}
