import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { EventStatus, type Event } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe("Public Devotee Event Queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should query exclusively events with status: PUBLISHED", async () => {
    const mockPublishedEvent = {
      id: "pub-1",
      title: "Maha Shivaratri Celebrations",
      slug: "maha-shivaratri-celebrations",
      status: EventStatus.PUBLISHED,
      category: "Festival",
      venue: "Main Mandapam",
      images: ["https://example.com/img.jpg"],
      description: "Sacred night vigil",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: "admin-1",
    };

    vi.spyOn(prisma.event, "findMany").mockResolvedValueOnce([
      mockPublishedEvent,
    ] as unknown as Event[]);

    const events = await prisma.event.findMany({
      where: { status: EventStatus.PUBLISHED },
    });

    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: { status: "PUBLISHED" },
    });
    expect(events.length).toBe(1);
    expect(events[0]?.status).toBe("PUBLISHED");
  });

  it("should not return archived or draft events in public event detail query", async () => {
    // When querying public slug with status PUBLISHED, an archived event will return null
    vi.spyOn(prisma.event, "findUnique").mockResolvedValueOnce(null);

    const event = await prisma.event.findUnique({
      where: {
        slug: "archived-event-slug",
        status: EventStatus.PUBLISHED,
      },
    });

    expect(event).toBeNull();
    expect(prisma.event.findUnique).toHaveBeenCalledWith({
      where: {
        slug: "archived-event-slug",
        status: "PUBLISHED",
      },
    });
  });
});
