import type { CatalogQuery } from "./catalog";
import type { CatalogRequest } from "@/src/entities/lot";

export function serverCatalogRequest(query: CatalogQuery, page: number, size: number): CatalogRequest {
  const sort = {
    oldest: "date_asc",
    newest: "date_desc",
    "price-asc": "cost_asc",
    "price-desc": "cost_desc",
    rating: "rating",
  } as const;

  return {
    q: query.q,
    category_id: query.category,
    region: query.region,
    type: query.type,
    delivery: query.delivery,
    pickup: query.pickup,
    min_cost: query.min,
    max_cost: query.max,
    sort: sort[query.sort],
    page,
    per_page: size,
  };
}
