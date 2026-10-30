"use client";

import { useRef, useState } from "react";

import styles from "./Catalog.module.scss";

import { Icon } from "@/src/shared/ui/icon";

export function CatalogSearch({
  initial,
  disabled,
  onSearch,
}: {
  initial: string;
  disabled: boolean;
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const input = useRef<HTMLInputElement>(null);

  return (
    <form
      className={styles.search}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled) onSearch(value.trim());
      }}
    >
      <Icon name="search" />
      <label className={styles.srOnly} htmlFor="catalog-search">
        Поиск по лотам
      </label>
      <div className={styles.searchField}>
        <input
          ref={input}
          id="catalog-search"
          type="search"
          maxLength={200}
          placeholder="Например, велосипед, кофемашина или урок английского"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={disabled}
        />
        {value && (
          <button
            type="button"
            className={styles.clearSearch}
            aria-label="Очистить поиск"
            disabled={disabled}
            onClick={() => {
              setValue("");
              input.current?.focus();
            }}
          >
            <Icon name="close" />
          </button>
        )}
      </div>
      <button type="submit" className={styles.primaryButton} disabled={disabled}>
        Найти
      </button>
    </form>
  );
}
