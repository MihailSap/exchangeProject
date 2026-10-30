import { clearStoredSession, readTokens, replaceTokens } from "@/src/shared/lib/session-storage";
import { isNonEmptyString, isRecord } from "@/src/shared/lib/validation";

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
let lastRenewal: { previousRefreshToken: string; accessToken: string; refreshToken: string } | null = null;

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!isRecord(payload) || !isRecord(payload.error)) return fallback;
  const error = payload.error;
  if (isNonEmptyString(error.message)) return error.message.trim();
  if (Array.isArray(error.details)) {
    for (const detail of error.details) {
      if (isRecord(detail) && isNonEmptyString(detail.message)) return detail.message.trim();
    }
  }
  if (error.code === "INVALID_CREDENTIALS") return "Неверный email или пароль";
  if (error.code === "ACCOUNT_FROZEN") return "Аккаунт заморожен. Обратитесь в поддержку.";
  if (error.code === "EMAIL_EXISTS_EXCEPTION") return "Этот email уже зарегистрирован";
  return fallback;
}

async function readResponse(response: Response, fallback: string): Promise<unknown> {
  if (response.ok && response.status === 204) return undefined;
  const responseText = await response.text();
  let payload: unknown;
  try {
    payload = responseText ? JSON.parse(responseText) : undefined;
  } catch {
    if (response.ok) throw new ApiError(fallback, response.status);
  }
  if (!response.ok) {
    const code = isRecord(payload) && isRecord(payload.error) && typeof payload.error.code === "string" ? payload.error.code : undefined;
    throw new ApiError(getErrorMessage(payload, fallback), response.status, code);
  }
  return payload;
}

async function renewSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const session = readTokens();
    if (!session?.refreshToken) return false;

    try {
      const accessResponse = await fetch(`${API_BASE_URL}/api/v1/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      const accessEnvelope = await readResponse(
        accessResponse,
        "Не удалось обновить сессию. Войдите снова.",
      );
      const accessToken = isRecord(accessEnvelope) && isRecord(accessEnvelope.data) ? accessEnvelope.data.accessToken : undefined;
      if (!isNonEmptyString(accessToken)) {
        if (readTokens()?.refreshToken === session.refreshToken) clearStoredSession();
        return false;
      }

      if (!replaceTokens(session.refreshToken, accessToken, session.refreshToken)) return false;

      try {
        const rotationResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        });
        const rotationEnvelope = await readResponse(rotationResponse, "Не удалось обновить сессию.");
        const data = isRecord(rotationEnvelope) && isRecord(rotationEnvelope.data) ? rotationEnvelope.data : null;
        const rotatedAccessToken = data?.accessToken;
        const rotatedRefreshToken = data?.refreshToken;

        if (isNonEmptyString(rotatedAccessToken) && isNonEmptyString(rotatedRefreshToken)) {
          if (!replaceTokens(session.refreshToken, rotatedAccessToken, rotatedRefreshToken)) return false;
          lastRenewal = { previousRefreshToken: session.refreshToken, accessToken: rotatedAccessToken, refreshToken: rotatedRefreshToken };
          return true;
        }
      } catch {
        return readTokens()?.refreshToken === session.refreshToken;
      }

      return true;
    } catch {
      if (readTokens()?.refreshToken === session.refreshToken) clearStoredSession();
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
  responseType?: "json" | "blob";
  fallbackMessage?: string;
};

export async function apiRequest(path: string, options: ApiRequestOptions = {}): Promise<unknown> {
  const { body, authenticated = false, responseType = "json", fallbackMessage = "Не удалось выполнить запрос. Попробуйте позже.", ...requestOptions } = options;
  const session = readTokens();
  const headers = new Headers(requestOptions.headers);
  const multipart = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !multipart && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (authenticated && session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);

  const send = (authorization?: string) => {
    const attemptHeaders = new Headers(headers);
    if (authorization) attemptHeaders.set("Authorization", `Bearer ${authorization}`);

    return fetch(`${API_BASE_URL}/api/v1${path}`, {
      ...requestOptions,
      headers: attemptHeaders,
      body: multipart ? body : body === undefined ? undefined : JSON.stringify(body),
    });
  };

  const safeSend = async (authorization?: string) => {
    try {
      return await send(authorization);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      throw new ApiError(fallbackMessage, 0);
    }
  };

  let response = await safeSend();
  let attemptedRefreshToken = session?.refreshToken;
  if (response.status === 401 && authenticated && session?.refreshToken) {
    const current = readTokens();
    const alreadyRenewed = current && current.accessToken !== session.accessToken
      && (current.refreshToken === session.refreshToken
        || (lastRenewal?.previousRefreshToken === session.refreshToken
          && lastRenewal.accessToken === current.accessToken && lastRenewal.refreshToken === current.refreshToken));
    if (alreadyRenewed) {
      attemptedRefreshToken = current.refreshToken;
      response = await safeSend(current.accessToken);
    } else if (current?.refreshToken === session.refreshToken) {
      const renewed = await renewSession();
      const renewedSession = readTokens();
      if (renewed && renewedSession?.accessToken) {
        attemptedRefreshToken = renewedSession.refreshToken;
        response = await safeSend(renewedSession.accessToken);
      }
    }
  }

  if (response.status === 401 && authenticated && readTokens()?.refreshToken === attemptedRefreshToken) clearStoredSession();
  if (response.ok && responseType === "blob") return response.blob();
  return readResponse(response, fallbackMessage);
}
