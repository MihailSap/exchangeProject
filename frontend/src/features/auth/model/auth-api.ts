import { apiRequest } from "@/src/shared/api/client";
import { writeSession } from "@/src/entities/session";
import type { AuthSession, AuthUser } from "@/src/entities/session";

type ApiEnvelope<T> = { data: T };
type JwtTokenResponse = { body: string; expired_at: string };

type LoginData = {
  access_token: JwtTokenResponse;
  refresh_token: JwtTokenResponse;
  user: { id: number; name: string; status: AuthUser["status"] };
};

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const envelope = await apiRequest<ApiEnvelope<LoginData>>("/auth/login", {
    method: "POST",
    body: { email, password },
    fallbackMessage: "Не удалось войти. Попробуйте позже.",
  });

  const session: AuthSession = {
    accessToken: envelope.data.access_token.body,
    refreshToken: envelope.data.refresh_token.body,
    user: { ...envelope.data.user, email },
  };
  writeSession(session);
  return session;
}

export async function registerAndSignIn(name: string, email: string, password: string): Promise<AuthSession> {
  await apiRequest<ApiEnvelope<{ id: number; email: string; name: string }>>("/auth/register", {
    method: "POST",
    body: { name, email, password },
    fallbackMessage: "Не удалось создать аккаунт. Попробуйте позже.",
  });

  return signIn(email, password);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiRequest<void>("/auth/forgot-password", {
    method: "POST",
    body: { email },
    fallbackMessage: "Не удалось отправить ссылку. Попробуйте позже.",
  });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await apiRequest<void>("/auth/reset-password", {
    method: "POST",
    body: { token, password },
    fallbackMessage: "Не удалось сбросить пароль. Попробуйте позже.",
  });
}

export async function confirmEmail(token: string): Promise<boolean> {
  const envelope = await apiRequest<ApiEnvelope<{ email_Confirmed: boolean }>>("/auth/confirm-email", {
    method: "POST",
    body: { token },
    authenticated: true,
    fallbackMessage: "Возникла ошибка при подтверждении почты. Попробуйте еще раз позже",
  });
  return envelope.data.email_Confirmed;
}
