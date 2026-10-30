"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AuthMode } from "@/src/features/auth";
import { AuthFlow } from "@/src/features/auth";
import { useSession } from "@/src/entities/session";
import { SiteFooter, SiteHeader } from "@/src/widgets/site-chrome";

export function AuthPageShell({ mode, token }: { mode: AuthMode; token?: string }) {
  const { user, ready } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (user) {
      router.replace("/");
    } else if (mode === "reset" && !token) {
      router.replace("/login");
    }
  }, [ready, user, mode, token, router]);

  if (!ready || user || (mode === "reset" && !token)) return null;

  return (
    <div className="sitePage">
      <SiteHeader />
      <AuthFlow mode={mode} token={token} />
      <SiteFooter />
    </div>
  );
}