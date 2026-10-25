"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { confirmEmail } from "@/src/features/auth";
import { useSession } from "@/src/entities/session";
import { ApiError } from "@/src/shared/api/client";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";
import { SiteFooter, SiteHeader } from "@/src/widgets/site-chrome";
import styles from "./ConfirmEmailPage.module.scss";

const DEFAULT_ERROR = "Возникла ошибка при подтверждении почты. Попробуйте еще раз позже";
const confirmationRequests = new Map<string, Promise<boolean>>();

function confirmEmailOnce(token: string): Promise<boolean> {
  const existingRequest = confirmationRequests.get(token);
  if (existingRequest) return existingRequest;

  const request = confirmEmail(token).finally(() => confirmationRequests.delete(token));
  confirmationRequests.set(token, request);
  return request;
}

export function ConfirmEmailPage({ token }: { token?: string }) {
  const router = useRouter();
  const { user, ready } = useSession();
  const fallbackHref = user ? "/" : "/login";
  const { notify } = useToast();
  useEffect(() => {
    if (!ready) return;
    let active = true;

    async function completeConfirmation() {
      if (!token) {
        if (active) router.replace(fallbackHref);
        return;
      }
      try {
        const confirmed = await confirmEmailOnce(token);
        if (!active) return;
        if (!confirmed) throw new ApiError(DEFAULT_ERROR, 400);
        notify({ kind: "success", title: "Почта успешно подтверждена!" });
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error && error.message ? error.message : DEFAULT_ERROR;
        notify({ kind: "error", title: message });
      } finally {
        if (active) router.replace("/");
      }
    }

    void completeConfirmation();
    return () => {
      active = false;
    };
  }, [fallbackHref, ready, notify, router, token]);

  return (
    <div className="sitePage">
      <SiteHeader />
      <main className={styles.main}>
        <div className={styles.loader} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          <h1>Подождите…</h1>
          <p>Подтверждаем адрес электронной почты.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
