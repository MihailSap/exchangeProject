"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "./HomePage.module.scss";

import { useCategories } from "@/src/entities/category/client";
import { RECOMMENDED_ITEMS } from "@/src/entities/lot";
import { CatalogLotCard } from "@/src/entities/lot/ui";
import { useSession, updateSessionProfile } from "@/src/entities/session";
import { ApiError } from "@/src/shared/api/client";
import { Icon } from "@/src/shared/ui/icon";
import { Loading } from "@/src/shared/ui/loading";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";

export function HomeDiscovery() {
  const { user, ready, setUser } = useSession();
  const { notify } = useToast();
  const { state, retry } = useCategories(String(user?.id ?? "guest"), ready);
  const track = useRef<HTMLUListElement>(null);
  const [position, setPosition] = useState({ start: true, end: false });
  useEffect(() => {
    if (!ready || !user) return;

    let active = true;
    updateSessionProfile()
      .then((profile) => {
        if (active) setUser(profile);
      })
      .catch((error: unknown) => {
        if (!active) return;

        if (error instanceof ApiError && error.status === 401) setUser(null);
        else
          notify({
            kind: "error",
            title: error instanceof Error ? error.message : "Не удалось обновить профиль",
          });
      });

    return () => {
      active = false;
    };
  }, [ready, user?.id, setUser, notify]);
  useEffect(() => {
    const element = track.current;
    if (!element) return;

    const sync = () =>
      setPosition({
        start: element.scrollLeft <= 1,
        end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2,
      });

    const observer = new ResizeObserver(sync);
    observer.observe(element);
    element.addEventListener("scroll", sync, { passive: true });
    sync();

    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", sync);
    };
  }, []);

  function scroll(direction: number): void {
    const element = track.current;
    if (!element) return;

    const first = element.children[0];
    const second = element.children[1];
    const step =
      first instanceof HTMLElement && second instanceof HTMLElement
        ? second.offsetLeft - first.offsetLeft
        : element.clientWidth;

    element.scrollBy({
      left: direction * step,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  return (
    <>
      <section className={styles.section} aria-labelledby="categories-heading">
        <h2 id="categories-heading">Что ищем сегодня?</h2>
        <p className={styles.subtitle}>Выберите направление или начните с поиска</p>
        {state.status === "loading" ? (
          <Loading compact label="Загружаем категории…" />
        ) : state.status === "error" ? (
          <div className={styles.categoryError}>
            <span>{state.message}</span>
            <button type="button" className={styles.textButton} onClick={retry}>
              Повторить
            </button>
          </div>
        ) : state.categories.length === 0 ? (
          <p className={styles.subtitle}>Категории пока не добавлены</p>
        ) : null}
        <div className={styles.categories}>
          {state.status === "ready" &&
            state.categories
              .filter((category) => category.parentId === null)
              .slice(0, 5)
              .map((category) => (
                <Link
                  key={category.id}
                  className={styles.category}
                  href={`/catalog?category=${category.id}`}
                >
                  <span className={styles.dot} aria-hidden="true" />
                  <strong>{category.name}</strong>
                  <span aria-hidden="true">
                    <Icon name="arrowUpRight" />
                  </span>
                </Link>
              ))}
          <Link className={styles.category} href="/catalog">
            <span className={styles.dot} aria-hidden="true" />
            <strong>Другое</strong>
            <span aria-hidden="true">
              <Icon name="arrowUpRight" />
            </span>
          </Link>
        </div>
      </section>
      <section
        className={styles.section}
        aria-labelledby="recommendations-heading"
        aria-roledescription="карусель"
      >
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.headingLine}>
              <h2 id="recommendations-heading">Подобрали для вас</h2>
              <span className={styles.badge}>РЕКОМЕНДАЦИИ</span>
            </div>
            <p className={styles.subtitle}>
              {ready && user?.emailConfirmed
                ? "Варианты, которые могут подойти под ваши лоты"
                : "Варианты, которые могут подойти под ваши интересы"}
            </p>
          </div>
          <Link className={styles.more} href="/recommendations">
            Смотреть ещё
            {" "}
            <Icon name="arrow" />
          </Link>
        </div>
        <div className={styles.carouselControls}>
          <div>
            <button
              type="button"
              aria-label="Предыдущие рекомендации"
              disabled={position.start}
              onClick={() => scroll(-1)}
            >
              <Icon name="back" />
            </button>
            <button
              type="button"
              aria-label="Следующие рекомендации"
              disabled={position.end}
              onClick={() => scroll(1)}
            >
              <Icon name="arrow" />
            </button>
          </div>
        </div>
        <ul className={styles.carousel} ref={track} aria-label="10 рекомендаций" tabIndex={0}>
          {RECOMMENDED_ITEMS.slice(0, 10).map((item, index) => (
            <li key={item.id}>
              <CatalogLotCard item={item} spacious eager={index < 4} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
