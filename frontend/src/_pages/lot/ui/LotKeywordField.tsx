"use client";

import { useId, useRef } from "react";

import styles from "./LotKeywordField.module.scss";
import { KEYWORD_LIMIT, keywordError } from "../model/keywords";

type Props = {
  tags: string[];
  query: string;
  disabled: boolean;
  touched: boolean;
  error?: string;
  onQuery: (value: string) => void;
  onChange: (tags: string[]) => void;
  onBlur: () => void;
};

export function LotKeywordField({
  tags,
  query,
  disabled,
  touched,
  error,
  onQuery,
  onChange,
  onBlur,
}: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const validation = keywordError(query, tags);
  const message = touched ? validation || (query.trim() ? "Нажмите Enter, чтобы добавить пожелание" : error) : undefined;
  const remaining = Math.max(0, KEYWORD_LIMIT - tags.join("").length);

  return (
    <div className={styles.field}>
      <label htmlFor={id}>Что хотите получить *</label>
      <div className={`${styles.control} ${message ? styles.invalid : ""}`}>
        {tags.length > 0 && (
          <ul className={styles.tags} aria-label="Добавленные пожелания">
            {tags.map((tag) => (
              <li className={styles.tag} key={tag}>
                <span>{tag}</span>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`Удалить пожелание «${tag}»`}
                  onClick={() => {
                    onChange(tags.filter((item) => item !== tag));
                    input.current?.focus();
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={input}
          id={id}
          name="keyword-query"
          type="text"
          value={query}
          maxLength={remaining}
          disabled={disabled}
          placeholder="Добавьте пожелание и нажмите Enter"
          aria-invalid={Boolean(message)}
          aria-describedby={`${id}-hint${message ? ` ${id}-error` : ""}`}
          onChange={(event) => onQuery(event.target.value)}
          onBlur={onBlur}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.nativeEvent.isComposing) return;

            event.preventDefault();
            if (disabled || !query.trim() || validation) return;

            onChange([...tags, query.trim()]);
            onQuery("");
          }}
        />
      </div>
      <p id={`${id}-hint`} className={styles.hint}>
        До 10 пожеланий, от 2 символов каждое. {tags.join("").length + query.length} / 300 символов.
      </p>
      {message && <p id={`${id}-error`} className={styles.error} role="alert">{message}</p>}
    </div>
  );
}
