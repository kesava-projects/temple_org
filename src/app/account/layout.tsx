import { requireUser } from "@/server/auth/guards";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AccountNav } from "@/components/account-nav";

export default async function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-amber-50/20">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="bg-white dark:bg-stone-900 border border-amber-900/10 rounded-xl shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[500px]">
          <AccountNav userEmail={user.email} userName={user.name} />
          <main className="flex-1 p-6 md:p-8">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
