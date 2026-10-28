import Link from "next/link";
import { requireAdmin } from "@/server/auth/guards";
import { bookingsService } from "@/server/bookings/bookings.service";
import { ExportCsvButton } from "@/components/admin/export-csv-button";
import { RefundBookingButton } from "@/components/admin/refund-booking-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  IndianRupee,
  Search,
  ExternalLink,
  Layers,
  User as UserIcon,
} from "lucide-react";
import type { BookingStatus } from "@prisma/client";

interface AdminBookingsPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
  }>;
}

export const metadata = {
  title: "Bookings Registry | Admin Portal",
};

export default async function AdminBookingsPage({
  searchParams,
}: AdminBookingsPageProps) {
  // Security Rule 1: Every admin route calls requireAdmin() first.
  await requireAdmin();

  const { status: statusParam, search: searchParam } = await searchParams;

  const status =
    statusParam &&
    ["PAID", "PENDING", "FAILED", "REFUNDED", "CANCELLED"].includes(statusParam)
      ? (statusParam as BookingStatus)
      : "ALL";

  const { bookings, total } = await bookingsService.listAdminBookings({
    status,
    search: searchParam,
  });

  const statusTabs = [
    { label: "All Bookings", value: "ALL" },
    { label: "Confirmed (PAID)", value: "PAID" },
    { label: "Pending Hold", value: "PENDING" },
    { label: "Refunded", value: "REFUNDED" },
    { label: "Failed / Cancelled", value: "FAILED" },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-900/10 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
            Devotee Bookings Registry
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time tracking of puja reservations, attendee quantities, payment confirmations, and refunds.
          </p>
        </div>
        <ExportCsvButton />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {statusTabs.map((tab) => {
            const isActive = (statusParam || "ALL") === tab.value;
            return (
              <Link
                key={tab.value}
                href={`/admin/bookings?status=${tab.value}${
                  searchParam ? `&search=${encodeURIComponent(searchParam)}` : ""
                }`}
              >
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    isActive
                      ? "bg-amber-700 text-white shadow-xs"
                      : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-amber-50 border border-stone-200 dark:border-stone-700"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>

        <form method="GET" action="/admin/bookings" className="relative shrink-0 w-full sm:w-72">
          <input type="hidden" name="status" value={statusParam || "ALL"} />
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            type="search"
            name="search"
            placeholder="Search by name, email, or ID..."
            defaultValue={searchParam || ""}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </form>
      </div>

      {/* Bookings Table */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-700 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Booking ID</th>
                <th className="p-3.5">Devotee Information</th>
                <th className="p-3.5">Puja & Muhurtham</th>
                <th className="p-3.5">Seats</th>
                <th className="p-3.5">Amount (INR)</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-stone-400">
                    <Layers className="h-8 w-8 mx-auto mb-2 text-stone-300" />
                    <p className="font-medium">No bookings found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  const amountInRupees = b.amountInPaise / 100;
                  const payment = b.payments.find((p) => p.status === "SUCCESS");

                  return (
                    <tr key={b.id} className="hover:bg-amber-50/10 font-mono text-[11px]">
                      <td className="p-3.5 font-bold text-stone-900 dark:text-stone-100">
                        #{b.id.slice(-8).toUpperCase()}
                      </td>

                      <td className="p-3.5 font-sans">
                        <div className="font-semibold text-stone-900 dark:text-stone-100 text-xs flex items-center gap-1">
                          <UserIcon className="h-3 w-3 text-amber-600" />
                          {b.guestName}
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          {b.guestEmail} • {b.guestPhone}
                        </div>
                      </td>

                      <td className="p-3.5 font-sans">
                        <div className="font-medium text-stone-900 dark:text-stone-100 text-xs">
                          {b.schedule.event.title}
                        </div>
                        <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3 text-amber-600" />
                          {new Date(b.schedule.startsAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      <td className="p-3.5 text-stone-700 dark:text-stone-300 font-sans">
                        {b.quantity} seat(s)
                      </td>

                      <td className="p-3.5 font-bold text-stone-900 dark:text-stone-100">
                        <span className="flex items-center gap-0.5">
                          <IndianRupee className="h-3 w-3 text-amber-700" />
                          {amountInRupees.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        {payment?.razorpayPaymentId && (
                          <div className="text-[10px] text-stone-400 font-mono">
                            {payment.razorpayPaymentId.slice(-8)}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 font-sans">
                        <Badge
                          variant={
                            b.status === "PAID"
                              ? "success"
                              : b.status === "PENDING"
                                ? "warning"
                                : "destructive"
                          }
                        >
                          {b.status}
                        </Badge>
                      </td>

                      <td className="p-3.5 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/booking/${b.id}/confirmation?token=${b.guestToken}`}
                            target="_blank"
                          >
                            <Button variant="outline" size="xs" className="h-6 text-[10px]">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Receipt
                            </Button>
                          </Link>

                          {b.status === "PAID" && (
                            <RefundBookingButton
                              bookingId={b.id}
                              guestName={b.guestName}
                              amountInRupees={amountInRupees}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 text-xs text-stone-500 flex items-center justify-between">
          <span>Total Recorded Bookings: {total}</span>
          <span className="text-[11px] text-stone-400">
            CSV exports and refunds audited per Security Rule 9
          </span>
        </div>
      </div>
    </div>
  );
}
