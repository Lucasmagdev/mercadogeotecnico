import { z } from "zod";

export const AI_MAX_IMAGE_BYTES = 1024 * 1024;
export const AI_MAX_TOTAL_IMAGE_BYTES = 3 * 1024 * 1024;
export const AI_MAX_AUDIO_BYTES = 3 * 1024 * 1024;
export const AI_MAX_NOTE_LENGTH = 4000;
export const AI_MAX_RECORD_SECONDS = 60;

function base64Schema(maxBytes: number) {
  return z
    .string()
    .min(4, "Arquivo vazio.")
    .max(Math.ceil(maxBytes / 3) * 4, "Arquivo acima do limite permitido.")
    .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/, {
      message: "Arquivo base64 inválido.",
    })
    .refine((value) => decodedBase64Bytes(value) <= maxBytes, "Arquivo acima do limite permitido.");
}

export function decodedBase64Bytes(value: string) {
  return (value.length / 4) * 3 - (value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0);
}

function fileHeader(base64: string) {
  try {
    return atob(base64.slice(0, 24));
  } catch {
    return "";
  }
}

function imageMatchesType(image: { mediaType: string; base64: string }) {
  const header = fileHeader(image.base64);
  if (image.mediaType === "image/jpeg") return header.startsWith("\xff\xd8\xff");
  if (image.mediaType === "image/png") return header.startsWith("\x89PNG\r\n\x1a\n");
  return header.startsWith("RIFF") && header.slice(8, 12) === "WEBP";
}

function audioMatchesType(audio: { mediaType: string; base64: string }) {
  const header = fileHeader(audio.base64);
  switch (audio.mediaType.split(";")[0]) {
    case "audio/webm":
      return header.startsWith("\x1a\x45\xdf\xa3");
    case "audio/ogg":
      return header.startsWith("OggS");
    case "audio/mp4":
      return header.slice(4, 8) === "ftyp";
    case "audio/mpeg":
      return (
        header.startsWith("ID3") ||
        (header.charCodeAt(0) === 255 && (header.charCodeAt(1) & 224) === 224)
      );
    default:
      return header.startsWith("RIFF") && header.slice(8, 12) === "WAVE";
  }
}

export const DraftInputSchema = z
  .object({
    images: z
      .array(
        z
          .object({
            mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
            base64: base64Schema(AI_MAX_IMAGE_BYTES),
          })
          .strict()
          .refine(imageMatchesType, "O conteúdo da imagem não corresponde ao formato informado."),
      )
      .max(4, "Use até quatro fotos por solicitação."),
    note: z.string().trim().max(AI_MAX_NOTE_LENGTH, "Use até 4.000 caracteres na observação."),
    categories: z
      .array(
        z
          .object({
            slug: z
              .string()
              .min(1)
              .max(80)
              .regex(/^[a-z0-9-]+$/),
            name: z.string().trim().min(1).max(100),
          })
          .strict(),
      )
      .min(1)
      .max(40),
  })
  .strict()
  .refine((data) => data.images.length > 0 || data.note.length > 0, {
    message: "Envie ao menos uma foto ou escreva uma observação.",
  })
  .refine(
    (data) =>
      data.images.reduce((total, image) => total + decodedBase64Bytes(image.base64), 0) <=
      AI_MAX_TOTAL_IMAGE_BYTES,
    { message: "As fotos juntas devem ter até 3 MB." },
  );

export const SpecInputSchema = z
  .object({
    categoryName: z.string().trim().min(1).max(100),
    itemName: z.string().trim().min(1, "Informe o título do anúncio primeiro.").max(200),
  })
  .strict();

export const VoiceInputSchema = z
  .object({
    mediaType: z.enum([
      "audio/webm",
      "audio/ogg",
      "audio/mp4",
      "audio/mpeg",
      "audio/wav",
      "audio/x-wav",
      "audio/webm;codecs=opus",
      "audio/ogg;codecs=opus",
      "audio/mp4;codecs=mp4a.40.2",
    ]),
    base64: base64Schema(AI_MAX_AUDIO_BYTES),
  })
  .strict()
  .refine(audioMatchesType, "O conteúdo do áudio não corresponde ao formato informado.");
