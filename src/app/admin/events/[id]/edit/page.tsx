import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/guards";
import { eventsService } from "@/server/events/events.service";
import { EventForm } from "@/components/admin/event-form";
import { ChevronLeft } from "lucide-react";

interface AdminEventEditPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Edit Temple Event | Admin Portal",
};

export default async function AdminEventEditPage({
  params,
}: AdminEventEditPageProps) {
  // Security Rule 1: Every admin route calls requireAdmin() first.
  await requireAdmin();
  const { id } = await params;

  const event = await eventsService.getAdminEventById(id);
  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/events/${event.id}`}
          className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 flex items-center gap-1 font-medium"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Event Details
        </Link>
      </div>

      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
          Edit Temple Event: &quot;{event.title}&quot;
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Update event details, modify schedule dates, adjust capacity limits, or alter seva booking fees.
        </p>
      </div>

      <EventForm mode="edit" initialEvent={event} />
    </div>
  );
}
