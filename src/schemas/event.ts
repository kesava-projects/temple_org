import { z } from "zod";

export const EventScheduleSchema = z
  .object({
    id: z.string().optional(),
    startsAt: z.coerce.date({
      message: "Event start date and time is required",
    }),
    endsAt: z.coerce.date({
      message: "Event end date and time is required",
    }),
    capacity: z
      .number({ message: "Capacity must be a number" })
      .int("Capacity must be an integer")
      .positive("Capacity must be greater than zero"),
    priceInPaise: z
      .number({ message: "Price must be a number in paise" })
      .int("Price must be an integer in paise")
      .nonnegative("Price cannot be negative"),
    isBookable: z.boolean().default(true),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: "Event end time must be after the start time",
    path: ["endsAt"],
  });

export const EventCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title cannot exceed 120 characters"),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters")
    .max(140, "Slug cannot exceed 140 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description cannot exceed 5000 characters"),
  category: z
    .string()
    .trim()
    .min(2, "Category is required")
    .max(50, "Category cannot exceed 50 characters"),
  venue: z
    .string()
    .trim()
    .min(3, "Venue must be at least 3 characters")
    .max(150, "Venue cannot exceed 150 characters"),
  images: z
    .array(z.string().url("Must be a valid image URL"))
    .min(1, "At least one image is required")
    .max(10, "Cannot upload more than 10 images"),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "ARCHIVED"]).default("DRAFT"),
  schedules: z.array(EventScheduleSchema).min(1, "At least one schedule is required"),
});

export const EventUpdateSchema = EventCreateSchema.partial().extend({
  id: z.string().min(1, "Event ID is required"),
});

export type EventScheduleInput = z.infer<typeof EventScheduleSchema>;
export type EventCreateInput = z.infer<typeof EventCreateSchema>;
export type EventUpdateInput = z.infer<typeof EventUpdateSchema>;
