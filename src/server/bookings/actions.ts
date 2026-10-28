"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getCurrentUser, requireAdmin } from "@/server/auth/guards";
import { bookingsService, BookingServiceError } from "./bookings.service";
import { staffService } from "@/server/staff/staff.service";
import type { BookingCreateInput, PaymentVerifyInput } from "@/schemas/booking";

async function getClientIp(): Promise<string | undefined> {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0]?.trim();
    }
    return headersList.get("x-real-ip") ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Server Action: Initiate Seva Booking & Seat Reservation
 * Security Rule 3 & 5: Amount computed on server; 15-minute seat reservation created.
 */
export async function createBookingReservationAction(payload: BookingCreateInput) {
  try {
    const user = await getCurrentUser();
    const ip = await getClientIp();

    const result = await bookingsService.reserveSeatsAndCreateBooking(
      payload,
      user?.id,
      ip
    );

    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";

    return {
      success: true,
      data: {
        bookingId: result.booking.id,
        guestToken: result.guestToken,
        isFree: result.isFree,
        amountInPaise: result.booking.amountInPaise,
        razorpayOrder: result.razorpayOrder,
        razorpayKeyId,
        guestName: result.booking.guestName,
        guestEmail: result.booking.guestEmail,
        guestPhone: result.booking.guestPhone,
        eventTitle: result.booking.schedule.event.title,
      },
    };
  } catch (error) {
    if (error instanceof BookingServiceError) {
      return { success: false, error: error.message, code: error.code };
    }
    const message = error instanceof Error ? error.message : "Failed to initiate booking";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Verify Razorpay Payment Signature and Confirm Booking
 * Security Rule 4: Idempotent processing.
 */
export async function verifyPaymentAction(payload: PaymentVerifyInput) {
  try {
    const ip = await getClientIp();
    const result = await bookingsService.confirmBookingPayment(payload, ip);

    revalidatePath(`/booking/${result.booking.id}/confirmation`);
    revalidatePath("/account/bookings");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/payments");

    return {
      success: true,
      data: {
        bookingId: result.booking.id,
        guestToken: result.booking.guestToken,
        alreadyConfirmed: result.alreadyConfirmed ?? false,
      },
    };
  } catch (error) {
    if (error instanceof BookingServiceError) {
      return { success: false, error: error.message, code: error.code };
    }
    const message = error instanceof Error ? error.message : "Payment verification failed";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Refund a Paid Booking
 * Security Rule 1: requireAdmin() checked on the server first.
 * Security Rule 7: TOTP re-authentication before sensitive refund action.
 * Security Rule 9: Logs refund to AuditLog.
 */
export async function refundBookingAction(
  bookingId: string,
  reason: string,
  totpCode?: string
) {
  try {
    const admin = await requireAdmin(false);
    const ip = await getClientIp();

    // Security Rule 7: Re-authenticate before refunds
    await staffService.verifyAdminMfa(admin.id, totpCode);

    await bookingsService.refundBooking(bookingId, reason, admin, ip);

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/payments");
    revalidatePath(`/account/bookings/${bookingId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof BookingServiceError) {
      return { success: false, error: error.message, code: error.code };
    }
    const message = error instanceof Error ? error.message : "Failed to refund booking";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Export Bookings CSV
 * Security Rule 1: requireAdmin() checked on the server first.
 * Security Rule 9: Logs data export to AuditLog.
 */
export async function exportBookingsCsvAction() {
  try {
    const admin = await requireAdmin(false);
    const ip = await getClientIp();

    const csvData = await bookingsService.exportBookingsCsv(admin, ip);

    return { success: true, csv: csvData };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export bookings";
    return { success: false, error: message };
  }
}
