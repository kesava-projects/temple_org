"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { refundBookingAction } from "@/server/bookings/actions";
import { RotateCcw, AlertTriangle, Loader2 } from "lucide-react";

interface RefundBookingButtonProps {
  bookingId: string;
  guestName: string;
  amountInRupees: number;
}

export function RefundBookingButton({
  bookingId,
  guestName,
  amountInRupees,
}: RefundBookingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRefund = () => {
    if (!reason.trim()) {
      setError("Please provide a refund reason for audit logging.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await refundBookingAction(bookingId, reason);
      if (res.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to process refund");
      }
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="xs"
        onClick={() => setIsOpen(true)}
        className="h-6 text-[10px] text-red-700 border-red-200 hover:bg-red-50 dark:border-red-900/60"
      >
        <RotateCcw className="mr-1 h-3 w-3" />
        Refund
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-stone-900 p-6 shadow-xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center gap-3 text-red-700">
              <div className="rounded-full bg-red-100 dark:bg-red-950 p-2">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                Initiate Seva Refund
              </h3>
            </div>

            <div className="text-xs text-stone-600 dark:text-stone-400 space-y-2">
              <p>
                You are about to refund <strong>₹{amountInRupees}</strong> for devotee <strong>{guestName}</strong> (Booking #{bookingId.slice(-6)}).
              </p>
              <p className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 text-amber-900 dark:text-amber-300">
                <strong>Security Rule 9:</strong> All refunds are immutably logged to the security AuditLog with the operator admin&apos;s identity and IP address.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="refund-reason" className="text-xs">
                Audit Refund Reason *
              </Label>
              <Input
                id="refund-reason"
                placeholder="e.g. Devotee request due to medical emergency / puja rescheduled"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-xs"
              />
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
                onClick={handleRefund}
                disabled={isPending}
                className="bg-red-700 hover:bg-red-800 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Processing Refund...
                  </>
                ) : (
                  "Confirm & Process Refund"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
