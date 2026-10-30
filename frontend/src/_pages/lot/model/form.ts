import { isRecord } from "@/src/shared/lib/validation";
import type { Lot, LotCategory } from "@/src/entities/lot";

export const WANT_TYPES = ["LOT", "CATEGORY", "KEYWORDS", "ANY"] as const;
export type WantType = typeof WANT_TYPES[number];
export type LotFormValues = { title: string; description: string; categoryId: string; region: string; type: Lot["type"]; delivery: Lot["delivery_method"]; cost: string; wantTypes: WantType[]; keywords: string; targetCategoryIds: string[]; targetLots: string[] };
export type LotField = keyof LotFormValues | "photos";
const unique = (items: string[]) => [...new Set(items)];
const ordered = (items: string[]) => unique(items).sort();
const isWantType = (value: unknown): value is WantType => WANT_TYPES.some((type) => type === value);

export function parseTargetLot(value: string): string | null {
  const match = value.trim().match(/^(?:https?:\/\/[^\s/]+)?(?:\/lots\/)?(\d+)\/?$/);
  if (!match || value.length > 300) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? String(id) : null;
}

export function initialValues(lot: Lot | null, region: string): LotFormValues {
  const wants = lot?.wants ?? [];
  return {
    title: lot?.title ?? "", description: lot?.description ?? "", categoryId: lot ? String(lot.category.id) : "", region: lot?.region ?? region,
    type: lot?.type ?? "PRODUCT", delivery: lot?.delivery_method ?? "BOTH", cost: lot ? String(lot.estimated_cost) : "",
    wantTypes: wants.length ? WANT_TYPES.filter((type) => wants.some((want) => want.want_type === type)) : ["ANY"],
    keywords: unique(wants.filter((want) => want.want_type === "KEYWORDS").map((want) => want.keywords ?? "").filter(Boolean)).join("; "),
    targetCategoryIds: unique(wants.filter((want) => want.want_type === "CATEGORY" && want.target_category).map((want) => String(want.target_category?.id))),
    targetLots: unique(wants.filter((want) => want.want_type === "LOT" && want.target_lot).map((want) => parseTargetLot(want.target_lot ?? "") ?? want.target_lot ?? "")),
  };
}

