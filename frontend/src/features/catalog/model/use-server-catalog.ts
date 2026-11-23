"use client";

import { useEffect, useState } from "react";

import { serverCatalogRequest } from "./server-request";

import type { CatalogQuery } from "./catalog";
import type { CatalogItem } from "@/src/entities/lot";

import { getCatalogPage } from "@/src/entities/lot";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";

export function useServerCatalog(query: CatalogQuery, size: number | null, enabled: boolean, viewerId: number | undefined) {
  const [result, setResult] = useState<{ key: string; baseKey: string; page: number; items: CatalogItem[]; total: number; hasMore: boolean } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { notify } = useToast();
  const key = JSON.stringify([query, size, viewerId, attempt]);
  const baseKey = JSON.stringify([{ ...query, page: 1 }, size, viewerId]);

  useEffect(() => {
    if (!enabled || !size) return;

    let active = true;
    void (async () => {
      const items = new Map<string, CatalogItem>();
      let total = 0;
      let hasMore = true;
      const target = query.page * size;
      for (let page = 1; hasMore && items.size < target; page++) {
        const result = await getCatalogPage(serverCatalogRequest(query, page, size), viewerId);

        if (!active) return;

        result.items.forEach((item) => items.set(item.id, item));
        total = result.total;
        hasMore = result.hasMore;
      }

      setResult({ key, baseKey, page: query.page, items: [...items.values()].slice(0, target), total, hasMore: hasMore || items.size > target });
    })().catch((error: unknown) => {
      if (!active) return;

      const message = error instanceof Error ? error.message : "Не удалось загрузить каталог";
      setFailure({ key, message });
      notify({ kind: "error", title: message });
    });

    return () => {
      active = false;
    };
  }, [enabled, size, viewerId, key, baseKey, query.q, query.category, query.region, query.type, query.min, query.max, query.sort, query.page, query.delivery, query.pickup, notify]);

  const loading = enabled && result?.key !== key && failure?.key !== key;
  const matching = enabled && result?.baseKey === baseKey;

  return {
    items: matching ? result.items : [],
    total: matching ? result.total : 0,
    hasMore: matching && result.hasMore,
    appending: loading && matching && query.page > result.page,
    loading,
    error: failure?.key === key ? failure.message : "",
    retry: () => setAttempt((value) => value + 1),
  };
}
