import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/guards";
import { eventsService } from "@/server/events/events.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArchiveEventButton } from "@/components/admin/archive-event-button";
import { ScheduleToggleButton } from "@/components/admin/schedule-toggle-button";
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  Edit,
  ExternalLink,
  ChevronLeft,
  Users,
  IndianRupee,
  History,
  ShieldCheck,
} from "lucide-react";

interface AdminEventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEventDetailPage({
  params,
}: AdminEventDetailPageProps) {
  // Security Rule 1: Every admin route calls requireAdmin() first.
  await requireAdmin();
  const { id } = await params;

  const event = await eventsService.getAdminEventById(id);
  if (!event) {
    notFound();
  }

  const isArchived = event.status === "ARCHIVED";
  const totalCapacity = event.schedules.reduce((acc, s) => acc + s.capacity, 0);
  const totalBookings = event.schedules.reduce(
    (acc, s) => acc + s._count.bookings,
    0
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/events"
          className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 flex items-center gap-1 font-medium"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Events List
        </Link>
        <div className="flex items-center gap-2">
          {event.status === "PUBLISHED" && (
            <Link href={`/events/${event.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <ExternalLink className="mr-1 h-3 w-3" />
                Devotee View
              </Button>
            </Link>
          )}
          {!isArchived && (
            <Link href={`/admin/events/${event.id}/edit`}>
              <Button size="sm" className="h-7 text-xs bg-amber-700 hover:bg-amber-800 text-white">
                <Edit className="mr-1 h-3 w-3" />
                Edit Event
              </Button>
            </Link>
          )}
          <ArchiveEventButton
            eventId={event.id}
            eventTitle={event.title}
            isArchived={isArchived}
          />
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  event.status === "PUBLISHED"
                    ? "success"
                    : event.status === "DRAFT"
                      ? "warning"
                      : "destructive"
                }
              >
                {event.status}
              </Badge>
              <span className="inline-flex items-center gap-1 text-xs text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2.5 py-0.5 rounded-full font-medium">
                <Tag className="h-3 w-3" />
                {event.category}
              </span>
              <span className="text-xs font-mono text-stone-400">/{event.slug}</span>
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 dark:text-stone-100">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-amber-600" />
                {event.venue}
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                Created by {event.createdBy.name} ({event.createdBy.email})
              </span>
              <span>Created on {new Date(event.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 shrink-0 bg-amber-50/50 dark:bg-stone-800/50 p-3 rounded-lg border border-amber-900/10">
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-stone-500">
                Schedules
              </div>
              <div className="text-base font-bold text-stone-900 dark:text-stone-100">
                {event.schedules.length}
              </div>
            </div>
            <div className="text-center px-2 border-x border-stone-200 dark:border-stone-700">
              <div className="text-[10px] uppercase font-bold text-stone-500">
                Total Seats
              </div>
              <div className="text-base font-bold text-stone-900 dark:text-stone-100">
                {totalCapacity}
              </div>
            </div>
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-stone-500">
                Bookings
              </div>
              <div className="text-base font-bold text-amber-700 dark:text-amber-400">
                {totalBookings}
              </div>
            </div>
          </div>
        </div>

        {/* Event Gallery */}
        {event.images.length > 0 && (
          <div className="pt-2">
            <div className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Cover & Gallery Images
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {event.images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative shrink-0 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 w-36 h-24 bg-stone-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={`${event.title} preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 text-[9px] bg-amber-700 text-white font-bold px-1.5 py-0.5 rounded">
                      Cover Photo
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
          <div className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            Seva Description & Devotee Instructions
          </div>
          <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400 whitespace-pre-wrap">
            {event.description}
          </p>
        </div>
      </div>

      {/* Schedules & Pricing Table */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-700" />
            <h2 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
              Schedule Slots & Seva Pricing
            </h2>
          </div>
          {!isArchived && (
            <Link href={`/admin/events/${event.id}/edit`}>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Manage Slots
              </Button>
            </Link>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-700 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Schedule Time Slot</th>
                <th className="p-3.5">Seat Capacity</th>
                <th className="p-3.5">Price in INR (Stored in Paise)</th>
                <th className="p-3.5">Devotee Bookings</th>
                <th className="p-3.5">Booking Status</th>
                <th className="p-3.5 text-right">Quick Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {event.schedules.map((s, idx) => (
                <tr key={s.id} className="hover:bg-amber-50/10">
                  <td className="p-3.5">
                    <div className="font-medium text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-amber-600 shrink-0" />
                      Slot #{idx + 1}: {new Date(s.startsAt).toLocaleDateString()}
                    </div>
                    <div className="text-[11px] text-stone-500 pl-4.5 mt-0.5">
                      {new Date(s.startsAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(s.endsAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 text-stone-700 dark:text-stone-300 font-medium">
                      <Users className="h-3 w-3 text-stone-400" />
                      {s.capacity} seats
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-0.5">
                      <IndianRupee className="h-3 w-3 text-amber-700" />
                      {(s.priceInPaise / 100).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono">
                      {s.priceInPaise} paise
                    </div>
                  </td>
                  <td className="p-3.5 text-stone-600 font-medium">
                    {s._count.bookings} booking(s)
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        s.isBookable && !isArchived
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {s.isBookable && !isArchived ? "BOOKABLE" : "PAUSED"}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <ScheduleToggleButton
                      scheduleId={s.id}
                      isBookable={s.isBookable}
                      isEventArchived={isArchived}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Append-Only Audit Log Trail */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
          <History className="h-4 w-4 text-amber-700" />
          <h2 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
            Append-Only Audit Log History (Security Rule 9)
          </h2>
        </div>

        {event.auditLogs.length === 0 ? (
          <p className="text-xs text-stone-400">No audit log records for this event yet.</p>
        ) : (
          <div className="space-y-2">
            {event.auditLogs.map((log) => (
              <div
                key={log.id}
                className="text-xs p-3 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                    <span className="font-mono text-[11px] text-amber-700 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span>
                      by {log.user?.name || log.user?.email || "System"}
                    </span>
                  </div>
                  {log.meta && (
                    <div className="text-[11px] font-mono text-stone-500">
                      {JSON.stringify(log.meta)}
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-stone-400 shrink-0">
                  {new Date(log.createdAt).toLocaleString()} {log.ip && `(${log.ip})`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
