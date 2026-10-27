import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  TicketCheck,
  CreditCard,
  Users,
  ScrollText,
  Plus,
  ArrowRight,
} from "lucide-react";

export default async function AdminDashboardPage() {
  // Security Rule 1: Every admin page calls requireAdmin() first.
  const admin = await requireAdmin();

  // Metrics overview
  const [totalEvents, totalBookings, totalPayments, totalStaff, recentAuditLogs] =
    await Promise.all([
      prisma.event.count(),
      prisma.booking.count(),
      prisma.payment.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: true },
      }),
    ]);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-900/10 pb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 dark:text-stone-100">
            Temple Management Dashboard
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Welcome back, {admin.name}. Secure admin session active.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/events/new">
            <Button size="sm" className="bg-amber-700 hover:bg-amber-800 text-white">
              <Plus className="mr-1.5 h-4 w-4" />
              Create Event
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-xl border border-amber-900/10 bg-white dark:bg-stone-900 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-stone-500">Total Events</div>
            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
              {totalEvents}
            </div>
            <Link
              href="/admin/events"
              className="text-[11px] text-amber-700 hover:underline inline-flex items-center gap-0.5 mt-2"
            >
              <span>Manage Events</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
            <CalendarDays className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl border border-amber-900/10 bg-white dark:bg-stone-900 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-stone-500">Devotee Bookings</div>
            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
              {totalBookings}
            </div>
            <Link
              href="/admin/bookings"
              className="text-[11px] text-amber-700 hover:underline inline-flex items-center gap-0.5 mt-2"
            >
              <span>View Bookings</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <TicketCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl border border-amber-900/10 bg-white dark:bg-stone-900 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-stone-500">Payments Recorded</div>
            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
              {totalPayments}
            </div>
            <Link
              href="/admin/payments"
              className="text-[11px] text-amber-700 hover:underline inline-flex items-center gap-0.5 mt-2"
            >
              <span>Audit Payments</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl border border-amber-900/10 bg-white dark:bg-stone-900 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-stone-500">Active Staff</div>
            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
              {totalStaff}
            </div>
            <Link
              href="/admin/staff"
              className="text-[11px] text-amber-700 hover:underline inline-flex items-center gap-0.5 mt-2"
            >
              <span>Manage Staff</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-10 w-10 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Recent Security Audit Log */}
      <div className="rounded-xl border border-amber-900/10 bg-white dark:bg-stone-900 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-amber-700" />
            <h2 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              Recent Security Audit Activity
            </h2>
          </div>
          <Link
            href="/admin/audit-log"
            className="text-xs font-semibold text-amber-700 hover:text-amber-800"
          >
            Full Audit Trail →
          </Link>
        </div>

        {recentAuditLogs.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-400">
            No audit log entries recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-stone-100 text-xs">
            {recentAuditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono font-semibold text-stone-800 dark:text-stone-200">
                    {log.action}
                  </span>{" "}
                  on{" "}
                  <span className="text-amber-700 font-medium">{log.entity}</span>
                  {log.user && (
                    <span className="text-stone-400 ml-2">by {log.user.email}</span>
                  )}
                </div>
                <div className="text-stone-400 font-mono text-[11px]">
                  {new Date(log.createdAt).toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
