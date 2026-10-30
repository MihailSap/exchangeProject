import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/src/_app";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Меняемся - Главная",
    template: "Меняемся - %s",
  },
  description: "Сервис обмена вещами и услугами по интересам.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ru">
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
