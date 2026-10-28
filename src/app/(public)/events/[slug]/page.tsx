import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventJsonLd } from "@/components/json-ld";
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  IndianRupee,
  Users,
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const event = await prisma.event.findUnique({
      where: { slug, status: "PUBLISHED" },
      select: {
        title: true,
        description: true,
        images: true,
        venue: true,
      },
    });

    if (!event) {
      return {
        title: "Event Not Found | Sri Venkateswara Temple",
      };
    }

    const cover = event.images[0] || "https://images.unsplash.com/photo-1609766857041-ed402ea8069a";

    return {
      title: `${event.title} | Sri Venkateswara Temple`,
      description: event.description.slice(0, 160),
      openGraph: {
        title: event.title,
        description: event.description.slice(0, 160),
        images: [{ url: cover, width: 1200, height: 630, alt: event.title }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: event.title,
        description: event.description.slice(0, 160),
        images: [cover],
      },
    };
  } catch {
    return {
      title: "Temple Puja & Event Details",
    };
  }
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { slug } = await params;

  let event = null;
  try {
    event = await prisma.event.findUnique({
      where: {
        slug,
        status: "PUBLISHED",
      },
      include: {
        schedules: {
          orderBy: { startsAt: "asc" },
        },
      },
    });
  } catch {
    console.warn(`[EventDetailPage] Error fetching event for slug: ${slug}`);
  }

  if (!event) {
    notFound();
  }

  const primaryImage =
    event.images[0] ||
    "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&q=80&w=1200";

  const firstSchedule = event.schedules[0];
  const lowestPriceInPaise = event.schedules.length
    ? Math.min(...event.schedules.map((s) => s.priceInPaise))
    : 0;

  return (
    <div className="min-h-screen bg-stone-50/50 dark:bg-stone-950 pb-20">
      {/* JSON-LD Structured Data */}
      {firstSchedule && (
        <EventJsonLd
          name={event.title}
          description={event.description}
          slug={event.slug}
          image={primaryImage}
          startDate={new Date(firstSchedule.startsAt).toISOString()}
          endDate={new Date(firstSchedule.endsAt).toISOString()}
          priceInPaise={lowestPriceInPaise}
          venue={event.venue}
        />
      )}

      {/* Hero Cover Banner */}
      <div className="relative h-72 sm:h-96 w-full bg-stone-900 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={primaryImage}
          alt={event.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

        <div className="absolute bottom-0 inset-x-0 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/events"
              className="inline-flex items-center gap-1 text-xs text-amber-200/90 hover:text-white transition-colors mr-2"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              All Pujas & Events
            </Link>
            <Badge variant="default" className="bg-amber-600/90 hover:bg-amber-600 text-white">
              <Tag className="mr-1 h-3 w-3" />
              {event.category}
            </Badge>
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-white max-w-4xl tracking-tight leading-tight">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-stone-200">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
              {event.venue}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
              {event.schedules.length} Muhurtham Slot(s) Available
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Description, Gallery & Guidelines */}
          <div className="lg:col-span-7 space-y-8">
            {/* Seva Significance */}
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                <Sparkles className="h-5 w-5 text-amber-600" />
                <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
                  Sacred Significance & Seva Description
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>

            {/* Additional Photo Gallery */}
            {event.images.length > 1 && (
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-xs space-y-4">
                <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                  Darshan & Ritual Gallery
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {event.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl overflow-hidden aspect-video border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`${event.title} ritual ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Devotee Guidelines & Dress Code */}
            <div className="rounded-2xl border border-amber-900/15 bg-amber-50/40 dark:bg-amber-950/20 p-6 sm:p-8 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-serif font-bold text-base">
                <ShieldCheck className="h-5 w-5 text-amber-700" />
                Temple Etiquette & Devotee Guidelines
              </div>
              <ul className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 space-y-2 list-disc list-inside leading-relaxed">
                <li>
                  <strong>Traditional Dress Code:</strong> Men must wear Dhoti, Kurta, or traditional Indian attire. Women must wear Saree, Salwar Kameez, or traditional clothing.
                </li>
                <li>
                  <strong>Sanctum Protocol:</strong> Footwear is strictly prohibited beyond the outer temple prakaram. Free footwear stalls are available at Gate 1.
                </li>
                <li>
                  <strong>Reporting Time:</strong> Devotees holding confirmed seva bookings must report 20 minutes prior to the muhurtham start time at the Seva Mandapam counter.
                </li>
                <li>
                  <strong>Prasadam Collection:</strong> Blessed Mahaprasadam and consecrated Raksha dharan will be handed directly after the Harati.
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Schedule Muhurtham Booking Box */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-20 rounded-2xl border border-amber-900/20 bg-white dark:bg-stone-900 p-6 shadow-md space-y-6">
              <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
                <span className="text-xs uppercase font-semibold text-amber-700 tracking-wider">
                  Puja Muhurtham Slots
                </span>
                <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                  Select Your Seva Slot
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Choose a date & timing to reserve family sankalpam.
                </p>
              </div>

              {event.schedules.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  No slots currently scheduled for this puja.
                </div>
              ) : (
                <div className="space-y-4">
                  {event.schedules.map((s, idx) => {
                    const priceInRupees = s.priceInPaise / 100;
                    const isSlotBookable = s.isBookable;

                    return (
                      <div
                        key={s.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isSlotBookable
                            ? "border-amber-900/20 bg-amber-50/20 hover:border-amber-600/50"
                            : "border-stone-200 bg-stone-50 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                              Slot #{idx + 1}
                            </span>
                            <div className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                              {new Date(s.startsAt).toLocaleDateString("en-IN", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-bold text-base text-amber-900 dark:text-amber-200 flex items-center justify-end gap-0.5">
                              <IndianRupee className="h-3.5 w-3.5" />
                              {priceInRupees.toLocaleString("en-IN")}
                            </div>
                            <span className="text-[10px] text-stone-400">
                              {priceInRupees === 0 ? "Free Offering" : "per family sankalpam"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-amber-900/10 dark:border-stone-800">
                          <span className="flex items-center gap-1 text-[11px]">
                            <Clock className="h-3 w-3 text-amber-600" />
                            {new Date(s.startsAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(s.endsAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="flex items-center gap-1 text-[11px]">
                            <Users className="h-3 w-3 text-stone-400" />
                            {s.capacity} seats limit
                          </span>
                        </div>

                        <div className="pt-3">
                          {isSlotBookable ? (
                            <Link href={`/events/${event.slug}/book?scheduleId=${s.id}`}>
                              <Button className="w-full bg-amber-700 hover:bg-amber-800 text-white text-xs h-9 font-semibold">
                                Book Seva Now
                              </Button>
                            </Link>
                          ) : (
                            <Button disabled variant="outline" className="w-full text-xs h-9">
                              Bookings Paused
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="rounded-lg bg-stone-100 dark:bg-stone-800/60 p-3 text-center text-xs text-stone-600 dark:text-stone-300">
                <CheckCircle2 className="inline h-3.5 w-3.5 text-emerald-600 mr-1" />
                Instant SMS & Email confirmation with verified sankalpam receipt.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
