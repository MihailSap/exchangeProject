import { redirect } from "next/navigation";

import { LotEditorPage } from "@/src/_pages/lot";

export const metadata = { title: "Редактирование лота" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) redirect("/");

  return <LotEditorPage id={Number(id)} />;
}
