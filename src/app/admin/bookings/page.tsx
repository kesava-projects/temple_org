import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default async function AdminBookingsPage() {
  await requireAdmin();

  const bookings = await prisma.booking.findMany({
    include: {
      schedule: {
        include: {
          event: true,
        },
      },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-amber-900/10 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
            Devotee Bookings Registry
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time tracking of puja reservations, attendee quantities, and payment confirmations.
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-xs">
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export CSV (Phase 4)
        </Button>
      </div>

      <div className="rounded-xl border border-amber-900/10 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-amber-50/50 border-b border-amber-900/10 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-4">Booking ID</th>
              <th className="p-4">Devotee Details</th>
              <th className="p-4">Puja / Event</th>
              <th className="p-4">Seats</th>
              <th className="p-4">Dakshina</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-stone-400">
                  No bookings recorded yet.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id} className="hover:bg-amber-50/20 transition-colors">
                  <td className="p-4 font-mono font-bold text-amber-900">
                    #{b.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-stone-900">{b.guestName}</div>
                    <div className="text-[11px] text-stone-500">{b.guestEmail}</div>
                    <div className="text-[11px] text-stone-500">{b.guestPhone}</div>
                  </td>
                  <td className="p-4 font-medium text-stone-800">
                    {b.schedule.event.title}
                  </td>
                  <td className="p-4 font-mono">{b.quantity}</td>
                  <td className="p-4 font-mono font-semibold text-amber-800">
                    ₹{(b.amountInPaise / 100).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : b.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
