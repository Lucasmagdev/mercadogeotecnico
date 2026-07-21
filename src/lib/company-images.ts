import gontijoLogo from "@/assets/verified-companies/gontijo.png";
import geotesteLogo from "@/assets/verified-companies/geoteste.jpg";
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

// Company profile pictures used across product cards and company pages.
// Each company slug picks one deterministically so the same company
// always shows the same picture across the app.
const companyPhotoPool: string[] = [gontijoLogo, geotesteLogo];

// Exact logo per company slug; anything else falls back to the pool.
const companyPhotoBySlug: Record<string, string> = {
  "gontijo-fundacoes": gontijoLogo,
  geoteste: geotesteLogo,
};

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic profile picture for a company, or null when the pool is empty. */
export function getCompanyPhotoUrl(slug: string): string | null {
  if (companyPhotoBySlug[slug]) return companyPhotoBySlug[slug];
  if (companyPhotoPool.length === 0) return null;
  return companyPhotoPool[hashSlug(slug) % companyPhotoPool.length];
}
