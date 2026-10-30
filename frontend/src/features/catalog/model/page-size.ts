export const CATALOG_VIEWPORTS = { mobileMax: 600, tabletMax: 1100, wideMin: 1600 } as const;
export type CatalogPageSize = 2 | 4 | 6 | 8;

export function getCatalogPageSize(width: number): CatalogPageSize {
  if (width <= CATALOG_VIEWPORTS.mobileMax) return 2;

  if (width <= CATALOG_VIEWPORTS.tabletMax) return 4;

  if (width < CATALOG_VIEWPORTS.wideMin) return 6;

  return 8;
}
