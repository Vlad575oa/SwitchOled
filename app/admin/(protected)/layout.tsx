import { AdminSidebar } from "../AdminSidebar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  const session = await verifyAdminSession(token);
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#f5f5f5]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
