import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary SDK
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = Boolean(
  cloudName &&
    apiKey &&
    apiSecret &&
    !cloudName.includes("placeholder") &&
    !apiKey.includes("placeholder")
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

/**
 * Uploads an image buffer to Cloudinary.
 * Falls back to a deterministic placeholder in development if credentials are placeholders.
 */
export async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  options: {
    folder?: string;
    filename?: string;
    tags?: string[];
  } = {}
): Promise<CloudinaryUploadResult> {
  const folder = options.folder || "temple-org/events";

  if (!isConfigured) {
    // Development fallback when credentials are not configured
    const timestamp = Date.now();
    const mockPublicId = `${folder}/mock_${timestamp}`;

    console.warn(
      `[Cloudinary] Real credentials not set. Simulated upload for: ${mockPublicId}`
    );

    return {
      url: `https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&q=80&w=1200&t=${timestamp}`,
      publicId: mockPublicId,
      width: 1200,
      height: 800,
      format: "jpg",
      bytes: fileBuffer.length,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        tags: options.tags || ["temple-event"],
        allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
        transformation: [
          { quality: "auto:eco" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) {
          return reject(
            new Error(
              `Cloudinary upload error: ${error?.message || "Unknown error"}`
            )
          );
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Deletes an image from Cloudinary by public ID.
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<boolean> {
  if (!isConfigured || publicId.startsWith("temple-org/events/mock_")) {
    return true;
  }

  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
    return res.result === "ok";
  } catch (error) {
    console.error("[Cloudinary Delete Error]", error);
    return false;
  }
}
