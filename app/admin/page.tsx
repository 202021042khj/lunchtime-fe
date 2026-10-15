import { redirect } from "next/navigation";
import { ADMIN_ROUTES } from "@/constants/navigation";

// /admin → 유저 관리
export default function AdminIndexPage() {
  redirect(ADMIN_ROUTES.users);
}
