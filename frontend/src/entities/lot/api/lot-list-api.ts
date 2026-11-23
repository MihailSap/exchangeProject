import { isLot } from "../model/validation";

import type { Lot, LotStatus } from "../model/lot";

import { ApiError, apiRequest } from "@/src/shared/api/client";
import { isRecord } from "@/src/shared/lib/validation";

export type LotListRequest = {
  q?: string;
  category_id?: string;
  region?: string;
  type?: "PRODUCT" | "SERVICE" | "";
  delivery?: boolean;
  pickup?: boolean;
  min_cost?: string;
  max_cost?: string;
  by_user?: number;
  statuses: readonly [LotStatus, ...LotStatus[]];
  sort?: "date_desc" | "date_asc" | "cost_asc" | "cost_desc" | "rating";
  page: number;
  per_page: number;
};

type LotListPage = { lots: Lot[]; total: number };

const cache = new Map<string, { expires: number; promise: Promise<LotListPage> }>();

export function invalidateLotLists(): void {
  cache.clear();
}

export function getLotList(
  { statuses, ...request }: LotListRequest,
  viewerId?: number,
): Promise<LotListPage> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(request))
    if (value !== undefined && value !== "") params.set(key, String(value));

  params.set("status", statuses.join("|"));
  const key = `${viewerId ?? "public"}:${params}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.promise;

  const promise = apiRequest(`/lots?${params}`, {
    authenticated: viewerId !== undefined,
    cache: "no-store",
    fallbackMessage: "Не удалось загрузить лоты. Попробуйте ещё раз.",
  }).then((payload) => {
    if (
      !isRecord(payload) || !Array.isArray(payload.data) || !payload.data.every(isLot) ||
      !isRecord(payload.meta) || payload.meta.page !== request.page ||
      payload.meta.per_page !== request.per_page ||
      !Number.isSafeInteger(payload.meta.total) || Number(payload.meta.total) < 0 ||
      payload.data.length > request.per_page ||
      new Set(payload.data.map((lot) => lot.id)).size !== payload.data.length ||
      payload.data.some((lot) => !statuses.includes(lot.status) ||
        (request.by_user !== undefined && lot.owner.id !== request.by_user))
    ) throw new ApiError("Сервер вернул некорректный список лотов", 502);

    return {
      lots: payload.data.map((lot): Lot => ({
        ...lot,
        source: "server",
        photos: [...lot.photos].sort((a, b) => a.id - b.id),
      })),
      total: Number(payload.meta.total),
    };
  }).catch((error: unknown) => {
    if (cache.get(key)?.promise === promise) cache.delete(key);

    throw error;
  });

  if (cache.size >= 50) cache.delete(cache.keys().next().value ?? "");

  cache.set(key, { expires: Date.now() + 60_000, promise });

  return promise;
}
