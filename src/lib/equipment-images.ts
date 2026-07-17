import { supabase, type EquipmentRow } from "@/lib/supabase";
import { equipmentImages } from "@/lib/mock-data";

const BUCKET = "equipment-images";

/** All display URLs for a listing: uploaded photos first, stock fallback otherwise. */
export function getEquipmentImageUrls(item: Pick<EquipmentRow, "images" | "image_key">): string[] {
  if (item.images && item.images.length > 0) {
    return item.images.map(
      (path) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
    );
  }
  const key = (item.image_key ?? "excavator") as keyof typeof equipmentImages;
  return [equipmentImages[key] ?? equipmentImages.excavator];
}

export function getEquipmentCoverUrl(item: Pick<EquipmentRow, "images" | "image_key">): string {
  return getEquipmentImageUrls(item)[0];
}

/** Upload listing photos under the user's folder; returns storage paths. */
export async function uploadEquipmentImages(userId: string, files: File[]): Promise<string[]> {
  const paths: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || "image/jpeg",
    });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}
