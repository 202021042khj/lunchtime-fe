export interface LatLng {
  lat: number;
  lng: number;
}

// 사용자 화면 목록: ?cursor=&limit=
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

// 어드민 표: ?page=&size=
export interface AdminPage<T> {
  items: T[];
  total: number;
}

export type ErrorCode =
  | "VALIDATION_FAILED"
  | "REVIEW_TOO_LONG"
  | "TOO_MANY_PHOTOS"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "USER_SUSPENDED"
  | "NOT_FOUND"
  | "REVIEW_DAILY_LIMIT"
  | "ALREADY_REPORTED"
  | "ALREADY_REPORTED_MENU"
  | "OUT_OF_SERVICE_AREA"
  | "RATE_LIMITED"
  | "UPSTREAM_UNAVAILABLE"
  | "LOCATION_REQUIRED";

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    fields?: Record<string, string>; // VALIDATION_FAILED
    until?: string; // USER_SUSPENDED
  };
}
