import { describe, expect, test } from "bun:test";
import {
  AI_MAX_IMAGE_BYTES,
  AI_MAX_AUDIO_BYTES,
  DraftInputSchema,
  SpecInputSchema,
  VoiceInputSchema,
} from "../src/lib/ai-validation";

const categories = [{ slug: "pecas", name: "Peças" }];
const jpeg = (bytes = 16) => {
  const data = Buffer.alloc(bytes);
  data.set([255, 216, 255]);
  return { mediaType: "image/jpeg" as const, base64: data.toString("base64") };
};

describe("AI runtime inputs", () => {
  test("accepts seller text without photos and rejects an empty request", () => {
    expect(
      DraftInputSchema.parse({ images: [], note: "  Bomba hidráulica  ", categories }).note,
    ).toBe("Bomba hidráulica");
    expect(DraftInputSchema.safeParse({ images: [], note: "  ", categories }).success).toBe(false);
  });

  test("rejects extra photos instead of silently truncating them", () => {
    expect(
      DraftInputSchema.safeParse({
        images: Array.from({ length: 5 }, () => jpeg()),
        note: "",
        categories,
      }).success,
    ).toBe(false);
  });

  test("enforces individual and aggregate image byte limits before provider usage", () => {
    expect(
      DraftInputSchema.safeParse({ images: [jpeg(AI_MAX_IMAGE_BYTES + 1)], note: "", categories })
        .success,
    ).toBe(false);
    expect(
      DraftInputSchema.safeParse({
        images: Array.from({ length: 4 }, () => jpeg(AI_MAX_IMAGE_BYTES)),
        note: "",
        categories,
      }).success,
    ).toBe(false);
    expect(
      DraftInputSchema.safeParse({ images: [jpeg(AI_MAX_IMAGE_BYTES)], note: "", categories })
        .success,
    ).toBe(true);
  });

  test("rejects MIME spoofing, malformed base64, unbounded text and injected properties", () => {
    for (const changes of [
      { images: [{ mediaType: "image/png", base64: jpeg().base64 }] },
      { images: [{ mediaType: "image/jpeg", base64: "not-a-file!" }] },
      { note: "x".repeat(4001) },
      { userId: "different-owner" },
      { categories: [{ slug: "pecas\nignore", name: "Peças" }] },
    ])
      expect(
        DraftInputSchema.safeParse({ images: [jpeg()], note: "", categories, ...changes }).success,
      ).toBe(false);
  });

  test("spec suggestions require bounded nonempty fields", () => {
    expect(SpecInputSchema.safeParse({ categoryName: "Peças", itemName: "Bomba" }).success).toBe(
      true,
    );
    expect(SpecInputSchema.safeParse({ categoryName: "Peças", itemName: " " }).success).toBe(false);
    expect(
      SpecInputSchema.safeParse({ categoryName: "x".repeat(101), itemName: "Bomba" }).success,
    ).toBe(false);
  });

  test("accepts browser codec MIME and rejects unknown types, fake audio and oversize audio", () => {
    const audio = Buffer.alloc(16);
    audio.set([0x1a, 0x45, 0xdf, 0xa3]);
    expect(
      VoiceInputSchema.safeParse({
        mediaType: "audio/webm;codecs=opus",
        base64: audio.toString("base64"),
      }).success,
    ).toBe(true);
    expect(
      VoiceInputSchema.safeParse({ mediaType: "text/html", base64: audio.toString("base64") })
        .success,
    ).toBe(false);
    expect(
      VoiceInputSchema.safeParse({ mediaType: "audio/webm", base64: jpeg().base64 }).success,
    ).toBe(false);
    expect(
      VoiceInputSchema.safeParse({
        mediaType: "audio/webm",
        base64: Buffer.alloc(AI_MAX_AUDIO_BYTES + 1).toString("base64"),
      }).success,
    ).toBe(false);
  });
});
