export type AuthUser = {
  id: number;
  email: string;
  name: string;
  status: "ACTIVE" | "FROZEN" | string;
  emailConfirmed?: boolean;
  avatarUrl?: string | null;
  region?: string | null;
  contacts?: string | null;
  rating?: number | null;
  reviewsCount?: number;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

const SESSION_KEY = "exchange.auth.session";

export function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  try {
    const rawSession = window.localStorage.getItem(SESSION_KEY);
    if (!rawSession) return null;

    const session = JSON.parse(rawSession) as AuthSession;
    if (!session.accessToken || !session.refreshToken || !session.user) return null;
    return session;
  } catch {
    return null;
  }
}

export function writeSession(session: AuthSession): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
}
