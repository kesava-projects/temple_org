"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookingCreateSchema, type BookingCreateInput } from "@/schemas/booking";
import { createBookingReservationAction, verifyPaymentAction } from "@/server/bookings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IndianRupee,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import type { Event, EventSchedule } from "@prisma/client";

interface BookingCheckoutFormProps {
  event: Event;
  schedule: EventSchedule;
  availableSeats: number;
  initialUser?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (response: unknown) => void) => void;
    };
  }
}

export function BookingCheckoutForm({
  event,
  schedule,
  availableSeats,
  initialUser,
}: BookingCheckoutFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const pricePerTicketInRupees = schedule.priceInPaise / 100;
  const isFree = schedule.priceInPaise === 0;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<BookingCreateInput>({
    resolver: zodResolver(BookingCreateSchema),
    defaultValues: {
      scheduleId: schedule.id,
      quantity: 1,
      guestName: initialUser?.name ?? "",
      guestEmail: initialUser?.email ?? "",
      guestPhone: initialUser?.phone ?? "+91",
    },
  });

  const quantity = useWatch({ control, name: "quantity" }) ?? 1;
  const totalAmountInRupees = pricePerTicketInRupees * quantity;

  const loadRazorpayScript = async (): Promise<boolean> => {
    if (typeof window !== "undefined" && window.Razorpay) {
      return true;
    }
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const onSubmit = (data: BookingCreateInput) => {
    setError(null);

    startTransition(async () => {
      const res = await createBookingReservationAction(data);

      if (!res.success || !res.data) {
        setError(res.error || "Could not reserve puja seats. Please try again.");
        return;
      }

      const { bookingId, guestToken, isFree: isFreeBooking, razorpayOrder, razorpayKeyId } =
        res.data;

      // If free seva, redirect immediately
      if (isFreeBooking) {
        router.push(`/booking/${bookingId}/confirmation?token=${guestToken}`);
        return;
      }

      // Paid seva: Open Razorpay checkout modal
      setIsProcessingPayment(true);
      const isLoaded = await loadRazorpayScript();

      if (!isLoaded || !window.Razorpay) {
        // Fallback for mocked/offline test environments
        if (razorpayOrder?.id.startsWith("order_mock_")) {
          const verifyRes = await verifyPaymentAction({
            bookingId,
            razorpayOrderId: razorpayOrder.id,
            razorpayPaymentId: `pay_mock_${Date.now()}`,
            razorpaySignature: "simulated_signature",
          });

          if (verifyRes.success) {
            router.push(`/booking/${bookingId}/confirmation?token=${guestToken}`);
            return;
          }
        }

        setError("Razorpay checkout failed to load. Please verify internet connection.");
        setIsProcessingPayment(false);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: res.data.amountInPaise,
        currency: "INR",
        name: "Sri Venkateswara Temple",
        description: `${event.title} (${quantity} devotee tickets)`,
        image: "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&q=80&w=200",
        order_id: razorpayOrder?.id,
        prefill: {
          name: res.data.guestName,
          email: res.data.guestEmail,
          contact: res.data.guestPhone,
        },
        theme: {
          color: "#b45309",
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await verifyPaymentAction({
              bookingId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              router.push(`/booking/${bookingId}/confirmation?token=${guestToken}`);
            } else {
              setError(verifyRes.error || "Payment verification failed.");
            }
          } catch {
            setError("Error verifying payment signature with temple servers.");
          } finally {
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Devotee Details */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs space-y-4">
        <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-3">
          1. Devotee Sankalpam Details
        </h3>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="guestName">Devotee Full Name *</Label>
            <Input
              id="guestName"
              placeholder="e.g. Smt. & Sri Radhakrishna Sharma"
              {...register("guestName")}
            />
            {errors.guestName && (
              <p className="text-[11px] text-red-600">{errors.guestName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="guestEmail">Email for Digital Receipt *</Label>
              <Input
                id="guestEmail"
                type="email"
                placeholder="devotee@example.com"
                {...register("guestEmail")}
              />
              {errors.guestEmail && (
                <p className="text-[11px] text-red-600">{errors.guestEmail.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="guestPhone">Mobile (with Country Code) *</Label>
              <Input
                id="guestPhone"
                type="tel"
                placeholder="+919876543210"
                {...register("guestPhone")}
              />
              {errors.guestPhone && (
                <p className="text-[11px] text-red-600">{errors.guestPhone.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seat Quantity Selector */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs space-y-4">
        <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-3">
          2. Devotees / Sankalpam Tickets
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-sm text-stone-800 dark:text-stone-200">
              Number of Devotees
            </span>
            <p className="text-xs text-stone-500">
              {availableSeats} seats currently available for this slot
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={quantity <= 1}
              onClick={() => setValue("quantity", Math.max(1, quantity - 1))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center font-bold text-base text-stone-900 dark:text-stone-100">
              {quantity}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={quantity >= Math.min(10, availableSeats)}
              onClick={() =>
                setValue("quantity", Math.min(10, availableSeats, quantity + 1))
              }
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Pricing Breakdown & Checkout Trigger */}
      <div className="rounded-xl border border-amber-900/20 bg-amber-50/40 dark:bg-stone-900 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
          <span>Seva Donation per Devotee:</span>
          <span>{isFree ? "Free" : `₹${pricePerTicketInRupees}`}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
          <span>Devotees / Tickets:</span>
          <span>× {quantity}</span>
        </div>
        <div className="border-t border-amber-900/10 dark:border-stone-800 pt-3 flex items-center justify-between font-bold text-base text-stone-900 dark:text-stone-100">
          <span>Total Seva Offering:</span>
          <span className="text-amber-800 dark:text-amber-200 flex items-center gap-0.5 text-lg">
            <IndianRupee className="h-4 w-4" />
            {isFree ? "Free" : totalAmountInRupees.toLocaleString("en-IN")}
          </span>
        </div>

        <p className="text-[11px] text-stone-500 text-center">
          <ShieldCheck className="inline h-3.5 w-3.5 text-amber-600 mr-1" />
          Seats are held for 15 minutes upon proceeding. All transactions are securely routed through Razorpay.
        </p>

        <Button
          type="submit"
          disabled={isPending || isProcessingPayment}
          className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm h-11 shadow-md"
        >
          {isPending || isProcessingPayment ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Seva Reservation...
            </>
          ) : isFree ? (
            "Confirm Free Seva Registration"
          ) : (
            `Proceed to Offer Seva (₹${totalAmountInRupees.toLocaleString("en-IN")})`
          )}
        </Button>
      </div>
    </form>
  );
}
