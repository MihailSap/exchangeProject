import type { Metadata } from "next";

import { CatalogPage } from "@/src/_pages/catalog";

export const metadata: Metadata = { title: "Рекомендации" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogPage recommendations searchParams={await searchParams} />;
}
