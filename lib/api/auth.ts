import { request } from "@/lib/api/client";
import { clearTokens, getRefreshToken, saveTokens } from "@/lib/api/token";
import {
  EmailCodeRequest,
  EmailCodeResponse,
  EmailLoginRequest,
  EmailSignupRequest,
  EmailVerifyRequest,
  EmailVerifyResponse,
  LoginRequest,
  LoginResponse,
  PasswordResetRequest,
  User,
} from "@/types/user";

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

// ---------- 이메일 계정 ----------

export function sendEmailCode(input: EmailCodeRequest): Promise<EmailCodeResponse> {
  return request<EmailCodeResponse>("POST", "/auth/email/code", { body: input });
}

export function verifyEmailCode(input: EmailVerifyRequest): Promise<EmailVerifyResponse> {
  return request<EmailVerifyResponse>("POST", "/auth/email/verify", { body: input });
}

export async function signupWithEmail(input: EmailSignupRequest): Promise<LoginResponse> {
  const res = await request<LoginResponse>("POST", "/auth/email/signup", { body: input });
  saveTokens(res);
  return res;
}

export async function loginWithEmail(input: EmailLoginRequest): Promise<LoginResponse> {
  const res = await request<LoginResponse>("POST", "/auth/email/login", { body: input });
  saveTokens(res);
  return res;
}

export function resetPassword(input: PasswordResetRequest): Promise<void> {
  return request<void>("POST", "/auth/email/password-reset", { body: input });
}
