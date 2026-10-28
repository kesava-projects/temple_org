import { NextRequest, NextResponse } from "next/server";
import { bookingsService, BookingServiceError } from "@/server/bookings/bookings.service";

/**
 * Route Handler: Razorpay Webhook Endpoint
 * Security Rule 4: Source of truth. Uses raw request body to verify HMAC signature.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header" },
        { status: 400 }
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0]?.trim() : undefined;

    const result = await bookingsService.handleRazorpayWebhook(
      rawBody,
      signature,
      ip
    );

    return NextResponse.json({ ...result }, { status: 200 });
  } catch (error) {
    if (error instanceof BookingServiceError && error.code === "INVALID_SIGNATURE") {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.error("[Razorpay Webhook Error]", error);
    return NextResponse.json(
      { error: "Webhook processing failure" },
      { status: 500 }
    );
  }
}
