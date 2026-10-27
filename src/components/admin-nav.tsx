"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  CalendarDays,
  TicketCheck,
  CreditCard,
  Users,
  ScrollText,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface AdminNavProps {
  adminEmail: string;
  adminName: string;
}

export function AdminNav({ adminEmail, adminName }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/admin/events", label: "Events & Pujas", icon: CalendarDays },
    { href: "/admin/bookings", label: "Devotee Bookings", icon: TicketCheck },
    { href: "/admin/payments", label: "Payments & Invoices", icon: CreditCard },
    { href: "/admin/staff", label: "Staff & Invites", icon: Users },
    { href: "/admin/audit-log", label: "Security Audit Log", icon: ScrollText },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside className="w-64 border-r border-amber-900/10 bg-amber-50/50 dark:bg-stone-900/50 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand header */}
        <div className="p-6 border-b border-amber-900/10">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-700 text-white font-serif font-bold">
              ॐ
            </div>
            <div>
              <div className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                Temple Administration
              </div>
              <div className="flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                <ShieldCheck className="h-3 w-3" />
                Staff Portal
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-stone-700 hover:bg-amber-100/60 dark:text-stone-300 dark:hover:bg-stone-800"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-amber-700 dark:text-amber-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Account Info */}
      <div className="p-4 border-t border-amber-900/10 space-y-3">
        <div className="px-3 py-2 rounded-lg bg-amber-100/50 dark:bg-stone-800/50">
          <div className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
            {adminName}
          </div>
          <div className="text-[11px] text-stone-500 truncate" title={adminEmail}>
            {adminEmail}
          </div>
          <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-200/60 text-amber-900">
            ADMIN STAFF
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs text-stone-600 hover:text-amber-800 transition-colors"
          >
            <span>View Public Website</span>
            <ExternalLink className="h-3 w-3" />
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}
