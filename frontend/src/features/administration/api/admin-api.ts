import { parseCategories, parseModerationPage, parseUsersPage } from "../model/contracts";

import type { CategoryInput } from "../model/contracts";

import { clearCategoryCache } from "@/src/entities/category";
import { invalidateLotCategories, invalidateLots } from "@/src/entities/lot";
import { apiRequest } from "@/src/shared/api/client";

export async function getAdminUsers(page: number, filter: string, status = "") {
  const query = new URLSearchParams({ page: String(page + 1), per_page: "20" });
  if (filter.trim()) query.set("q", filter.trim());

  if (status) query.set("status", status);

  return parseUsersPage(
    await apiRequest(`/admin/users?${query}`, {
      authenticated: true,
      cache: "no-store",
      fallbackMessage: "Не удалось загрузить пользователей",
    }),
  );
}
export async function getModerationLots(page: number) {
  return parseModerationPage(await apiRequest(`/moderation/lots?page=${page + 1}&per_page=20`, {
    authenticated: true,
    cache: "no-store",
    fallbackMessage: "Не удалось загрузить очередь модерации",
  }));
}

export async function moderateLot(id: number, action: "approve" | "reject", reason?: string) {
  await apiRequest(`/moderation/lots/${id}/${action}`, {
    method: "POST",
    authenticated: true,
    body: action === "reject" ? { reason: reason?.trim() } : undefined,
    fallbackMessage: "Не удалось изменить статус лота",
  });
  invalidateLots();
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
