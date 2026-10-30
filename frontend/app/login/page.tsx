import type { Metadata } from "next";
import { AuthPageShell } from "@/src/_pages/auth";

export const metadata: Metadata = { title: "Вход" };

export default function LoginPage() {
  return <AuthPageShell mode="login" />;
}
