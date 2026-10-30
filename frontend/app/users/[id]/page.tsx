import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ProfilePage } from "@/src/_pages/profile";

type Props = { params: Promise<{ id: string }> };
export const metadata = { title: "Профиль пользователя" };
export default async function PublicProfileRoute({ params }: Props) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) redirect("/");
  return <Suspense fallback={<main role="status">Загружаем профиль…</main>}><ProfilePage key={id} userId={Number(id)} /></Suspense>;
}
