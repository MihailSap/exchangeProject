"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { LotEstimate } from "./LotEstimate";
import styles from "./LotForm.module.scss";
import { LotPhotosField } from "./LotPhotosField";
import { LotStepper } from "./LotStepper";
import { LotWants } from "./LotWants";
import {
  canContinueLotStep,
  hasFormChanges,
  initialValues,
  readFormValues,
  formWants,
  toMultipart,
  validateLotForm,
} from "../model/form";
import { initialPhotos, photosChanged, serializePhotos } from "../model/photos";

import type { LotField, LotFormValues } from "../model/form";
import type { LotPhotoSelection } from "../model/photos";
import type { Lot, LotCategory } from "@/src/entities/lot";
import type { AuthUser } from "@/src/entities/session";
import type { FormEvent } from "react";

import { createLot, getFixtureLot, getLotCategories, updateLot } from "@/src/entities/lot";
import { getRegions } from "@/src/entities/profile";
import { ApiError } from "@/src/shared/api/client";
import { FormField } from "@/src/shared/ui/form-field";
import { Icon } from "@/src/shared/ui/icon";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";

const FIRST_FIELDS: LotField[] = [
  "title",
  "description",
  "categoryId",
  "region",
  "type",
  "delivery",
  "cost",
  "photos",
];

