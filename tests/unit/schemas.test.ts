import { describe, it, expect } from "vitest";
import { PhoneLoginSchema, StaffInviteCreateSchema } from "@/schemas/auth";
import { EventCreateSchema, EventScheduleSchema } from "@/schemas/event";

describe("Validation Schemas (Zod)", () => {
  describe("PhoneLoginSchema", () => {
    it("should accept valid E.164 phone numbers with country codes", () => {
      const valid = PhoneLoginSchema.safeParse({ phoneNumber: "+919876543210" });
      expect(valid.success).toBe(true);
    });

    it("should reject phone numbers without country code", () => {
      const invalid = PhoneLoginSchema.safeParse({ phoneNumber: "9876543210" });
      expect(invalid.success).toBe(false);
    });
  });

  describe("StaffInviteCreateSchema", () => {
    it("should accept valid email addresses", () => {
      const valid = StaffInviteCreateSchema.safeParse({ email: "priest@temple.org" });
      expect(valid.success).toBe(true);
    });

    it("should reject invalid email strings", () => {
      const invalid = StaffInviteCreateSchema.safeParse({ email: "not-an-email" });
      expect(invalid.success).toBe(false);
    });
  });

  describe("EventScheduleSchema", () => {
    it("should accept valid schedule with positive capacity and paise price", () => {
      const now = new Date();
      const futureStart = new Date(now.getTime() + 3600000);
      const futureEnd = new Date(now.getTime() + 7200000);

      const valid = EventScheduleSchema.safeParse({
        startsAt: futureStart,
        endsAt: futureEnd,
        capacity: 50,
        priceInPaise: 50100, // 501.00 INR
        isBookable: true,
      });

      expect(valid.success).toBe(true);
    });

    it("should reject schedule where endsAt is before startsAt", () => {
      const now = new Date();
      const start = new Date(now.getTime() + 7200000);
      const end = new Date(now.getTime() + 3600000);

      const invalid = EventScheduleSchema.safeParse({
        startsAt: start,
        endsAt: end,
        capacity: 50,
        priceInPaise: 5000,
      });

      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues[0]?.message).toContain(
          "Event end time must be after the start time"
        );
      }
    });

    it("should reject negative prices in paise", () => {
      const now = new Date();
      const invalid = EventScheduleSchema.safeParse({
        startsAt: new Date(now.getTime() + 1000),
        endsAt: new Date(now.getTime() + 5000),
        capacity: 10,
        priceInPaise: -100,
      });

      expect(invalid.success).toBe(false);
    });
  });

  describe("EventCreateSchema", () => {
    it("should enforce lowercase slug with hyphens", () => {
      const now = new Date();
      const payload = {
        title: "Kalyanotsavam Special Seva",
        slug: "kalyanotsavam-special-seva",
        description: "Auspicious wedding ceremony of Sri Venkateswara Swami.",
        category: "Kalyanam",
        venue: "Main Temple Mandapam",
        images: ["https://example.com/image.jpg"],
        status: "DRAFT" as const,
        schedules: [
          {
            startsAt: new Date(now.getTime() + 10000),
            endsAt: new Date(now.getTime() + 20000),
            capacity: 100,
            priceInPaise: 100100,
            isBookable: true,
          },
        ],
      };

      const valid = EventCreateSchema.safeParse(payload);
      expect(valid.success).toBe(true);

      const invalidSlug = EventCreateSchema.safeParse({
        ...payload,
        slug: "Invalid Slug With Caps!",
      });
      expect(invalidSlug.success).toBe(false);
    });
  });
});
