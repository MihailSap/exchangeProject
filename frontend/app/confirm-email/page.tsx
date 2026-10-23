import type { Metadata } from "next";
import { ConfirmEmailPage } from "@/src/_pages/auth";

export const metadata: Metadata = { title: "Подтверждение почты" };

type ConfirmEmailRouteProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ConfirmEmailRoute({ searchParams }: ConfirmEmailRouteProps) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  return <ConfirmEmailPage token={token} />;
}
