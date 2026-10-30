import { redirect } from "next/navigation";

import type { Metadata } from "next";

import { LotPage } from "@/src/_pages/lot";
import { getCatalogLot } from "@/src/entities/lot";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  return { title: getCatalogLot(id)?.title ?? "Информация о лоте" };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const localLot = getCatalogLot(id);
  if (localLot) return <LotPage id={localLot.id} localLot={localLot} />;

  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) redirect("/");

  return <LotPage id={Number(id)} />;
}
