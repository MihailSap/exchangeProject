import type { Metadata } from "next";

import { AuthPageShell } from "@/src/_pages/auth";

export const metadata: Metadata = { title: "Сброс пароля" };

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  return <AuthPageShell mode="reset" token={token} />;
}
