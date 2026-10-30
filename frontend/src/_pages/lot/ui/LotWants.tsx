"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./LotWants.module.scss";
import { parseTargetLot } from "../model/form";

import type { LotField, LotFormValues, WantType } from "../model/form";
import type { Lot, LotCategory } from "@/src/entities/lot";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import { getLot } from "@/src/entities/lot";
import { AssetImage } from "@/src/shared/ui/asset-image";
import { FormField } from "@/src/shared/ui/form-field";
import { Icon } from "@/src/shared/ui/icon";

type Props = {
  values: LotFormValues;
  categories: LotCategory[];
  userId: number;
  disabled: boolean;
  errors: Partial<Record<LotField, string>>;
  touched: Partial<Record<LotField, boolean>>;
  query: string;
  onQuery: (value: string) => void;
  onChange: Dispatch<SetStateAction<LotFormValues>>;
  onBlur: (field: LotField) => void;
};

type ChoiceProps = {
  type: WantType;
  title: string;
  description: string;
  values: LotFormValues;
  disabled: boolean;
  onToggle: (type: WantType) => void;
  onBlur: () => void;
  children?: ReactNode;
};

function Choice({
  type,
  title,
  description,
  values,
  disabled,
  onToggle,
  onBlur,
  children,
}: ChoiceProps) {
  const selected = values.wantTypes.includes(type);

  return (
    <section className={`${styles.option} ${selected ? styles.selected : ""}`}>
      <label className={styles.heading}>
        <input
          type="checkbox"
          name={`exchange-${type}`}
          checked={selected}
          disabled={disabled}
          onChange={() => onToggle(type)}
          onBlur={onBlur}
        />
        <span>
          <strong>{title}</strong>
          <small>{description}</small>
        </span>
      </label>
      {selected && children && <div className={styles.content}>{children}</div>}
    </section>
  );
}

