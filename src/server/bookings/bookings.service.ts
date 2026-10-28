import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { BookingStatus, PaymentStatus, type Booking, type User } from "@prisma/client";
import {
  BookingCreateSchema,
  PaymentVerifySchema,
  type BookingCreateInput,
} from "@/schemas/booking";
import { razorpayService } from "@/server/payments/razorpay";
import { communications } from "@/server/notifications/communications";

export class BookingServiceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "VALIDATION_ERROR"
      | "NOT_FOUND"
      | "INSUFFICIENT_SEATS"
      | "SCHEDULE_NOT_BOOKABLE"
      | "INVALID_SIGNATURE"
      | "ALREADY_PROCESSED"
      | "CANNOT_REFUND"
      | "UNAUTHORIZED"
  ) {
    super(message);
    this.name = "BookingServiceError";
  }
}

export const bookingsService = {
  /**
   * Security Rule 3: Amount computed strictly on the server from database.
   * Security Rule 5: Seat reservation transaction with 15-minute hold.
   */
  async reserveSeatsAndCreateBooking(
    rawInput: unknown,
    sessionUserId?: string | null,
    ip?: string
  ) {
    const parseResult = BookingCreateSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const msg = parseResult.error.issues.map((i) => i.message).join(", ");
      throw new BookingServiceError(msg, "VALIDATION_ERROR");
    }

    const input: BookingCreateInput = parseResult.data;

    return prisma.$transaction(async (tx) => {
      // 1. Fetch Schedule & Event
      const schedule = await tx.eventSchedule.findUnique({
        where: { id: input.scheduleId },
        include: { event: true },
      });

      if (!schedule || !schedule.isBookable || schedule.event.status !== "PUBLISHED") {
        throw new BookingServiceError(
          "This puja schedule is currently not available for booking.",
          "SCHEDULE_NOT_BOOKABLE"
        );
      }

      const now = new Date();

      // 2. Security Rule 5: Calculate actively reserved seats (PAID or non-expired PENDING)
      const activeBookings = await tx.booking.findMany({
        where: {
          scheduleId: input.scheduleId,
          OR: [
            { status: BookingStatus.PAID },
            {
              status: BookingStatus.PENDING,
              expiresAt: { gt: now },
            },
          ],
        },
        select: { quantity: true },
      });

      const reservedSeatsCount = activeBookings.reduce(
        (sum, b) => sum + b.quantity,
        0
      );

      const availableSeats = schedule.capacity - reservedSeatsCount;

      if (input.quantity > availableSeats) {
        throw new BookingServiceError(
          `Only ${Math.max(0, availableSeats)} seat(s) remaining for this muhurtham.`,
          "INSUFFICIENT_SEATS"
        );
      }

      // 3. Security Rule 3: Never accept amount from client; compute from DB
      const amountInPaise = schedule.priceInPaise * input.quantity;

      // 4. Security Rule 2: Unguessable token for guest confirmation access
      const guestToken = crypto.randomBytes(32).toString("hex");

      // 5. 15-Minute Seat Reservation Hold
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Handle Free Puja vs Paid Puja
      if (amountInPaise === 0) {
        // Free Seva: confirm immediately
        const booking = await tx.booking.create({
          data: {
            scheduleId: schedule.id,
            userId: sessionUserId ?? null,
            guestName: input.guestName,
            guestEmail: input.guestEmail,
            guestPhone: input.guestPhone,
            quantity: input.quantity,
            amountInPaise: 0,
            status: BookingStatus.PAID,
            guestToken,
            expiresAt,
          },
          include: {
            schedule: {
              include: { event: true },
            },
          },
        });

        const mockFreeOrderId = `free_order_${booking.id}`;
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            razorpayOrderId: mockFreeOrderId,
            status: PaymentStatus.SUCCESS,
          },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            userId: sessionUserId ?? null,
            action: "FREE_BOOKING_CONFIRMED",
            entity: "Booking",
            entityId: booking.id,
            meta: {
              eventTitle: schedule.event.title,
              quantity: booking.quantity,
            },
            ip: ip ?? null,
          },
        });

        // Trigger notifications asynchronously
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://temple.org";
        const confirmationUrl = `${siteUrl}/booking/${booking.id}/confirmation?token=${guestToken}`;

        void communications.sendBookingConfirmationEmail({
          to: booking.guestEmail,
          devoteeName: booking.guestName,
          eventTitle: schedule.event.title,
          startsAt: schedule.startsAt,
          venue: schedule.event.venue,
          quantity: booking.quantity,
          amountInPaise: 0,
          confirmationUrl,
          bookingId: booking.id,
        });

        void communications.sendBookingConfirmationSms({
          to: booking.guestPhone,
          devoteeName: booking.guestName,
          eventTitle: schedule.event.title,
          startsAt: schedule.startsAt,
          bookingId: booking.id,
        });

        return {
          booking,
          guestToken,
          isFree: true,
          razorpayOrder: null,
        };
      }

      // Paid Seva: Create PENDING Booking + Razorpay Order
      const booking = await tx.booking.create({
        data: {
          scheduleId: schedule.id,
          userId: sessionUserId ?? null,
          guestName: input.guestName,
          guestEmail: input.guestEmail,
          guestPhone: input.guestPhone,
          quantity: input.quantity,
          amountInPaise,
          status: BookingStatus.PENDING,
          guestToken,
          expiresAt,
        },
        include: {
          schedule: {
            include: { event: true },
          },
        },
      });

      // Create Razorpay Order
      const rzpOrder = await razorpayService.createOrder({
        amountInPaise,
        receipt: booking.id,
        notes: {
          bookingId: booking.id,
          eventTitle: schedule.event.title,
          devoteeName: input.guestName,
        },
      });

      // Create PENDING Payment entry
      const payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          razorpayOrderId: rzpOrder.id,
          status: PaymentStatus.PENDING,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: sessionUserId ?? null,
          action: "BOOKING_RESERVATION_CREATED",
          entity: "Booking",
          entityId: booking.id,
          meta: {
            eventTitle: schedule.event.title,
            amountInPaise,
            razorpayOrderId: rzpOrder.id,
            expiresAt: expiresAt.toISOString(),
          },
          ip: ip ?? null,
        },
      });

      return {
        booking,
        payment,
        razorpayOrder: rzpOrder,
        guestToken,
        isFree: false,
      };
    });
  },

  /**
   * Security Rule 4: Source of truth verification & idempotent confirmation.
   * Never double-confirms a booking.
   */
  async confirmBookingPayment(
    rawInput: unknown,
    ip?: string
  ): Promise<{ success: boolean; booking: Booking; alreadyConfirmed?: boolean }> {
    const parseResult = PaymentVerifySchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new BookingServiceError("Invalid payment verification payload", "VALIDATION_ERROR");
    }

    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      parseResult.data;

    // Verify signature
    const isValidSignature = razorpayService.verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValidSignature) {
      // Record failed payment attempt
      await prisma.payment.updateMany({
        where: { razorpayOrderId },
        data: { status: PaymentStatus.FAILED },
      });
      throw new BookingServiceError("Payment signature verification failed.", "INVALID_SIGNATURE");
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        schedule: {
          include: { event: true },
        },
      },
    });

    if (!existingBooking) {
      throw new BookingServiceError("Booking not found", "NOT_FOUND");
    }

    // Idempotent check: if already confirmed, do not double-confirm
    if (existingBooking.status === BookingStatus.PAID) {
      return { success: true, booking: existingBooking, alreadyConfirmed: true };
    }

    return prisma.$transaction(async (tx) => {
      // 1. Mark Payment SUCCESS
      await tx.payment.updateMany({
        where: { razorpayOrderId },
        data: {
          razorpayPaymentId,
          signature: razorpaySignature,
          status: PaymentStatus.SUCCESS,
        },
      });

      // 2. Mark Booking PAID
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.PAID,
        },
        include: {
          schedule: {
            include: { event: true },
          },
        },
      });

      // 3. Security Rule 9: Audit Log
      await tx.auditLog.create({
        data: {
          userId: updatedBooking.userId ?? null,
          action: "BOOKING_PAYMENT_CONFIRMED",
          entity: "Booking",
          entityId: updatedBooking.id,
          meta: {
            razorpayOrderId,
            razorpayPaymentId,
            amountInPaise: updatedBooking.amountInPaise,
          },
          ip: ip ?? null,
        },
      });

      // 4. Send Confirmation Notifications
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://temple.org";
      const confirmationUrl = `${siteUrl}/booking/${updatedBooking.id}/confirmation?token=${updatedBooking.guestToken}`;

      void communications.sendBookingConfirmationEmail({
        to: updatedBooking.guestEmail,
        devoteeName: updatedBooking.guestName,
        eventTitle: updatedBooking.schedule.event.title,
        startsAt: updatedBooking.schedule.startsAt,
        venue: updatedBooking.schedule.event.venue,
        quantity: updatedBooking.quantity,
        amountInPaise: updatedBooking.amountInPaise,
        confirmationUrl,
        bookingId: updatedBooking.id,
      });

      void communications.sendBookingConfirmationSms({
        to: updatedBooking.guestPhone,
        devoteeName: updatedBooking.guestName,
        eventTitle: updatedBooking.schedule.event.title,
        startsAt: updatedBooking.schedule.startsAt,
        bookingId: updatedBooking.id,
      });

      return { success: true, booking: updatedBooking };
    });
  },

  /**
   * Security Rule 4: Webhook handler as source of truth.
   * Verifies signature with raw body and updates idempotently.
   */
  async handleRazorpayWebhook(
    rawBody: string,
    signature: string,
    ip?: string
  ): Promise<{ received: boolean; status: string }> {
    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error("[Webhook Error] Razorpay signature mismatch");
      throw new BookingServiceError("Invalid webhook signature", "INVALID_SIGNATURE");
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    // Handle payment.captured or order.paid
    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id || payload.payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;

      if (!orderId) {
        return { received: true, status: "ignored_no_order_id" };
      }

      const existingPayment = await prisma.payment.findUnique({
        where: { razorpayOrderId: orderId },
        include: {
          booking: {
            include: {
              schedule: {
                include: { event: true },
              },
            },
          },
        },
      });

      if (!existingPayment) {
        return { received: true, status: "order_not_found" };
      }

      // Idempotency: if booking already confirmed, don't double confirm
      if (existingPayment.booking.status === BookingStatus.PAID) {
        return { received: true, status: "already_confirmed" };
      }

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            razorpayPaymentId: paymentId,
            status: PaymentStatus.SUCCESS,
            rawPayload: payload,
          },
        });

        await tx.booking.update({
          where: { id: existingPayment.bookingId },
          data: {
            status: BookingStatus.PAID,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: existingPayment.booking.userId,
            action: "WEBHOOK_BOOKING_CONFIRMED",
            entity: "Booking",
            entityId: existingPayment.bookingId,
            meta: {
              event,
              razorpayOrderId: orderId,
              razorpayPaymentId: paymentId,
            },
            ip: ip ?? "webhook",
          },
        });
      });

      // Dispatch notifications
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://temple.org";
      const confirmationUrl = `${siteUrl}/booking/${existingPayment.booking.id}/confirmation?token=${existingPayment.booking.guestToken}`;

      void communications.sendBookingConfirmationEmail({
        to: existingPayment.booking.guestEmail,
        devoteeName: existingPayment.booking.guestName,
        eventTitle: existingPayment.booking.schedule.event.title,
        startsAt: existingPayment.booking.schedule.startsAt,
        venue: existingPayment.booking.schedule.event.venue,
        quantity: existingPayment.booking.quantity,
        amountInPaise: existingPayment.booking.amountInPaise,
        confirmationUrl,
        bookingId: existingPayment.booking.id,
      });

      return { received: true, status: "confirmed" };
    }

    return { received: true, status: "event_unhandled" };
  },

  /**
   * Security Rule 2: Users may only read their own bookings; always filter by session user id.
   */
  async getDevoteeBooking(bookingId: string, devoteeUserId: string) {
    return prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: devoteeUserId,
      },
      include: {
        schedule: {
          include: { event: true },
        },
        payments: true,
      },
    });
  },

  /**
   * Security Rule 2: Guest confirmation pages require an unguessable token.
   */
  async getGuestBookingByToken(bookingId: string, guestToken: string) {
    return prisma.booking.findFirst({
      where: {
        id: bookingId,
        guestToken,
      },
      include: {
        schedule: {
          include: { event: true },
        },
        payments: true,
      },
    });
  },

  /**
   * Security Rule 2: List bookings filtered strictly by authenticated session user id.
   */
  async listDevoteeBookings(devoteeUserId: string) {
    return prisma.booking.findMany({
      where: {
        userId: devoteeUserId,
      },
      include: {
        schedule: {
          include: { event: true },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Admin Portal: List bookings with filters & pagination.
   */
  async listAdminBookings(options: {
    status?: BookingStatus | "ALL";
    search?: string;
    take?: number;
    skip?: number;
  } = {}) {
    const { status, search, take = 50, skip = 0 } = options;

    const whereClause: Record<string, unknown> = {};

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (search && search.trim()) {
      const term = search.trim();
      whereClause.OR = [
        { guestName: { contains: term, mode: "insensitive" } },
        { guestEmail: { contains: term, mode: "insensitive" } },
        { guestPhone: { contains: term, mode: "insensitive" } },
        { id: { contains: term, mode: "insensitive" } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        include: {
          schedule: {
            include: { event: true },
          },
          payments: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.booking.count({ where: whereClause }),
    ]);

    return { bookings, total };
  },

  /**
   * Admin Portal: Export bookings as CSV string.
   * Security Rule 9: Logs data export to AuditLog.
   */
  async exportBookingsCsv(adminUser: User, ip?: string): Promise<string> {
    const bookings = await prisma.booking.findMany({
      include: {
        schedule: {
          include: { event: true },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Booking ID",
      "Event Title",
      "Muhurtham Date",
      "Devotee Name",
      "Devotee Email",
      "Devotee Phone",
      "Tickets",
      "Amount (INR)",
      "Status",
      "Razorpay Payment ID",
      "Booked At",
    ];

    const rows = bookings.map((b) => {
      const payment = b.payments.find((p) => p.status === PaymentStatus.SUCCESS);
      return [
        b.id,
        `"${b.schedule.event.title.replace(/"/g, '""')}"`,
        `"${new Date(b.schedule.startsAt).toISOString()}"`,
        `"${b.guestName.replace(/"/g, '""')}"`,
        b.guestEmail,
        b.guestPhone,
        b.quantity,
        (b.amountInPaise / 100).toFixed(2),
        b.status,
        payment?.razorpayPaymentId || "N/A",
        `"${new Date(b.createdAt).toISOString()}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    // Security Rule 9: Log export to AuditLog
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "BOOKINGS_EXPORT_CSV",
        entity: "Booking",
        meta: {
          count: bookings.length,
          exportedAt: new Date().toISOString(),
        },
        ip: ip ?? null,
      },
    });

    return csvContent;
  },

  /**
   * Admin Portal: Refund Booking.
   * Calls Razorpay refunds API, marks Booking and Payment as REFUNDED, and logs to AuditLog.
   */
  async refundBooking(
    bookingId: string,
    reason: string,
    adminUser: User,
    ip?: string
  ): Promise<Booking> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: true,
        schedule: { include: { event: true } },
      },
    });

    if (!booking) {
      throw new BookingServiceError("Booking not found", "NOT_FOUND");
    }

    if (booking.status !== BookingStatus.PAID) {
      throw new BookingServiceError("Only PAID bookings can be refunded.", "CANNOT_REFUND");
    }

    const successfulPayment = booking.payments.find(
      (p) => p.status === PaymentStatus.SUCCESS
    );

    let refundResult = { id: `manual_refund_${Date.now()}`, status: "processed" };

    if (successfulPayment?.razorpayPaymentId) {
      refundResult = await razorpayService.refundPayment(
        successfulPayment.razorpayPaymentId,
        booking.amountInPaise
      );
    }

    return prisma.$transaction(async (tx) => {
      // 1. Update Payment status
      if (successfulPayment) {
        await tx.payment.update({
          where: { id: successfulPayment.id },
          data: {
            status: PaymentStatus.REFUNDED,
            rawPayload: { refundResult, reason },
          },
        });
      }

      // 2. Update Booking status
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.REFUNDED,
        },
      });

      // 3. Security Rule 9: Audit Log
      await tx.auditLog.create({
        data: {
          userId: adminUser.id,
          action: "BOOKING_REFUND",
          entity: "Booking",
          entityId: bookingId,
          meta: {
            reason,
            amountInPaise: booking.amountInPaise,
            refundResult,
          },
          ip: ip ?? null,
        },
      });

      return updatedBooking;
    });
  },

  /**
   * Lists all recorded payments for the Admin Payments dashboard.
   */
  async listAdminPayments(options: { take?: number; skip?: number } = {}) {
    const { take = 50, skip = 0 } = options;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        include: {
          booking: {
            include: {
              schedule: {
                include: { event: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.payment.count(),
    ]);

    return { payments, total };
  },
};
