"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createEventAction, updateEventAction, uploadEventImageAction } from "@/server/events/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock,
  IndianRupee,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { Event, EventSchedule } from "@prisma/client";

// Form-specific schema accepting datetime strings from HTML datetime-local inputs
const EventFormSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters")
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000),
  category: z.string().trim().min(2, "Category is required"),
  venue: z.string().trim().min(3, "Venue must be at least 3 characters"),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "ARCHIVED"]),
  images: z.array(z.string().url("Valid image URL required")).min(1, "At least one image is required"),
  schedules: z
    .array(
      z.object({
        id: z.string().optional(),
        startsAtStr: z.string().min(1, "Start time is required"),
        endsAtStr: z.string().min(1, "End time is required"),
        capacity: z.number().int().positive("Capacity must be positive"),
        priceInRupees: z.number().nonnegative("Price cannot be negative"),
        isBookable: z.boolean(),
      })
    )
    .min(1, "At least one schedule slot is required")
    .refine(
      (slots) =>
        slots.every(
          (s) => new Date(s.endsAtStr).getTime() > new Date(s.startsAtStr).getTime()
        ),
      {
        message: "Every schedule slot's end time must be after its start time",
      }
    ),
});

type EventFormData = z.infer<typeof EventFormSchema>;

interface EventFormProps {
  initialEvent?: Event & { schedules: EventSchedule[] };
  mode: "create" | "edit";
}

