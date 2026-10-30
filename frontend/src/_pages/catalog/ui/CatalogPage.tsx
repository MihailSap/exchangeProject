import { Suspense } from "react";

import styles from "./CatalogPage.module.scss";

import { CatalogBrowser, catalogQueryFromParams } from "@/src/features/catalog";
import { Breadcrumbs } from "@/src/shared/ui/breadcrumbs";
import { Loading } from "@/src/shared/ui/loading";
import { SiteFooter, SiteHeader } from "@/src/widgets/site-chrome";

export function CatalogPage({
  recommendations = false,
  searchParams,
}: {
  recommendations?: boolean;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const query = catalogQueryFromParams(searchParams, recommendations);

  return (
    <div className="sitePage">
      <SiteHeader />
      <main className={styles.main}>
        <Breadcrumbs
          items={[
            { label: "Главная", href: "/" },
            { label: recommendations ? "Рекомендации" : "Каталог" },
          ]}
        />
        <h1>{recommendations ? "Рекомендации для вас" : "Найдите то, что ищете"}</h1>
        <p className={styles.description}>
          {recommendations
            ? "Вещи и услуги, которые могут подойти под ваши интересы"
            : "Обменивайтесь вещами и услугами с людьми рядом"}
        </p>
        <Suspense fallback={<Loading label="Загружаем каталог…" />}>
          <CatalogBrowser recommendations={recommendations} query={query} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
