import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfilePage } from "@/src/_pages/profile";

export const metadata: Metadata = { title: "Личный кабинет" };
export default function MyProfileRoute() {
  return <Suspense fallback={<main role="status">Загружаем личный кабинет…</main>}><ProfilePage /></Suspense>;
}