function toDateTimeLocalString(date: Date): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ initialEvent, mode }: EventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [manualImageUrl, setManualImageUrl] = useState("");

  const defaultStartTime = new Date();
  defaultStartTime.setDate(defaultStartTime.getDate() + 7);
  defaultStartTime.setHours(18, 0, 0, 0);

  const defaultEndTime = new Date(defaultStartTime);
  defaultEndTime.setHours(21, 0, 0, 0);

  const defaultValues: EventFormData = {
    title: initialEvent?.title ?? "",
    slug: initialEvent?.slug ?? "",
    description: initialEvent?.description ?? "",
    category: initialEvent?.category ?? "Festival",
    venue: initialEvent?.venue ?? "Main Temple Mandapam & Sanctum",
    status: initialEvent?.status ?? "DRAFT",
    images: initialEvent?.images?.length
      ? initialEvent.images
      : ["https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&q=80&w=1200"],
    schedules: initialEvent?.schedules?.length
      ? initialEvent.schedules.map((s) => ({
          id: s.id,
          startsAtStr: toDateTimeLocalString(new Date(s.startsAt)),
          endsAtStr: toDateTimeLocalString(new Date(s.endsAt)),
          capacity: s.capacity,
          priceInRupees: s.priceInPaise / 100,
          isBookable: s.isBookable,
        }))
      : [
          {
            startsAtStr: toDateTimeLocalString(defaultStartTime),
            endsAtStr: toDateTimeLocalString(defaultEndTime),
            capacity: 100,
            priceInRupees: 251,
            isBookable: true,
          },
        ],
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(EventFormSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "schedules",
  });

  const images = useWatch({ control, name: "images" }) ?? defaultValues.images;
  const title = useWatch({ control, name: "title" }) ?? "";

  const generateSlugFromTitle = () => {
    if (!title) return;
    const generated = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setValue("slug", generated, { shouldValidate: true });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setServerError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadEventImageAction(formData);
      if (res.success && res.data) {
        setValue("images", [...images, res.data.url], { shouldValidate: true });
      } else {
        setServerError(res.error || "Image upload failed");
      }
    } catch {
      setServerError("Unexpected image upload error");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleAddManualImage = () => {
    if (!manualImageUrl.trim()) return;
    try {
      new URL(manualImageUrl);
      setValue("images", [...images, manualImageUrl.trim()], { shouldValidate: true });
      setManualImageUrl("");
    } catch {
      setServerError("Please enter a valid HTTP/HTTPS image URL");
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (images.length <= 1) {
      setServerError("At least one event image is required");
      return;
    }
    setValue(
      "images",
      images.filter((_, idx) => idx !== indexToRemove),
      { shouldValidate: true }
    );
  };

  const handleSetPrimaryImage = (indexToPrimary: number) => {
    const primary = images[indexToPrimary];
    const rest = images.filter((_, idx) => idx !== indexToPrimary);
    setValue("images", [primary, ...rest], { shouldValidate: true });
  };

  const onSubmit = (data: EventFormData) => {
    setServerError(null);

    // Transform into server schema with paise and Date objects
    const schedulesPayload = data.schedules.map((s) => ({
      id: s.id,
      startsAt: new Date(s.startsAtStr),
      endsAt: new Date(s.endsAtStr),
      capacity: s.capacity,
      priceInPaise: Math.round(s.priceInRupees * 100),
      isBookable: s.isBookable,
    }));

    startTransition(async () => {
      if (mode === "create") {
        const payload = {
          title: data.title,
          slug: data.slug,
          description: data.description,
          category: data.category,
          venue: data.venue,
          status: data.status,
          images: data.images,
          schedules: schedulesPayload,
        };

        const res = await createEventAction(payload);
        if (res.success && res.data) {
          router.push(`/admin/events/${res.data.id}`);
          router.refresh();
        } else {
          setServerError(res.error || "Failed to create event");
        }
      } else if (mode === "edit" && initialEvent) {
        const payload = {
          id: initialEvent.id,
          title: data.title,
          slug: data.slug,
          description: data.description,
          category: data.category,
          venue: data.venue,
          status: data.status,
          images: data.images,
          schedules: schedulesPayload,
        };

        const res = await updateEventAction(payload);
        if (res.success && res.data) {
          router.push(`/admin/events/${res.data.id}`);
          router.refresh();
        } else {
          setServerError(res.error || "Failed to update event");
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {serverError && (
        <div className="flex items-center gap-2 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Basic Event Information */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs space-y-4">
        <h2 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-3">
          1. General Event Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Sri Srinivasa Kalyanotsavam & Special Seva"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-[11px] text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="slug">URL Slug *</Label>
              <button
                type="button"
                onClick={generateSlugFromTitle}
                className="text-[11px] text-amber-700 hover:text-amber-800 dark:text-amber-400 flex items-center gap-1 font-medium"
              >
                <Sparkles className="h-3 w-3" />
                Generate from Title
              </button>
            </div>
            <Input
              id="slug"
              placeholder="e.g. srinivasa-kalyanotsavam-2026"
              {...register("slug")}
            />
            {errors.slug && (
              <p className="text-[11px] text-red-600">{errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              className="flex h-9 w-full rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-amber-500"
              {...register("category")}
            >
              <option value="Festival">Festival (Utsavam)</option>
              <option value="Daily Puja">Daily Puja & Seva</option>
              <option value="Kalyanotsavam">Kalyanotsavam</option>
              <option value="Abhishekam">Abhishekam & Snapanam</option>
              <option value="Homa & Havan">Homa & Havan (Yagashala)</option>
              <option value="Special Darshan">Special Darshan</option>
              <option value="Veda Parayanam">Veda Parayanam & Chanting</option>
              <option value="Cultural & Bhajan">Cultural Program & Bhajan</option>
            </select>
            {errors.category && (
              <p className="text-[11px] text-red-600">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="venue">Temple Venue / Mandapam *</Label>
            <select
              id="venue"
              className="flex h-9 w-full rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-amber-500"
              {...register("venue")}
            >
              <option value="Main Temple Mandapam & Sanctum">
                Main Temple Mandapam & Sanctum
              </option>
              <option value="Kalyana Mandapam">Kalyana Mandapam</option>
              <option value="Yagashala Courtyard">Yagashala Courtyard</option>
              <option value="Temple Outer Prakaram">Temple Outer Prakaram</option>
              <option value="Annadana Hall">Annadana Hall</option>
              <option value="Sri Venkateswara Dhyana Mandir">
                Sri Venkateswara Dhyana Mandir
              </option>
            </select>
            {errors.venue && (
              <p className="text-[11px] text-red-600">{errors.venue.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Publication Status *</Label>
            <select
              id="status"
              className="flex h-9 w-full rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-amber-500"
              {...register("status")}
            >
              <option value="DRAFT">DRAFT (Internal only)</option>
              <option value="PUBLISHED">PUBLISHED (Visible to devotees)</option>
              <option value="CANCELLED">CANCELLED (Shown as cancelled)</option>
              <option value="ARCHIVED">ARCHIVED (Soft-deleted)</option>
            </select>
            {errors.status && (
              <p className="text-[11px] text-red-600">{errors.status.message}</p>
            )}
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="description">Event Description & Seva Details *</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Describe the significance, Vedic rituals performed, prasadam offered, and attire guidelines for devotees..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-[11px] text-red-600">{errors.description.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Cloudinary Image Upload & Gallery */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div>
            <h2 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
              2. Event Media & Cover Images (Cloudinary)
            </h2>
            <p className="text-xs text-stone-500">
              Upload photos to Cloudinary or specify hosted image URLs. The first image serves as the primary cover.
            </p>
          </div>
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            {images.length} Image(s)
          </span>
        </div>

        {/* Upload Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-lg text-center bg-stone-50/50 dark:bg-stone-800/30 flex flex-col items-center justify-center space-y-2">
            <Upload className="h-6 w-6 text-stone-400" />
            <div className="text-xs text-stone-600 dark:text-stone-400">
              <label
                htmlFor="cloudinary-upload"
                className="cursor-pointer font-semibold text-amber-700 hover:text-amber-800 underline"
              >
                Click to upload file
              </label>{" "}
              (JPG, PNG, WebP up to 5MB)
            </div>
            <input
              id="cloudinary-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploadingImage}
            />
            {isUploadingImage && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading to Cloudinary...
              </div>
            )}
          </div>

          <div className="p-4 border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50/50 dark:bg-stone-800/30 flex flex-col justify-center space-y-2">
            <Label htmlFor="manual-url" className="text-[11px]">
              Or add image by URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="manual-url"
                placeholder="https://..."
                value={manualImageUrl}
                onChange={(e) => setManualImageUrl(e.target.value)}
                className="text-xs h-8"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddManualImage}
                className="shrink-0 h-8 text-xs"
              >
                Add URL
              </Button>
            </div>
          </div>
        </div>

        {errors.images && (
          <p className="text-[11px] text-red-600">{errors.images.message}</p>
        )}

        {/* Thumbnail Preview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
          {images.map((url, idx) => (
            <div
              key={idx}
              className={`group relative rounded-lg border overflow-hidden aspect-video bg-stone-100 dark:bg-stone-800 ${
                idx === 0 ? "ring-2 ring-amber-600" : "border-stone-200"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Event image ${idx + 1}`}
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 text-white">
                <div className="flex justify-between items-center">
                  {idx === 0 ? (
                    <span className="text-[9px] bg-amber-600 px-1.5 py-0.5 rounded font-bold">
                      Cover
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryImage(idx)}
                      className="text-[9px] bg-white/80 text-black hover:bg-white px-1.5 py-0.5 rounded font-medium"
                    >
                      Make Cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="p-1 rounded bg-red-600/80 hover:bg-red-600 text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {idx === 0 && (
                <div className="absolute bottom-1 left-1 bg-amber-700/90 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 group-hover:opacity-0 transition-opacity">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Cover
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Schedules & Pricing Management */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div>
            <h2 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
              3. Event Schedules, Capacity & Seva Donation (Paise)
            </h2>
            <p className="text-xs text-stone-500">
              Devotees can book slots individually. All monetary values are entered in Rupees and strictly stored as integer paise.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const nextStart = new Date();
              nextStart.setDate(nextStart.getDate() + 8);
              nextStart.setHours(9, 0, 0, 0);
              const nextEnd = new Date(nextStart);
              nextEnd.setHours(12, 0, 0, 0);

              append({
                startsAtStr: toDateTimeLocalString(nextStart),
                endsAtStr: toDateTimeLocalString(nextEnd),
                capacity: 50,
                priceInRupees: 251,
                isBookable: true,
              });
            }}
            className="text-xs h-8 text-amber-800 border-amber-300 hover:bg-amber-50"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Schedule Slot
          </Button>
        </div>

        {errors.schedules && (
          <p className="text-[11px] text-red-600">{errors.schedules.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="p-4 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
            >
              <div className="md:col-span-3 space-y-1">
                <Label className="text-[11px] flex items-center gap-1">
                  <Clock className="h-3 w-3 text-amber-600" />
                  Starts At *
                </Label>
                <Input
                  type="datetime-local"
                  className="h-8 text-xs"
                  {...register(`schedules.${index}.startsAtStr`)}
                />
              </div>

              <div className="md:col-span-3 space-y-1">
                <Label className="text-[11px] flex items-center gap-1">
                  <Clock className="h-3 w-3 text-amber-600" />
                  Ends At *
                </Label>
                <Input
                  type="datetime-local"
                  className="h-8 text-xs"
                  {...register(`schedules.${index}.endsAtStr`)}
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <Label className="text-[11px]">Seat Capacity *</Label>
                <Input
                  type="number"
                  min={1}
                  className="h-8 text-xs"
                  {...register(`schedules.${index}.capacity`, { valueAsNumber: true })}
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <Label className="text-[11px] flex items-center gap-0.5">
                  <IndianRupee className="h-3 w-3 text-amber-600" />
                  Price (₹)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  className="h-8 text-xs"
                  {...register(`schedules.${index}.priceInRupees`, { valueAsNumber: true })}
                />
              </div>

              <div className="md:col-span-1 flex items-center pb-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                    {...register(`schedules.${index}.isBookable`)}
                  />
                  <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300">
                    Open
                  </span>
                </label>
              </div>

              <div className="md:col-span-1 flex justify-end pb-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    if (fields.length <= 1) {
                      setServerError("At least one schedule slot is required.");
                      return;
                    }
                    remove(index);
                  }}
                  className="text-stone-400 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending || isUploadingImage}
          className="bg-amber-700 hover:bg-amber-800 text-white min-w-[140px]"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Saving Event...
            </>
          ) : mode === "create" ? (
            "Create Temple Event"
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
