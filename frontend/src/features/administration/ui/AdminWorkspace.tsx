"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AdminCategories } from "./AdminCategories";
import styles from "./Administration.module.scss";
import { AdminUsers } from "./AdminUsers";

import type { AdminCategory } from "../model/contracts";

import { Icon } from "@/src/shared/ui/icon";

type Props = { userId: number; categories: AdminCategory[]; onDenied: (error: unknown) => boolean };

export function AdminWorkspace({ userId, categories, onDenied }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();
  const tab = search.get("tab") === "categories" ? "categories" : "users";

  function setTab(next: "users" | "categories") {
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
      </nav>
      <div hidden={tab !== "users"}>
        <AdminUsers userId={userId} active={tab === "users"} onDenied={onDenied} />
      </div>
      <div hidden={tab !== "categories"}>
        <AdminCategories initial={categories} onDenied={onDenied} />
      </div>
    </div>
  );
}
