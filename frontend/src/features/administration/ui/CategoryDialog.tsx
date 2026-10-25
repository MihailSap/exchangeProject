"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "@/src/shared/ui/modal";
import { FormField } from "@/src/shared/ui/form-field";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";
import { allowedParents, categoryErrors } from "../model/contracts";
import type { AdminCategory } from "../model/contracts";
import { saveAdminCategory } from "../api/admin-api";
import styles from "./Administration.module.scss";

type Props = { category: AdminCategory | null; categories: AdminCategory[]; onClose: () => void; onSaved: () => void; onDenied: (error: unknown) => boolean };
export function CategoryDialog({ category, categories, onClose, onSaved, onDenied }: Props) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [parent, setParent] = useState(category?.parentId?.toString() ?? "");
  const [visibility, setVisibility] = useState(category ? "" : "true");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  const errors = categoryErrors(name, slug, visibility);
  const parents = allowedParents(categories, category?.id);
  const valid = Object.values(errors).every((error) => !error) && (!parent || parents.some((item) => item.id === Number(parent)));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ name: true, slug: true, visibility: true });
    if (!valid || busy) return;
    setBusy(true);
    try {
      await saveAdminCategory(category?.id, { name: name.trim(), slug, parentId: parent ? Number(parent) : null, isActive: visibility === "true" });
      notify({ kind: "success", title: category ? "Категория обновлена" : "Категория создана" });
      onSaved();
    } catch (error) {
      if (!onDenied(error)) notify({ kind: "error", title: error instanceof Error ? error.message : "Не удалось сохранить категорию" });
    } finally { setBusy(false); }
  }
  return <Modal title={category ? "Редактировать категорию" : "Новая категория"} onClose={onClose} busy={busy}><form className={styles.dialogForm} onSubmit={submit}>
    <FormField label="Название" name="category-name" value={name} onChange={setName} onBlur={() => setTouched((value) => ({ ...value, name: true }))} maxLength={120} error={touched.name ? errors.name : undefined} required disabled={busy} />
    <FormField label="Адрес категории (slug)" name="category-slug" value={slug} onChange={setSlug} onBlur={() => setTouched((value) => ({ ...value, slug: true }))} maxLength={120} error={touched.slug ? errors.slug : undefined} required disabled={busy} />
    <FormField label="Родительская категория" name="category-parent" value={parent} onChange={setParent} onBlur={() => undefined} maxLength={20} disabled={busy}><option value="">Без родителя</option>{parents.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</FormField>
    <FormField label="Доступность после сохранения" name="category-visibility" value={visibility} onChange={setVisibility} onBlur={() => setTouched((value) => ({ ...value, visibility: true }))} maxLength={5} error={touched.visibility ? errors.visibility : undefined} required disabled={busy}><option value="" disabled>Выберите доступность</option><option value="true">Категория включена</option><option value="false">Категория скрыта</option></FormField>
    <div className={styles.actions}><button className={styles.secondary} type="button" disabled={busy} onClick={onClose}>Отмена</button><button className={styles.primary} type="submit" disabled={busy || !valid}>{busy ? "Сохраняем…" : "Сохранить"}</button></div>
  </form></Modal>;
}
