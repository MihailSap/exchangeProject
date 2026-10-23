import { clearSession, readSession, writeSession } from "@/src/entities/session";
import type { AuthSession } from "@/src/entities/session";

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string | null;
    details?: Array<{ message?: string | null }> | null;
  };
};

export class ApiError extends Error {
  readonly code?: string;
  readonly status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/$/, "");
let refreshInFlight: Promise<boolean> | null = null;

function getErrorMessage(payload: ApiErrorPayload, fallback: string): string {
  const serverMessage = payload.error?.message?.trim();
  if (serverMessage) return serverMessage;

  const detailMessage = payload.error?.details?.find((detail) => detail.message?.trim())?.message;
  if (detailMessage) return detailMessage;

  if (payload.error?.code === "INVALID_CREDENTIALS") return "Неверный email или пароль";
  if (payload.error?.code === "ACCOUNT_FROZEN") return "Аккаунт заморожен. Обратитесь в поддержку.";
  if (payload.error?.code === "EMAIL_EXISTS_EXCEPTION") return "Этот email уже зарегистрирован";

  return fallback;
}

async function readResponse<T>(response: Response, fallback: string): Promise<T> {
  if (response.status === 204) return undefined as T;

  const responseText = await response.text();
  let payload: unknown;

  try {
    payload = responseText ? JSON.parse(responseText) : undefined;
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    const errorPayload = (payload && typeof payload === "object" ? payload : {}) as ApiErrorPayload;
    throw new ApiError(getErrorMessage(errorPayload, fallback), response.status, errorPayload.error?.code);
  }

  return payload as T;
}

async function renewSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const session = readSession();
    if (!session?.refreshToken) return false;

    try {
      const accessResponse = await fetch(`${API_BASE_URL}/api/v1/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      const accessEnvelope = await readResponse<{ data?: { accessToken?: string | null } }>(
        accessResponse,
        "Не удалось обновить сессию. Войдите снова.",
      );
      const accessToken = accessEnvelope.data?.accessToken;
      if (!accessToken) {
        clearSession();
        return false;
      }

      const accessSession = { ...session, accessToken };
      writeSession(accessSession);

      try {
        const rotationResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        });
        const rotationEnvelope = await readResponse<{
          data?: { accessToken?: string | null; refreshToken?: string | null };
        }>(rotationResponse, "Не удалось обновить сессию.");
        const rotatedAccessToken = rotationEnvelope.data?.accessToken;
        const rotatedRefreshToken = rotationEnvelope.data?.refreshToken;

        if (rotatedAccessToken && rotatedRefreshToken) {
          writeSession({
            ...accessSession,
            accessToken: rotatedAccessToken,
            refreshToken: rotatedRefreshToken,
          });
        }
      } catch {
        writeSession(accessSession);
      }

      return true;
    } catch {
      clearSession();
      return false;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  authenticated?: boolean;
  fallbackMessage?: string;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, authenticated = false, fallbackMessage = "Не удалось выполнить запрос. Попробуйте позже.", ...requestOptions } = options;
  const session = readSession();
  const headers = new Headers(requestOptions.headers);
  if (body !== undefined && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (authenticated && session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);

  const send = (authorization?: string) => {
    const attemptHeaders = new Headers(headers);
    if (authorization) attemptHeaders.set("Authorization", `Bearer ${authorization}`);

    return fetch(`${API_BASE_URL}/api/v1${path}`, {
      ...requestOptions,
      headers: attemptHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  let response = await send();
  if (response.status === 401 && authenticated && session?.refreshToken) {
    const renewed = await renewSession();
    const renewedSession = readSession();
    if (renewed && renewedSession?.accessToken) response = await send(renewedSession.accessToken);
  }

  return readResponse<T>(response, fallbackMessage);
}

export async function updateSessionProfile(): Promise<AuthSession["user"]> {
  type UserProfileDto = {
    id: number;
    email: string;
    name: string;
    avatar_url?: string | null;
    region?: string | null;
    contacts?: string | null;
    email_confirmed: boolean;
    status: AuthSession["user"]["status"];
    rating?: number | null;
    reviews_count?: number;
  };

  const envelope = await apiRequest<{ data: UserProfileDto }>("/users/me", {
    authenticated: true,
    fallbackMessage: "Не удалось загрузить профиль. Попробуйте позже.",
  });

  const user: AuthSession["user"] = {
    id: envelope.data.id,
    email: envelope.data.email,
    name: envelope.data.name,
    avatarUrl: envelope.data.avatar_url,
    region: envelope.data.region,
    contacts: envelope.data.contacts,
    emailConfirmed: envelope.data.email_confirmed,
    status: envelope.data.status,
    rating: envelope.data.rating,
    reviewsCount: envelope.data.reviews_count,
  };
  const session = readSession();
  if (session) writeSession({ ...session, user });
  return user;
}
