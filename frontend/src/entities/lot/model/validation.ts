import { isRecord } from "@/src/shared/lib/validation";
import type { Lot } from "./lot";

const statuses = ["DRAFT", "MODERATION", "REJECTED", "ACTIVE", "ARCHIVED", "IN_EXCHANGE", "COMPLETED", "DELETED"];
const nullableString = (value: unknown) => value === null || typeof value === "string";
const nullableDate = (value: unknown) => value === null || typeof value === "string" && Number.isFinite(Date.parse(value));
const category = (value: unknown) => isRecord(value) && Number.isSafeInteger(value.id) && Number(value.id) > 0 && typeof value.name === "string";
export function isLot(value: unknown): value is Lot {
  return isRecord(value) && Number.isSafeInteger(value.id) && Number(value.id) > 0 && typeof value.title === "string" && typeof value.description === "string"
    && ["PRODUCT", "SERVICE"].includes(String(value.type)) && ["DELIVERY", "PICKUP", "BOTH"].includes(String(value.delivery_method))
    && typeof value.estimated_cost === "number" && Number.isFinite(value.estimated_cost) && category(value.category) && typeof value.region === "string"
    && Array.isArray(value.photos) && value.photos.every((photo) => isRecord(photo) && typeof photo.name === "string" && typeof photo.order === "number")
    && isRecord(value.owner) && Number.isSafeInteger(value.owner.id) && Number(value.owner.id) > 0 && typeof value.owner.name === "string" && (value.owner.rating === null || typeof value.owner.rating === "number" && Number.isFinite(value.owner.rating))
    && Array.isArray(value.wants) && value.wants.every((want) => isRecord(want) && ["LOT", "KEYWORDS", "CATEGORY", "ANY"].includes(String(want.want_type)) && nullableString(want.keywords) && nullableString(want.target_lot) && (want.target_category === null || category(want.target_category)))
    && statuses.includes(String(value.status)) && nullableDate(value.published_at) && nullableDate(value.expires_at);
}
