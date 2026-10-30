"use client";

import type { ReactNode } from "react";

import { SessionProvider } from "@/src/entities/session";
import { NotificationsProvider } from "@/src/features/notifications";
import { ThemeProvider } from "@/src/shared/theme";
import { ToastProvider } from "@/src/shared/ui/toast/ToastProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <ToastProvider>
          <NotificationsProvider>{children}</NotificationsProvider>
        </ToastProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
