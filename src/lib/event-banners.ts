import { supabase } from "@/lib/supabase-client"
import { getErrorMessage } from "@/lib/errors"

const MAX_BANNER_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_BANNER_TYPES = ["image/jpeg", "image/png", "image/webp"]

type UploadEventBannerParams = {
  eventId: string
  file: File
  organizerId: string
}

export function getEventBannerValidationError(file: File) {
  if (!ALLOWED_BANNER_TYPES.includes(file.type)) {
    return "Banner must be a JPG, PNG, or WebP image."
  }

  if (file.size > MAX_BANNER_SIZE_BYTES) {
    return "Banner image must be 5MB or smaller."
  }

  return ""
}

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

export async function uploadEventBanner({ eventId, file, organizerId }: UploadEventBannerParams) {
  const validationError = getEventBannerValidationError(file)
  if (validationError) throw new Error(validationError)

  const safeFileName = sanitizeFileName(file.name) || "banner.webp"
  const filePath = `${organizerId}/${eventId}/banner-${Date.now()}-${safeFileName}`

  const { error: uploadError } = await supabase.storage
    .from("banners")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (uploadError) throw new Error(getErrorMessage(uploadError, "Banner upload failed."))

  const { data } = supabase.storage.from("banners").getPublicUrl(filePath)

  return {
    publicUrl: data.publicUrl,
    path: filePath,
  }
}
