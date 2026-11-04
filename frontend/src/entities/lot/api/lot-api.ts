import { invalidateCatalog } from "./catalog-api";
import { getFixtureLot, saveFixtureLot } from "../model/fixtures";
import { isLot } from "../model/validation";
import { sameWants, wantKey } from "../model/wants";

import type { Lot } from "../model/lot";

import { apiRequest, ApiError } from "@/src/shared/api/client";
import { readTokens } from "@/src/shared/lib/session-storage";
import { isRecord } from "@/src/shared/lib/validation";

export type LotUpdate = {
  title: string;
  description: string;
  category_id: number;
  region: string;
  type: Lot["type"];
  delivery_method: Lot["delivery_method"];
  estimated_cost: number;
};
export type LotCategory = { id: number; name: string };
const cache = new Map<string, { lot: Lot; expires: number }>();

function parseLot(value: unknown): Lot {
  if (!isRecord(value) || !isLot(value.data))
    throw new ApiError("Сервер вернул некорректные данные лота", 0);

  return value.data;
}

export async function getLot(id: number): Promise<Lot> {
  const fixture = getFixtureLot(id);
  if (fixture) return fixture;

  const key = `${readTokens()?.refreshToken ?? "guest"}:${id}`;
  const saved = cache.get(key);
  if (saved && saved.expires > Date.now()) return saved.lot;

  const lot = parseLot(
    await apiRequest(`/lots/${id}`, {
      authenticated: true,
      fallbackMessage: "Не удалось загрузить лот",
    }),
  );

  if (lot.id !== id) throw new ApiError("Сервер вернул данные другого лота", 0);

  cache.set(key, { lot, expires: Date.now() + 60_000 });
  if (cache.size > 30) cache.delete(cache.keys().next().value ?? "");

  return lot;
}
export async function createLot(body: FormData): Promise<Lot> {
  const lot = parseLot(
    await apiRequest("/lots", {
      method: "POST",
      body,
      authenticated: true,
      fallbackMessage: "Не удалось отправить лот на модерацию",
    }),
  );

  cache.clear();
  invalidateCatalog();

  return lot;
}
export async function updateLot(
  lot: Lot,
  body: LotUpdate,
  wants: Lot["wants"],
  photos?: Lot["photos"],
  newFiles: File[] = [],
  photoOrder?: (number | null)[],
): Promise<Lot> {
  if (getFixtureLot(lot.id)) {
    const next = {
      ...lot,
      ...body,
      category: { ...lot.category, id: body.category_id },
      wants,
      photos: photos ?? lot.photos,
      status: "MODERATION" as const,
    };

    saveFixtureLot(next);

    return next;
  }

  const wantsChanged = !sameWants(lot.wants, wants);
  const reconcile = wantsChanged || photoOrder !== undefined;
  cache.clear();
  invalidateCatalog();
  const current = reconcile ? await readServerLot(lot.id) : lot;
  const retainedWants = new Set(wants.map(wantKey));
  const currentWants = new Set(current.wants.map(wantKey));
  if (wantsChanged) {
    for (const want of current.wants) {
      if (want.id !== undefined && !retainedWants.has(wantKey(want)))
        await apiRequest(`/lots/${lot.id}/want/${want.id}`, {
          method: "DELETE",
          authenticated: true,
          fallbackMessage: "Не удалось удалить вариант обмена",
        });
    }
  }

  if (photoOrder) {
    const retainedPhotos = new Set(photoOrder.filter((id) => id !== null));
    for (const photo of current.photos) {
      if (!retainedPhotos.has(photo.id))
        await apiRequest(`/lots/${lot.id}/photo/${photo.id}`, {
          method: "DELETE",
          authenticated: true,
          fallbackMessage: "Не удалось удалить фотографию",
        });
    }
  }

  const multipart = new FormData();
  multipart.set("title", body.title);
  multipart.set("description", body.description);
  multipart.set("categoryId", String(body.category_id));
  multipart.set("region", body.region);
  multipart.set("type", body.type);
  multipart.set("deliveryMethod", body.delivery_method);
  multipart.set("estimatedCost", String(body.estimated_cost));
  newFiles.forEach((file) => multipart.append("photos", file));
  if (wantsChanged) {
    wants.filter((want) => !currentWants.has(wantKey(want))).forEach((want, index) => {
      multipart.set(`wants[${index}].wantType`, want.want_type);
      if (want.keywords !== null) multipart.set(`wants[${index}].keywords`, want.keywords);

      if (want.target_category !== null)
        multipart.set(`wants[${index}].targetCategoryId`, String(want.target_category.id));

      if (want.target_lot !== null) multipart.set(`wants[${index}].targetLot`, want.target_lot);
    });
  }

  const updated = parseLot(
    await apiRequest(`/lots/${lot.id}`, {
      method: "PATCH",
      body: multipart,
      authenticated: true,
      fallbackMessage: "Не удалось сохранить лот",
    }),
  );

  cache.clear();
  invalidateCatalog();

  if (!reconcile) return updated;

  const saved = await readServerLot(lot.id);
  const photosMatch = !photoOrder || (
    saved.photos.length === photoOrder.length &&
    photoOrder.every((id, index) => id === null || saved.photos[index]?.id === id)
  );

  if (!photosMatch || (wantsChanged && !sameWants(saved.wants, wants)))
    throw new ApiError("Сервер сохранил изменения лота не полностью. Обновите страницу и проверьте фотографии и варианты обмена.", 502);

  return saved;
}

