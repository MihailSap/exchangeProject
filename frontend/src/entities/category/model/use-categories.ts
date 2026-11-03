"use client";

import { useEffect, useState } from "react";

import { clearCategoryCache, getActiveCategories } from "../api/category-api";

import type { Category } from "./category";

import { useToast } from "@/src/shared/ui/toast/ToastProvider";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; categories: Category[] };

export function useCategories() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const { notify } = useToast();
  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    getActiveCategories()
      .then((categories) => {
        if (active) setState({ status: "ready", categories });
      })
      .catch((error: unknown) => {
        if (!active) return;

        const message = error instanceof Error ? error.message : "Не удалось загрузить категории";
        setState({ status: "error", message });
        notify({ kind: "error", title: message });
      });

    return () => {
      active = false;
    };
  }, [attempt, notify]);

  return {
    state,
    retry: () => {
      clearCategoryCache();
      setAttempt((value) => value + 1);
    },
  };
}
