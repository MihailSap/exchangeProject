"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { Icon } from "@/src/shared/ui/icon";
import { Modal } from "@/src/shared/ui/modal";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";
import { deleteAdminCategory, getAdminCategories } from "../api/admin-api";
import type { AdminCategory } from "../model/contracts";
import { categoryRows } from "../model/category-tree";
import { CategoryDialog } from "./CategoryDialog";
import styles from "./Administration.module.scss";

type Props = { initial: AdminCategory[]; onDenied: (error: unknown) => boolean };
type CategoryStyle = CSSProperties & { "--category-depth": number };
const categoryStyle = (depth: number): CategoryStyle => ({ "--category-depth": depth });
export function AdminCategories({ initial, onDenied }: Props) {
  const [categories, setCategories] = useState(initial);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ category: AdminCategory | null } | null>(null);
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();
  const visible = categoryRows(categories).filter(({ category }) => `${category.name} ${category.slug}`.toLocaleLowerCase("ru").includes(query.trim().toLocaleLowerCase("ru")));
  async function reload() {
    setBusy(true);
    setError(null);
    try { setCategories(await getAdminCategories()); }
    catch (error) {
      if (!onDenied(error)) setError(error instanceof Error ? error.message : "Не удалось обновить категории");
    } finally { setBusy(false); }
  }
  async function remove() {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      await deleteAdminCategory(deleting.id);
      setDeleting(null);
      notify({ kind: "success", title: "Категория удалена" });
      await reload();
    } catch (error) {
      if (!onDenied(error)) notify({ kind: "error", title: error instanceof Error ? error.message : "Не удалось удалить категорию" });
    } finally { setBusy(false); }
  }
  return <section className={styles.panel} aria-labelledby="admin-categories-title" aria-busy={busy}>
    <div className={styles.heading}><div><h2 id="admin-categories-title">Категории</h2><p>Справочник товаров и услуг для обмена</p></div><button type="button" className={styles.primary} disabled={busy || Boolean(error)} onClick={() => setEditor({ category: null })}><Icon name="plus" />Добавить</button></div>
    <div className={styles.search}><label htmlFor="admin-category-search" className={styles.srOnly}>Поиск категорий</label><Icon name="search" /><input id="admin-category-search" type="search" maxLength={120} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Название или адрес категории" /><button type="button" className={styles.secondary} disabled={busy} onClick={() => void reload()}>Обновить</button></div>
    {error ? <div className={styles.state} role="status"><p>{error}</p><button type="button" className={styles.secondary} disabled={busy} onClick={() => void reload()}>Повторить загрузку</button></div> : visible.length === 0 ? <p className={styles.state}>{categories.length ? "Категории не найдены" : "Категорий пока нет. Создайте первую категорию."}</p> : <div className={styles.categoryList}>{visible.map(({ category, depth }) => <article key={category.id} style={categoryStyle(depth)} className={`${styles.categoryCard}${depth > 0 ? ` ${styles.subcategoryCard}` : ""}`}>
      <div><h3>{category.name}</h3><span>/{category.slug}</span><small>{category.parentId ? `В разделе «${categories.find((item) => item.id === category.parentId)?.name ?? category.parentId}»` : "Основная категория"}</small></div>
      <div className={styles.rowActions}><button type="button" className={styles.secondary} disabled={busy} onClick={() => setEditor({ category })}>Редактировать</button><button type="button" className={styles.iconDanger} aria-label={`Удалить категорию ${category.name}`} disabled={busy} onClick={() => setDeleting(category)}><Icon name="trash" /></button></div>
    </article>)}</div>}
    {editor && <CategoryDialog category={editor.category} categories={categories} onClose={() => setEditor(null)} onDenied={onDenied} onSaved={() => { setEditor(null); void reload(); }} />}
    {deleting && <Modal title="Удалить категорию?" onClose={() => setDeleting(null)} busy={busy}><div className={styles.dialogForm}><p>Категория «{deleting.name}» будет удалена. Действие нельзя отменить.</p>{categories.some((item) => item.parentId === deleting.id) && <p className={styles.warning}>В категории есть подразделы. Сначала перенесите или удалите их.</p>}<div className={styles.actions}><button type="button" className={styles.secondary} disabled={busy} onClick={() => setDeleting(null)}>Отмена</button><button type="button" className={styles.danger} disabled={busy || categories.some((item) => item.parentId === deleting.id)} onClick={() => void remove()}>{busy ? "Удаляем…" : "Удалить"}</button></div></div></Modal>}
  </section>;
}
