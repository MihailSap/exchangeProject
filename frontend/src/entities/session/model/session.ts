import { accessTokenRole } from "./role";

import {
  clearStoredSession,
  readStoredSession,
  storeSession,
} from "@/src/shared/lib/session-storage";
import { isNonEmptyString, isRecord } from "@/src/shared/lib/validation";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  status: "ACTIVE" | "FROZEN" | string;
  role?: "USER" | "ADMIN";
  emailConfirmed?: boolean;
  frozenReason?: string | null;
  avatarUrl?: string | null;
  region?: string | null;
  contacts?: string | null;
  rating?: number | null;
  reviewsCount?: number;
  createdAt?: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export function isAuthUser(value: unknown): value is AuthUser {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "number" &&
    Number.isSafeInteger(value.id) &&
    value.id > 0 &&
    isNonEmptyString(value.email) &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.status) &&
    (value.createdAt === undefined ||
      (typeof value.createdAt === "string" && Number.isFinite(Date.parse(value.createdAt)))) &&
    (value.emailConfirmed === undefined || typeof value.emailConfirmed === "boolean") &&
    [value.avatarUrl, value.region, value.contacts, value.frozenReason].every(
      (item) => item == null || typeof item === "string",
    ) &&
    (value.rating == null || (typeof value.rating === "number" && Number.isFinite(value.rating))) &&
    (value.reviewsCount === undefined ||
      (typeof value.reviewsCount === "number" &&
        Number.isSafeInteger(value.reviewsCount) &&
        value.reviewsCount >= 0))
  );
}

export function readSession(): AuthSession | null {
  const session = readStoredSession();
  if (
    !isRecord(session) ||
    !isNonEmptyString(session.accessToken) ||
    !isNonEmptyString(session.refreshToken) ||
    !isAuthUser(session.user)
  )
    return null;

  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: { ...session.user, role: accessTokenRole(session.accessToken) },
  };
}

export function writeSession(session: AuthSession): void {
  storeSession(session);
}

export function clearSession(): void {
  clearStoredSession();
}
