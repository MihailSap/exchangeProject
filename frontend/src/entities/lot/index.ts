export type { Lot, LotStatus } from "./model/lot";
export { initializeFixtureLots, getFixtureLot, saveFixtureLot, getLotPath, archiveFixtureLot } from "./model/fixtures";
export {
  getLot,
  createLot,
  updateLot,
  deleteLot,
  deleteLotAttachment,
  republishLot,
  getLotCategories,
  invalidateLotCategories,
} from "./api/lot-api";
export type { LotCategory } from "./api/lot-api";
export type { CatalogItem } from "./model/discovery";
export { CATALOG_ITEMS, RECOMMENDED_ITEMS, getCatalogLot } from "./model/discovery";

export { getCatalogPage } from "./api/catalog-api";
export type { CatalogRequest } from "./api/catalog-api";
