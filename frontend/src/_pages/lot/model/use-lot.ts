"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLot } from "@/src/entities/lot";
import type { Lot } from "@/src/entities/lot";
import { useSession, updateSessionProfile } from "@/src/entities/session";
import { ApiError } from "@/src/shared/api/client";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";

export function useLot(id?: number, edit = false) {
  const { user, ready } = useSession();
  const userId = user?.id;
  const router = useRouter();
  const { notify } = useToast();
  const [lot, setLot] = useState<Lot | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!ready) return;
    if (!userId) { router.replace("/login"); return; }
    let active = true;
    setLoaded(false); setError("");
    Promise.all([updateSessionProfile(), id ? getLot(id) : Promise.resolve(null)]).then(([profile, next]) => {
      if (!active) return;
      if ((edit || !id) && (profile.status !== "ACTIVE" || !profile.emailConfirmed || next && (next.owner.id !== profile.id || !["DRAFT", "ACTIVE", "REJECTED"].includes(next.status)))) { router.replace("/"); return; }
      if (next?.status === "DELETED" || next && ["DRAFT", "MODERATION", "REJECTED"].includes(next.status) && next.owner.id !== profile.id) { router.replace("/"); return; }
      setLot(next); setLoaded(true);
    }).catch((error: unknown) => {
      if (!active) return;
      if (error instanceof ApiError && [401, 403, 404].includes(error.status)) router.replace(error.status === 401 ? "/login" : "/");
      else setError(error instanceof Error ? error.message : "Не удалось загрузить страницу");
      notify({ kind: "error", title: error instanceof Error ? error.message : "Не удалось загрузить страницу" });
    });
    return () => { active = false; };
  }, [ready, userId, id, edit, router, notify, attempt]);
  return { lot, setLot, loaded, error, retry: () => setAttempt((current) => current + 1), user, router };
}
