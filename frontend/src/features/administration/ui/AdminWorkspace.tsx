"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AdminCategories } from "./AdminCategories";
import styles from "./Administration.module.scss";
import { AdminModeration } from "./AdminModeration";
import { AdminUsers } from "./AdminUsers";

import type { AdminCategory } from "../model/contracts";

import { Icon } from "@/src/shared/ui/icon";

type Props = { userId: number; categories: AdminCategory[]; onDenied: (error: unknown) => boolean };

export function AdminWorkspace({ userId, categories, onDenied }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();
  const requestedTab = search.get("tab");
  const tab = requestedTab === "categories" || requestedTab === "moderation" ? requestedTab : "users";

  function setTab(next: "users" | "categories" | "moderation") {
    const params = new URLSearchParams(search.toString());
    params.set("tab", next);
    router.replace(`${pathname}?${params}`, { scroll: false });
  }

  return (
    <div className={styles.workspace}>
      <nav className={styles.tabs} aria-label="Разделы администрирования">
        <button
          type="button"
          aria-current={tab === "users" ? "page" : undefined}
          onClick={() => setTab("users")}
        >
          <Icon name="user" />
          Пользователи
        </button>
        <button
          type="button"
          aria-current={tab === "categories" ? "page" : undefined}
          onClick={() => setTab("categories")}
        >
          <Icon name="lots" />
          Категории
        </button>
        <button type="button" aria-current={tab === "moderation" ? "page" : undefined} onClick={() => setTab("moderation")}>
          <Icon name="check" />
          Модерация
        </button>
      </nav>
      <div hidden={tab !== "users"}>
        <AdminUsers userId={userId} active={tab === "users"} onDenied={onDenied} />
      </div>
      <div hidden={tab !== "moderation"}>
        <AdminModeration active={tab === "moderation"} onDenied={onDenied} />
      </div>
      <div hidden={tab !== "categories"}>
        <AdminCategories initial={categories} onDenied={onDenied} />
      </div>
    </div>
  );
}