export function LotForm({
  lot,
  user,
  onSaved,
}: {
  lot: Lot | null;
  user: AuthUser;
  onSaved: (lot: Lot) => void;
}) {
  const [initial] = useState(() => initialValues(lot, user.region ?? ""));
  const [values, setValues] = useState(initial);
  const [savedDraft, setSavedDraft] = useState<LotFormValues | null>(null);
  const [touched, setTouched] = useState<Partial<Record<LotField, boolean>>>({});
  const [photos, setPhotos] = useState<LotPhotoSelection[]>(() => initialPhotos(lot));
  const files = photos.flatMap((photo) => (photo.kind === "file" ? [photo.file] : []));
  const [categories, setCategories] = useState<LotCategory[]>(lot ? [lot.category] : []);
  const [regions, setRegions] = useState<string[]>([]);
  const [referenceError, setReferenceError] = useState("");
  const [referenceAttempt, setReferenceAttempt] = useState(0);
  const [step, setStep] = useState(1);
  const [lotQuery, setLotQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const { notify } = useToast();
  const draftKey = `exchange.lot-draft.v1.${user.id}.${lot?.id ?? "new"}`;
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const fixture = Boolean(lot && getFixtureLot(lot.id));
  const wantsEditable = !lot || fixture;
  const errors = validateLotForm(
    values,
    regions,
    categories.map((category) => category.id),
    photos.length,
  );

  const photoChanges = Boolean(lot && photosChanged(lot, photos));
  const unsupportedPhotoChanges = Boolean(lot && !fixture && photoChanges);
  const dirty = !lot || photoChanges || hasFormChanges(values, initial, wantsEditable);
  const firstValid = !FIRST_FIELDS.some((field) => errors[field]);
  const wantsValid = wantsEditable
    ? !["wantTypes", "keywords", "targetCategoryIds", "targetLots"].some(
      (field) => errors[field as LotField],
    ) &&
      (!values.wantTypes.includes("LOT") || !lotQuery.trim())
    : true;

  useEffect(() => {
    let active = true;
    setReferenceError("");
    Promise.allSettled([getLotCategories(), getRegions()]).then(
      ([categoryResult, regionResult]) => {
        if (!active) return;

        const failures: string[] = [];
        if (categoryResult.status === "fulfilled")
          setCategories(
            lot
              ? [
                ...categoryResult.value.filter((item) => item.id !== lot.category.id),
                lot.category,
              ]
              : categoryResult.value,
          );
        else if (!(
          categoryResult.reason instanceof ApiError && categoryResult.reason.status === 403
        ))
          failures.push(
            categoryResult.reason instanceof Error
              ? categoryResult.reason.message
              : "Не удалось загрузить категории. Попробуйте ещё раз.",
          );

        if (regionResult.status === "fulfilled") setRegions(regionResult.value);
        else
          failures.push(
            regionResult.reason instanceof Error
              ? regionResult.reason.message
              : "Не удалось загрузить регионы. Попробуйте ещё раз.",
          );

        setReferenceError(failures.join(" "));
      },
    );

    return () => {
      active = false;
    };
  }, [lot, referenceAttempt]);
  useEffect(() => {
    try {
      const stored = readFormValues(JSON.parse(localStorage.getItem(draftKey) || "null"));
      if (!stored) return;

      const saved = wantsEditable
        ? stored
        : {
          ...stored,
          wantTypes: initial.wantTypes,
          keywords: initial.keywords,
          targetCategoryIds: initial.targetCategoryIds,
          targetLots: initial.targetLots,
        };

      if (lot) {
        if (hasFormChanges(saved, initial, wantsEditable)) setSavedDraft(saved);
      } else {
        setValues(saved);
        setSavedAt("Восстановлен сохранённый текст");
      }
    } catch {
      return;
    }
  }, [draftKey, lot, initial, wantsEditable]);
  useEffect(() => {
    if (savedDraft) return;

    const timer = window.setInterval(() => {
      if (lot && !hasFormChanges(valuesRef.current, initial, wantsEditable)) return;

      try {
        localStorage.setItem(draftKey, JSON.stringify(valuesRef.current));
        setSavedAt("Текст сохранён на этом устройстве");
      } catch {
        setSavedAt("Не удалось сохранить черновик на устройстве");
      }
    }, 30_000);

    return () => clearInterval(timer);
  }, [draftKey, savedDraft, lot, initial, wantsEditable]);

  function change<K extends keyof LotFormValues>(field: K, value: LotFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function touch(field: LotField) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function field(
    fieldName: "title" | "description" | "cost",
    label: string,
    maxLength: number,
    multiline = false,
  ) {
    return (
      <FormField
        name={fieldName}
        label={label}
        maxLength={maxLength}
        value={values[fieldName]}
        required
        multiline={multiline}
        disabled={busy}
        error={touched[fieldName] ? errors[fieldName] : undefined}
        onChange={(value) => change(fieldName, value)}
        onBlur={() => touch(fieldName)}
      />
    );
  }

  function draft() {
    try {
      localStorage.setItem(draftKey, JSON.stringify(values));
      setSavedDraft(null);
      setSavedAt("Текст сохранён на этом устройстве");
      notify({
        kind: "success",
        title: "Черновик сохранён",
        description: "Текст доступен на этом устройстве. Фотографии нужно выбрать повторно.",
      });
    } catch {
      notify({ kind: "error", title: "Не удалось сохранить черновик на устройстве" });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    if (step === 1)
      setTouched((current) => ({
        ...current,
        title: true,
        description: true,
        categoryId: true,
        region: true,
        cost: true,
        photos: true,
      }));

    if (step === 2)
      setTouched((current) => ({
        ...current,
        wantTypes: true,
        keywords: true,
        targetCategoryIds: true,
        targetLots: true,
      }));

    if (!canContinueLotStep(step, firstValid, wantsValid)) return;

    if (step < 3) {
      setStep((current) => current + 1);

      return;
    }

    if (!canPublish) return;

    setBusy(true);
    try {
      let result: Lot;
      if (lot) {
        const wants = wantsEditable ? formWants(values, categories) : lot.wants;
        result = await updateLot(
          lot,
          {
            title: values.title.trim(),
            description: values.description.trim(),
            category_id: Number(values.categoryId),
            region: values.region,
            type: values.type,
            delivery_method: values.delivery,
            estimated_cost: Number(values.cost.replace(",", ".")),
          },
          wants,
          photoChanges ? await serializePhotos(photos) : undefined,
        );
      } else result = await createLot(toMultipart(values, files));

      try {
        localStorage.removeItem(draftKey);
      } catch {
        setSavedAt("");
      }

      onSaved(result);
    } catch (error) {
      notify({
        kind: "error",
        title: error instanceof Error ? error.message : "Не удалось сохранить лот",
      });
      if (error instanceof ApiError && error.status === 401) window.location.assign("/login");

      if (error instanceof ApiError && error.status === 403) window.location.assign("/");
    } finally {
      setBusy(false);
    }
  }

  const canPublish = !busy && firstValid && wantsValid && dirty && !unsupportedPhotoChanges;

  return (
    <>
      {savedDraft && (
        <section className={styles.draftNotice} aria-label="Сохранённый черновик">
          <p>Есть сохранённый черновик изменений этого лота.</p>
          <button
            type="button"
            onClick={() => {
              setValues(savedDraft);
              setSavedDraft(null);
              setSavedAt("Восстановлен сохранённый текст");
            }}
          >
            Восстановить черновик
          </button>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem(draftKey);
                setSavedDraft(null);
              } catch {
                notify({ kind: "error", title: "Не удалось удалить черновик" });
              }
            }}
          >
            Удалить черновик
          </button>
        </section>
      )}
      <LotStepper step={step} />
      <div className={styles.layout}>
        <form id="lot-form" className={styles.form} noValidate onSubmit={submit}>
          {step === 1 ? (
            <>
              <h2>Основная информация</h2>
              {referenceError && (
                <div className={styles.referenceError} role="status">
                  <p>{referenceError}</p>
                  <button type="button" onClick={() => setReferenceAttempt((value) => value + 1)}>
                    Повторить загрузку
                  </button>
                </div>
              )}
              {field("title", "Название лота", 120)}
              <div className={styles.row}>
                <FormField
                  name="categoryId"
                  label="Категория"
                  maxLength={20}
                  value={values.categoryId}
                  required
                  disabled={busy || !categories.length}
                  error={touched.categoryId ? errors.categoryId : undefined}
                  onChange={(value) => change("categoryId", value)}
                  onBlur={() => touch("categoryId")}
                  options={[
                    { value: "", label: "Выберите категорию" },
                    ...categories.map((item) => ({ value: String(item.id), label: item.name })),
                  ]}
                />
                <fieldset className={styles.segmented}>
                  <legend>Тип предложения *</legend>
                  {(["PRODUCT", "SERVICE"] as const).map((type) => (
                    <label key={type}>
                      <input
                        type="radio"
                        name="type"
                        checked={values.type === type}
                        disabled={busy}
                        onChange={() => change("type", type)}
                      />
                      <span>{type === "PRODUCT" ? "Товар" : "Услуга"}</span>
                    </label>
                  ))}
                </fieldset>
              </div>
              {field("description", "Описание", 1000, true)}
              <p className={styles.count}>{values.description.length} / 1000</p>
              <LotPhotosField
                photos={photos}
                onChange={setPhotos}
                disabled={busy}
                onBlur={() => touch("photos")}
                error={touched.photos ? errors.photos : undefined}
              />
              {unsupportedPhotoChanges && (
                <p className={styles.referenceError} role="status">
                  Сервер пока не поддерживает сохранение изменений фотографий. Верните исходный
                  набор фото, чтобы сохранить остальные изменения, или дождитесь обновления API.
                  <button type="button" onClick={() => setPhotos(initialPhotos(lot))}>
                    Вернуть исходные фотографии
                  </button>
                </p>
              )}
              <div className={styles.row}>
                <FormField
                  name="region"
                  label="Регион"
                  maxLength={120}
                  value={values.region}
                  required
                  disabled={busy || !regions.length}
                  error={touched.region ? errors.region : undefined}
                  onChange={(value) => change("region", value)}
                  onBlur={() => touch("region")}
                  options={[
                    { value: "", label: "Выберите регион" },
                    ...regions.map((region) => ({ value: region, label: region })),
                  ]}
                />
                <FormField
                  name="delivery"
                  label="Способ передачи"
                  maxLength={20}
                  value={values.delivery}
                  required
                  onChange={(value) => {
                    if (value === "BOTH" || value === "DELIVERY" || value === "PICKUP")
                      change("delivery", value);
                  }}
                  onBlur={() => touch("delivery")}
                  disabled={busy}
                  options={[
                    { value: "BOTH", label: "Доставка и самовывоз" },
                    { value: "DELIVERY", label: "Доставка" },
                    { value: "PICKUP", label: "Самовывоз" },
                  ]}
                />
              </div>
              <div className={styles.row}>
                {field("cost", "Оценочная стоимость, ₽", 11)}
                <p className={styles.priceHint}>
                  Не уверены в цене? ИИ-оценка на следующем шаге подскажет рыночный диапазон.
                </p>
              </div>
            </>
          ) : step === 2 ? (
            <>
              <h2>Варианты обмена</h2>
              <p className={styles.hint}>
                Отметьте один или несколько вариантов. Приоритет между ними не задаётся — все
                варианты равнозначны.
              </p>
              {!wantsEditable && (
                <p className={styles.referenceError}>
                  Пожелания текущего лота сохранены. Их изменение станет доступно после поддержки
                  замены пожеланий на сервере.
                </p>
              )}
              <LotWants
                values={values}
                categories={categories}
                userId={user.id}
                disabled={!wantsEditable || busy}
                errors={errors}
                touched={touched}
                query={lotQuery}
                onQuery={setLotQuery}
                onChange={setValues}
                onBlur={touch}
              />
              <div className={styles.priceSummary}>
                <span>Ваша оценка</span>
                <strong>{Number(values.cost.replace(",", ".")).toLocaleString("ru-RU")} ₽</strong>
                <p>
                  Стоимость помогает сравнить варианты обмена. Условия вы согласуете с участником.
                </p>
              </div>
            </>
          ) : (
            <>
              <h2>Всё готово к публикации</h2>
              <p className={styles.hint}>Проверьте данные. После отправки лот пройдёт модерацию.</p>
              <div className={styles.review}>
                <h3>{values.title}</h3>
                <strong>{Number(values.cost.replace(",", ".")).toLocaleString("ru-RU")} ₽</strong>
                <p>
                  {categories.find((category) => category.id === Number(values.categoryId))?.name} ·{" "}
                  {values.region}
                </p>
                <p>{values.description}</p>
                <div className={styles.reviewWants}>
                  <strong>Хочу получить взамен:</strong>
                  <ul>
                    {formWants(values, categories).map((want) => (
                      <li
                        key={`${want.want_type}:${want.target_lot ?? want.target_category?.id ?? "text"}`}
                      >
                        {want.want_type === "ANY"
                          ? "Готов рассмотреть ваши варианты"
                          : want.keywords ||
                            want.target_category?.name ||
                            `Лот №${want.target_lot}`}
                      </li>
                    ))}
                  </ul>
                </div>
                <p>Фотографий: {photos.length}</p>
              </div>
              <p className={styles.hint}>
                Отправляя лот, вы принимаете
                {" "}
                <Link href="/rules">правила сервиса</Link>
                .
              </p>
            </>
          )}
        </form>
        <aside className={styles.aside}>
          {step === 1 && (
            <section className={styles.tip}>
              <Icon name="check" />
              <h2>Совет для хорошего обмена</h2>
              <p>Добавьте 3–5 фото при хорошем освещении и честно расскажите о состоянии вещи.</p>
            </section>
          )}
          {step === 2 && <LotEstimate price={Number(values.cost.replace(",", "."))} />}
          <section className={styles.actions}>
            <button
              type="submit"
              form="lot-form"
              className={styles.primary}
              disabled={
                step === 3 ? !canPublish : busy || !canContinueLotStep(step, firstValid, wantsValid)
              }
            >
              {busy ? "Отправляем…" : step === 3 ? "Отправить на модерацию" : "Продолжить"}
              <Icon name="arrow" />
            </button>
            {step > 1 && (
              <button
                type="button"
                className={styles.secondary}
                disabled={busy}
                onClick={() => setStep((value) => value - 1)}
              >
                <Icon name="back" />
                Назад
              </button>
            )}
            <button type="button" className={styles.secondary} disabled={busy} onClick={draft}>
              Сохранить черновик
            </button>
            {lot && step === 3 && !dirty && (
              <p role="status">Внесите изменения, чтобы отправить лот на модерацию.</p>
            )}
            <p aria-live="polite">
              {savedAt || "Текст автоматически сохраняется каждые 30 секунд"}
            </p>
            <small>Фотографии не сохраняются в черновике.</small>
            <Link href={lot ? `/lots/${lot.id}` : "/profile"}>Отмена</Link>
          </section>
        </aside>
      </div>
    </>
  );
}
