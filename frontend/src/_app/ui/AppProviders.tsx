"use client";

import type { ReactNode } from "react";
import { NotificationsProvider } from "@/src/features/notifications";
import { SessionProvider } from "@/src/entities/session";
import { ToastProvider } from "@/src/shared/ui/toast/ToastProvider";
import { ThemeProvider } from "@/src/shared/theme";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <ToastProvider><NotificationsProvider>{children}</NotificationsProvider></ToastProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
