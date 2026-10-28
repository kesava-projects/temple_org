"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { archiveEventAction } from "@/server/events/actions";
import { Archive, AlertTriangle, Loader2 } from "lucide-react";

interface ArchiveEventButtonProps {
  eventId: string;
  eventTitle: string;
  isArchived?: boolean;
}

export function ArchiveEventButton({
  eventId,
  eventTitle,
  isArchived = false,
}: ArchiveEventButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (isArchived) {
    return (
      <span className="text-xs text-stone-400 italic flex items-center gap-1">
        <Archive className="h-3 w-3" />
        Archived
      </span>
    );
  }

  const handleArchive = () => {
    setError(null);
    startTransition(async () => {
      const res = await archiveEventAction(eventId);
      if (res.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to archive event");
      }
    });
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-7 text-xs bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300"
      >
        <Archive className="mr-1 h-3 w-3" />
        Archive
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-stone-900 p-6 shadow-xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-500">
              <div className="rounded-full bg-amber-100 dark:bg-amber-950/60 p-2">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                Archive Event
              </h3>
            </div>

            <div className="text-xs text-stone-600 dark:text-stone-400 space-y-2">
              <p>
                Are you sure you want to archive <strong>&quot;{eventTitle}&quot;</strong>?
              </p>
              <p className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-300">
                <strong>Security Rule 6:</strong> Events are soft-deleted. Archiving will immediately disable all future seat bookings on all schedules while preserving audit trails and financial history.
              </p>
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/50 p-2 rounded-md border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleArchive}
                disabled={isPending}
                className="bg-red-700 hover:bg-red-800 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Archiving...
                  </>
                ) : (
                  "Confirm Archive"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
