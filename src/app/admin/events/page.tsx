import Link from "next/link";
import { requireAdmin } from "@/server/auth/guards";
import { eventsService } from "@/server/events/events.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArchiveEventButton } from "@/components/admin/archive-event-button";
import {
  Plus,
  Calendar,
  Tag,
  Search,
  Eye,
  Edit,
  IndianRupee,
  Layers,
  MapPin,
} from "lucide-react";
import type { EventStatus } from "@prisma/client";

interface AdminEventsPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    category?: string;
  }>;
}

export const metadata = {
  title: "Events Management | Admin Portal",
};

export default async function AdminEventsPage({
  searchParams,
}: AdminEventsPageProps) {
  // Security Rule 1: Every admin route calls requireAdmin() first.
  await requireAdmin();

  const { status: statusParam, search: searchParam, category: categoryParam } =
    await searchParams;

  const status =
    statusParam && ["DRAFT", "PUBLISHED", "CANCELLED", "ARCHIVED"].includes(statusParam)
      ? (statusParam as EventStatus)
      : "ALL";

  const { events, total } = await eventsService.listAdminEvents({
    status,
    search: searchParam,
    category: categoryParam,
  });

  const allStatusTabs = [
    { label: "All Events", value: "ALL" },
    { label: "Published", value: "PUBLISHED" },
    { label: "Drafts", value: "DRAFT" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "Archived", value: "ARCHIVED" },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-900/10 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
            Events & Pujas Management
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Create, update, and manage temple festival schedules, prices, and capacities.
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button size="sm" className="bg-amber-700 hover:bg-amber-800 text-white shrink-0">
            <Plus className="mr-1.5 h-4 w-4" />
            Add New Event
          </Button>
        </Link>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {allStatusTabs.map((tab) => {
            const isActive = (statusParam || "ALL") === tab.value;
            return (
              <Link
                key={tab.value}
                href={`/admin/events?status=${tab.value}${
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

        {/* Search Input Form */}
        <form method="GET" action="/admin/events" className="relative shrink-0 w-full sm:w-72">
          <input type="hidden" name="status" value={statusParam || "ALL"} />
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            type="search"
            name="search"
            placeholder="Search by title or venue..."
            defaultValue={searchParam || ""}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </form>
      </div>

      {/* Events Table Container */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-700 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Event & Location</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4">Schedules & Pricing</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-stone-400">
                    <Layers className="h-8 w-8 mx-auto mb-2 text-stone-300" />
                    <p className="font-medium">No events found matching your filter criteria.</p>
                    <p className="text-[11px] mt-1 text-stone-400">
                      Try clearing search terms or create a new event.
                    </p>
                  </td>
                </tr>
              ) : (
                events.map((evt) => {
                  const isArchived = evt.status === "ARCHIVED";
                  const coverImage =
                    evt.images[0] ||
                    "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&q=80&w=1200";

                  // Calculate price range
                  const prices = evt.schedules.map((s) => s.priceInPaise / 100);
                  const minPrice = prices.length ? Math.min(...prices) : 0;
                  const maxPrice = prices.length ? Math.max(...prices) : 0;
                  const priceDisplay =
                    prices.length === 0
                      ? "Free"
                      : minPrice === maxPrice
                        ? `₹${minPrice}`
                        : `₹${minPrice} - ₹${maxPrice}`;

                  return (
                    <tr
                      key={evt.id}
                      className={`hover:bg-amber-50/10 transition-colors ${
                        isArchived ? "opacity-60 bg-stone-50/40 dark:bg-stone-900/40" : ""
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-11 rounded-md overflow-hidden bg-stone-100 shrink-0 border border-stone-200 dark:border-stone-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={coverImage}
                              alt={evt.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <Link
                              href={`/admin/events/${evt.id}`}
                              className="font-bold text-stone-900 dark:text-stone-100 text-sm hover:text-amber-700 dark:hover:text-amber-400 transition-colors line-clamp-1"
                            >
                              {evt.title}
                            </Link>
                            <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3 text-amber-600" />
                                {evt.venue}
                              </span>
                              <span>•</span>
                              <span className="font-mono text-stone-400">/{evt.slug}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-medium">
                          <Tag className="h-3 w-3" />
                          {evt.category}
                        </span>
                      </td>

                      <td className="p-4">
                        <Badge
                          variant={
                            evt.status === "PUBLISHED"
                              ? "success"
                              : evt.status === "DRAFT"
                                ? "warning"
                                : "destructive"
                          }
                        >
                          {evt.status}
                        </Badge>
                      </td>

                      <td className="p-4 text-stone-600 dark:text-stone-300">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-medium">
                            <Calendar className="h-3 w-3 text-amber-600" />
                            <span>{evt.schedules.length} slot(s)</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-stone-500">
                            <IndianRupee className="h-3 w-3 text-amber-600" />
                            <span>{priceDisplay}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/admin/events/${evt.id}`}>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                          </Link>
                          {!isArchived && (
                            <Link href={`/admin/events/${evt.id}/edit`}>
                              <Button variant="outline" size="sm" className="h-7 text-xs">
                                <Edit className="mr-1 h-3 w-3" />
                                Edit
                              </Button>
                            </Link>
                          )}
                          <ArchiveEventButton
                            eventId={evt.id}
                            eventTitle={evt.title}
                            isArchived={isArchived}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info count */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 text-xs text-stone-500 flex items-center justify-between">
          <span>Showing {events.length} of {total} event(s)</span>
          <span className="text-[11px] text-stone-400">
            Soft delete protection enabled (Security Rule 6)
          </span>
        </div>
      </div>
    </div>
  );
}
