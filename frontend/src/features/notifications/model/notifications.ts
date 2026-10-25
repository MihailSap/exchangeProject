import { isRecord } from "@/src/shared/lib/validation";

export const NOTIFICATION_TYPES = ["ACCOUNT_FROZEN", "MODERATOR_WARNING", "LOT_REJECTED", "NEW_OFFER", "OFFER_ACCEPTED", "OFFER_DECLINED", "CHAT_MESSAGE", "NEW_REVIEW", "ACCOUNT_UNFROZEN", "LOT_EXPIRING", "LOT_APPROVED", "LOT_REPUBLISHED", "EXCHANGE_COMPLETED", "EXCHANGE_CANCELLED"] as const;
export type NotificationType = typeof NOTIFICATION_TYPES[number];
export type NotificationCategory = "offers" | "messages" | "reviews" | "information";
export type NotificationSettings = Record<NotificationCategory, boolean>;
export type NotificationEvent = { id: string; type: NotificationType; createdAt: string; lotId?: number; lotTitle?: string; offerId?: number; chatId?: number; reviewId?: number; reason?: string };
export type NotificationItem = NotificationEvent & { unread: boolean; count: number; acknowledged: boolean };
export const DEFAULT_SETTINGS: NotificationSettings = { offers: true, messages: true, reviews: true, information: true };
export const RETENTION_MS = 7 * 86400_000;
export function isNotificationEvent(value: unknown): value is NotificationEvent {
  return isRecord(value) && typeof value.id === "string" && value.id.length > 0 && value.id.length <= 200 && NOTIFICATION_TYPES.some((type) => type === value.type)
    && typeof value.createdAt === "string" && Number.isFinite(Date.parse(value.createdAt))
    && ["lotId", "offerId", "chatId", "reviewId"].every((key) => value[key] === undefined || Number.isSafeInteger(value[key]) && Number(value[key]) > 0)
    && ["lotTitle", "reason"].every((key) => value[key] === undefined || typeof value[key] === "string" && value[key].length <= 3000);
}
export function isNotificationItem(value: unknown): value is NotificationItem {
  return isRecord(value) && typeof value.unread === "boolean" && typeof value.acknowledged === "boolean" && Number.isSafeInteger(value.count) && Number(value.count) > 0 && isNotificationEvent(value);
}
export function categoryOf(type: NotificationType): NotificationCategory | null {
  if (["NEW_OFFER", "OFFER_ACCEPTED", "OFFER_DECLINED"].includes(type)) return "offers";
  if (type === "CHAT_MESSAGE") return "messages";
  if (type === "NEW_REVIEW") return "reviews";
  if (["LOT_EXPIRING", "LOT_APPROVED", "LOT_REPUBLISHED", "EXCHANGE_COMPLETED", "EXCHANGE_CANCELLED"].includes(type)) return "information";
  return null;
}
export function isImportant(type: NotificationType): boolean { return categoryOf(type) !== "information"; }
export function retainNotifications(items: NotificationItem[], now = Date.now()): NotificationItem[] {
  return items.filter((item) => Date.parse(item.createdAt) > now - RETENTION_MS && Date.parse(item.createdAt) <= now + 60_000).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
export function mergeNotification(items: NotificationItem[], event: NotificationEvent): NotificationItem[] {
  const retained = retainNotifications(items);
  if (retained.some((item) => item.id === event.id)) return retained;
  const previous = event.type === "CHAT_MESSAGE" && event.chatId ? retained.find((item) => item.type === event.type && item.chatId === event.chatId) : undefined;
  return retainNotifications([{ ...event, count: (previous?.count ?? 0) + 1, unread: true, acknowledged: false }, ...retained.filter((item) => item !== previous)]);
}
export function notificationText(item: NotificationEvent & { count?: number }): { title: string; text: string } {
  const lot = item.lotTitle ? `«${item.lotTitle}»` : "";
  const reason = item.reason || "Причина не указана";
  const texts: Record<NotificationType, [string, string]> = {
    ACCOUNT_FROZEN: ["Аккаунт заморожен", `Ваш аккаунт заморожен. Причина: ${reason}. Для разморозки обратитесь в поддержку.`],
    MODERATOR_WARNING: ["Предупреждение модератора", `Вы получили предупреждение от модератора. Причина: ${reason}. Повторное нарушение может привести к заморозке аккаунта.`],
    LOT_REJECTED: ["Лот отклонён", `Ваше объявление ${lot} было отклонено модератором. Причина: ${reason}. Вы можете изменить объявление согласно правилам площадки и отправить снова.`],
    NEW_OFFER: ["Новое предложение обмена", "Вам поступило новое предложение обмена"],
    OFFER_ACCEPTED: ["Предложение принято", `Ваше предложение по лоту ${lot} принято`],
    OFFER_DECLINED: ["Предложение отклонено", `Ваше предложение по лоту ${lot} отклонено`],
    CHAT_MESSAGE: ["Новое сообщение", (item.count ?? 1) > 1 ? "Пришло несколько новых сообщений" : "Пришло новое сообщение"],
    NEW_REVIEW: ["Новый отзыв", "На Вас оставили новый отзыв"],
    ACCOUNT_UNFROZEN: ["Аккаунт разморожен", "Ваш аккаунт был разморожен. Все функции сайта снова доступны Вам"],
    LOT_EXPIRING: ["Скоро в архив", `Лот ${lot} будет архивирован через 3 дня. Хотите опубликовать его снова?`],
    LOT_APPROVED: ["Лот опубликован", `Ваш лот ${lot} опубликован`],
    LOT_REPUBLISHED: ["Лот снова активен", `Лот ${lot} снова активен`],
    EXCHANGE_COMPLETED: ["Обмен завершён", "Обмен завершен. Вы можете оставить отзыв"],
    EXCHANGE_CANCELLED: ["Обмен отменён", "Обмен отменен. Лоты возвращены в активные"],
  };
  const [title, text] = texts[item.type]; return { title, text };
}
export function notificationHref(item: NotificationEvent): string {
  if (item.type === "CHAT_MESSAGE" && item.chatId) return `/chats/${item.chatId}`;
  if (["NEW_OFFER", "OFFER_ACCEPTED", "OFFER_DECLINED"].includes(item.type) && item.offerId) return `/offers/${item.offerId}`;
  if (item.type === "NEW_REVIEW") return `/profile?section=reviews${item.reviewId ? `#review-${item.reviewId}` : ""}`;
  if (item.lotId) return `/lots/${item.lotId}`;
  return "/profile";
}
export function initialNotifications(now = Date.now()): NotificationItem[] {
  return [
    { id: "welcome-review", type: "NEW_REVIEW", createdAt: new Date(now - 15 * 60_000).toISOString(), unread: true, count: 1, acknowledged: true },
    { id: "welcome-published", type: "LOT_APPROVED", lotTitle: "Камера Fujifilm X-T30", createdAt: new Date(now - 3 * 3600_000).toISOString(), unread: true, count: 1, acknowledged: true },
    { id: "welcome-exchange", type: "EXCHANGE_COMPLETED", createdAt: new Date(now - 86400_000).toISOString(), unread: false, count: 1, acknowledged: true },
  ];
}
