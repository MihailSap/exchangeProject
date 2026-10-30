"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./ProfileSettings.module.scss";
import { PROFILE_LIMITS, validateAvatar, validateProfile } from "../model/validation";

import type { ProfileValues } from "../model/validation";
import type { AuthUser } from "@/src/entities/session";
import type { FormEvent } from "react";

import { getRegions } from "@/src/entities/profile";
import { saveSessionProfile } from "@/src/entities/session";
import { Avatar } from "@/src/shared/ui/avatar";
import { FormField } from "@/src/shared/ui/form-field";
import { Icon } from "@/src/shared/ui/icon";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";

function valuesOf(user: AuthUser): ProfileValues {
  return { name: user.name, region: user.region ?? "", contacts: user.contacts ?? "" };
}

export function ProfileSettings({
  user,
  onSaved,
}: {
  user: AuthUser;
  onSaved: (user: AuthUser) => void;
}) {
  const [initial, setInitial] = useState(() => valuesOf(user));
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState<Partial<Record<keyof ProfileValues | "avatar", boolean>>>(
    {},
  );

  const [regions, setRegions] = useState<string[]>([]);
  const [regionsState, setRegionsState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [preview, setPreview] = useState<string>();
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();
  useEffect(() => {
    let active = true;
    setRegionsState("loading");
    getRegions()
      .then((data) => {
        if (active) {
          setRegions(data);
          setRegionsState("ready");
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setRegionsState("error");
          notify({
            kind: "error",
            title: error instanceof Error ? error.message : "Не удалось загрузить регионы",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [attempt, notify]);
  const avatarError = validateAvatar(avatar);
  useEffect(() => {
    if (!avatar || validateAvatar(avatar)) {
      setPreview(undefined);

      return;
    }

    const url = URL.createObjectURL(avatar);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [avatar]);
  const errors = validateProfile(values, regions);
  const changed =
    removeAvatar ||
    avatar !== null ||
    Object.keys(PROFILE_LIMITS).some(
      (key) => values[key as keyof ProfileValues] !== initial[key as keyof ProfileValues],
    );

  const invalid =
    Object.keys(errors).length > 0 || Boolean(avatarError) || regionsState !== "ready";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ name: true, region: true, contacts: true, avatar: true });
    if (invalid || !changed || saving) return;

    const body = new FormData();
    if (values.name.trim() !== initial.name) body.append("name", values.name.trim());

    if (values.region !== initial.region) body.append("region", values.region);

    if (values.contacts.trim() !== initial.contacts)
      body.append("contacts", values.contacts.trim());

    if (avatar) body.append("avatar", avatar);
    else if (removeAvatar) body.append("avatar", new Blob([]), "");

    setSaving(true);
    try {
      const updated = await saveSessionProfile(body);
      onSaved(updated);
      const next = valuesOf(updated);
      setInitial(next);
      setValues(next);
      setAvatar(null);
      setRemoveAvatar(false);
      setTouched({});
      if (fileRef.current) fileRef.current.value = "";

      notify({ kind: "success", title: "Профиль обновлён" });
    } catch (error) {
      notify({
        kind: "error",
        title: error instanceof Error ? error.message : "Не удалось сохранить профиль",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="settings-heading">
      <h2 id="settings-heading">Настройки профиля</h2>
      <p className={styles.intro}>
        Расскажите немного о себе — так другим участникам будет проще с вами познакомиться.
      </p>
      <form onSubmit={submit} noValidate className={styles.form}>
        <fieldset disabled={saving} className={styles.fields}>
          <div className={styles.avatarRow}>
            <Avatar name={values.name} src={removeAvatar ? null : preview || user.avatarUrl} />
            <div>
              <div className={styles.avatarActions}>
                <label className={styles.upload} htmlFor="profile-avatar">
                  Изменить аватар
                  <input
                    ref={fileRef}
                    id="profile-avatar"
                    name="avatar"
                    type="file"
                    accept="image/jpeg,image/png"
                    aria-invalid={Boolean(avatarError)}
                    aria-describedby={`avatar-hint${touched.avatar && avatarError ? " avatar-error" : ""}`}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setAvatar(file);
                      if (file) setRemoveAvatar(false);
                    }}
                    onBlur={() => setTouched((state) => ({ ...state, avatar: true }))}
                  />
                </label>
                {(avatar || user.avatarUrl || removeAvatar) && (
                  <button
                    type="button"
                    className={styles.removeAvatar}
                    disabled={saving}
                    aria-describedby={removeAvatar ? "avatar-delete-hint" : undefined}
                    onClick={() => {
                      if (!avatar) setRemoveAvatar((value) => !value);

                      setAvatar(null);
                      setTouched((state) => ({ ...state, avatar: false }));
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    <Icon name={removeAvatar ? "back" : "trash"} />
                    {removeAvatar
                      ? "Отменить удаление"
                      : avatar
                        ? "Убрать выбранное фото"
                        : "Удалить аватар"}
                  </button>
                )}
              </div>
              <p id="avatar-hint">JPG или PNG, один файл до 10 МБ</p>
              {removeAvatar && (
                <p id="avatar-delete-hint">Аватар будет удалён после сохранения изменений.</p>
              )}
              {touched.avatar && avatarError && (
                <p id="avatar-error" className={styles.error} role="alert">
                  {avatarError}
                </p>
              )}
            </div>
          </div>
          <FormField
            name="name"
            label="Имя"
            required
            value={values.name}
            maxLength={PROFILE_LIMITS.name}
            error={touched.name ? errors.name : undefined}
            onBlur={() => setTouched((state) => ({ ...state, name: true }))}
            onChange={(name) => setValues((state) => ({ ...state, name }))}
          />
          <FormField
            name="region"
            label="Регион"
            required
            value={values.region}
            maxLength={PROFILE_LIMITS.region}
            disabled={regionsState !== "ready"}
            error={touched.region ? errors.region : undefined}
            onBlur={() => setTouched((state) => ({ ...state, region: true }))}
            onChange={(region) => setValues((state) => ({ ...state, region }))}
            options={[
              {
                value: "",
                label: regionsState === "loading" ? "Загружаем регионы…" : "Выберите регион",
              },
              ...regions.map((region) => ({ value: region, label: region })),
            ]}
          />
          {regionsState === "error" && (
            <button
              type="button"
              className={styles.retry}
              onClick={() => setAttempt((value) => value + 1)}
            >
              Повторить загрузку регионов
            </button>
          )}
          <FormField
            name="contacts"
            label="Контакты"
            multiline
            value={values.contacts}
            maxLength={PROFILE_LIMITS.contacts}
            error={touched.contacts ? errors.contacts : undefined}
            onBlur={() => setTouched((state) => ({ ...state, contacts: true }))}
            onChange={(contacts) => setValues((state) => ({ ...state, contacts }))}
          />
          {values.contacts.trim() && (
            <p className={styles.hint}>
              Контакты видны в публичном профиле. Укажите удобный способ связи. Изменение региона
              профиля не меняет регион опубликованных лотов.
            </p>
          )}
          <div className={styles.actions}>
            <button type="submit" disabled={invalid || !changed || saving} className={styles.save}>
              {saving ? "Сохраняем…" : "Сохранить изменения"}
            </button>
            <button
              type="button"
              className={styles.cancel}
              disabled={!changed || saving}
              onClick={() => {
                setValues(initial);
                setAvatar(null);
                setRemoveAvatar(false);
                setTouched({});
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              Отменить
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
