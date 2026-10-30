import { parseCategories, parseUsersPage } from "../model/contracts";

import type { CategoryInput } from "../model/contracts";

import { clearCategoryCache } from "@/src/entities/category";
import { invalidateLotCategories } from "@/src/entities/lot";
import { apiRequest } from "@/src/shared/api/client";

export async function getAdminUsers(page: number, filter: string) {
  const query = new URLSearchParams({ page: String(page), size: "20" });
  if (filter.trim()) query.set("filter", filter.trim());

  return parseUsersPage(
    await apiRequest(`/users?${query}`, {
      authenticated: true,
      cache: "no-store",
      fallbackMessage: "Не удалось загрузить пользователей",
    }),
  );
}
export async function setUserFrozen(id: number, frozen: boolean, reason: string) {
  await apiRequest(`/admin/users/${id}/${frozen ? "freeze" : "unfreeze"}`, {
    method: "PATCH",
    authenticated: true,
    body: frozen ? { reason: reason.trim() } : undefined,
    fallbackMessage: frozen
      ? "Не удалось заморозить пользователя"
      : "Не удалось разморозить пользователя",
  });
}
export async function getAdminCategories() {
  return parseCategories(
    await apiRequest("/categories", {
      authenticated: true,
      cache: "no-store",
      fallbackMessage: "Не удалось загрузить категории",
    }),
  );
}
export async function saveAdminCategory(id: number | undefined, body: CategoryInput) {
  await apiRequest(`/categories${id === undefined ? "" : `/${id}`}`, {
    method: id === undefined ? "POST" : "PUT",
    body,
    authenticated: true,
    fallbackMessage: "Не удалось сохранить категорию",
  });
  invalidateLotCategories();
  clearCategoryCache();
}
export async function deleteAdminCategory(id: number) {
  await apiRequest(`/categories/${id}`, {
    method: "DELETE",
    authenticated: true,
    fallbackMessage: "Не удалось скрыть категорию",
  });
  invalidateLotCategories();
  clearCategoryCache();
}
