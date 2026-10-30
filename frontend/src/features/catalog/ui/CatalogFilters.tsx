"use client";

import { useState } from "react";

import styles from "./Catalog.module.scss";
import { priceErrors } from "../model/catalog";

import type { CatalogFilters as Filters } from "../model/catalog";
import type { FormEvent } from "react";

import { Select } from "@/src/shared/ui/select";

export type FilterCategory = { id: string; name: string; depth?: number };

type Props = {
  initial: Filters;
  categories: FilterCategory[];
  regions: string[];
  disabled: boolean;
  categoriesDisabled: boolean;
  regionsDisabled: boolean;
  onApply: (value: Filters) => void;
  onReset: () => void;
};

export function CatalogFilters({
  initial,
  categories,
  regions,
  disabled,
  categoriesDisabled,
  regionsDisabled,
  onApply,
  onReset,
}: Props) {
  const [draft, setDraft] = useState<Filters>(initial);
  const [touched, setTouched] = useState({ min: false, max: false });
  const errors = priceErrors(draft.min, draft.max);
  const invalid = Boolean(errors.min || errors.max);

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setTouched({ min: true, max: true });
    if (!disabled && !invalid) onApply(draft);
  }

  return (
    <form className={styles.filters} onSubmit={submit} noValidate>
      <fieldset disabled={disabled} className={styles.filterFields}>
        <legend className={styles.filterTitle}>Фильтры</legend>
        <fieldset className={styles.typeGroup}>
          <legend>Тип предложения</legend>
          <div className={styles.typeOptions}>
            {(
              [
                { value: "", label: "Все" },
                { value: "PRODUCT", label: "Товар" },
                { value: "SERVICE", label: "Услуга" },
              ] as const
            ).map((option) => (
              <label key={option.value} className={styles.typeOption}>
                <input
                  type="radio"
                  name="catalog-type"
                  value={option.value}
                  checked={draft.type === option.value}
                  onChange={() => setDraft({ ...draft, type: option.value })}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className={styles.field}>
          <label id="catalog-category-label" htmlFor="catalog-category">
            Категория
          </label>
          <Select
            id="catalog-category"
            labelledBy="catalog-category-label"
            variant="filter"
            value={draft.category}
            disabled={disabled || categoriesDisabled}
            onChange={(category) => setDraft({ ...draft, category })}
            options={[
              { value: "", label: "Все категории" },
              ...(draft.category && !categories.some((item) => item.id === draft.category)
                ? [{ value: draft.category, label: "Выбранная категория" }]
                : []),
              ...categories.map((category) => ({
                value: category.id,
                label: `${"• ".repeat(category.depth ?? 0)}${category.name}`,
              })),
            ]}
          />
        </div>
        <div className={styles.field}>
          <label id="catalog-region-label" htmlFor="catalog-region">
            Регион
          </label>
          <Select
            id="catalog-region"
            labelledBy="catalog-region-label"
            variant="filter"
            value={draft.region}
            disabled={disabled || regionsDisabled}
            onChange={(region) => setDraft({ ...draft, region })}
            options={[
              { value: "", label: "Вся Россия" },
              ...(draft.region && !regions.includes(draft.region)
                ? [{ value: draft.region, label: draft.region }]
                : []),
              ...regions.map((region) => ({ value: region, label: region })),
            ]}
          />
        </div>
        <fieldset className={styles.priceGroup}>
          <legend>Стоимость, ₽</legend>
          <div className={styles.priceFields}>
            {(["min", "max"] as const).map((key) => (
              <label key={key}>
                <span className={styles.srOnly}>
                  {key === "min" ? "Стоимость от" : "Стоимость до"}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder={key === "min" ? "От" : "До"}
                  value={draft[key]}
                  aria-invalid={touched[key] && Boolean(errors[key])}
                  aria-describedby={
                    touched[key] && errors[key] ? `catalog-${key}-error` : `catalog-${key}-hint`
                  }
                  onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                  onBlur={() => setTouched({ ...touched, [key]: true })}
                />
                <span id={`catalog-${key}-hint`} className={styles.srOnly}>
                  До 10 цифр, целое число от 0 до 9 999 999 999
                </span>
                {touched[key] && errors[key] && (
                  <span className={styles.error} id={`catalog-${key}-error`} role="status">
                    {errors[key]}
                  </span>
                )}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className={styles.deliveryGroup}>
          <legend>Способ передачи</legend>
          <label>
            <input
              type="checkbox"
              checked={draft.delivery}
              onChange={(event) => setDraft({ ...draft, delivery: event.target.checked })}
            />
            Доставка
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.pickup}
              onChange={(event) => setDraft({ ...draft, pickup: event.target.checked })}
            />
            Самовывоз
          </label>
        </fieldset>
        <div className={styles.filterActions}>
          <button type="submit" className={styles.secondaryButton} disabled={disabled || invalid}>
            Применить фильтры
          </button>
          <button
            type="button"
            className={styles.resetButton}
            onClick={() => {
              setDraft(initial);
              setTouched({ min: false, max: false });
              onReset();
            }}
          >
            Сбросить фильтры
          </button>
        </div>
      </fieldset>
    </form>
  );
}
