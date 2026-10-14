import { supabase, type EquipmentRow } from "@/lib/supabase";

const BUCKET = "equipment-images";
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Uploaded listing photos, or an explicit placeholder when no photo was supplied. */
export function getEquipmentImageUrls(item: Pick<EquipmentRow, "images" | "image_key">): string[] {
  if (item.images && item.images.length > 0) {
    return item.images.map(
      (path) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
    );
  }
  return ["/listing-placeholder.svg"];
}

export function getEquipmentCoverUrl(item: Pick<EquipmentRow, "images" | "image_key">): string {
  return getEquipmentImageUrls(item)[0];
}

/** Upload listing photos under the user's folder; returns storage paths. */
export async function uploadEquipmentImages(userId: string, files: File[]): Promise<string[]> {
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Formato não permitido: ${file.name}. Use JPG, PNG ou WEBP.`);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Arquivo muito grande: ${file.name}. Limite de 8MB por imagem.`);
    }
  }

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
