import { request } from "@/lib/api/client";
import { clearTokens, getRefreshToken, saveTokens } from "@/lib/api/token";
import { LoginRequest, LoginResponse, User } from "@/types/user";

export async function login(input: LoginRequest): Promise<LoginResponse> {
  const res = await request<LoginResponse>("POST", "/auth/login", { body: input });
  saveTokens(res);
  return res;
}

export async function logout(): Promise<void> {
  await request<void>("POST", "/auth/logout", { body: { refreshToken: getRefreshToken() } });
  clearTokens();
}

export function getMe(): Promise<User> {
  return request<User>("GET", "/me");
}

export async function withdraw(): Promise<void> {
  await request<void>("DELETE", "/me");
  clearTokens();
}
