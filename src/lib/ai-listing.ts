import { createServerFn } from "@tanstack/react-start";
import { DraftInputSchema, SpecInputSchema, VoiceInputSchema } from "./ai-validation";
import type { ListingDraft, SpecSuggestion } from "./ai-operations.server";

export type { ListingDraft, SpecSuggestion } from "./ai-operations.server";

export const generateListingDraft = createServerFn({ method: "POST" })
  .validator((data: unknown) => DraftInputSchema.parse(data))
  .handler(async ({ data }): Promise<ListingDraft> => {
    const [{ runAiOperation }, { draftListing }] = await Promise.all([
      import("./ai-guard.server"),
      import("./ai-operations.server"),
    ]);
    return runAiOperation("draft", ({ call, signal }) => draftListing(data, call, signal));
  });

/** Text-only, no image: suggests which technical fields to ask for, based on category + item name. */
export const suggestSpecFields = createServerFn({ method: "POST" })
  .validator((data: unknown) => SpecInputSchema.parse(data))
  .handler(async ({ data }): Promise<SpecSuggestion> => {
    const [{ runAiOperation }, { suggestSpecs }] = await Promise.all([
      import("./ai-guard.server"),
      import("./ai-operations.server"),
    ]);
    return runAiOperation("specs", ({ call, signal }) => suggestSpecs(data, call, signal));
  });

/** Transcribes a voice note recorded in the browser, for the cadastro-por-voz flow. */
export const transcribeVoiceNote = createServerFn({ method: "POST" })
  .validator((data: unknown) => VoiceInputSchema.parse(data))
  .handler(async ({ data }): Promise<string> => {
    const [{ runAiOperation }, { transcribe }] = await Promise.all([
      import("./ai-guard.server"),
      import("./ai-operations.server"),
    ]);
    return runAiOperation("transcribe", ({ call, signal }) => transcribe(data, call, signal));
  });
