import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  IndianRupee,
  Search,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Temple Pujas & Festive Events | Sri Venkateswara Temple",
  description:
    "Explore the sacred spiritual calendar of Sri Venkateswara Temple. Discover upcoming festivals, special pujas, Kalyanotsavam, and reserve your family sankalpam slots.",
};

interface EventsListPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
  }>;
}

export default async function EventsListPage({
  searchParams,
}: EventsListPageProps) {
  const { category: categoryParam, search: searchParam } = await searchParams;

  const categories = [
    { label: "All Pujas", value: "ALL" },
    { label: "Festivals (Utsavam)", value: "Festival" },
    { label: "Daily Puja & Seva", value: "Daily Puja" },
    { label: "Kalyanotsavam", value: "Kalyanotsavam" },
    { label: "Abhishekam", value: "Abhishekam" },
    { label: "Homa & Havan", value: "Homa & Havan" },
    { label: "Special Darshan", value: "Special Darshan" },
  ];

  const whereClause: Record<string, unknown> = {
    status: "PUBLISHED",
  };

  if (categoryParam && categoryParam !== "ALL") {
    whereClause.category = categoryParam;
  }

  if (searchParam && searchParam.trim()) {
    const term = searchParam.trim();
    whereClause.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { venue: { contains: term, mode: "insensitive" } },
    ];
  }

  let events: Array<{
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
      endsAt: Date;
      capacity: number;
      priceInPaise: number;
      isBookable: boolean;
    }>;
  }> = [];

  try {
    events = await prisma.event.findMany({
      where: whereClause,
      include: {
        schedules: {
          where: { isBookable: true },
          orderBy: { startsAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    console.warn("[EventsListPage] Database unavailable during build, using empty list.");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Page Header */}
      <div className="border-b border-amber-900/10 pb-6 space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-100/60 px-2.5 py-1 rounded-full">
          Spiritual Calendar & Seva Muhurtham
        </span>
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
          Upcoming Temple Events & Special Pujas
        </h1>
        <p className="text-stone-600 dark:text-stone-400 max-w-3xl text-sm leading-relaxed">
          Participate in sacred festive celebrations, daily homams, and special abhishekams. Register online to reserve your family sankalpam slots with authentic Vedic chanting by our temple priests.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const isSelected = (categoryParam || "ALL") === cat.value;
            return (
              <Link
                key={cat.value}
                href={`/events?category=${cat.value}${
                  searchParam ? `&search=${encodeURIComponent(searchParam)}` : ""
                }`}
              >
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                    isSelected
                      ? "bg-amber-700 text-white shadow-xs"
                      : "bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-50 border border-stone-200 dark:border-stone-700"
                  }`}
                >
                  {cat.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Keyword Search */}
        <form method="GET" action="/events" className="relative shrink-0 w-full md:w-72">
          <input type="hidden" name="category" value={categoryParam || "ALL"} />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            type="search"
            name="search"
            placeholder="Search puja or venue..."
            defaultValue={searchParam || ""}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500 shadow-xs"
          />
        </form>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-900/20 bg-amber-50/40 p-16 text-center space-y-3">
          <Calendar className="mx-auto h-12 w-12 text-amber-700/60" />
          <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
            No Pujas Found
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            There are currently no scheduled events matching your filter. Please clear search terms or browse our other spiritual categories.
          </p>
          <Link href="/events">
            <Button variant="outline" size="sm" className="mt-2 text-xs">
              Clear All Filters
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => {
            const coverImage =
              evt.images[0] ||
              "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&q=80&w=800";

            const nextSchedule = evt.schedules[0];
            const prices = evt.schedules.map((s) => s.priceInPaise / 100);
            const minPrice = prices.length ? Math.min(...prices) : 0;

            return (
              <div
                key={evt.id}
                className="group flex flex-col justify-between rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Thumbnail Banner */}
                  <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImage}
                      alt={evt.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-amber-800/90 text-white text-[10px] uppercase font-bold tracking-wider">
                        <Tag className="mr-1 h-2.5 w-2.5" />
                        {evt.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 transition-colors line-clamp-1">
                      <Link href={`/events/${evt.slug}`}>{evt.title}</Link>
                    </h2>

                    <div className="flex items-center gap-1.5 text-xs text-stone-500">
                      <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="line-clamp-1">{evt.venue}</span>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>

                    {/* Schedule Slot Timing */}
                    {nextSchedule ? (
                      <div className="pt-2 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300 space-y-1">
                        <div className="flex items-center gap-1 font-semibold text-stone-800 dark:text-stone-200">
                          <Calendar className="h-3 w-3 text-amber-600" />
                          <span>
                            {new Date(nextSchedule.startsAt).toLocaleDateString("en-IN", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-stone-500">
                          <Clock className="h-3 w-3 text-amber-600" />
                          <span>
                            {new Date(nextSchedule.startsAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 text-xs text-stone-400 italic">
                        Muhurtham dates to be announced
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Strip */}
                <div className="p-5 pt-0 border-t border-stone-100 dark:border-stone-800 mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-semibold">
                      Seva Offering
                    </span>
                    <div className="text-base font-bold text-amber-800 dark:text-amber-200 flex items-center gap-0.5">
                      <IndianRupee className="h-3.5 w-3.5" />
                      {minPrice === 0 ? "Free" : `${minPrice}`}
                    </div>
                  </div>

                  <Link href={`/events/${evt.slug}`}>
                    <Button size="sm" className="bg-amber-700 hover:bg-amber-800 text-white text-xs h-8">
                      Book Seva
                      <ArrowRight className="ml-1 h-3 w-3" />
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
