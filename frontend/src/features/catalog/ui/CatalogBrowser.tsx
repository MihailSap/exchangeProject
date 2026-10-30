"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import styles from "./Catalog.module.scss";
import { CatalogFilters } from "./CatalogFilters";
import { CatalogSearch } from "./CatalogSearch";
import {
  EMPTY_FILTERS,
  SORT_OPTIONS,
  catalogParams,
  resultLabel,
  selectCatalogItems,
} from "../model/catalog";
import { useCatalogPageSize } from "../model/use-catalog-page-size";

import type { CatalogQuery } from "../model/catalog";

import { useCategories } from "@/src/entities/category/client";
import { CATALOG_ITEMS, RECOMMENDED_ITEMS } from "@/src/entities/lot";
import { CatalogLotCard } from "@/src/entities/lot/ui";
import { getRegions } from "@/src/entities/profile";
import { useSession } from "@/src/entities/session";
import { Icon } from "@/src/shared/ui/icon";
import { Loading } from "@/src/shared/ui/loading";
import { Select } from "@/src/shared/ui/select";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";

export function CatalogBrowser({
  recommendations,
  query,
}: {
  recommendations: boolean;
  query: CatalogQuery;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const pageSize = useCatalogPageSize();
  const { user, ready } = useSession();
  const [pending, startTransition] = useTransition();
  const [navigationKind, setNavigationKind] = useState<"replace" | "append">("replace");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { state: categoryState, retry: retryCategories } = useCategories(
    String(user?.id ?? "guest"),
    ready,
  );

  const [regions, setRegions] = useState<string[]>([]);
  const [regionError, setRegionError] = useState("");
  const [regionLoading, setRegionLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const { notify } = useToast();
  useEffect(() => {
    let active = true;
    setRegionLoading(true);
    setRegionError("");
    getRegions()
      .then((items) => {
        if (active) setRegions(items);
      })
      .catch((error: unknown) => {
        if (!active) return;

        const message = error instanceof Error ? error.message : "Не удалось загрузить регионы";
        setRegionError(message);
        notify({ kind: "error", title: message });
      })
      .finally(() => {
        if (active) setRegionLoading(false);
      });

    return () => {
      active = false;
    };
  }, [attempt, notify]);

  function navigate(patch: Partial<CatalogQuery>, append = false): void {
    if (pending) return;

    const params = catalogParams({ ...query, page: 1, ...patch });
    setNavigationKind(append ? "append" : "replace");
    startTransition(() => router.push(`${pathname}?${params}`, { scroll: false }));
  }

  const categoryTree = categoryState.status === "ready" ? categoryState.categories : [];
  const categories = categoryTree.map((item) => ({
    id: String(item.id),
    name: item.name,
    depth: item.depth,
  }));

  const source = recommendations ? RECOMMENDED_ITEMS : CATALOG_ITEMS;
  const items = selectCatalogItems(source, query, categoryTree);
  const visible = items.slice(0, query.page * (pageSize ?? 0));
  const replacing = pending && navigationKind === "replace";
  const appending = pending && navigationKind === "append";
  const filterKey = JSON.stringify([
    query.type,
    query.category,
    query.region,
    query.min,
    query.max,
    query.delivery,
    query.pickup,
  ]);

  const categoryPending = query.category && categoryState.status === "loading";

  return (
    <div className={styles.browser}>
      <CatalogSearch
        key={query.q}
        initial={query.q}
        disabled={pending}
        onSearch={(q) => navigate({ q })}
      />
      <div className={styles.toolbar}>
        <span aria-live="polite">
          {replacing || categoryPending || pageSize === null
            ? "Обновляем предложения…"
            : resultLabel(items.length)}
        </span>
        <div className={styles.sort}>
          <label id="catalog-sort-label" htmlFor="catalog-sort">
            Сортировать:
          </label>
          <Select
            id="catalog-sort"
            labelledBy="catalog-sort-label"
            variant="sort"
            value={query.sort}
            disabled={pending}
            onChange={(value) => {
              const sort = SORT_OPTIONS.find((item) => item.value === value)?.value;
              if (sort) navigate({ sort });
            }}
            options={SORT_OPTIONS.filter((item) => recommendations || item.value !== "suitable")}
          />
        </div>
      </div>
      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Фильтры каталога">
          <button
            type="button"
            className={styles.filterToggle}
            aria-expanded={filtersOpen}
            aria-controls="catalog-filters-panel"
            onClick={() => setFiltersOpen((value) => !value)}
          >
            Фильтры
            {" "}
            <Icon name="down" />
          </button>
          <div id="catalog-filters-panel" className={styles.filterContent} data-open={filtersOpen}>
            {(categoryState.status === "loading" || regionLoading) && (
              <Loading compact label="Загружаем фильтры…" />
            )}
            {categoryState.status === "error" && (
              <div className={styles.referenceError}>
                <p>{categoryState.message}</p>
                <button type="button" disabled={pending} onClick={retryCategories}>
                  Повторить загрузку категорий
                </button>
              </div>
            )}
            {regionError && (
              <div className={styles.referenceError}>
                <p>{regionError}</p>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setAttempt((value) => value + 1)}
                >
                  Повторить загрузку регионов
                </button>
              </div>
            )}
            <CatalogFilters
              key={filterKey}
              initial={query}
              categories={categories}
              regions={regions}
              disabled={pending}
              categoriesDisabled={categoryState.status !== "ready"}
              regionsDisabled={regionLoading || Boolean(regionError)}
              onApply={(filters) => navigate(filters)}
              onReset={() => navigate(EMPTY_FILTERS)}
            />
          </div>
        </aside>
        <section
          className={styles.results}
          aria-label="Результаты поиска"
          aria-busy={pending || Boolean(categoryPending) || pageSize === null}
        >
          {replacing || categoryPending || pageSize === null ? (
            <div className={styles.resultsLoading}>
              <Loading label="Ищем подходящие варианты…" />
              <div className={styles.skeletonGrid} aria-hidden="true">
                {Array.from({ length: pageSize ?? 0 }, (_, id) => (
                  <div className={styles.skeleton} key={id}>
                    <span />
                    <span />
                    <span />
                  </div>
                ))}
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>
                <Icon name="search" />
              </span>
              <h2>Пока ничего не нашли</h2>
              <p>Попробуйте другой запрос или расширьте фильтры.</p>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => navigate({ ...EMPTY_FILTERS, q: "" })}
              >
                Сбросить поиск и фильтры
              </button>
            </div>
          ) : (
            <>
              <ul className={styles.grid}>
                {visible.map((item, index) => (
                  <li key={item.id}>
                    <CatalogLotCard item={item} eager={index < 4} />
                  </li>
                ))}
              </ul>
              <div className={styles.pagination}>
                <span aria-live="polite">
                  Показано {visible.length} из {items.length}
                </span>
                <div className={styles.loadMoreSlot}>
                  {appending ? (
                    <Loading compact label="Загружаем лоты…" />
                  ) : (
                    visible.length < items.length && (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        disabled={pending}
                        onClick={() => navigate({ page: query.page + 1 }, true)}
                      >
                        Загрузить ещё
                      </button>
                    )
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
