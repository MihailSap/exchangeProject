"use client";

import { useEffect, useState } from "react";

import { clearCategoryCache, getActiveCategories } from "../api/category-api";

import type { Category } from "./category";

import { useToast } from "@/src/shared/ui/toast/ToastProvider";

type State =
  | { status: "loading"; key: string }
  | { status: "error"; key: string; message: string }
  | { status: "ready"; key: string; categories: Category[] };

export function useCategories(identity: string, ready: boolean) {
  const [state, setState] = useState<State>({ status: "loading", key: identity });
  const [attempt, setAttempt] = useState(0);
  const { notify } = useToast();
  useEffect(() => {
    if (!ready) return;

    let active = true;
    setState({ status: "loading", key: identity });
    getActiveCategories()
      .then((categories) => {
        if (active) setState({ status: "ready", key: identity, categories });
      })
      .catch((error: unknown) => {
        if (!active) return;

        const message = error instanceof Error ? error.message : "Не удалось загрузить категории";
        setState({ status: "error", key: identity, message });
        notify({ kind: "error", title: message });
      });

    return () => {
      active = false;
    };
  }, [identity, ready, attempt, notify]);

  return {
    state: state.key === identity && ready ? state : { status: "loading" as const, key: identity },
    retry: () => {
      clearCategoryCache();
      setAttempt((value) => value + 1);
    },
  };
}
