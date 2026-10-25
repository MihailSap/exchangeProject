import { ApiError, apiRequest } from "@/src/shared/api/client";
import { isNonEmptyString, isRecord } from "@/src/shared/lib/validation";
import type { UserProfile } from "../model/profile";

export async function getPublicProfile(id: number): Promise<UserProfile> {
  const envelope = await apiRequest(`/users/${id}`, { fallbackMessage: "Не удалось загрузить профиль пользователя." });
  if (!isRecord(envelope) || !isRecord(envelope.data)) throw new ApiError("Некорректный ответ профиля.", 502);
  const data = envelope.data;
  if (typeof data.id !== "number" || data.id !== id || !isNonEmptyString(data.name)
    || typeof data.email_confirmed !== "boolean"
    || ![data.avatar_url, data.region, data.contacts].every((value) => value == null || typeof value === "string")
    || (data.created_at !== undefined && (typeof data.created_at !== "string" || !Number.isFinite(Date.parse(data.created_at))))) {
    throw new ApiError("Не удалось загрузить профиль пользователя.", 502);
  }
  return { id: data.id, name: data.name, avatarUrl: typeof data.avatar_url === "string" ? data.avatar_url : null,
    region: typeof data.region === "string" ? data.region : null, contacts: typeof data.contacts === "string" ? data.contacts : null,
    emailConfirmed: data.email_confirmed, ...(typeof data.created_at === "string" ? { createdAt: data.created_at } : {}) };
}

let regionsRequest: Promise<string[]> | null = null;
export function getRegions(): Promise<string[]> {
  if (regionsRequest) return regionsRequest;
  regionsRequest = apiRequest("/regions", { fallbackMessage: "Не удалось загрузить список регионов." }).then((envelope) => {
    if (!isRecord(envelope) || !isRecord(envelope.data) || !Array.isArray(envelope.data.regions)
      || !envelope.data.regions.every((value): value is string => isNonEmptyString(value))) throw new ApiError("Не удалось загрузить список регионов.", 502);
    return envelope.data.regions;
  }).catch((error: unknown) => { regionsRequest = null; throw error; });
  return regionsRequest;
}

export async function resendConfirmation(): Promise<void> {
  await apiRequest("/auth/resend-confirmation", { method: "POST", authenticated: true, fallbackMessage: "Не удалось отправить письмо. Попробуйте позже." });
}
