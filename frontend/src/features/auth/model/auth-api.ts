import { ApiError, apiRequest } from "@/src/shared/api/client";
import { writeSession } from "@/src/entities/session";
import type { AuthSession } from "@/src/entities/session";

import { isNonEmptyString, isRecord } from "@/src/shared/lib/validation";

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const envelope = await apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
    fallbackMessage: "Не удалось войти. Попробуйте позже.",
  });

  if (!isRecord(envelope) || !isRecord(envelope.data)) throw new ApiError("Не удалось войти. Попробуйте позже.", 502);
  const data = envelope.data;
  if (!isRecord(data.access_token) || !isNonEmptyString(data.access_token.body)
    || !isRecord(data.refresh_token) || !isNonEmptyString(data.refresh_token.body)
    || !isRecord(data.user) || typeof data.user.id !== "number" || !Number.isSafeInteger(data.user.id) || data.user.id <= 0
    || !isNonEmptyString(data.user.name) || !isNonEmptyString(data.user.status)) {
    throw new ApiError("Не удалось войти. Попробуйте позже.", 502);
  }

  const session: AuthSession = {
    accessToken: data.access_token.body,
    refreshToken: data.refresh_token.body,
    user: { id: data.user.id, name: data.user.name, status: data.user.status, email },
  };
  writeSession(session);
  return session;
}

export async function registerAndSignIn(name: string, email: string, password: string): Promise<AuthSession> {
  await apiRequest("/auth/register", {
    method: "POST",
    body: { name, email, password },
    fallbackMessage: "Не удалось создать аккаунт. Попробуйте позже.",
  });

  return signIn(email, password);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiRequest("/auth/forgot-password", {
    method: "POST",
    body: { email },
    fallbackMessage: "Не удалось отправить ссылку. Попробуйте позже.",
  });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await apiRequest("/auth/reset-password", {
    method: "POST",
    body: { token, password },
    fallbackMessage: "Не удалось сбросить пароль. Попробуйте позже.",
  });
}

export async function confirmEmail(token: string): Promise<boolean> {
  const envelope = await apiRequest("/auth/confirm-email", {
    method: "POST",
    body: { token },
    authenticated: true,
    fallbackMessage: "Возникла ошибка при подтверждении почты. Попробуйте еще раз позже",
  });
  if (!isRecord(envelope) || !isRecord(envelope.data) || typeof envelope.data.email_Confirmed !== "boolean") {
    throw new ApiError("Возникла ошибка при подтверждении почты. Попробуйте еще раз позже", 502);
  }
  return envelope.data.email_Confirmed;
}
