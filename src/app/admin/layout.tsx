import { requireAdmin } from "@/server/auth/guards";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Security Rule 1: Every admin route calls requireAdmin() on the server first.
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen flex bg-stone-100 dark:bg-stone-950">
      <AdminNav adminEmail={admin.email} adminName={admin.name} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-amber-900/10 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xs flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-100/60 px-2.5 py-1 rounded-full">
              Production Admin Guard Active
            </span>
          </div>
          <div className="text-xs text-stone-500">
            Signed in as <span className="font-medium text-stone-800 dark:text-stone-200">{admin.email}</span>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
