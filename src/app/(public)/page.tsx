import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { Calendar, Clock, MapPin, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export default async function HomePage() {
  // Query published events from database
  let publishedEvents: Array<{
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    venue: string;
    images: string[];
    schedules: Array<{
      id: string;
      startsAt: Date;
      priceInPaise: number;
    }>;
  }> = [];

  try {
    publishedEvents = await prisma.event.findMany({
      where: { status: "PUBLISHED" },
      include: {
        schedules: {
          where: { isBookable: true },
          orderBy: { startsAt: "asc" },
          take: 1,
        },
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("[HomePage Events Fetch Error]", err);
  }

  return (
    <div className="space-y-16 py-8 md:py-12">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-900 via-amber-800 to-stone-900 px-6 py-20 text-white shadow-xl sm:px-12 sm:py-28 lg:px-16">
          {/* Subtle sacred ambient pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Sacred Darshan & Divine Sevas</span>
            </div>

            <h1 className="font-serif text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-amber-50 leading-tight">
              Experience the Divine Grace of <span className="text-amber-300">Lord Venkateswara</span>
            </h1>

            <p className="text-base sm:text-lg text-amber-100/90 leading-relaxed">
              Welcome to our spiritual sanctuary. Partake in sacred Vedic rituals, book special pujas with your family, and immerse in divine peace and timeless Sanatana heritage.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link href="/events">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold shadow-md">
                  Browse Events & Pujas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-amber-300/40 text-amber-100 hover:bg-amber-400/10"
                >
                  Our Sacred Lineage
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Darshan & Timings Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-amber-900/10 bg-white dark:bg-stone-900 p-6 shadow-xs flex items-start gap-4">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
                Daily Darshan Timings
              </h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Morning: 6:00 AM – 12:30 PM<br />
                Evening: 4:30 PM – 9:00 PM
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-900/10 bg-white dark:bg-stone-900 p-6 shadow-xs flex items-start gap-4">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
                Sanctum Location
              </h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Temple Road, Sacred Hills<br />
                Accessible parking and prasadam hall.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-900/10 bg-white dark:bg-stone-900 p-6 shadow-xs flex items-start gap-4">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
                Verified Puja Booking
              </h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Official Razorpay checkout with instant digital receipt and SMS confirmation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between border-b border-amber-900/10 pb-4">
          <div>
            <div className="text-xs font-semibold tracking-wider uppercase text-amber-700">
              Sacred Gatherings
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 dark:text-stone-100">
              Upcoming Events & Special Pujas
            </h2>
          </div>
          <Link
            href="/events"
            className="text-sm font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            <span>View all events</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {publishedEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-amber-900/20 bg-amber-50/50 p-12 text-center">
            <Calendar className="mx-auto h-10 w-10 text-amber-600/70" />
            <h3 className="mt-3 font-serif text-lg font-medium text-stone-800">
              Events are being scheduled
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              Our temple priests are currently planning the upcoming festive calendar. Please check back shortly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {publishedEvents.map((evt) => {
              const nextSchedule = evt.schedules[0];
              const priceDisplay = nextSchedule
                ? nextSchedule.priceInPaise === 0
                  ? "Free / Seva"
                  : `₹${(nextSchedule.priceInPaise / 100).toFixed(0)}`
                : "Schedule Pending";

              return (
                <div
                  key={evt.id}
                  className="rounded-2xl border border-amber-900/10 bg-white dark:bg-stone-900 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {evt.images[0] && (
                      <div className="h-48 w-full overflow-hidden bg-amber-100 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={evt.images[0]}
                          alt={evt.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-3 right-3 rounded-full bg-amber-950/80 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                          {evt.category}
                        </div>
                      </div>
                    )}
                    <div className="p-6 space-y-2">
                      <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                        {evt.title}
                      </h3>
                      <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                        {evt.description}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-amber-900/5 p-6 pt-3 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-stone-400">
                        Puja Dakshina
                      </div>
                      <div className="text-sm font-bold text-amber-800 dark:text-amber-400">
                        {priceDisplay}
                      </div>
                    </div>
                    <Link href={`/events/${evt.slug}`}>
                      <Button size="sm" variant="outline" className="border-amber-700/30 text-amber-900">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