export function LotWants({
  values,
  categories,
  userId,
  disabled,
  errors,
  touched,
  query,
  onQuery,
  onChange,
  onBlur,
}: Props) {
  const [queryTouched, setQueryTouched] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [loading, setLoading] = useState(false);
  const [references, setReferences] = useState<Record<string, Lot>>({});
  const [allCategories, setAllCategories] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    for (const id of values.targetLots) {
      const target = parseTargetLot(id);
      if (target)
        void getLot(Number(target))
          .then((lot) => {
            if (active && lot.status === "ACTIVE" && lot.owner.id !== userId)
              setReferences((current) => ({ ...current, [id]: lot }));
          })
          .catch(() => undefined);
    }

    return () => {
      active = false;
    };
  }, [values.targetLots, userId]);

  function toggle(type: WantType) {
    onChange({
      ...values,
      wantTypes: values.wantTypes.includes(type)
        ? values.wantTypes.filter((item) => item !== type)
        : [...values.wantTypes, type],
    });
    onBlur("wantTypes");
  }

  const parsed = parseTargetLot(query);
  const duplicate =
    parsed !== null && values.targetLots.some((item) => parseTargetLot(item) === parsed);

  const queryError =
    query.trim() && !parsed
      ? "Введите номер лота или ссылку вида /lots/123"
      : duplicate
        ? "Этот лот уже добавлен"
        : undefined;

  async function addLot() {
    setQueryTouched(true);
    if (!parsed || duplicate || loading || disabled || values.targetLots.length >= 10) return;

    setLoading(true);
    setRequestError("");
    try {
      const lot = await getLot(Number(parsed));
      if (!mounted.current) return;

      if (lot.owner.id === userId) {
        setRequestError("Выберите лот другого участника");

        return;
      }

      if (lot.status !== "ACTIVE") {
        setRequestError("Выберите активный лот, доступный для обмена");

        return;
      }

      setReferences((current) => ({ ...current, [parsed]: lot }));
      onChange((current) => ({
        ...current,
        targetLots: current.targetLots.includes(parsed)
          ? current.targetLots
          : [...current.targetLots, parsed],
      }));
      onQuery("");
      setQueryTouched(false);
    } catch (error) {
      if (mounted.current)
        setRequestError(error instanceof Error ? error.message : "Не удалось загрузить лот");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  const choiceProps = {
    values,
    disabled: disabled || loading,
    onToggle: toggle,
    onBlur: () => onBlur("wantTypes"),
  };

  const selectedCategories = categories.filter((item) =>
    values.targetCategoryIds.includes(String(item.id)),
  );

  const shownCategories = allCategories
    ? categories
    : [
      ...selectedCategories,
      ...categories
        .filter((item) => !values.targetCategoryIds.includes(String(item.id)))
        .slice(0, Math.max(0, 6 - selectedCategories.length)),
    ];

  return (
    <fieldset className={styles.options} disabled={disabled} aria-label="Варианты обмена">
      <Choice
        {...choiceProps}
        type="LOT"
        title="Конкретные лоты"
        description="Добавьте лоты, которые хотите получить взамен"
      >
        {!disabled && (
          <>
            <div className={styles.lotInput}>
              <FormField
                name="target-lot-query"
                label="Номер или ссылка на лот"
                maxLength={300}
                value={query}
                disabled={loading || values.targetLots.length >= 10}
                onChange={(value) => {
                  onQuery(value);
                  setRequestError("");
                }}
                onBlur={() => {
                  setQueryTouched(true);
                  onBlur("targetLots");
                }}
                error={requestError || (queryTouched ? queryError : undefined)}
              />
              <button
                type="button"
                className={styles.add}
                disabled={!parsed || duplicate || loading || values.targetLots.length >= 10}
                onClick={() => void addLot()}
              >
                {loading ? "Загружаем…" : "Добавить"}
                <Icon name="plus" />
              </button>
            </div>
            <p className={styles.hint}>
              До 10 лотов. Укажите номер или ссылку и нажмите «Добавить».
            </p>
          </>
        )}
        {values.targetLots.length > 0 && (
          <ul className={styles.lots}>
            {values.targetLots.map((id) => {
              const lot = references[id];

              return (
                <li key={id}>
                  <span className={styles.thumb}>
                    {lot?.photos[0] ? (
                      <AssetImage src={lot.photos[0].name} alt="" width={36} height={36} />
                    ) : (
                      <Icon name="lots" />
                    )}
                  </span>
                  <span className={styles.lotInfo}>
                    <strong>{lot?.title ?? `Лот №${id}`}</strong>
                    {lot && (
                      <small>
                        {lot.region} · {lot.owner.name}
                      </small>
                    )}
                  </span>
                  {!disabled && (
                    <button
                      type="button"
                      disabled={loading}
                      aria-label={`Убрать лот ${lot?.title ?? id}`}
                      onClick={() => {
                        onChange({
                          ...values,
                          targetLots: values.targetLots.filter((item) => item !== id),
                        });
                        onBlur("targetLots");
                      }}
                    >
                      <Icon name="close" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {touched.targetLots && errors.targetLots && (
          <p className={styles.error} role="alert">
            {errors.targetLots}
          </p>
        )}
      </Choice>
      <Choice
        {...choiceProps}
        type="CATEGORY"
        title="Категории"
        description="Подойдёт любой лот из выбранных категорий"
      >
        <div className={styles.categories}>
          {shownCategories.map((category) => (
            <label
              key={category.id}
              className={
                values.targetCategoryIds.includes(String(category.id)) ? styles.activeCategory : ""
              }
            >
              <input
                type="checkbox"
                name={`target-category-${category.id}`}
                checked={values.targetCategoryIds.includes(String(category.id))}
                disabled={
                  disabled ||
                  (!values.targetCategoryIds.includes(String(category.id)) &&
                    values.targetCategoryIds.length >= 10)
                }
                onChange={() =>
                  onChange({
                    ...values,
                    targetCategoryIds: values.targetCategoryIds.includes(String(category.id))
                      ? values.targetCategoryIds.filter((id) => id !== String(category.id))
                      : [...values.targetCategoryIds, String(category.id)],
                  })
                }
                onBlur={() => onBlur("targetCategoryIds")}
              />
              <span>{category.name}</span>
            </label>
          ))}
          {categories.length > 6 && (
            <button
              type="button"
              className={styles.more}
              onClick={() => setAllCategories((value) => !value)}
            >
              {allCategories ? "Свернуть" : "Ещё +"}
            </button>
          )}
        </div>
        {!disabled && <p className={styles.hint}>Можно выбрать до 10 категорий.</p>}
        {touched.targetCategoryIds && errors.targetCategoryIds && (
          <p className={styles.error} role="alert">
            {errors.targetCategoryIds}
          </p>
        )}
      </Choice>
      <Choice
        {...choiceProps}
        type="KEYWORDS"
        title="Мои пожелания"
        description="Расскажите, какие вещи или услуги вам интересны"
      >
        <FormField
          name="keywords"
          label="Что хотите получить"
          maxLength={300}
          value={values.keywords}
          multiline
          required
          disabled={disabled}
          error={touched.keywords ? errors.keywords : undefined}
          onChange={(keywords) => onChange({ ...values, keywords })}
          onBlur={() => onBlur("keywords")}
        />
        <p className={styles.hint}>
          Свободный текст до 300 символов, например: «Велосипед или самокат».
        </p>
      </Choice>
      <Choice
        {...choiceProps}
        type="ANY"
        title="Готов рассмотреть ваши варианты"
        description="Другие участники смогут предложить свой вариант обмена"
      />
      {touched.wantTypes && errors.wantTypes && (
        <p className={styles.error} role="alert">
          {errors.wantTypes}
        </p>
      )}
    </fieldset>
  );
}