export function validateLotForm(values: LotFormValues, regions: string[], categoryIds: number[], photoCount: number): Partial<Record<LotField, string>> {
  const errors: Partial<Record<LotField, string>> = {};
  if (values.title.trim().length < 3 || values.title.length > 120) errors.title = "Название должно содержать от 3 до 120 символов";
  if (values.description.trim().length < 10 || values.description.length > 1000) errors.description = "Описание должно содержать от 10 до 1000 символов";
  if (!categoryIds.includes(Number(values.categoryId))) errors.categoryId = "Выберите категорию из списка";
  if (!regions.includes(values.region)) errors.region = "Выберите регион из списка";
  if (!/^\d{1,8}([.,]\d{1,2})?$/.test(values.cost) || Number(values.cost.replace(",", ".")) <= 0) errors.cost = "Стоимость должна быть от 0,01 до 99 999 999,99 ₽";
  if (photoCount < 1 || photoCount > 10) errors.photos = "Добавьте от 1 до 10 фотографий";
  if (!values.wantTypes.length || values.wantTypes.some((type) => !isWantType(type)) || new Set(values.wantTypes).size !== values.wantTypes.length) errors.wantTypes = "Выберите хотя бы один вариант обмена";
  if (values.wantTypes.includes("KEYWORDS") && (values.keywords.trim().length < 2 || values.keywords.length > 300)) errors.keywords = "Укажите пожелания: от 2 до 300 символов";
  if (values.wantTypes.includes("CATEGORY") && (!values.targetCategoryIds.length || values.targetCategoryIds.length > 10 || new Set(values.targetCategoryIds).size !== values.targetCategoryIds.length || values.targetCategoryIds.some((id) => !categoryIds.includes(Number(id))))) errors.targetCategoryIds = "Выберите от 1 до 10 категорий для обмена";
  if (values.wantTypes.includes("LOT") && (!values.targetLots.length || values.targetLots.length > 10 || new Set(values.targetLots.map(parseTargetLot)).size !== values.targetLots.length || values.targetLots.some((id) => !parseTargetLot(id)))) errors.targetLots = "Добавьте от 1 до 10 разных лотов по номеру или ссылке";
  return errors;
}
export function validatePhotos(files: File[]): string | null {
  if (files.length > 10) return "Можно добавить не больше 10 фотографий";
  if (files.some((file) => !["image/jpeg", "image/png"].includes(file.type) || file.size === 0 || file.size > 10 * 1024 * 1024)) return "Фотографии должны быть JPG или PNG, не больше 10 МБ каждая";
  return null;
}
export function isFormValues(value: unknown): value is LotFormValues {
  if (!isRecord(value)) return false;
  const stringsValid = ["title", "description", "categoryId", "region", "cost", "keywords"].every((key) => typeof value[key] === "string" && value[key].length <= (key === "description" ? 1000 : key === "keywords" ? 300 : 120));
  return stringsValid && ["PRODUCT", "SERVICE"].includes(String(value.type)) && ["BOTH", "PICKUP", "DELIVERY"].includes(String(value.delivery))
    && Array.isArray(value.wantTypes) && value.wantTypes.length <= 4 && value.wantTypes.every(isWantType) && new Set(value.wantTypes).size === value.wantTypes.length
    && [value.targetCategoryIds, value.targetLots].every((items) => Array.isArray(items) && items.length <= 10 && items.every((item) => typeof item === "string" && item.length <= 300));
}
export function readFormValues(value: unknown): LotFormValues | null {
  if (isFormValues(value)) return value;
  if (!isRecord(value) || !isWantType(value.wantType) || typeof value.targetCategoryId !== "string" || value.targetCategoryId.length > 120 || typeof value.targetLot !== "string" || value.targetLot.length > 300) return null;
  const migrated = { ...value, wantTypes: [value.wantType], targetCategoryIds: value.targetCategoryId ? [value.targetCategoryId] : [], targetLots: value.targetLot ? [parseTargetLot(value.targetLot) ?? value.targetLot] : [] };
  if (!isFormValues(migrated)) return null;
  return { title: migrated.title, description: migrated.description, categoryId: migrated.categoryId, region: migrated.region, type: migrated.type, delivery: migrated.delivery, cost: migrated.cost, keywords: migrated.keywords, wantTypes: migrated.wantTypes, targetCategoryIds: migrated.targetCategoryIds, targetLots: migrated.targetLots };
}
export function formWants(values: LotFormValues, categories: LotCategory[]): Lot["wants"] {
  const wants: Lot["wants"] = [];
  if (values.wantTypes.includes("LOT")) values.targetLots.forEach((id) => wants.push({ want_type: "LOT", keywords: null, target_category: null, target_lot: parseTargetLot(id) ?? id }));
  if (values.wantTypes.includes("CATEGORY")) values.targetCategoryIds.forEach((id) => wants.push({ want_type: "CATEGORY", keywords: null, target_category: categories.find((item) => item.id === Number(id)) ?? { id: Number(id), name: `Категория №${id}` }, target_lot: null }));
  if (values.wantTypes.includes("KEYWORDS")) wants.push({ want_type: "KEYWORDS", keywords: values.keywords.trim(), target_category: null, target_lot: null });
  if (values.wantTypes.includes("ANY")) wants.push({ want_type: "ANY", keywords: null, target_category: null, target_lot: null });
  return wants;
}
export function toMultipart(values: LotFormValues, files: File[]): FormData {
  const body = new FormData();
  body.set("title", values.title.trim()); body.set("description", values.description.trim()); body.set("categoryId", values.categoryId); body.set("region", values.region); body.set("type", values.type); body.set("deliveryMethod", values.delivery); body.set("estimatedCost", values.cost.replace(",", "."));
  files.forEach((file) => body.append("photos", file));
  formWants(values, []).forEach((want, index) => {
    body.set(`wants[${index}].wantType`, want.want_type);
    if (want.keywords !== null) body.set(`wants[${index}].keywords`, want.keywords);
    if (want.target_category !== null) body.set(`wants[${index}].targetCategoryId`, String(want.target_category.id));
    if (want.target_lot !== null) body.set(`wants[${index}].targetLot`, want.target_lot);
  });
  return body;
}
export function hasFormChanges(values: LotFormValues, initial: LotFormValues, includeWants = true): boolean {
  const normalized = (value: LotFormValues) => ({
    title: value.title.trim(), description: value.description.trim(), categoryId: Number(value.categoryId), region: value.region,
    type: value.type, delivery: value.delivery, cost: Number(value.cost.replace(",", ".")),
    ...(includeWants ? { wantTypes: ordered(value.wantTypes), keywords: value.wantTypes.includes("KEYWORDS") ? value.keywords.trim() : "", targetCategoryIds: value.wantTypes.includes("CATEGORY") ? ordered(value.targetCategoryIds.map((id) => String(Number(id)))) : [], targetLots: value.wantTypes.includes("LOT") ? ordered(value.targetLots.map((id) => parseTargetLot(id) ?? id)) : [] } : {}),
  });
  return JSON.stringify(normalized(values)) !== JSON.stringify(normalized(initial));
}
export function canContinueLotStep(step: number, firstValid: boolean, wantsValid: boolean): boolean {
  return firstValid && (step === 1 || wantsValid);
}
