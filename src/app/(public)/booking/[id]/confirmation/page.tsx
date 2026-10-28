import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/guards";
import { PrintReceiptButton } from "@/components/print-receipt-button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  IndianRupee,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";

interface ConfirmationPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export const metadata: Metadata = {
  title: "Puja Booking Confirmation & Receipt | Sri Venkateswara Temple",
  robots: "noindex, nofollow",
};

export default async function BookingConfirmationPage({
  params,
  searchParams,
}: ConfirmationPageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  const currentUser = await getCurrentUser();

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      schedule: {
        include: { event: true },
      },
      payments: true,
    },
  });

  if (!booking) {
    notFound();
  }

  // Security Rule 2: Access requires user session match OR unguessable guestToken match
  const isOwner = currentUser && booking.userId === currentUser.id;
  const hasValidGuestToken = token && booking.guestToken === token;

  if (!isOwner && !hasValidGuestToken) {
    notFound();
  }

  const successfulPayment = booking.payments.find(
    (p) => p.status === "SUCCESS"
  );

  const amountInRupees = (booking.amountInPaise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });

  return (
    <div className="min-h-screen bg-stone-50/50 dark:bg-stone-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="print:hidden">
          <Link
            href="/events"
            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 font-medium"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to Temple Events
          </Link>
        </div>

        {/* Official Printable Receipt Card */}
        <div className="rounded-3xl border border-amber-900/15 bg-white dark:bg-stone-900 shadow-md p-6 sm:p-10 space-y-8">
          {/* Header Banner */}
          <div className="text-center space-y-2 border-b border-amber-900/10 pb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="pt-2 text-xs font-semibold text-amber-700 uppercase tracking-widest">
              ॐ నమో వేంకటేశాయ • Sacred Seva Receipt
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
              Puja Booking Confirmed
            </h1>
            <p className="text-xs text-stone-500">
              Booking Reference: <strong className="font-mono text-stone-800 dark:text-stone-200">#{booking.id}</strong>
            </p>
          </div>

          {/* Puja Muhurtham & Location */}
          <div className="rounded-xl bg-amber-50/40 dark:bg-stone-800/40 border border-amber-900/10 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="default" className="bg-amber-700 text-white text-[10px]">
                {booking.schedule.event.category}
              </Badge>
              <Badge
                variant={
                  booking.status === "PAID"
                    ? "success"
                    : booking.status === "REFUNDED"
                      ? "destructive"
                      : "warning"
                }
              >
                {booking.status}
              </Badge>
            </div>

            <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
              {booking.schedule.event.title}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-600 dark:text-stone-300 pt-2 border-t border-amber-900/10">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-amber-700 shrink-0" />
                <span>
                  {new Date(booking.schedule.startsAt).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-700 shrink-0" />
                <span>
                  {new Date(booking.schedule.startsAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {new Date(booking.schedule.endsAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:col-span-2">
                <MapPin className="h-4 w-4 text-amber-700 shrink-0" />
                <span>{booking.schedule.event.venue}</span>
              </div>
            </div>
          </div>

          {/* Devotee Sankalpam Breakdown */}
          <div className="space-y-3 text-xs">
            <h3 className="font-serif text-sm font-bold text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-2">
              Devotee & Sankalpam Particulars
            </h3>

            <div className="grid grid-cols-2 gap-2 text-stone-600 dark:text-stone-400">
              <div>Devotee Name:</div>
              <div className="font-semibold text-right text-stone-900 dark:text-stone-100">
                {booking.guestName}
              </div>

              <div>Registered Email:</div>
              <div className="font-mono text-right text-stone-800 dark:text-stone-200">
                {booking.guestEmail}
              </div>

              <div>Contact Phone:</div>
              <div className="font-mono text-right text-stone-800 dark:text-stone-200">
                {booking.guestPhone}
              </div>

              <div>Devotees / Tickets:</div>
              <div className="font-semibold text-right text-stone-900 dark:text-stone-100">
                {booking.quantity} Devotee(s)
              </div>

              {successfulPayment && (
                <>
                  <div>Payment Reference:</div>
                  <div className="font-mono text-right text-stone-500">
                    {successfulPayment.razorpayPaymentId || successfulPayment.razorpayOrderId}
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-dashed border-stone-200 dark:border-stone-700 pt-3 flex items-center justify-between text-sm font-bold text-stone-900 dark:text-stone-100">
              <span>Total Offering Paid:</span>
              <span className="text-amber-800 dark:text-amber-300 flex items-center gap-0.5 text-base">
                <IndianRupee className="h-4 w-4" />
                {amountInRupees}
              </span>
            </div>
          </div>

          {/* Arrival Instructions */}
          <div className="rounded-xl bg-stone-50 dark:bg-stone-800/40 p-4 border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-300 space-y-1.5">
            <div className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Temple Arrival Guidelines
            </div>
            <p>
              Please report to the temple Seva Mandapam counter 20 minutes prior to the muhurtham start time. Show this digital receipt or SMS to our temple desk to collect your sankalpam token and prasadam pass. Traditional dress code applies.
            </p>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-100 dark:border-stone-800 print:hidden">
            <PrintReceiptButton />
            <Link href="/events">
              <span className="text-xs text-amber-700 hover:text-amber-800 font-semibold cursor-pointer">
                Explore More Temple Pujas →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
