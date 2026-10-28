import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/guards";
import { BookingCheckoutForm } from "@/components/booking-checkout-form";
import {
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
} from "lucide-react";

interface BookPujaPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ scheduleId?: string }>;
}

export const metadata: Metadata = {
  title: "Book Puja & Seva Sankalpam | Sri Venkateswara Temple",
  description: "Reserve your family puja sankalpam slots securely online.",
};

export default async function BookPujaPage({
  params,
  searchParams,
}: BookPujaPageProps) {
  const { slug } = await params;
  const { scheduleId } = await searchParams;

  const event = await prisma.event.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      schedules: {
        where: { isBookable: true },
        orderBy: { startsAt: "asc" },
      },
    },
  });

  if (!event || event.schedules.length === 0) {
    notFound();
  }

  const selectedSchedule = scheduleId
    ? event.schedules.find((s) => s.id === scheduleId)
    : event.schedules[0];

  if (!selectedSchedule) {
    redirect(`/events/${slug}`);
  }

  // Calculate active reservations for capacity check
  const now = new Date();
  const activeBookings = await prisma.booking.findMany({
    where: {
      scheduleId: selectedSchedule.id,
      OR: [
        { status: "PAID" },
        { status: "PENDING", expiresAt: { gt: now } },
      ],
    },
    select: { quantity: true },
  });

  const reservedCount = activeBookings.reduce((sum, b) => sum + b.quantity, 0);
  const availableSeats = Math.max(0, selectedSchedule.capacity - reservedCount);

  const currentUser = await getCurrentUser();

  const coverImage =
    event.images[0] ||
    "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&q=80&w=800";

  return (
    <div className="min-h-screen bg-stone-50/50 dark:bg-stone-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 font-medium"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to &quot;{event.title}&quot; Details
          </Link>
        </div>

        {/* Selected Puja Summary Card */}
        <div className="rounded-2xl border border-amber-900/10 bg-white dark:bg-stone-900 p-6 shadow-xs flex flex-col sm:flex-row gap-5 items-center">
          <div className="w-full sm:w-36 h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-1.5 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              {event.category}
            </span>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 pt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-amber-600" />
                {new Date(selectedSchedule.startsAt).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                {new Date(selectedSchedule.startsAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-amber-600" />
                {event.venue}
              </span>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <BookingCheckoutForm
          event={event}
          schedule={selectedSchedule}
          availableSeats={availableSeats}
          initialUser={
            currentUser
              ? {
                  name: currentUser.name,
                  email: currentUser.email,
                  phone: currentUser.phoneNumber || currentUser.phone,
                }
              : null
          }
        />
      </div>
    </div>
  );
}
