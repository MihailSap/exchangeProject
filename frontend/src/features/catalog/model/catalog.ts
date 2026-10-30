import type { Category } from "@/src/entities/category";
import type { CatalogItem } from "@/src/entities/lot";

export const SORT_OPTIONS = [
  { value: "newest", label: "Сначала новые" },
  { value: "price-asc", label: "По цене по возрастанию" },
  { value: "price-desc", label: "По цене по убыванию" },
  { value: "rating", label: "По рейтингу" },
  { value: "suitable", label: "Сначала подходящие" },
] as const;
export type CatalogSort = (typeof SORT_OPTIONS)[number]["value"];
export type CatalogFilters = {
  type: "" | "PRODUCT" | "SERVICE";
  category: string;
  region: string;
  min: string;
  max: string;
  delivery: boolean;
  pickup: boolean;
};
export type CatalogQuery = CatalogFilters & { q: string; sort: CatalogSort; page: number };
export const EMPTY_FILTERS: CatalogFilters = {
  type: "",
  category: "",
  region: "",
  min: "",
  max: "",
  delivery: false,
  pickup: false,
};
const pricePattern = /^\d{1,10}$/;
export function priceErrors(min: string, max: string): { min: string; max: string } {
  return {
    min: min && !pricePattern.test(min) ? "Введите целое число от 0 до 9 999 999 999" : "",
    max:
      max && !pricePattern.test(max)
        ? "Введите целое число от 0 до 9 999 999 999"
        : min && max && pricePattern.test(min) && Number(min) > Number(max)
          ? "Стоимость «До» должна быть не меньше «От»"
          : "",
  };
}
export function readCatalogQuery(
  params: Pick<URLSearchParams, "get">,
  recommendations: boolean,
): CatalogQuery {
  const min = params.get("min") ?? "";
  const max = params.get("max") ?? "";
  const errors = priceErrors(min, max);
  const sort = params.get("sort");
  const page = Number(params.get("page"));
  const category = params.get("category") ?? "";

  return {
    type:
      params.get("type") === "PRODUCT"
        ? "PRODUCT"
        : params.get("type") === "SERVICE"
          ? "SERVICE"
          : "",
    category:
      /^[1-9]\d{0,15}$/.test(category) && Number.isSafeInteger(Number(category)) ? category : "",
    region: (params.get("region") ?? "").slice(0, 120),
    min: errors.min ? "" : min,
    max: errors.max ? "" : max,
    delivery: params.get("delivery") === "1",
    pickup: params.get("pickup") === "1",
    q: (params.get("q") ?? "").trim().slice(0, 200),
    sort:
      SORT_OPTIONS.find(
        (item) => item.value === sort && (recommendations || item.value !== "suitable"),
      )?.value ?? (recommendations ? "suitable" : "newest"),
    page: Number.isSafeInteger(page) && page > 0 && page <= 100 ? page : 1,
  };
}
export function catalogParams(query: CatalogQuery): string {
  const params = new URLSearchParams();
  for (const key of ["q", "type", "category", "region", "min", "max"] as const)
    if (query[key]) params.set(key, query[key]);

  if (query.delivery) params.set("delivery", "1");

  if (query.pickup) params.set("pickup", "1");

  params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));

  return params.toString();
}

function normalize(value: string): string {
  return value.toLocaleLowerCase("ru-RU").replaceAll("ё", "е");
}

export function selectCatalogItems(
  items: CatalogItem[],
  query: CatalogQuery,
  categories: Category[] = [],
): CatalogItem[] {
  const selectedIds = new Set(query.category ? [Number(query.category)] : []);
  for (let step = 0; step < categories.length; step++) {
    let changed = false;
    for (const category of categories)
      if (
        category.parentId !== null &&
        selectedIds.has(category.parentId) &&
        !selectedIds.has(category.id)
      ) {
        selectedIds.add(category.id);
        changed = true;
      }

    if (!changed) break;
  }

  const names = new Set(
    categories
      .filter((category) => selectedIds.has(category.id))
      .map((category) => normalize(category.name)),
  );

  const words = normalize(query.q).split(/\s+/).filter(Boolean);
  const filtered = items.filter((item) => {
    const text = normalize(`${item.title} ${item.description} ${item.category}`);

    return (
      words.every((word) => text.includes(word)) &&
      (!query.type || item.type === query.type) &&
      (!query.category ||
        item.categoryId === query.category ||
        names.has(normalize(item.category))) &&
      (!query.region || item.region === query.region) &&
      (!query.min || item.cost >= Number(query.min)) &&
      (!query.max || item.cost <= Number(query.max)) &&
      ((!query.delivery && !query.pickup) ||
        (query.delivery && item.delivery !== "PICKUP") ||
        (query.pickup && item.delivery !== "DELIVERY"))
    );
  });

  return filtered.sort((a, b) => {
    if (query.sort === "price-asc") return a.cost - b.cost;

    if (query.sort === "price-desc") return b.cost - a.cost;

    if (query.sort === "rating") return (b.rating ?? -1) - (a.rating ?? -1);

    if (query.sort === "newest") return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);

    return 0;
  });
}
export function resultLabel(count: number): string {
  const last = count % 10;
  const teen = count % 100;

  return `${count.toLocaleString("ru-RU")} ${last === 1 && teen !== 11 ? "предложение" : last >= 2 && last <= 4 && (teen < 12 || teen > 14) ? "предложения" : "предложений"}`;
}

export function catalogQueryFromParams(
  params: Record<string, string | string[] | undefined>,
  recommendations: boolean,
): CatalogQuery {
  const values = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) values.set(key, first);
  }

  return readCatalogQuery(values, recommendations);
}
