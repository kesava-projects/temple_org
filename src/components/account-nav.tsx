"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Ticket, LogOut, ArrowLeft } from "lucide-react";

interface AccountNavProps {
  userEmail: string;
  userName: string;
}

export function AccountNav({ userEmail, userName }: AccountNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-amber-900/10 bg-amber-50/40 p-4 shrink-0 flex flex-col justify-between">
      <div className="space-y-4">
        {/* User Card */}
        <div className="p-3 bg-white dark:bg-stone-800 rounded-lg border border-amber-900/10 shadow-xs">
          <div className="text-xs uppercase tracking-wider text-amber-800 font-semibold">
            Devotee Account
          </div>
          <div className="font-medium text-sm text-stone-900 dark:text-stone-100 truncate mt-1">
            {userName}
          </div>
          <div className="text-xs text-stone-500 truncate" title={userEmail}>
            {userEmail}
          </div>
        </div>

        {/* Links */}
        <nav className="space-y-1">
          <Link
            href="/account/bookings"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith("/account/bookings")
                ? "bg-amber-600 text-white"
                : "text-stone-700 hover:bg-amber-100/50"
            }`}
          >
            <Ticket className="h-4 w-4" />
            My Puja Bookings
          </Link>
        </nav>
      </div>

      <div className="pt-4 border-t border-amber-900/10 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-amber-800 px-3 py-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Temple Home
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
