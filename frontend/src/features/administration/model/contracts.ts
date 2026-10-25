import { ApiError } from "@/src/shared/api/client";
import { isRecord, isNonEmptyString } from "@/src/shared/lib/validation";

export type AdminUser = { id: number; name: string; email: string; avatarUrl: string | null; role: "ADMIN" | "USER"; status: "ACTIVE" | "FROZEN"; emailConfirmed: boolean; createdAt: string };
export type UsersPage = { content: AdminUser[]; totalElements: number; totalPages: number; page: number; size: number };
export type AdminCategory = { id: number; name: string; slug: string; parentId: number | null };
export type CategoryInput = { name: string; slug: string; parentId: number | null; isActive: boolean };
const positiveId = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value > 0;
const nonnegative = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
function invalid(): never { throw new ApiError("Сервер вернул некорректные данные административной панели", 502); }

export function parseUsersPage(payload: unknown): UsersPage {
  if (!isRecord(payload) || !Array.isArray(payload.content) || !nonnegative(payload.totalElements) || !nonnegative(payload.totalPages) || !nonnegative(payload.page) || !positiveId(payload.size)) return invalid();
  const content = payload.content.map((item): AdminUser => {
    if (!isRecord(item) || !positiveId(item.id) || !isNonEmptyString(item.name) || !isNonEmptyString(item.email)
      || (item.role !== "USER" && item.role !== "ADMIN") || (item.status !== "ACTIVE" && item.status !== "FROZEN")
      || typeof item.email_confirmed !== "boolean" || (item.avatar_url != null && typeof item.avatar_url !== "string")
      || typeof item.createdAt !== "string" || !Number.isFinite(Date.parse(item.createdAt))) return invalid();
    return { id: item.id, name: item.name, email: item.email, avatarUrl: typeof item.avatar_url === "string" ? item.avatar_url : null, role: item.role, status: item.status, emailConfirmed: item.email_confirmed, createdAt: item.createdAt };
  });
  if (new Set(content.map((user) => user.id)).size !== content.length || content.length > payload.size || content.length > payload.totalElements) return invalid();
  return { content, page: payload.page, size: payload.size, totalElements: payload.totalElements, totalPages: payload.totalPages };
}

export function parseCategories(payload: unknown): AdminCategory[] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) return invalid();
  const categories = new Map<number, AdminCategory>();
  let count = 0;
  function visit(nodes: unknown[], parentId: number | null, depth: number) {
    if (depth > 30 || (count += nodes.length) > 10_000) return invalid();
    for (const node of nodes) {
      if (!isRecord(node) || !positiveId(node.id) || !isNonEmptyString(node.name) || !isNonEmptyString(node.slug) || !Array.isArray(node.children)) return invalid();
      const previous = categories.get(node.id);
      categories.set(node.id, { id: node.id, name: node.name, slug: node.slug, parentId: parentId ?? previous?.parentId ?? null });
      visit(node.children, node.id, depth + 1);
    }
  }
  visit(payload.data, null, 0);
  return [...categories.values()];
}

export function allowedParents(categories: AdminCategory[], id?: number): AdminCategory[] {
  const excluded = new Set(id === undefined ? [] : [id]);
  for (let step = 0; step < categories.length; step++) {
    let changed = false;
    for (const category of categories) if (category.parentId !== null && excluded.has(category.parentId) && !excluded.has(category.id)) { excluded.add(category.id); changed = true; }
    if (!changed) break;
  }
  return categories.filter((category) => !excluded.has(category.id));
}

export function reasonError(value: string): string | undefined {
  if (value.trim().length < 3) return "Укажите причину — минимум 3 символа";
  if (value.length > 500) return "Не более 500 символов";
}

export function categoryErrors(name: string, slug: string, visibility: string) {
  return {
    name: name.trim().length < 2 || name.length > 120 ? "Название должно содержать от 2 до 120 символов" : undefined,
    slug: !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120 ? "До 120 символов: латинские буквы, цифры и дефис между словами" : undefined,
    visibility: visibility !== "true" && visibility !== "false" ? "Выберите доступность категории" : undefined,
  };
}
