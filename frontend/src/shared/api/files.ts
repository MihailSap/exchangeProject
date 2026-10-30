import { apiRequest } from "./client";

import { readTokens } from "@/src/shared/lib/session-storage";

const images = new Map<string, { expires: number; promise: Promise<Blob> }>();

type ImageSource = { expires: number; url: string | null; promise: Promise<string> };

const sources = new Map<string, ImageSource>();

export function getCachedProtectedImageUrl(name: string): string | null {
  const tokens = readTokens();
  if (!tokens) return null;

  const source = sources.get(`${tokens.refreshToken}:${name}`);

  return source && source.expires > Date.now() ? source.url : null;
}

export function getProtectedImageUrl(name: string): Promise<string> {
  const tokens = readTokens();
  if (!tokens) return Promise.reject(new Error("Изображение требует авторизации"));

  const key = `${tokens.refreshToken}:${name}`;
  for (const [cachedKey, source] of sources) {
    if (source.expires <= Date.now()) {
      if (source.url) URL.revokeObjectURL(source.url);

      sources.delete(cachedKey);
    }
  }

  const cached = sources.get(key);
  if (cached) return cached.promise;

  if (sources.size >= 20) {
    const oldestKey = sources.keys().next().value;
    if (oldestKey !== undefined) {
      const oldest = sources.get(oldestKey);
      if (oldest?.url) URL.revokeObjectURL(oldest.url);

      sources.delete(oldestKey);
    }
  }

  const source: ImageSource = {
    expires: Date.now() + 300_000,
    url: null,
    promise: getProtectedImage(name)
      .then((blob) => {
        if (sources.get(key) !== source) throw new Error("Загрузка изображения устарела");

        source.url = URL.createObjectURL(blob);

        return source.url;
      })
      .catch((error: unknown) => {
        if (sources.get(key) === source) sources.delete(key);

        throw error;
      }),
  };

  sources.set(key, source);

  return source.promise;
}

export function getProtectedImage(name: string): Promise<Blob> {
  const tokens = readTokens();
  if (!tokens) return Promise.reject(new Error("Изображение требует авторизации"));

  const key = `${tokens.refreshToken}:${name}`;
  const cached = images.get(key);
  if (cached && cached.expires > Date.now()) return cached.promise;

  const promise = apiRequest(`/files/image/${encodeURIComponent(name)}`, {
    authenticated: true,
    responseType: "blob",
  })
    .then((result) => {
      if (!(result instanceof Blob) || !result.type.startsWith("image/"))
        throw new Error("Не удалось загрузить изображение");

      return result;
    })
    .catch((error: unknown) => {
      images.delete(key);
      throw error;
    });

  if (images.size >= 20) images.clear();

  images.set(key, { expires: Date.now() + 300_000, promise });

  return promise;
}
