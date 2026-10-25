import type { LotStatus } from "@/src/entities/lot";

export type Review = { id: number; lotId: number; lotTitle: string; authorId: number; authorName: string; score: number; text: string; createdAt: string };
export type CompletedExchange = { id: number; lotId: number; receivedCost: number; receivedTitle: string; receivedImage: string; partnerId: number; partnerName: string; completedAt: string };
export const LOT_STATUS_LABELS: Record<LotStatus, string> = { ACTIVE: "Активен", MODERATION: "На модерации", ARCHIVED: "Архив", COMPLETED: "Обмен завершён", DRAFT: "Черновик", REJECTED: "Отклонён", IN_EXCHANGE: "В обмене", DELETED: "Удалён" };
export const DEMO_REVIEWS: Review[] = [
  { id: 1, lotId: 90009, lotTitle: "Камера моментальной печати", authorId: 101, authorName: "Анна Соколова", score: 5, text: "Очень приятный обмен! Камера точно как в описании, всё показали и объяснили. Договорились о встрече быстро. Спасибо!", createdAt: "2026-10-21T14:30:00Z" },
  { id: 2, lotId: 90010, lotTitle: "Кресло для чтения", authorId: 102, authorName: "Михаил Петров", score: 4, text: "Кресло в хорошем состоянии, отлично вписалось в квартиру. Немного перенесли встречу, но в остальном всё прошло замечательно.", createdAt: "2026-10-17T09:00:00Z" },
  { id: 3, lotId: 90011, lotTitle: "Кофемашина для эспрессо", authorId: 103, authorName: "Елена Крылова", score: 5, text: "Всё честно и без сюрпризов. Обменяли кофемашину на объектив, остались довольны. Рекомендую участника!", createdAt: "2026-10-11T16:20:00Z" },
];
export const DEMO_EXCHANGES: CompletedExchange[] = [
  { id: 70001, receivedCost: 7000, lotId: 90009, receivedTitle: "Объектив Helios 44-2", receivedImage: "/images/profile/camera.svg", partnerId: 101, partnerName: "Анна Соколова", completedAt: "2026-10-21T12:00:00Z" },
  { id: 70002, receivedCost: 9500, lotId: 90010, receivedTitle: "Кофеварка для дома", receivedImage: "/images/profile/coffee.svg", partnerId: 102, partnerName: "Михаил Петров", completedAt: "2026-10-17T08:00:00Z" },
  { id: 70003, receivedCost: 17500, lotId: 90011, receivedTitle: "Плёночный фотоаппарат", receivedImage: "/images/profile/camera.svg", partnerId: 103, partnerName: "Елена Крылова", completedAt: "2026-10-11T14:00:00Z" },
];

export function ratingOf(reviews: Review[]): number | null {
  return reviews.length ? reviews.reduce((sum, review) => sum + review.score, 0) / reviews.length : null;
}
export function latestReviews(reviews: Review[]): Review[] { return [...reviews].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)); }
export function formatDate(date: string): string { return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date)); }
