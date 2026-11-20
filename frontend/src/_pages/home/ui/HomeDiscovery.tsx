"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "./HomePage.module.scss";

import type { CatalogItem } from "@/src/entities/lot";

import { useCategories } from "@/src/entities/category/client";
import { getCatalogPage, RECOMMENDED_ITEMS } from "@/src/entities/lot";
import { CatalogLotCard } from "@/src/entities/lot/ui";
import { useSession, updateSessionProfile } from "@/src/entities/session";
import { ApiError } from "@/src/shared/api/client";
import { Icon } from "@/src/shared/ui/icon";
import { Loading } from "@/src/shared/ui/loading";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";

export function HomeDiscovery() {
  const { user, ready, setUser } = useSession();
  const { notify } = useToast();
  const { state, retry } = useCategories();
  const [lots, setLots] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ready"; items: CatalogItem[] }>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const personalized = ready && Boolean(user);
  const items = personalized ? RECOMMENDED_ITEMS.slice(0, 10) : lots.status === "ready" ? lots.items : [];
  useEffect(() => {
    if (!ready || personalized) return;

    let active = true;
    setLots({ status: "loading" });
    getCatalogPage({ sort: "date_desc", page: 1, per_page: 10 })
      .then((page) => {
        if (active) setLots({ status: "ready", items: page.items });
      })
      .catch((error: unknown) => {
        if (!active) return;

        const message = error instanceof Error ? error.message : "Не удалось загрузить предложения";
        setLots({ status: "error", message });
        notify({ kind: "error", title: message });
      });

    return () => {
      active = false;
    };
  }, [attempt, notify, ready, personalized]);
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
  }, [lots, personalized]);

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
              <h2 id="recommendations-heading">{personalized ? "Подобрали для вас" : "Новые предложения"}</h2>
              <span className={styles.badge}>{personalized ? "РЕКОМЕНДАЦИИ" : "НОВЫЕ ЛОТЫ"}</span>
            </div>
            <p className={styles.subtitle}>
              {personalized ? "Варианты, которые могут подойти под ваши интересы" : "Вещи и услуги, которые можно обменять уже сейчас"}
            </p>
          </div>
          <Link className={styles.more} href={personalized ? "/recommendations" : "/catalog"}>
            Смотреть ещё
            {" "}
            <Icon name="arrow" />
          </Link>
        </div>
        <div className={styles.carouselControls}>
          <div>
            <button
              type="button"
              aria-label="Предыдущие лоты"
              disabled={(!personalized && lots.status !== "ready") || !items.length || position.start}
              onClick={() => scroll(-1)}
            >
              <Icon name="back" />
            </button>
            <button
              type="button"
              aria-label="Следующие лоты"
              disabled={(!personalized && lots.status !== "ready") || !items.length || position.end}
              onClick={() => scroll(1)}
            >
              <Icon name="arrow" />
            </button>
          </div>
        </div>
        <ul className={styles.carousel} ref={track} aria-label={personalized ? "10 рекомендаций" : "Последние 10 лотов каталога"} aria-busy={!ready || (!personalized && lots.status === "loading")} tabIndex={0}>
          {!ready || (!personalized && lots.status === "loading") ? (
            <li>
              <Loading compact label="Загружаем предложения…" />
            </li>
          ) : !personalized && lots.status === "error" ? (
            <li role="status">
              <p>{lots.message}</p>
              <button type="button" className={styles.textButton} onClick={() => setAttempt((value) => value + 1)}>Повторить загрузку</button>
            </li>
          ) : items.length === 0 ? (
            <li>
              <p>Опубликованных предложений пока нет.</p>
            </li>
          ) : items.map((item, index) => (
            <li key={item.id}>
              <CatalogLotCard item={item} spacious eager={index < 4} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
