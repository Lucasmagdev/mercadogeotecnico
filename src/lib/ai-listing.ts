import { createServerFn } from "@tanstack/react-start";
import OpenAI, { toFile } from "openai";
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
    if (data.images.length === 0 && !data.note.trim()) {
      throw new Error("Envie ao menos uma foto ou grave/escreva uma observação.");
    }

    const client = new OpenAI({ apiKey });
    const images = data.images.slice(0, MAX_IMAGES);
    const categoryList = data.categories.map((c) => `${c.slug} (${c.name})`).join(", ");

    const response = await client.responses.parse({
      model: "gpt-5.6-terra",
      instructions:
        "Você é um especialista técnico em máquinas, peças e ferramentas de engenharia geotécnica " +
        "e construção pesada. Analise as fotos (se houver) de uma peça/equipamento à venda (incluindo " +
        "qualquer plaqueta de identificação visível) e/ou a observação do vendedor (que pode vir de um " +
        "áudio transcrito, então pode ter erros de transcrição — interprete pelo contexto) e extraia " +
        "informações estruturadas para montar um anúncio. Se não conseguir identificar algo com " +
        "confiança, use string vazia (\"\") ou array vazio — nunca invente dados nem escreva texto tipo " +
        "\"não identificado\" ou \"não disponível\" nos campos; esses casos de incerteza vão em " +
        "missing_info, não nos campos de dados. Responda sempre em português do Brasil.",
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
                (data.note.trim() ? `Observação do vendedor: "${data.note.trim()}"\n\n` : "") +
                (images.length > 0
                  ? "Analise as fotos e monte o rascunho do anúncio."
                  : "Monte o rascunho do anúncio com base na observação do vendedor."),
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

const SpecSuggestionSchema = z.object({
  specs: z
    .array(z.object({ label: z.string(), placeholder: z.string() }))
    .max(8)
    .describe(
      "At most 8 relevant technical spec field labels for this specific item type — only the most " +
        "important ones a buyer would actually need to decide, most important first. Each with a short " +
        "example placeholder value in Portuguese.",
    ),
});

export type SpecSuggestion = z.infer<typeof SpecSuggestionSchema>["specs"];

/** Text-only, no image: suggests which technical fields to ask for, based on category + item name. */
export const suggestSpecFields = createServerFn({ method: "POST" })
  .validator((data: { categoryName: string; itemName: string }) => data)
  .handler(async ({ data }): Promise<SpecSuggestion> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY não configurada no servidor.");
    }
    if (!data.itemName.trim()) {
      throw new Error("Informe o título do anúncio primeiro.");
    }

    const client = new OpenAI({ apiKey });
    const response = await client.responses.parse({
      model: "gpt-5.6-luna",
      instructions:
        "Você é um especialista técnico em máquinas, peças e ferramentas de engenharia geotécnica " +
        "e construção pesada. Dado o tipo de item que alguém está anunciando, sugira quais campos " +
        "técnicos específicos fariam sentido perguntar para ESSE tipo de item — não uma lista genérica. " +
        "Exemplo: para uma célula de carga, sugira capacidade nominal, precisão, indicador utilizado, " +
        "última calibração; para uma bomba hidráulica, sugira vazão, pressão, cilindrada, flange, eixo, " +
        "equipamento de origem. Responda sempre em português do Brasil.",
      input: [
        {
          role: "user",
          content: `Categoria: ${data.categoryName}\nO que está sendo vendido: "${data.itemName}"\n\nSugira os campos técnicos.`,
        },
      ],
      text: { format: zodTextFormat(SpecSuggestionSchema, "spec_suggestion") },
    });

    if (!response.output_parsed) {
      throw new Error("Não foi possível sugerir campos. Tente novamente.");
    }
    return response.output_parsed.specs;
  });

const AUDIO_EXTENSION_BY_MIME: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
};

/** Transcribes a voice note recorded in the browser, for the cadastro-por-voz flow. */
export const transcribeVoiceNote = createServerFn({ method: "POST" })
  .validator((data: { mediaType: string; base64: string }) => data)
  .handler(async ({ data }): Promise<string> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY não configurada no servidor.");
    }
    if (!data.base64) {
      throw new Error("Áudio vazio.");
    }

    const client = new OpenAI({ apiKey });
    const extension = AUDIO_EXTENSION_BY_MIME[data.mediaType] ?? "webm";
    const buffer = Buffer.from(data.base64, "base64");
    const file = await toFile(buffer, `voice-note.${extension}`, { type: data.mediaType });

    const transcription = await client.audio.transcriptions.create({
      file,
      model: "gpt-4o-mini-transcribe",
      language: "pt",
    });

    return transcription.text;
  });
