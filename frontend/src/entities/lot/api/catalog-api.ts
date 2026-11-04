import { isLot } from "../model/validation";

import type { CatalogItem } from "../model/discovery";

import { ApiError, apiRequest } from "@/src/shared/api/client";
import { isRecord } from "@/src/shared/lib/validation";

export type CatalogRequest = {
  q?: string;
  category_id?: string;
  region?: string;
  type?: "PRODUCT" | "SERVICE" | "";
  delivery_method?: "DELIVERY" | "PICKUP" | "BOTH";
  min_cost?: string;
  max_cost?: string;
  sort: "date_desc" | "date_asc" | "cost_asc" | "cost_desc" | "rating";
  page: number;
  per_page: number;
};
export type CatalogPage = { items: CatalogItem[]; total: number };
const cache = new Map<string, { expires: number; promise: Promise<CatalogPage> }>();

export function invalidateCatalog(): void {
  cache.clear();
}

export function getCatalogPage(request: CatalogRequest): Promise<CatalogPage> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(request))
    if (value !== undefined && value !== "") params.set(key, String(value));

  const key = params.toString();
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.promise;

  const promise = apiRequest(`/lots?${key}`, {
    cache: "no-store",
    fallbackMessage: "Не удалось загрузить каталог. Попробуйте ещё раз.",
  }).then((payload) => {
    if (
      !isRecord(payload) || !Array.isArray(payload.data) || !payload.data.every(isLot) ||
      !isRecord(payload.meta) || payload.meta.page !== request.page ||
      payload.meta.per_page !== request.per_page ||
      !Number.isSafeInteger(payload.meta.total) || Number(payload.meta.total) < 0 ||
      payload.data.length > request.per_page ||
      new Set(payload.data.map((lot) => lot.id)).size !== payload.data.length
    ) throw new ApiError("Сервер вернул некорректный список лотов", 502);

    return {
      total: Number(payload.meta.total),
      items: payload.data.map((lot): CatalogItem => ({
        id: String(lot.id),
        title: lot.title,
        description: lot.description,
        category: lot.category.name,
        categoryId: String(lot.category.id),
        region: lot.region,
        image: [...lot.photos].sort((a, b) => a.id - b.id)[0]?.name ?? "",
        cost: lot.estimated_cost,
        type: lot.type,
        delivery: lot.delivery_method,
        rating: lot.owner.rating,
        publishedAt: lot.published_at ?? "",
        recommended: false,
      })),
    };
  }).catch((error: unknown) => {
    if (cache.get(key)?.promise === promise) cache.delete(key);

    throw error;
  });

  if (cache.size >= 50) cache.delete(cache.keys().next().value ?? "");

  cache.set(key, { expires: Date.now() + 60_000, promise });

  return promise;
}
