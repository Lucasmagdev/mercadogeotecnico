import { createServerFn } from "@tanstack/react-start";
import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

const ListingDraftSchema = z.object({
  category_slug: z
    .string()
    .describe("The best-matching category slug from the allowed list provided in the prompt."),
  title: z.string().describe("Short, technically correct listing title in Portuguese."),
  brand: z.string().describe("Manufacturer/brand name, or empty string if unreadable."),
  model: z.string().describe("Model name/number, or empty string if unreadable."),
  part_number: z
    .string()
    .describe("Part number / código da peça read from a nameplate or stamp, or empty string."),
  condition: z.enum(["Novo", "Seminovo", "Usado"]),
  description: z.string().describe("2-4 sentence listing description in Portuguese."),
  compatible_with: z
    .array(z.string())
    .describe("Machine/equipment models this part is known or likely to fit, e.g. ['Doosan DX225']."),
  specs: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .describe("Up to 8 relevant technical specs as label/value pairs, specific to this item type."),
  missing_info: z
    .array(z.string())
    .describe("Short list of important details the seller should still confirm to improve the listing."),
});

export type ListingDraft = z.infer<typeof ListingDraftSchema>;

const MAX_IMAGES = 4;

export const generateListingDraft = createServerFn({ method: "POST" })
  .validator(
    (data: {
      images: { mediaType: "image/jpeg" | "image/png" | "image/webp"; base64: string }[];
      note: string;
      categories: { slug: string; name: string }[];
    }) => data,
  )
  .handler(async ({ data }): Promise<ListingDraft> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY não configurada no servidor.");
    }
    if (data.images.length === 0) {
      throw new Error("Envie ao menos uma foto.");
    }

    const client = new OpenAI({ apiKey });
    const images = data.images.slice(0, MAX_IMAGES);
    const categoryList = data.categories.map((c) => `${c.slug} (${c.name})`).join(", ");

    const response = await client.responses.parse({
      model: "gpt-5.5",
      instructions:
        "Você é um especialista técnico em máquinas, peças e ferramentas de engenharia geotécnica " +
        "e construção pesada. Analise as fotos de uma peça/equipamento à venda (incluindo qualquer " +
        "plaqueta de identificação visível) e extraia informações estruturadas para montar um anúncio. " +
        "Se não conseguir identificar algo com confiança, use string vazia ou array vazio — nunca invente " +
        "dados. Responda sempre em português do Brasil.",
      input: [
        {
          role: "user",
          content: [
            ...images.map(
              (img): OpenAI.Responses.ResponseInputImage => ({
                type: "input_image" as const,
                detail: "auto",
                image_url: `data:${img.mediaType};base64,${img.base64}`,
              }),
            ),
            {
              type: "input_text",
              text:
                `Categorias válidas (use exatamente um destes slugs): ${categoryList}\n\n` +
                (data.note.trim()
                  ? `Observação do vendedor: "${data.note.trim()}"\n\n`
                  : "") +
                "Analise as fotos e monte o rascunho do anúncio.",
            },
          ],
        },
      ],
      text: { format: zodTextFormat(ListingDraftSchema, "listing_draft") },
    });

    if (!response.output_parsed) {
      throw new Error("Não foi possível interpretar as fotos. Tente novamente ou preencha manualmente.");
    }
    return response.output_parsed;
  });
