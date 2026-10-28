import { prisma } from "@/lib/prisma";
import { EventStatus, type Event, type EventSchedule, type User } from "@prisma/client";
import {
  EventCreateSchema,
  EventUpdateSchema,
} from "@/schemas/event";

export class EventServiceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "VALIDATION_ERROR"
      | "NOT_FOUND"
      | "SLUG_EXISTS"
      | "CANNOT_DELETE_SCHEDULE_WITH_BOOKINGS"
      | "CANNOT_MODIFY_ARCHIVED"
  ) {
    super(message);
    this.name = "EventServiceError";
  }
}

export interface AdminEventSummary extends Event {
  schedules: EventSchedule[];
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    schedules: number;
  };
}

export interface ListAdminEventsOptions {
  status?: EventStatus | "ALL";
  search?: string;
  category?: string;
  take?: number;
  skip?: number;
}

/**
 * Service providing core business logic for temple event management.
 * All mutations record append-only audit logs (Security Rule 9) and soft-delete via archiving (Security Rule 6).
 */
export const eventsService = {
  /**
   * Retrieves events list with filters for the admin portal.
   */
  async listAdminEvents(options: ListAdminEventsOptions = {}): Promise<{
    events: AdminEventSummary[];
    total: number;
  }> {
    const { status, search, category, take = 50, skip = 0 } = options;

    const whereClause: Record<string, unknown> = {};

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (search && search.trim()) {
      const term = search.trim();
      whereClause.OR = [
        { title: { contains: term, mode: "insensitive" } },
        { slug: { contains: term, mode: "insensitive" } },
        { venue: { contains: term, mode: "insensitive" } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: whereClause,
        include: {
          schedules: {
            orderBy: { startsAt: "asc" },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { schedules: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.event.count({ where: whereClause }),
    ]);

    return { events: events as unknown as AdminEventSummary[], total };
  },

  /**
   * Retrieves single event by ID with all schedules, audit history, and creator info.
   */
  async getAdminEventById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        schedules: {
          include: {
            _count: {
              select: { bookings: true },
            },
          },
          orderBy: { startsAt: "asc" },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!event) {
      return null;
    }

    // Retrieve recent audit history for this event
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entity: "Event",
        entityId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return { ...event, auditLogs };
  },

  /**
   * Creates a new temple event with schedules inside a transaction and records an audit log.
   */
  async createEvent(
    rawInput: unknown,
    adminUser: User,
    ip?: string
  ): Promise<Event & { schedules: EventSchedule[] }> {
    const parseResult = EventCreateSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      throw new EventServiceError(errorMessage, "VALIDATION_ERROR");
    }

    const input = parseResult.data;

    // Check slug uniqueness
    const existing = await prisma.event.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      throw new EventServiceError(
        `An event with slug "${input.slug}" already exists.`,
        "SLUG_EXISTS"
      );
    }

    return prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: {
          title: input.title,
          slug: input.slug,
          description: input.description,
          category: input.category,
          venue: input.venue,
          images: input.images,
          status: input.status,
          createdById: adminUser.id,
          schedules: {
            create: input.schedules.map((s) => ({
              startsAt: s.startsAt,
              endsAt: s.endsAt,
              capacity: s.capacity,
              priceInPaise: s.priceInPaise,
              isBookable: s.isBookable ?? true,
            })),
          },
        },
        include: {
          schedules: true,
        },
      });

      // Security Rule 9: Append-only audit log
      await tx.auditLog.create({
        data: {
          userId: adminUser.id,
          action: "EVENT_CREATE",
          entity: "Event",
          entityId: created.id,
          meta: {
            title: created.title,
            slug: created.slug,
            category: created.category,
            status: created.status,
            schedulesCount: created.schedules.length,
          },
          ip: ip ?? null,
        },
      });

      return created;
    });
  },

  /**
   * Updates an existing event and its schedules inside a transaction and records an audit log.
   */
  async updateEvent(
    rawInput: unknown,
    adminUser: User,
    ip?: string
  ): Promise<Event & { schedules: EventSchedule[] }> {
    const parseResult = EventUpdateSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      throw new EventServiceError(errorMessage, "VALIDATION_ERROR");
    }

    const input = parseResult.data;

    const existingEvent = await prisma.event.findUnique({
      where: { id: input.id },
      include: {
        schedules: {
          include: {
            _count: {
              select: { bookings: true },
            },
          },
        },
      },
    });

    if (!existingEvent) {
      throw new EventServiceError("Event not found", "NOT_FOUND");
    }

    // Check slug uniqueness if changed
    if (input.slug && input.slug !== existingEvent.slug) {
      const slugCollision = await prisma.event.findUnique({
        where: { slug: input.slug },
      });
      if (slugCollision) {
        throw new EventServiceError(
          `Slug "${input.slug}" is already in use by another event.`,
          "SLUG_EXISTS"
        );
      }
    }

    return prisma.$transaction(async (tx) => {
      // 1. Update event details
      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.slug !== undefined) updateData.slug = input.slug;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.venue !== undefined) updateData.venue = input.venue;
      if (input.images !== undefined) updateData.images = input.images;
      if (input.status !== undefined) updateData.status = input.status;

      // 2. Handle schedules update if provided
      if (input.schedules) {
        const submittedScheduleIds = new Set(
          input.schedules.map((s) => s.id).filter(Boolean) as string[]
        );

        // Check if any removed schedule has existing bookings
        for (const existingSched of existingEvent.schedules) {
          if (!submittedScheduleIds.has(existingSched.id)) {
            if (existingSched._count.bookings > 0) {
              // Safety rule: Do not hard delete schedules that have bookings; disable bookings instead
              await tx.eventSchedule.update({
                where: { id: existingSched.id },
                data: { isBookable: false },
              });
            } else {
              await tx.eventSchedule.delete({
                where: { id: existingSched.id },
              });
            }
          }
        }

        // Upsert submitted schedules
        for (const s of input.schedules) {
          if (s.id && existingEvent.schedules.some((ex) => ex.id === s.id)) {
            await tx.eventSchedule.update({
              where: { id: s.id },
              data: {
                startsAt: s.startsAt,
                endsAt: s.endsAt,
                capacity: s.capacity,
                priceInPaise: s.priceInPaise,
                isBookable: s.isBookable ?? true,
              },
            });
          } else {
            await tx.eventSchedule.create({
              data: {
                eventId: existingEvent.id,
                startsAt: s.startsAt,
                endsAt: s.endsAt,
                capacity: s.capacity,
                priceInPaise: s.priceInPaise,
                isBookable: s.isBookable ?? true,
              },
            });
          }
        }
      }

      const updated = await tx.event.update({
        where: { id: input.id },
        data: updateData,
        include: {
          schedules: {
            orderBy: { startsAt: "asc" },
          },
        },
      });

      // Security Rule 9: Append-only audit log
      await tx.auditLog.create({
        data: {
          userId: adminUser.id,
          action: "EVENT_UPDATE",
          entity: "Event",
          entityId: updated.id,
          meta: {
            updatedFields: Object.keys(updateData),
            schedulesCount: updated.schedules.length,
          },
          ip: ip ?? null,
        },
      });

      return updated;
    });
  },

  /**
   * Security Rule 6: Events are archived (soft delete), never hard-deleted.
   * Deactivates bookability on all associated schedules and records audit log.
   */
  async archiveEvent(
    eventId: string,
    adminUser: User,
    ip?: string
  ): Promise<Event> {
    const existing = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existing) {
      throw new EventServiceError("Event not found", "NOT_FOUND");
    }

    return prisma.$transaction(async (tx) => {
      // 1. Mark event as ARCHIVED
      const archived = await tx.event.update({
        where: { id: eventId },
        data: {
          status: EventStatus.ARCHIVED,
        },
      });

      // 2. Set all associated schedules to non-bookable
      await tx.eventSchedule.updateMany({
        where: { eventId },
        data: {
          isBookable: false,
        },
      });

      // 3. Security Rule 9: Audit log
      await tx.auditLog.create({
        data: {
          userId: adminUser.id,
          action: "EVENT_ARCHIVE",
          entity: "Event",
          entityId: eventId,
          meta: {
            previousStatus: existing.status,
            archivedAt: new Date().toISOString(),
          },
          ip: ip ?? null,
        },
      });

      return archived;
    });
  },

  /**
   * Toggles the bookable flag on a specific event schedule slot.
   */
  async toggleScheduleBookable(
    scheduleId: string,
    isBookable: boolean,
    adminUser: User,
    ip?: string
  ): Promise<EventSchedule> {
    const schedule = await prisma.eventSchedule.findUnique({
      where: { id: scheduleId },
      include: { event: true },
    });

    if (!schedule) {
      throw new EventServiceError("Schedule slot not found", "NOT_FOUND");
    }

    if (schedule.event.status === EventStatus.ARCHIVED && isBookable) {
      throw new EventServiceError(
        "Cannot enable booking on an archived event.",
        "CANNOT_MODIFY_ARCHIVED"
      );
    }

    const updated = await prisma.eventSchedule.update({
      where: { id: scheduleId },
      data: { isBookable },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "SCHEDULE_TOGGLE_BOOKABLE",
        entity: "EventSchedule",
        entityId: scheduleId,
        meta: {
          eventId: schedule.eventId,
          isBookable,
        },
        ip: ip ?? null,
      },
    });

    return updated;
  },
};