async function readServerLot(id: number): Promise<Lot> {
  const lot = parseLot(await apiRequest(`/lots/${id}`, {
    authenticated: true,
    cache: "no-store",
    fallbackMessage: "Не удалось проверить сохранённый лот",
  }));

  if (lot.id !== id) throw new ApiError("Сервер вернул данные другого лота", 502);

  return { ...lot, photos: [...lot.photos].sort((a, b) => a.id - b.id) };
}

export async function deleteLot(lot: Lot): Promise<void> {
  if (getFixtureLot(lot.id)) {
    saveFixtureLot({ ...lot, status: "DELETED" });

    return;
  }

  await apiRequest(`/lots/${lot.id}`, {
    method: "DELETE",
    authenticated: true,
    fallbackMessage: "Не удалось удалить лот",
  });
  cache.clear();
  invalidateCatalog();
}
export async function republishLot(lot: Lot): Promise<Lot> {
  if (getFixtureLot(lot.id)) {
    const next = {
      ...lot,
      status: "ACTIVE" as const,
      published_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
    };

    saveFixtureLot(next);

    return next;
  }

  const updated = parseLot(
    await apiRequest(`/lots/${lot.id}/republicate`, {
      method: "PATCH",
      authenticated: true,
      fallbackMessage: "Не удалось опубликовать лот заново",
    }),
  );

  cache.clear();
  invalidateCatalog();

  return updated;
}
export async function archiveLot(lot: Lot): Promise<Lot> {
  if (!getFixtureLot(lot.id))
    throw new ApiError("Сервер пока не поддерживает перенос лота в архив вручную", 0);

  const next = { ...lot, status: "ARCHIVED" as const };
  saveFixtureLot(next);

  return next;
}
let categoryCache: { promise: Promise<LotCategory[]>; expires: number } | null = null;

export function invalidateLotCategories(): void {
  categoryCache = null;
}

export function getLotCategories(): Promise<LotCategory[]> {
  if (categoryCache && categoryCache.expires > Date.now()) return categoryCache.promise;

  const promise = fetchLotCategories().catch((error: unknown) => {
    if (categoryCache?.promise === promise) categoryCache = null;

    throw error;
  });

  categoryCache = { promise, expires: Date.now() + 600_000 };

  return promise;
}

async function fetchLotCategories(): Promise<LotCategory[]> {
  const payload = await apiRequest("/categories/active", {
    fallbackMessage: "Не удалось загрузить категории. Попробуйте ещё раз.",
  });

  if (!isRecord(payload) || !Array.isArray(payload.data))
    throw new ApiError("Сервер вернул некорректный список категорий", 0);

  const flatten = (nodes: unknown[]): LotCategory[] =>
    nodes.flatMap((node) => {
      if (!isRecord(node) || !Number.isSafeInteger(node.id) || typeof node.name !== "string")
        throw new ApiError("Сервер вернул некорректную категорию", 0);

      return [
        { id: Number(node.id), name: node.name },
        ...(Array.isArray(node.children) ? flatten(node.children) : []),
      ];
    });

  return [...new Map(flatten(payload.data).map((category) => [category.id, category])).values()];
}
