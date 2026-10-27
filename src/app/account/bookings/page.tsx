import { requireUser } from "@/server/auth/guards";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Ticket, Calendar, ArrowRight } from "lucide-react";

export default async function DevoteeBookingsPage() {
  // Security Rule 2: Users may only read their own bookings; always filter by session user id.
  const user = await requireUser();

  const bookings = await prisma.booking.findMany({
    where: {
      userId: user.id,
    },
    include: {
      schedule: {
        include: {
          event: true,
        },
      },
      payments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-amber-900/10 pb-4">
        <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
          My Puja Seva Bookings
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Review your upcoming sankalpam slots, booking tokens, and payment receipts.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amber-900/20 bg-amber-50/40 p-10 text-center space-y-3">
          <Ticket className="mx-auto h-10 w-10 text-amber-700/60" />
          <h3 className="font-serif text-base font-medium text-stone-800">
            No Puja Bookings Found
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            You have not booked any pujas yet. Browse our upcoming temple festival schedule to participate.
          </p>
          <div className="pt-2">
            <Link href="/events">
              <Button size="sm" className="bg-amber-700 hover:bg-amber-800 text-white">
                Explore Available Pujas
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const startsAt = new Date(booking.schedule.startsAt);
            return (
              <div
                key={booking.id}
                className="rounded-xl border border-amber-900/10 p-5 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-base text-stone-900">
                      {booking.schedule.event.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        booking.status === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : booking.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-amber-700" />
                      <span>
                        {startsAt.toLocaleDateString("en-IN", {
                          dateStyle: "medium",
                        })}{" "}
                        at{" "}
                        {startsAt.toLocaleTimeString("en-IN", {
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <div>Qty: {booking.quantity} devotee(s)</div>
                    <div className="font-semibold text-stone-800">
                      Dakshina: ₹{(booking.amountInPaise / 100).toFixed(0)}
                    </div>
                  </div>
                </div>

                <div>
                  <Link href={`/account/bookings/${booking.id}`}>
                    <Button variant="outline" size="sm" className="border-amber-900/20 text-xs">
                      View Receipt & Details
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
