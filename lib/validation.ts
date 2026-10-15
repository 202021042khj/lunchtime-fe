import { AUTH_RULES } from "@/constants/user";

// 이메일 계정 입력 검사. 문제가 없으면 null, 있으면 화면에 보여 줄 문구
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function checkEmail(email: string): string | null {
  if (!email.trim()) return "이메일을 입력해 주세요.";
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? null : "이메일 형식이 맞지 않아요.";
}

export function checkPassword(password: string): string | null {
  if (password.length < AUTH_RULES.passwordMin || password.length > AUTH_RULES.passwordMax) {
    return `비밀번호는 ${AUTH_RULES.passwordMin}~${AUTH_RULES.passwordMax}자로 만들어 주세요.`;
  }
  return /[A-Za-z]/.test(password) && /\d/.test(password) ? null : "영문과 숫자를 모두 넣어 주세요.";
}

export function checkName(name: string): string | null {
  const length = name.trim().length;
  return length >= AUTH_RULES.nameMin && length <= AUTH_RULES.nameMax
    ? null
    : `이름은 ${AUTH_RULES.nameMin}~${AUTH_RULES.nameMax}자로 입력해 주세요.`;
}

export const isCode = (code: string) => code.length === AUTH_RULES.codeLength && /^\d+$/.test(code);
