import { parseActiveCategories } from "../model/category";

import type { Category } from "../model/category";

import { apiRequest } from "@/src/shared/api/client";
import { readTokens } from "@/src/shared/lib/session-storage";

const cache = new Map<string, { promise: Promise<Category[]>; expires: number }>();
export function clearCategoryCache(): void {
  cache.clear();
}
export function getActiveCategories(): Promise<Category[]> {
  const key = readTokens()?.refreshToken ?? "guest";
  const saved = cache.get(key);
  if (saved && saved.expires > Date.now()) return saved.promise;

  const promise = apiRequest("/categories/active", {
    authenticated: true,
    fallbackMessage: "Не удалось загрузить категории. Попробуйте ещё раз.",
  })
    .then(parseActiveCategories)
    .catch((error: unknown) => {
      cache.delete(key);
      throw error;
    });

  if (cache.size >= 5) cache.clear();

  cache.set(key, { promise, expires: Date.now() + 600_000 });

  return promise;
}
