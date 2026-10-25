import { isNonEmptyString, isRecord } from "../validation";

export const SESSION_KEY = "exchange.auth.session";
export const SESSION_CHANGED_EVENT = "exchange:session-changed";

export function readStoredSession(): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeSession(value: unknown): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export function readTokens(): { accessToken: string; refreshToken: string } | null {
  const value = readStoredSession();
  return isRecord(value) && isNonEmptyString(value.accessToken) && isNonEmptyString(value.refreshToken)
    ? { accessToken: value.accessToken, refreshToken: value.refreshToken }
    : null;
}

export function replaceTokens(previousRefreshToken: string, accessToken: string, refreshToken: string): boolean {
  const value = readStoredSession();
  if (!isRecord(value) || value.refreshToken !== previousRefreshToken) return false;
  storeSession({ ...value, accessToken, refreshToken });
  return true;
}
