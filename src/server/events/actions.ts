"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "@/server/auth/guards";
import { eventsService, EventServiceError } from "./events.service";
import { uploadImageToCloudinary } from "@/server/media/cloudinary";
import type { EventCreateInput, EventUpdateInput } from "@/schemas/event";

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
 * Server Action: Create Event
 * Security Rule 1: Calls requireAdmin() on the server first.
 */
export async function createEventAction(payload: EventCreateInput) {
  try {
    const admin = await requireAdmin(false);
    const ip = await getClientIp();

    const created = await eventsService.createEvent(payload, admin, ip);

    revalidatePath("/admin/events");
    revalidatePath("/events");
    revalidatePath("/");

    return {
      success: true,
      data: {
        id: created.id,
        slug: created.slug,
        title: created.title,
      },
    };
  } catch (error) {
    if (error instanceof EventServiceError) {
      return { success: false, error: error.message, code: error.code };
    }
    const message = error instanceof Error ? error.message : "Failed to create event";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Update Event
 * Security Rule 1: Calls requireAdmin() on the server first.
 */
export async function updateEventAction(payload: EventUpdateInput) {
  try {
    const admin = await requireAdmin(false);
    const ip = await getClientIp();

    const updated = await eventsService.updateEvent(payload, admin, ip);

    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${updated.id}`);
    revalidatePath(`/admin/events/${updated.id}/edit`);
    revalidatePath("/events");
    revalidatePath(`/events/${updated.slug}`);
    revalidatePath("/");

    return {
      success: true,
      data: {
        id: updated.id,
        slug: updated.slug,
      },
    };
  } catch (error) {
    if (error instanceof EventServiceError) {
      return { success: false, error: error.message, code: error.code };
    }
    const message = error instanceof Error ? error.message : "Failed to update event";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Archive Event (Soft delete - Security Rule 6)
 * Security Rule 1: Calls requireAdmin() on the server first.
 */
export async function archiveEventAction(eventId: string) {
  try {
    const admin = await requireAdmin(false);
    const ip = await getClientIp();

    await eventsService.archiveEvent(eventId, admin, ip);

    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    if (error instanceof EventServiceError) {
      return { success: false, error: error.message, code: error.code };
    }
    const message = error instanceof Error ? error.message : "Failed to archive event";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Toggle Schedule Bookable
 * Security Rule 1: Calls requireAdmin() on the server first.
 */
export async function toggleScheduleBookableAction(
  scheduleId: string,
  isBookable: boolean
) {
  try {
    const admin = await requireAdmin(false);
    const ip = await getClientIp();

    const updated = await eventsService.toggleScheduleBookable(
      scheduleId,
      isBookable,
      admin,
      ip
    );

    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${updated.eventId}`);

    return { success: true, data: { isBookable: updated.isBookable } };
  } catch (error) {
    if (error instanceof EventServiceError) {
      return { success: false, error: error.message, code: error.code };
    }
    const message = error instanceof Error ? error.message : "Failed to update schedule";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Upload Event Image to Cloudinary
 * Security Rule 1: Calls requireAdmin() on the server first.
 */
export async function uploadEventImageAction(formData: FormData) {
  try {
    await requireAdmin(false);

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No file provided for upload" };
    }

    // Validate mime type
    const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!validMimeTypes.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Allowed formats: JPEG, PNG, WebP, AVIF",
      };
    }

    // Validate size (max 5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        success: false,
        error: "File size exceeds 5MB limit",
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadImageToCloudinary(buffer, {
      folder: "temple-org/events",
      filename: file.name.replace(/\.[^/.]+$/, ""),
    });

    return {
      success: true,
      data: {
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image upload failed";
    return { success: false, error: message };
  }
}
