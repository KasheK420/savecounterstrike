import { redirect } from "next/navigation";
import { requireModerator, getRole } from "@/lib/admin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireModerator();
  if (!session) redirect("/");

  const role = getRole(session);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar role={role} />
      <div className="flex-1 p-6 lg:p-8 overflow-auto">{children}</div>
    </div>
  );
}
