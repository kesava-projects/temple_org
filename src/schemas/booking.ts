import { z } from "zod";

export const BookingCreateSchema = z.object({
  scheduleId: z.string().min(1, "Schedule slot is required"),
  quantity: z
    .number({ message: "Quantity must be a valid number" })
    .int("Quantity must be an integer")
    .min(1, "Minimum 1 seat/ticket required")
    .max(10, "Maximum 10 tickets per booking"),
  guestName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  guestEmail: z
    .string()
    .trim()
    .email("A valid email address is required for sending receipts"),
  guestPhone: z
    .string()
    .trim()
    .regex(
      /^\+?[1-9]\d{7,14}$/,
      "Please enter a valid phone number with country code (e.g. +919876543210)"
    ),
});

export const PaymentVerifySchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  razorpayOrderId: z.string().min(1, "Razorpay Order ID is required"),
  razorpayPaymentId: z.string().min(1, "Razorpay Payment ID is required"),
  razorpaySignature: z.string().min(1, "Razorpay Signature is required"),
});

export const BookingRefundSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  reason: z.string().trim().min(3, "Refund reason is required").max(500),
});

export type BookingCreateInput = z.infer<typeof BookingCreateSchema>;
export type PaymentVerifyInput = z.infer<typeof PaymentVerifySchema>;
export type BookingRefundInput = z.infer<typeof BookingRefundSchema>;
