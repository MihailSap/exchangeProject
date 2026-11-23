"use client";

import { useEffect, useState } from "react";

import type { Lot, LotStatus } from "@/src/entities/lot";

import { getLotList } from "@/src/entities/lot";
import { ApiError } from "@/src/shared/api/client";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";

type CountedStatus = "all" | "ACTIVE" | "MODERATION" | "ARCHIVED";

export type ProfileLotFilter = CountedStatus | "COMPLETED";

const pageSize = 12;
const ownStatuses: Record<CountedStatus, readonly [LotStatus, ...LotStatus[]]> = {
  all: ["ACTIVE", "MODERATION", "ARCHIVED", "REJECTED", "DRAFT", "IN_EXCHANGE", "COMPLETED"],
  ACTIVE: ["ACTIVE"],
  MODERATION: ["MODERATION"],
  ARCHIVED: ["ARCHIVED"],
};

function getProfileLots(id: number, own: boolean, filter: CountedStatus, page: number) {
  return getLotList({
    by_user: id,
    statuses: own ? ownStatuses[filter] : ownStatuses.ACTIVE,
    page,
    per_page: pageSize,
  }, own ? id : undefined);
}

export function useProfileLots(id: number | undefined, own: boolean, filter: ProfileLotFilter | null) {
  const { notify } = useToast();
  const [revision, setRevision] = useState(0);
  const scope = JSON.stringify([id, own, revision]);
  const key = JSON.stringify([scope, filter]);
  const [pages, setPages] = useState({ key: "", requested: 1 });
  const [result, setResult] = useState<{ key: string; page: number; lots: Lot[]; total: number }>();
  const [failure, setFailure] = useState<{ key: string; message: string; status?: number }>();
  const [counts, setCounts] = useState<{ scope: string; totals: Partial<Record<CountedStatus, number>> }>();
  const requested = pages.key === key ? pages.requested : 1;

  useEffect(() => {
    if (id === undefined) return;

    let active = true;
    const filters: CountedStatus[] = own ? ["all", "ACTIVE", "MODERATION", "ARCHIVED"] : ["all"];
    void Promise.allSettled(filters.map((status) => getProfileLots(id, own, status, 1)))
      .then((responses) => {
        if (!active) return;

        const totals: Partial<Record<CountedStatus, number>> = {};
        responses.forEach((response, index) => {
          if (response.status === "fulfilled") totals[filters[index]] = response.value.total;
        });
        setCounts({ scope, totals });
      });

    return () => {
      active = false;
    };
  }, [id, own, scope]);

  useEffect(() => {
    if (id === undefined || filter === null || filter === "COMPLETED") return;

    let active = true;
    void (async () => {
      const lots = new Map<number, Lot>();
      let total = 0;
      for (let page = 1; page <= requested; page++) {
        const result = await getProfileLots(id, own, filter, page);
        if (!active) return;

        total = result.total;
        result.lots.forEach((lot) => lots.set(lot.id, lot));
        if (page * pageSize >= total || !result.lots.length) break;
      }

      setResult({ key, page: requested, lots: [...lots.values()], total });
    })().catch((error: unknown) => {
      if (!active) return;

      const message = error instanceof Error ? error.message : "Не удалось загрузить лоты.";
      setFailure({ key, message, status: error instanceof ApiError ? error.status : undefined });
      notify({ kind: "error", title: message });
    });

    return () => {
      active = false;
    };
  }, [id, own, filter, key, requested, notify]);

  const current = result?.key === key ? result : undefined;
  const error = failure?.key === key ? failure : undefined;
  const totals = counts?.scope === scope ? { ...counts.totals } : {};
  if (current && filter && filter !== "COMPLETED") totals[filter] = current.total;

  return {
    lots: current?.lots ?? [],
    counts: totals,
    loading: !error && current?.page !== requested,
    hasMore: current !== undefined && current.page * pageSize < current.total,
    error,
    loadMore: () => setPages({ key, requested: requested + 1 }),
    reload: () => setRevision((value) => value + 1),
  };
}
