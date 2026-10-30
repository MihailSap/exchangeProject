"use client";

import { useSyncExternalStore } from "react";

import { CATALOG_VIEWPORTS, getCatalogPageSize } from "./page-size";

import type { CatalogPageSize } from "./page-size";

function subscribe(onChange: () => void): () => void {
  const queries = [
    window.matchMedia(`(max-width: ${CATALOG_VIEWPORTS.mobileMax}px)`),
    window.matchMedia(`(max-width: ${CATALOG_VIEWPORTS.tabletMax}px)`),
    window.matchMedia(`(min-width: ${CATALOG_VIEWPORTS.wideMin}px)`),
  ];

  for (const query of queries) query.addEventListener("change", onChange);

  return () => {
    for (const query of queries) query.removeEventListener("change", onChange);
  };
}

function getSnapshot(): CatalogPageSize {
  return getCatalogPageSize(window.innerWidth);
}

function getServerSnapshot(): null {
  return null;
}

export function useCatalogPageSize(): CatalogPageSize | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
