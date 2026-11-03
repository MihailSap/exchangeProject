import { parseActiveCategories } from "../model/category";

import type { Category } from "../model/category";

import { apiRequest } from "@/src/shared/api/client";

let cache: { promise: Promise<Category[]>; expires: number } | null = null;

export function clearCategoryCache(): void {
  cache = null;
}

export function getActiveCategories(): Promise<Category[]> {
  if (cache && cache.expires > Date.now()) return cache.promise;

  const promise = apiRequest("/categories/active", {
    fallbackMessage: "Не удалось загрузить категории. Попробуйте ещё раз.",
  })
    .then(parseActiveCategories)
    .catch((error: unknown) => {
      if (cache?.promise === promise) cache = null;

      throw error;
    });

  cache = { promise, expires: Date.now() + 600_000 };

  return promise;
}
