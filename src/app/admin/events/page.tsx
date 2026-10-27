import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Tag } from "lucide-react";

export default async function AdminEventsPage() {
  // Security Rule 1: Every admin route calls requireAdmin() first.
  await requireAdmin();

  const events = await prisma.event.findMany({
    include: {
      schedules: true,
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-amber-900/10 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
            Events & Pujas Management
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Create, update, and manage temple festival schedules, prices, and capacities.
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button size="sm" className="bg-amber-700 hover:bg-amber-800 text-white">
            <Plus className="mr-1.5 h-4 w-4" />
            Add New Event
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-amber-900/10 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-amber-50/50 border-b border-amber-900/10 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-4">Event Details</th>
              <th className="p-4">Category</th>
              <th className="p-4">Status</th>
              <th className="p-4">Schedules</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-stone-400">
                  No events created yet. Click &quot;Add New Event&quot; to begin.
                </td>
              </tr>
            ) : (
              events.map((evt) => (
                <tr key={evt.id} className="hover:bg-amber-50/20 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                      {evt.title}
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                      /{evt.slug}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[11px]">
                      <Tag className="h-3 w-3" />
                      {evt.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        evt.status === "PUBLISHED"
                          ? "bg-emerald-100 text-emerald-800"
                          : evt.status === "DRAFT"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {evt.status}
                    </span>
                  </td>
                  <td className="p-4 text-stone-600">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Calendar className="h-3 w-3 text-amber-600" />
                      {evt.schedules.length} schedule slot(s)
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/events/${evt.id}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        Manage
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
