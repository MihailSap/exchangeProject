"use client";

import { useState } from "react";
import type { AdminCategory } from "../model/contracts";
import { AdminUsers } from "./AdminUsers";
import { AdminCategories } from "./AdminCategories";
import { Icon } from "@/src/shared/ui/icon";
import styles from "./Administration.module.scss";

type Props = { userId: number; categories: AdminCategory[]; onDenied: (error: unknown) => boolean };
export function AdminWorkspace({ userId, categories, onDenied }: Props) {
  const [tab, setTab] = useState<"users" | "categories">("users");
  return <div className={styles.workspace}>
    <nav className={styles.tabs} aria-label="Разделы администрирования">
      <button type="button" aria-current={tab === "users" ? "page" : undefined} onClick={() => setTab("users")}><Icon name="user" />Пользователи</button>
      <button type="button" aria-current={tab === "categories" ? "page" : undefined} onClick={() => setTab("categories")}><Icon name="lots" />Категории</button>
    </nav>
    <div hidden={tab !== "users"}><AdminUsers userId={userId} active={tab === "users"} onDenied={onDenied} /></div>
    <div hidden={tab !== "categories"}><AdminCategories initial={categories} onDenied={onDenied} /></div>
  </div>;
}
