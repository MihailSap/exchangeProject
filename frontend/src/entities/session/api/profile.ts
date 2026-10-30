import { isAuthUser, readSession, writeSession } from "../model/session";

import type { AuthUser } from "../model/session";

import { ApiError, apiRequest } from "@/src/shared/api/client";
import { isRecord } from "@/src/shared/lib/validation";

let profileRequest: { token: string; promise: Promise<AuthUser> } | null = null;

export function updateSessionProfile(): Promise<AuthUser> {
  const session = readSession();
  if (!session) return Promise.reject(new ApiError("Войдите в аккаунт.", 401));

  if (profileRequest?.token === session.refreshToken) return profileRequest.promise;

  const promise = (async () => {
    const envelope = await apiRequest("/users/me", {
      authenticated: true,
      fallbackMessage: "Не удалось загрузить профиль. Попробуйте позже.",
    });

    const user = parseProfile(envelope);
    if (user.id !== session.user.id) throw new ApiError("Некорректный ответ профиля.", 502);

    const current = readSession();
    if (!current || current.user.id !== session.user.id)
      throw new ApiError("Сессия изменилась. Войдите снова.", 401);

    writeSession({ ...current, user });

    return user;
  })();

  profileRequest = { token: session.refreshToken, promise };
  void promise
    .finally(() => {
      if (profileRequest?.promise === promise) profileRequest = null;
    })
    .catch(() => undefined);

  return promise;
}

function parseProfile(envelope: unknown): AuthUser {
  if (!isRecord(envelope) || !isRecord(envelope.data))
    throw new ApiError("Не удалось загрузить профиль. Попробуйте позже.", 502);

  const data = envelope.data;
  const user = {
    id: data.id,
    email: data.email,
    name: data.name,
    avatarUrl: data.avatar_url,
    region: data.region,
    contacts: data.contacts,
    emailConfirmed: data.email_confirmed,
    status: data.status,
    frozenReason: data.frozen_reason,
    rating: data.rating,
    reviewsCount: data.reviews_count,
    createdAt: data.created_at,
  };

  if (!isAuthUser(user) || typeof user.emailConfirmed !== "boolean")
    throw new ApiError("Не удалось загрузить профиль. Попробуйте позже.", 502);

  return user;
}

export async function saveSessionProfile(body: FormData): Promise<AuthUser> {
  const session = readSession();
  if (!session) throw new ApiError("Войдите в аккаунт.", 401);

  const envelope = await apiRequest("/users/me", {
    method: "PATCH",
    body,
    authenticated: true,
    fallbackMessage: "Не удалось сохранить профиль. Попробуйте позже.",
  });

  const user = parseProfile(envelope);
  if (user.id !== session.user.id) throw new ApiError("Некорректный ответ профиля.", 502);

  const current = readSession();
  if (!current || current.user.id !== session.user.id)
    throw new ApiError("Сессия изменилась. Войдите снова.", 401);

  writeSession({ ...current, user });

  return user;
}
