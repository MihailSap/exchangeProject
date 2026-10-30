import type { Lot } from "./lot";

export type CatalogItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryId: string;
  region: string;
  image: string;
  cost: number;
  type: "PRODUCT" | "SERVICE";
  delivery: "DELIVERY" | "PICKUP" | "BOTH";
  rating: number | null;
  publishedAt: string;
  recommended: boolean;
};
const ITEM_CATEGORIES = [
  { id: "lot-electronics", name: "Электроника" },
  { id: "lot-home", name: "Дом и уют" },
  { id: "lot-garden", name: "Дом и сад" },
  { id: "lot-shoes", name: "Обувь" },
  { id: "lot-photo", name: "Фототехника" },
];

const entries: {
  title: string;
  category: number;
  image: string;
  cost: number;
  region: string;
  delivery: CatalogItem["delivery"];
  type?: CatalogItem["type"];
}[] = [
  {
    title: "Кресло в скандинавском стиле",
    category: 1,
    image: "catalog-chair",
    cost: 12500,
    region: "Москва",
    delivery: "PICKUP",
  },
  {
    title: "Настольная лампа",
    category: 1,
    image: "lamp",
    cost: 4200,
    region: "Москва",
    delivery: "BOTH",
  },
  {
    title: "Наушники Sony WH-1000XM4",
    category: 0,
    image: "headphones",
    cost: 18000,
    region: "Москва",
    delivery: "DELIVERY",
  },
  {
    title: "Монстера в кашпо",
    category: 2,
    image: "plant",
    cost: 3500,
    region: "Москва",
    delivery: "PICKUP",
  },
  {
    title: "Кресло Mid-century",
    category: 1,
    image: "mid-century",
    cost: 12500,
    region: "Пермь",
    delivery: "BOTH",
  },
  {
    title: "Кроссовки New Balance",
    category: 3,
    image: "sneakers",
    cost: 7900,
    region: "Казань",
    delivery: "DELIVERY",
  },
  {
    title: "Кресло для чтения",
    category: 1,
    image: "chair",
    cost: 15500,
    region: "Екатеринбург",
    delivery: "PICKUP",
  },
  {
    title: "Наушники для путешествий",
    category: 0,
    image: "headphones",
    cost: 16000,
    region: "Пермь",
    delivery: "BOTH",
  },
  {
    title: "Монстера в керамическом кашпо",
    category: 2,
    image: "plant",
    cost: 2800,
    region: "Казань",
    delivery: "PICKUP",
  },
  {
    title: "Винтажная лампа",
    category: 1,
    image: "lamp",
    cost: 6500,
    region: "Екатеринбург",
    delivery: "BOTH",
  },
  {
    title: "Кроссовки New Balance 574",
    category: 3,
    image: "sneakers",
    cost: 8200,
    region: "Москва",
    delivery: "BOTH",
  },
  {
    title: "Уютное кресло",
    category: 1,
    image: "chair",
    cost: 11000,
    region: "Казань",
    delivery: "PICKUP",
  },
  {
    title: "Пересадка комнатных растений",
    category: 2,
    image: "plant",
    cost: 1200,
    region: "Москва",
    delivery: "PICKUP",
    type: "SERVICE",
  },
  {
    title: "Реставрация кресла",
    category: 1,
    image: "mid-century",
    cost: 4500,
    region: "Екатеринбург",
    delivery: "BOTH",
    type: "SERVICE",
  },
  {
    title: "Ремонт настольной лампы",
    category: 1,
    image: "lamp",
    cost: 1500,
    region: "Пермь",
    delivery: "BOTH",
    type: "SERVICE",
  },
  {
    title: "Настройка наушников",
    category: 0,
    image: "headphones",
    cost: 800,
    region: "Казань",
    delivery: "BOTH",
    type: "SERVICE",
  },
];

export const CATALOG_ITEMS: CatalogItem[] = entries.map((entry, index) => ({
  id: `lot-${index + 1}`,
  title: entry.title,
  description:
    entry.type === "SERVICE"
      ? "Предлагаю услугу в обмен на интересные вещи или помощь. Условия и удобное время обсудим заранее."
      : "В хорошем состоянии, бережное использование. Готов рассмотреть обмен на вещи для дома, книги и другие интересные предложения.",
  category: ITEM_CATEGORIES[entry.category]?.name ?? "Другое",
  categoryId: ITEM_CATEGORIES[entry.category]?.id ?? "",
  image: `/images/discovery/${entry.image}.png`,
  cost: entry.cost,
  region: entry.region,
  type: entry.type ?? "PRODUCT",
  delivery: entry.delivery,
  rating: index % 4 === 0 ? null : 4 + (index % 6) / 5,
  publishedAt: `2026-10-${String(29 - index).padStart(2, "0")}T10:00:00Z`,
  recommended: index !== 1 && index !== 4 && index !== 11,
}));
const recommendationOrder = ["lot-3", "lot-7", "lot-4", "lot-6"];
export const RECOMMENDED_ITEMS = [...CATALOG_ITEMS.filter((item) => item.recommended)].sort(
  (a, b) => {
    const left = recommendationOrder.indexOf(a.id);
    const right = recommendationOrder.indexOf(b.id);

    return (left < 0 ? 100 : left) - (right < 0 ? 100 : right);
  },
);

export function getCatalogLot(id: string): Lot | undefined {
  const index = CATALOG_ITEMS.findIndex((item) => item.id === id);
  const item = CATALOG_ITEMS[index];
  if (!item) return undefined;

  return {
    id: index + 1,
    title: item.title,
    description: item.description,
    type: item.type,
    delivery_method: item.delivery,
    estimated_cost: item.cost,
    category: {
      id: ITEM_CATEGORIES.findIndex((category) => category.id === item.categoryId) + 1,
      name: item.category,
    },
    region: item.region,
    photos: [{ order: 0, name: item.image }],
    owner: { id: index + 1, name: "Владелец лота", rating: item.rating },
    wants: [{ want_type: "ANY", keywords: null, target_category: null, target_lot: null }],
    status: "ACTIVE",
    published_at: item.publishedAt,
    expires_at: null,
  };
}
