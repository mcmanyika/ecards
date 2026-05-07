import { verifyAdminSession } from "@/lib/admin-firebase-session";
import { redirect } from "next/navigation";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await verifyAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return children;
}
