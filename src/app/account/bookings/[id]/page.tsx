import { requireUser } from "@/server/auth/guards";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, Receipt, User, Mail, Phone } from "lucide-react";
import { PrintReceiptButton } from "@/components/print-receipt-button";

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DevoteeBookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const { id } = await params;

  // Security Rule 2: Always filter by session user id.
  const user = await requireUser();

  const booking = await prisma.booking.findFirst({
    where: {
      id,
      userId: user.id, // Enforce strict ownership check
    },
    include: {
      schedule: {
        include: {
          event: true,
        },
      },
      payments: true,
    },
  });

  if (!booking) {
    notFound();
  }

  const startsAt = new Date(booking.schedule.startsAt);
  const endsAt = new Date(booking.schedule.endsAt);
  const payment = booking.payments[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-amber-900/10 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/account/bookings">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-serif text-xl font-bold text-stone-900">
              Booking #{booking.id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-xs text-stone-500">
              Booked on {new Date(booking.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PrintReceiptButton />
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Puja & Schedule Details */}
        <div className="rounded-xl border border-amber-900/10 p-5 bg-stone-50/50 space-y-3">
          <h2 className="font-serif font-bold text-sm text-amber-900 uppercase tracking-wider">
            Puja Seva Details
          </h2>
          <div className="space-y-2 text-sm">
            <div className="font-bold text-base text-stone-900">
              {booking.schedule.event.title}
            </div>
            <div className="flex items-center gap-2 text-stone-600 text-xs">
              <Calendar className="h-3.5 w-3.5 text-amber-700" />
              <span>
                {startsAt.toLocaleDateString("en-IN", { dateStyle: "full" })} (
                {startsAt.toLocaleTimeString("en-IN", { timeStyle: "short" })} –{" "}
                {endsAt.toLocaleTimeString("en-IN", { timeStyle: "short" })})
              </span>
            </div>
            <div className="flex items-center gap-2 text-stone-600 text-xs">
              <MapPin className="h-3.5 w-3.5 text-amber-700" />
              <span>{booking.schedule.event.venue}</span>
            </div>
          </div>
        </div>

        {/* Devotee Sankalpam Details */}
        <div className="rounded-xl border border-amber-900/10 p-5 bg-stone-50/50 space-y-3">
          <h2 className="font-serif font-bold text-sm text-amber-900 uppercase tracking-wider">
            Devotee Details
          </h2>
          <div className="space-y-2 text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-amber-700" />
              <span className="font-medium text-stone-800">{booking.guestName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-amber-700" />
              <span>{booking.guestEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-amber-700" />
              <span>{booking.guestPhone}</span>
            </div>
            <div className="pt-1 text-stone-800 font-medium">
              Registered Seats: {booking.quantity} devotee(s)
            </div>
          </div>
        </div>
      </div>

      {/* Payment & Receipt Summary */}
      <div className="rounded-xl border border-amber-900/10 p-5 bg-white space-y-3">
        <h2 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-amber-700" />
          <span>Payment Summary</span>
        </h2>
        <div className="divide-y divide-stone-100 text-sm">
          <div className="py-2 flex justify-between text-stone-600 text-xs">
            <span>Puja Contribution ({booking.quantity} devotee/seat)</span>
            <span className="font-mono font-medium">₹{(booking.amountInPaise / 100).toFixed(2)}</span>
          </div>
          <div className="py-2 flex justify-between font-bold text-stone-900">
            <span>Total Amount Paid</span>
            <span className="font-mono text-amber-800">₹{(booking.amountInPaise / 100).toFixed(2)}</span>
          </div>
        </div>
        {payment && (
          <div className="pt-2 text-[11px] font-mono text-stone-500 space-y-0.5">
            <div>Razorpay Order ID: {payment.razorpayOrderId}</div>
            {payment.razorpayPaymentId && (
              <div>Razorpay Payment ID: {payment.razorpayPaymentId}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
