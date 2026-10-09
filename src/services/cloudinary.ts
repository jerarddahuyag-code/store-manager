export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Uploads a local File to Cloudinary via unsigned preset.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    console.warn(
      "Cloudinary credentials missing in .env (VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET)."
    );
    throw new Error(
      "Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to upload image (${response.statusText})`
    );
  }

  const data: CloudinaryUploadResponse = await response.json();
  return data.secure_url;
}

/**
 * Generates an optimized Cloudinary thumbnail URL with width and height transformations.
 */
export function getOptimizedImageUrl(
  url: string,
  options?: { width?: number; height?: number; crop?: string }
): string {
  if (!url || !url.includes("cloudinary.com")) {
    return url;
  }

  const { width = 400, height = 400, crop = "fill" } = options || {};
  const transformation = `c_${crop},w_${width},h_${height},q_auto,f_auto`;

  // Cloudinary image format: .../upload/{transformations}/{version}/{public_id}.ext
  return url.replace("/upload/", `/upload/${transformation}/`);
}
