import type { Metadata } from "next";
import { AuthPageShell } from "@/src/_pages/auth";

export const metadata: Metadata = { title: "Регистрация" };

export default function RegisterPage() {
  return <AuthPageShell mode="register" />;
}
