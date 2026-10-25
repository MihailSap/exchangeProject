import type { Metadata } from "next";
import { AdminPage } from "@/src/_pages/admin";

export const metadata: Metadata = { title: "Админ-панель", robots: { index: false, follow: false } };
export default function Page() { return <AdminPage />; }
