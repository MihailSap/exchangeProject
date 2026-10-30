export type { Lot, LotStatus } from "./model/lot";
export { initializeFixtureLots, getFixtureLot, saveFixtureLot } from "./model/fixtures";
export {
  getLot,
  createLot,
  updateLot,
  deleteLot,
  republishLot,
  archiveLot,
  getLotCategories,
  invalidateLotCategories,
} from "./api/lot-api";
export type { LotCategory } from "./api/lot-api";
export type { CatalogItem } from "./model/discovery";
export { CATALOG_ITEMS, RECOMMENDED_ITEMS, getCatalogLot } from "./model/discovery";
