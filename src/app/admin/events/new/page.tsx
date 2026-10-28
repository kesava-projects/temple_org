import { requireAdmin } from "@/server/auth/guards";
import { EventForm } from "@/components/admin/event-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "New Temple Event | Admin Portal",
};

export default async function NewAdminEventPage() {
  // Security Rule 1: Every admin route calls requireAdmin() on the server first.
  await requireAdmin();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/events"
          className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 flex items-center gap-1 font-medium"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Events List
        </Link>
      </div>

      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
          Create Temple Event or Puja
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Configure puja details, date & time slots, capacity limits, and seva booking fees.
        </p>
      </div>

      <EventForm mode="create" />
    </div>
  );
}
