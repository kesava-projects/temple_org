import { describe, it, expect, vi, beforeEach } from "vitest";
import { eventsService, EventServiceError } from "@/server/events/events.service";
import { prisma } from "@/lib/prisma";
import { EventStatus, type User, type Event, type EventSchedule, type AuditLog } from "@prisma/client";

// Mock Prisma
vi.mock("@lib/prisma", () => ({
  prisma: {
    event: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    eventSchedule: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("Events Business Logic Service (events.service.ts)", () => {
  const mockAdminUser: User = {
    id: "admin-user-123",
    email: "head-priest@temple.org",
    emailVerified: true,
    name: "Head Priest",
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

  describe("createEvent", () => {
    it("should reject creation when input fails Zod schema validation", async () => {
      const invalidPayload = {
        title: "A", // Too short (min 3)
        slug: "invalid slug with caps",
        description: "Short", // Too short (min 10)
        category: "",
        venue: "",
        images: [],
        status: "DRAFT",
        schedules: [],
      };

      await expect(
        eventsService.createEvent(invalidPayload, mockAdminUser)
      ).rejects.toThrowError(EventServiceError);

      await expect(
        eventsService.createEvent(invalidPayload, mockAdminUser)
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
      });
    });

    it("should throw SLUG_EXISTS when slug already exists in database", async () => {
      vi.spyOn(prisma.event, "findUnique").mockResolvedValueOnce({
        id: "existing-event-id",
        slug: "maha-shivaratri",
      } as unknown as Event);

      const validPayload = {
        title: "Maha Shivaratri Special",
        slug: "maha-shivaratri",
        description: "Devotional Rudrabhishekam and night vigil chanting.",
        category: "Festival",
        venue: "Main Temple Mandapam",
        images: ["https://example.com/shivaratri.jpg"],
        status: "PUBLISHED" as const,
        schedules: [
          {
            startsAt: new Date(Date.now() + 100000),
            endsAt: new Date(Date.now() + 200000),
            capacity: 200,
            priceInPaise: 50100, // 501.00 INR
            isBookable: true,
          },
        ],
      };

      await expect(
        eventsService.createEvent(validPayload, mockAdminUser)
      ).rejects.toThrowError(
        'An event with slug "maha-shivaratri" already exists.'
      );
    });

    it("should create event, schedules, and append an AuditLog entry in transaction", async () => {
      vi.spyOn(prisma.event, "findUnique").mockResolvedValueOnce(null);

      const mockCreatedEvent = {
        id: "event-new-123",
        title: "Sri Rama Navami Kalyanotsavam",
        slug: "sri-rama-navami-kalyanotsavam",
        description: "Celebration of Sri Sita Rama divine marriage.",
        category: "Kalyanam",
        venue: "Kalyana Mandapam",
        images: ["https://example.com/ram-navami.jpg"],
        status: EventStatus.PUBLISHED,
        createdById: mockAdminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        schedules: [
          {
            id: "sched-1",
            eventId: "event-new-123",
            startsAt: new Date(Date.now() + 100000),
            endsAt: new Date(Date.now() + 200000),
            capacity: 150,
            priceInPaise: 100100,
            isBookable: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      // Mock transaction execution
      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (callback) => {
          if (typeof callback !== "function") {
            throw new Error("Expected function in mock transaction");
          }
          const tx = {
            event: {
              create: vi.fn().mockResolvedValueOnce(mockCreatedEvent),
            },
            auditLog: {
              create: vi.fn().mockResolvedValueOnce({ id: "audit-1" }),
            },
          };
          return (callback as (tx: unknown) => Promise<unknown>)(tx);
        }
      );

      const payload = {
        title: "Sri Rama Navami Kalyanotsavam",
        slug: "sri-rama-navami-kalyanotsavam",
        description: "Celebration of Sri Sita Rama divine marriage.",
        category: "Kalyanam",
        venue: "Kalyana Mandapam",
        images: ["https://example.com/ram-navami.jpg"],
        status: "PUBLISHED" as const,
        schedules: [
          {
            startsAt: new Date(Date.now() + 100000),
            endsAt: new Date(Date.now() + 200000),
            capacity: 150,
            priceInPaise: 100100, // INR 1001.00 in integer paise
            isBookable: true,
          },
        ],
      };

      const result = await eventsService.createEvent(payload, mockAdminUser, "192.168.1.1");

      expect(result.id).toBe("event-new-123");
      expect(result.title).toBe("Sri Rama Navami Kalyanotsavam");
      expect(result.schedules[0]?.priceInPaise).toBe(100100);
    });
  });

  describe("archiveEvent (Security Rule 6)", () => {
    it("should soft delete an event and set all its schedules to non-bookable", async () => {
      vi.spyOn(prisma.event, "findUnique").mockResolvedValueOnce({
        id: "event-to-archive",
        status: EventStatus.PUBLISHED,
      } as unknown as Event);

      const mockArchivedEvent = {
        id: "event-to-archive",
        status: EventStatus.ARCHIVED,
      };

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (callback) => {
          if (typeof callback !== "function") {
            throw new Error("Expected function in mock transaction");
          }
          const tx = {
            event: {
              update: vi.fn().mockResolvedValueOnce(mockArchivedEvent),
            },
            eventSchedule: {
              updateMany: vi.fn().mockResolvedValueOnce({ count: 2 }),
            },
            auditLog: {
              create: vi.fn().mockResolvedValueOnce({ id: "audit-archive" }),
            },
          };
          return (callback as (tx: unknown) => Promise<unknown>)(tx);
        }
      );

      const result = await eventsService.archiveEvent("event-to-archive", mockAdminUser, "10.0.0.1");

      expect(result.status).toBe(EventStatus.ARCHIVED);
    });
  });

  describe("toggleScheduleBookable", () => {
    it("should reject re-opening bookings on an ARCHIVED event", async () => {
      vi.spyOn(prisma.eventSchedule, "findUnique").mockResolvedValueOnce({
        id: "sched-archived",
        eventId: "archived-event",
        isBookable: false,
        event: {
          id: "archived-event",
          status: EventStatus.ARCHIVED,
        },
      } as unknown as EventSchedule & { event: Event });

      await expect(
        eventsService.toggleScheduleBookable("sched-archived", true, mockAdminUser)
      ).rejects.toMatchObject({
        code: "CANNOT_MODIFY_ARCHIVED",
      });
    });

    it("should update bookable status and log audit when event is active", async () => {
      vi.spyOn(prisma.eventSchedule, "findUnique").mockResolvedValueOnce({
        id: "sched-active",
        eventId: "active-event",
        isBookable: false,
        event: {
          id: "active-event",
          status: EventStatus.PUBLISHED,
        },
      } as unknown as EventSchedule & { event: Event });

      vi.spyOn(prisma.eventSchedule, "update").mockResolvedValueOnce({
        id: "sched-active",
        eventId: "active-event",
        isBookable: true,
      } as unknown as EventSchedule);

      vi.spyOn(prisma.auditLog, "create").mockResolvedValueOnce({
        id: "audit-toggle",
      } as unknown as AuditLog);

      const result = await eventsService.toggleScheduleBookable(
        "sched-active",
        true,
        mockAdminUser
      );

      expect(result.isBookable).toBe(true);
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "SCHEDULE_TOGGLE_BOOKABLE",
            entityId: "sched-active",
          }),
        })
      );
    });
  });
});
