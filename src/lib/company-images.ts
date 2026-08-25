import { supabase } from "@/lib/supabase";

const BUCKET = "company-images";
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Public URL for an uploaded company logo/banner storage path. */
export function getCompanyImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Upload a company logo or banner under the owner's folder; returns the storage path. */
export async function uploadCompanyImage(
  userId: string,
  file: File,
  kind: "logo" | "banner",
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Formato não permitido. Use JPG, PNG ou WEBP.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Arquivo muito grande. Limite de 8MB.");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${kind}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;
  return path;
}
