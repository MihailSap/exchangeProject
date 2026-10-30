import type { Metadata } from "next";

import { AuthPageShell } from "@/src/_pages/auth";

export const metadata: Metadata = { title: "Восстановление пароля" };

export default function ForgotPasswordPage() {
  return <AuthPageShell mode="forgot" />;
}
