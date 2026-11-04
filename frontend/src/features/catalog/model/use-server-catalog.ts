"use client";

import { useEffect, useState } from "react";

import { serverCatalogRequest } from "./server-request";

import type { CatalogQuery } from "./catalog";
import type { CatalogItem } from "@/src/entities/lot";

import { getCatalogPage } from "@/src/entities/lot";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";

export function useServerCatalog(query: CatalogQuery, size: number | null, enabled: boolean) {
  const [result, setResult] = useState<{ key: string; baseKey: string; page: number; items: CatalogItem[]; total: number } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { notify } = useToast();
  const key = JSON.stringify([query, size, attempt]);
  const baseKey = JSON.stringify([{ ...query, page: 1 }, size]);

  useEffect(() => {
    if (!enabled || !size) return;

    let active = true;
    void (async () => {
      const items: CatalogItem[] = [];
      let total = 0;
      for (let page = 1; page <= query.page; page++) {
        const result = await getCatalogPage(serverCatalogRequest(query, page, size));

        if (!active) return;

        items.push(...result.items);
        total = result.total;
        if (page * size >= total || result.items.length === 0) break;
      }

      setResult({ key, baseKey, page: query.page, items: [...new Map(items.map((item) => [item.id, item])).values()], total });
    })().catch((error: unknown) => {
      if (!active) return;

      const message = error instanceof Error ? error.message : "Не удалось загрузить каталог";
      setFailure({ key, message });
      notify({ kind: "error", title: message });
    });

    return () => {
      active = false;
    };
  }, [enabled, size, key, baseKey, query.q, query.category, query.region, query.type, query.min, query.max, query.sort, query.page, query.delivery, query.pickup, notify]);

  const loading = enabled && result?.key !== key && failure?.key !== key;
  const matching = result?.baseKey === baseKey;

  return {
    items: matching ? result.items : [],
    total: matching ? result.total : 0,
    appending: loading && matching && query.page > result.page,
    loading,
    error: failure?.key === key ? failure.message : "",
    retry: () => setAttempt((value) => value + 1),
  };
}
