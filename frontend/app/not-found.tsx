import type { Metadata } from "next";

import { NotFoundPage } from "@/src/_pages/not-found";

export const metadata: Metadata = { title: "Страница не найдена" };

export default function NotFound() {
  return <NotFoundPage />;
}
