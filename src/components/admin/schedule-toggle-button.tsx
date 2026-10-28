"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toggleScheduleBookableAction } from "@/server/events/actions";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface ScheduleToggleButtonProps {
  scheduleId: string;
  isBookable: boolean;
  isEventArchived?: boolean;
}

export function ScheduleToggleButton({
  scheduleId,
  isBookable,
  isEventArchived = false,
}: ScheduleToggleButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = () => {
    if (isEventArchived) return;

    startTransition(async () => {
      await toggleScheduleBookableAction(scheduleId, !isBookable);
      router.refresh();
    });
  };

  if (isEventArchived) {
    return (
      <span className="text-[11px] text-stone-400 font-medium">Closed (Archived)</span>
    );
  }

  return (
    <Button
      variant="outline"
      size="xs"
      onClick={handleToggle}
      disabled={isPending}
      className={`h-6 text-[10px] font-semibold gap-1 ${
        isBookable
          ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
          : "border-stone-300 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-400"
      }`}
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isBookable ? (
        <>
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          Bookings Open
        </>
      ) : (
        <>
          <XCircle className="h-3 w-3 text-stone-400" />
          Bookings Paused
        </>
      )}
    </Button>
  );
}
