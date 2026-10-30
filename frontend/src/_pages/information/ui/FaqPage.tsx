"use client";

import { useState } from "react";

import styles from "./InformationPage.module.scss";
import { FAQ } from "../model/faq";

import { Breadcrumbs } from "@/src/shared/ui/breadcrumbs";
import { Icon } from "@/src/shared/ui/icon";
import { SiteHeader, SiteFooter } from "@/src/widgets/site-chrome";

export function FaqPage() {
  const [categoryId, setCategoryId] = useState("registration");
  const [query, setQuery] = useState("");
  const term = query.trim().toLocaleLowerCase("ru");
  const current = FAQ.find((category) => category.id === categoryId) ?? FAQ[0];
  const filtered = (term ? FAQ : [current])
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (item) => !term || `${item.question} ${item.answer}`.toLocaleLowerCase("ru").includes(term),
      ),
    }))
    .filter((category) => category.questions.length);

  return (
    <div className="sitePage">
      <SiteHeader />
      <main className={styles.main}>
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Частые вопросы" }]} />
        <h1>Частые вопросы</h1>
        <p className={styles.lead}>
          Ответы на типовые вопросы о регистрации, лотах, обмене, чате, отзывах и жалобах.
        </p>
        <div className={styles.search}>
          <label htmlFor="faq-search" className={styles.visuallyHidden}>
            Поиск по вопросам
          </label>
          <input
            id="faq-search"
            type="search"
            placeholder="Поиск по вопросам…"
            maxLength={200}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          <Icon name="search" />
        </div>
        <div className={styles.layout}>
          <nav className={styles.categories} aria-label="Категории вопросов">
            {FAQ.map((category) => (
              <button
                type="button"
                key={category.id}
                aria-current={!term && category.id === categoryId ? "page" : undefined}
                onClick={() => {
                  setCategoryId(category.id);
                  setQuery("");
                }}
              >
                <span>{category.title}</span>
                <span>{category.questions.length}</span>
              </button>
            ))}
          </nav>
          <div className={styles.content} aria-live="polite">
            {filtered.length ? (
              filtered.map((category) => (
                <section key={`${category.id}:${term}`}>
                  <h2>{category.title}</h2>
                  <div className={styles.questions}>
                    {category.questions.map((item, index) => (
                      <details key={item.question} open={index === 0 ? true : undefined}>
                        <summary>
                          {item.question}
                          <Icon name="down" />
                        </summary>
                        <p>{item.answer}</p>
                      </details>
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <section className={styles.empty}>
                <h2>Ничего не найдено</h2>
                <p>Попробуйте другой запрос или выберите категорию.</p>
                <button type="button" onClick={() => setQuery("")}>
                  Сбросить поиск
                </button>
              </section>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
