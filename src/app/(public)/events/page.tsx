import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Tag } from "lucide-react";

export default async function EventsListPage() {
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
      priceInPaise: number;
    }>;
  }> = [];

  try {
    events = await prisma.event.findMany({
      where: { status: "PUBLISHED" },
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
      <div className="border-b border-amber-900/10 pb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
          Spiritual Calendar
        </span>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 dark:text-stone-100 mt-1">
          Upcoming Temple Events & Pujas
        </h1>
        <p className="text-stone-600 dark:text-stone-400 mt-2 max-w-2xl text-sm">
          Participate in sacred festive celebrations, daily homams, and special abhishekams. Register online to reserve your family sankalpam slots.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-900/20 bg-amber-50/40 p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-amber-700/60" />
          <h3 className="mt-3 font-serif text-lg font-medium text-stone-900">
            No Events Published Yet
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            Check back soon for the updated festive muhurtham schedule.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => {
            const nextSchedule = evt.schedules[0];
            return (
              <div
                key={evt.id}
                className="rounded-2xl border border-amber-900/10 bg-white dark:bg-stone-900 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {evt.images[0] && (
                    <div className="h-48 w-full bg-amber-100 overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={evt.images[0]}
                        alt={evt.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute top-3 left-3 rounded-full bg-amber-950/80 backdrop-blur-xs px-2.5 py-0.5 text-xs text-amber-200 flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {evt.category}
                      </div>
                    </div>
                  )}

                  <div className="p-6 space-y-3">
                    <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
                      {evt.title}
                    </h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-3">
                      {evt.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-stone-500 pt-1">
                      <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>{evt.venue}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-amber-900/5 p-6 pt-4 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-stone-400 uppercase font-medium">Dakshina</div>
                    <div className="font-bold text-amber-800 text-sm">
                      {nextSchedule
                        ? nextSchedule.priceInPaise === 0
                          ? "Free Seva"
                          : `₹${(nextSchedule.priceInPaise / 100).toFixed(0)}`
                        : "N/A"}
                    </div>
                  </div>
                  <Link href={`/events/${evt.slug}`}>
                    <Button size="sm" className="bg-amber-700 hover:bg-amber-800 text-white">
                      View Puja Details
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
