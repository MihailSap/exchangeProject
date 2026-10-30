import type { Metadata } from "next";

import { CatalogPage } from "@/src/_pages/catalog";

export const metadata: Metadata = { title: "Каталог" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogPage searchParams={await searchParams} />;
}
