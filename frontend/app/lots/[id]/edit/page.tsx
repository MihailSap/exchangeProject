import { redirect } from "next/navigation";

import { LotEditorPage } from "@/src/_pages/lot";

export const metadata = { title: "Редактирование лота" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fixtureId = id.startsWith("demo-") ? id.slice(5) : null;
  if (fixtureId && /^\d+$/.test(fixtureId) && Number.isSafeInteger(Number(fixtureId)) && Number(fixtureId) > 0)
    return <LotEditorPage id={Number(fixtureId)} fixture />;

  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) redirect("/");

  return <LotEditorPage id={Number(id)} />;
}
