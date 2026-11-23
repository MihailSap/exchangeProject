import { getLotList } from "./lot-list-api";

import type { LotListRequest } from "./lot-list-api";
import type { CatalogItem } from "../model/discovery";

export type CatalogRequest = Omit<LotListRequest, "statuses" | "by_user"> & {
  sort: NonNullable<LotListRequest["sort"]>;
};

export async function getCatalogPage(request: CatalogRequest, viewerId?: number) {
  const { lots, total } = await getLotList({ ...request, statuses: ["ACTIVE"] });

  return {
    total,
    hasMore: lots.length > 0 && request.page * request.per_page < total,
    items: lots.filter((lot) => lot.owner.id !== viewerId).map((lot): CatalogItem => ({
      id: String(lot.id),
      title: lot.title,
      description: lot.description,
      category: lot.category.name,
      categoryId: String(lot.category.id),
      region: lot.region,
      image: lot.photos[0]?.name ?? "",
      cost: lot.estimated_cost,
      type: lot.type,
      delivery: lot.delivery_method,
      rating: lot.owner.rating,
      publishedAt: lot.published_at ?? "",
      recommended: false,
    })),
  };
}
