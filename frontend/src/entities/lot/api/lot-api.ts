import { apiRequest, ApiError } from "@/src/shared/api/client";
import { isRecord } from "@/src/shared/lib/validation";
import { readTokens } from "@/src/shared/lib/session-storage";
import { isLot } from "../model/validation";
import { getFixtureLot, saveFixtureLot } from "../model/fixtures";
import type { Lot } from "../model/lot";

export type LotUpdate = { title: string; description: string; category_id: number; region: string; type: Lot["type"]; delivery_method: Lot["delivery_method"]; estimated_cost: number };
export type LotCategory = { id: number; name: string };
const cache = new Map<string, { lot: Lot; expires: number }>();
function parseLot(value: unknown): Lot {
  if (!isRecord(value) || !isLot(value.data)) throw new ApiError("Сервер вернул некорректные данные лота", 0);
  return value.data;
}
export async function getLot(id: number): Promise<Lot> {
  const fixture = getFixtureLot(id);
  if (fixture) return fixture;
  const key = `${readTokens()?.refreshToken ?? "guest"}:${id}`;
  const saved = cache.get(key);
  if (saved && saved.expires > Date.now()) return saved.lot;
  const lot = parseLot(await apiRequest(`/lots/${id}`, { authenticated: true, fallbackMessage: "Не удалось загрузить лот" }));
  if (lot.id !== id) throw new ApiError("Сервер вернул данные другого лота", 0);
  cache.set(key, { lot, expires: Date.now() + 60_000 });
  if (cache.size > 30) cache.delete(cache.keys().next().value ?? "");
  return lot;
}
export async function createLot(body: FormData): Promise<Lot> {
  const lot = parseLot(await apiRequest("/lots", { method: "POST", body, authenticated: true, fallbackMessage: "Не удалось отправить лот на модерацию" }));
  cache.clear();
  return lot;
}
export async function updateLot(lot: Lot, body: LotUpdate, wants: Lot["wants"], photos?: Lot["photos"]): Promise<Lot> {
  if (getFixtureLot(lot.id)) {
    const next = { ...lot, ...body, category: { ...lot.category, id: body.category_id }, wants, photos: photos ?? lot.photos, status: "MODERATION" as const };
    saveFixtureLot(next);
    return next;
  }
  if (photos) throw new ApiError("Сервер пока не поддерживает сохранение изменений фотографий", 0);
  const updated = parseLot(await apiRequest(`/lots/${lot.id}`, { method: "PATCH", body, authenticated: true, fallbackMessage: "Не удалось сохранить лот" }));
  cache.clear();
  return updated;
}
export async function deleteLot(lot: Lot): Promise<void> {
  if (getFixtureLot(lot.id)) { saveFixtureLot({ ...lot, status: "DELETED" }); return; }
  await apiRequest(`/lots/${lot.id}`, { method: "DELETE", authenticated: true, fallbackMessage: "Не удалось удалить лот" });
  cache.clear();
}
export async function republishLot(lot: Lot): Promise<Lot> {
  if (getFixtureLot(lot.id)) {
    const next = { ...lot, status: "ACTIVE" as const, published_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * 86400_000).toISOString() };
    saveFixtureLot(next); return next;
  }
  const updated = parseLot(await apiRequest(`/lots/${lot.id}/republicate`, { method: "PATCH", authenticated: true, fallbackMessage: "Не удалось опубликовать лот заново" }));
  cache.clear(); return updated;
}
export async function archiveLot(lot: Lot): Promise<Lot> {
  if (!getFixtureLot(lot.id)) throw new ApiError("Сервер пока не поддерживает перенос лота в архив вручную", 0);
  const next = { ...lot, status: "ARCHIVED" as const }; saveFixtureLot(next); return next;
}
const categoryCache = new Map<string, { promise: Promise<LotCategory[]>; expires: number }>();
export function invalidateLotCategories(): void { categoryCache.clear(); }
export function getLotCategories(): Promise<LotCategory[]> {
  const key = readTokens()?.refreshToken ?? "guest";
  const cached = categoryCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.promise;
  const promise = fetchLotCategories().catch((error: unknown) => { categoryCache.delete(key); throw error; });
  if (categoryCache.size >= 5) categoryCache.clear();
  categoryCache.set(key, { promise, expires: Date.now() + 600_000 });
  return promise;
}
async function fetchLotCategories(): Promise<LotCategory[]> {
  const payload = await apiRequest("/categories", { authenticated: true, fallbackMessage: "Не удалось загрузить категории. Попробуйте ещё раз." });
  if (!isRecord(payload) || !Array.isArray(payload.data)) throw new ApiError("Сервер вернул некорректный список категорий", 0);
  const flatten = (nodes: unknown[]): LotCategory[] => nodes.flatMap((node) => {
    if (!isRecord(node) || !Number.isSafeInteger(node.id) || typeof node.name !== "string") throw new ApiError("Сервер вернул некорректную категорию", 0);
    return [{ id: Number(node.id), name: node.name }, ...(Array.isArray(node.children) ? flatten(node.children) : [])];
  });
  return [...new Map(flatten(payload.data).map((category) => [category.id, category])).values()];
}
