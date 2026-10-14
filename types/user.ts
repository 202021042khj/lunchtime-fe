export type LoginProvider = "kakao" | "apple" | "google";
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
  provider: LoginProvider;
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
