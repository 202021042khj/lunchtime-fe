export type SocialProvider = "kakao" | "apple" | "google";
// email: 자체 계정 (이메일 인증번호로 가입)
export type LoginProvider = SocialProvider | "email";
export type UserRole = "user" | "admin";

export interface UserStats {
  reviewCount: number;
  favoriteCount: number;
  recommendationCount: number;
}

// GET /me
export interface User {
  id: string;
  name: string;
  provider: LoginProvider;
  role: UserRole;
  onboardingCompleted: boolean;
  createdAt: string;
  stats: UserStats;
}

export interface LoginRequest {
  provider: SocialProvider;
  providerToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  isNewUser: boolean;
  user: Pick<User, "id" | "name" | "provider" | "role" | "onboardingCompleted">;
}

// ---------- 이메일 계정 (API.md에 없어 FE에서 정함) ----------

export type EmailCodePurpose = "signup" | "reset";

// POST /auth/email/code
export interface EmailCodeRequest {
  email: string;
  purpose: EmailCodePurpose;
}

export interface EmailCodeResponse {
  expiresInSec: number;
  resendAfterSec: number;
}

// POST /auth/email/verify
export interface EmailVerifyRequest extends EmailCodeRequest {
  code: string;
}

export interface EmailVerifyResponse {
  verificationToken: string;
}

// POST /auth/email/signup → LoginResponse
export interface EmailSignupRequest {
  email: string;
  password: string;
  name: string;
  verificationToken: string;
}

// POST /auth/email/login → LoginResponse
export interface EmailLoginRequest {
  email: string;
  password: string;
}

// POST /auth/email/password-reset → 204
export interface PasswordResetRequest {
  email: string;
  password: string;
  verificationToken: string;
}
