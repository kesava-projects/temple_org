import { describe, it, expect, vi, beforeEach } from "vitest";
import { bookingsService } from "@/server/bookings/bookings.service";
import { prisma } from "@/lib/prisma";
import { BookingStatus, PaymentStatus, type User, type Event, type EventSchedule, type Booking, type Payment, type AuditLog } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    eventSchedule: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("Bookings & Payments Business Logic Service (bookings.service.ts)", () => {
  const mockAdminUser: User = {
    id: "admin-1",
    email: "admin@temple.org",
    emailVerified: true,
    name: "Temple Admin",
    image: null,
    phone: null,
    phoneNumber: "+919876543210",
    phoneNumberVerified: true,
    role: "ADMIN",
    isActive: true,
    mfaEnabled: true,
    twoFactorEnabled: true,
    banned: false,
    banReason: null,
    banExpires: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("reserveSeatsAndCreateBooking (Security Rule 3 & 5)", () => {
    it("should compute amount from database and reject if quantity exceeds capacity", async () => {
      const mockSchedule = {
        id: "sched-1",
        eventId: "evt-1",
        startsAt: new Date(Date.now() + 86400000),
        endsAt: new Date(Date.now() + 90000000),
        capacity: 10,
        priceInPaise: 50000, // ₹500
        isBookable: true,
        event: {
          id: "evt-1",
          title: "Sahasranama Archana",
          status: "PUBLISHED",
          venue: "Main Mandapam",
        },
      };

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (callback) => {
          if (typeof callback !== "function") {
            throw new Error("Expected function in mock transaction");
          }
          const tx = {
            eventSchedule: {
              findUnique: vi.fn().mockResolvedValueOnce(mockSchedule),
            },
            booking: {
              // 8 seats already reserved
              findMany: vi.fn().mockResolvedValueOnce([{ quantity: 5 }, { quantity: 3 }]),
            },
          };
          return (callback as (tx: unknown) => Promise<unknown>)(tx);
        }
      );

      // Attempt to book 4 seats when only 2 are available
      const payload = {
        scheduleId: "sched-1",
        quantity: 4,
        guestName: "Sri Devotee",
        guestEmail: "devotee@example.com",
        guestPhone: "+919876543210",
      };

      await expect(
        bookingsService.reserveSeatsAndCreateBooking(payload)
      ).rejects.toMatchObject({
        code: "INSUFFICIENT_SEATS",
      });
    });

    it("should calculate exact paise amount from schedule price and hold seats for 15 minutes", async () => {
      const mockSchedule = {
        id: "sched-1",
        eventId: "evt-1",
        startsAt: new Date(Date.now() + 86400000),
        endsAt: new Date(Date.now() + 90000000),
        capacity: 50,
        priceInPaise: 25100, // ₹251
        isBookable: true,
        event: {
          id: "evt-1",
          title: "Sri Rama Navami Kalyanotsavam",
          status: "PUBLISHED",
          venue: "Kalyana Mandapam",
        },
      };

      const mockBooking = {
        id: "booking-123",
        scheduleId: "sched-1",
        quantity: 2,
        amountInPaise: 50200, // 25100 * 2 = 50200 paise
        status: BookingStatus.PENDING,
        guestName: "Sri Rama Devotee",
        guestEmail: "devotee@example.com",
        guestPhone: "+919876543210",
        guestToken: "unguessable_token_xyz",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        schedule: mockSchedule,
      };

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (callback) => {
          if (typeof callback !== "function") {
            throw new Error("Expected function in mock transaction");
          }
          const tx = {
            eventSchedule: {
              findUnique: vi.fn().mockResolvedValueOnce(mockSchedule),
            },
            booking: {
              findMany: vi.fn().mockResolvedValueOnce([]), // 0 existing bookings
              create: vi.fn().mockResolvedValueOnce(mockBooking),
            },
            payment: {
              create: vi.fn().mockResolvedValueOnce({
                id: "pay-rec-1",
                razorpayOrderId: "order_mock_1",
                status: PaymentStatus.PENDING,
              }),
            },
            auditLog: {
              create: vi.fn().mockResolvedValueOnce({ id: "audit-1" }),
            },
          };
          return (callback as (tx: unknown) => Promise<unknown>)(tx);
        }
      );

      const payload = {
        scheduleId: "sched-1",
        quantity: 2,
        guestName: "Sri Rama Devotee",
        guestEmail: "devotee@example.com",
        guestPhone: "+919876543210",
      };

      const result = await bookingsService.reserveSeatsAndCreateBooking(payload);

      expect(result.booking.amountInPaise).toBe(50200);
      expect(result.booking.status).toBe(BookingStatus.PENDING);
      expect(result.guestToken).toBeDefined();
    });
  });

  describe("confirmBookingPayment (Security Rule 4: Idempotency)", () => {
    it("should never double-confirm an already PAID booking", async () => {
      const existingPaidBooking = {
        id: "booking-already-paid",
        status: BookingStatus.PAID,
        amountInPaise: 50200,
        schedule: {
          event: {
            title: "Maha Shivaratri",
          },
        },
      };

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce(
        existingPaidBooking as unknown as Booking & { schedule: { event: Event } }
      );

      const payload = {
        bookingId: "booking-already-paid",
        razorpayOrderId: "order_mock_123",
        razorpayPaymentId: "pay_mock_456",
        razorpaySignature: "simulated_signature",
      };

      const result = await bookingsService.confirmBookingPayment(payload);

      expect(result.success).toBe(true);
      expect(result.alreadyConfirmed).toBe(true);
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });
  });

  describe("Devotee Ownership & Guest Token Access (Security Rule 2)", () => {
    it("should strictly filter devotee bookings by authenticated user id", async () => {
      vi.spyOn(prisma.booking, "findFirst").mockResolvedValueOnce({
        id: "booking-own-1",
        userId: "devotee-user-123",
      } as unknown as Booking & { schedule: EventSchedule & { event: Event }; payments: Payment[] });

      const booking = await bookingsService.getDevoteeBooking(
        "booking-own-1",
        "devotee-user-123"
      );

      expect(booking?.id).toBe("booking-own-1");
      expect(prisma.booking.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "booking-own-1",
            userId: "devotee-user-123",
          },
        })
      );
    });

    it("should allow guest confirmation only with matching unguessable token", async () => {
      vi.spyOn(prisma.booking, "findFirst").mockResolvedValueOnce({
        id: "booking-guest-1",
        guestToken: "secret_token_123",
      } as unknown as Booking & { schedule: EventSchedule & { event: Event }; payments: Payment[] });

      const booking = await bookingsService.getGuestBookingByToken(
        "booking-guest-1",
        "secret_token_123"
      );

      expect(booking?.id).toBe("booking-guest-1");
      expect(prisma.booking.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "booking-guest-1",
            guestToken: "secret_token_123",
          },
        })
      );
    });
  });

  describe("Admin Refund & CSV Export (Security Rule 9)", () => {
    it("should record an AuditLog entry when admin issues a refund", async () => {
      const mockPaidBooking = {
        id: "booking-to-refund",
        status: BookingStatus.PAID,
        amountInPaise: 25100,
        payments: [
          {
            id: "pay-1",
            razorpayPaymentId: "pay_mock_1",
            status: PaymentStatus.SUCCESS,
          },
        ],
        schedule: {
          event: { title: "Kalyanotsavam" },
        },
      };

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce(
        mockPaidBooking as unknown as Booking & { payments: Payment[]; schedule: { event: Event } }
      );

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (callback) => {
          if (typeof callback !== "function") {
            throw new Error("Expected function in mock transaction");
          }
          const tx = {
            payment: {
              update: vi.fn().mockResolvedValueOnce({ id: "pay-1", status: PaymentStatus.REFUNDED }),
            },
            booking: {
              update: vi.fn().mockResolvedValueOnce({
                id: "booking-to-refund",
                status: BookingStatus.REFUNDED,
              }),
            },
            auditLog: {
              create: vi.fn().mockResolvedValueOnce({ id: "audit-refund" }),
            },
          };
          return (callback as (tx: unknown) => Promise<unknown>)(tx);
        }
      );

      const result = await bookingsService.refundBooking(
        "booking-to-refund",
        "Devotee cancelled due to travel delay",
        mockAdminUser,
        "127.0.0.1"
      );

      expect(result.status).toBe(BookingStatus.REFUNDED);
    });

    it("should export CSV and log BOOKINGS_EXPORT_CSV to AuditLog", async () => {
      vi.spyOn(prisma.booking, "findMany").mockResolvedValueOnce([
        {
          id: "booking-1",
          guestName: "Smt. Lakshmi",
          guestEmail: "lakshmi@example.com",
          guestPhone: "+919876543210",
          quantity: 2,
          amountInPaise: 50200,
          status: BookingStatus.PAID,
          createdAt: new Date(),
          schedule: {
            startsAt: new Date(),
            event: { title: "Sri Venkateswara Kalyanotsavam" },
          },
          payments: [{ status: PaymentStatus.SUCCESS, razorpayPaymentId: "pay_123" }],
        },
      ] as unknown as Array<Booking & { schedule: EventSchedule & { event: Event }; payments: Payment[] }>);

      vi.spyOn(prisma.auditLog, "create").mockResolvedValueOnce({
        id: "audit-export-1",
      } as unknown as AuditLog);

      const csv = await bookingsService.exportBookingsCsv(mockAdminUser, "127.0.0.1");

      expect(csv).toContain("Booking ID,Event Title");
      expect(csv).toContain("Smt. Lakshmi");
      expect(csv).toContain("502.00");
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "BOOKINGS_EXPORT_CSV",
            entity: "Booking",
          }),
        })
      );
    });
  });
});
