import { toFile } from "openai";
import type OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import type { DraftInputSchema, SpecInputSchema, VoiceInputSchema } from "./ai-validation";
import type { AiCall } from "./ai-providers.server";

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
  condition: z
    .enum(["Novo", "Seminovo", "Usado", ""])
    .describe("Condition stated by the seller, or empty string when it cannot be confirmed."),
  description: z.string().describe("2-4 sentence listing description in Portuguese."),
  compatible_with: z
    .array(z.string())
    .describe(
      "Machine/equipment models this part is known or likely to fit, e.g. ['Doosan DX225'].",
    ),
  specs: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .describe("Up to 8 relevant technical specs as label/value pairs, specific to this item type."),
  missing_info: z
    .array(z.string())
    .describe(
      "Short list of important details the seller should still confirm to improve the listing.",
    ),
});

export type ListingDraft = z.infer<typeof ListingDraftSchema>;

const EvidenceFieldSchema = z.object({
  value: z.string().describe("Exact value, or empty string when it cannot be established."),
  confidence: z.enum(["alta", "media", "baixa"]),
  source: z.enum([
    "plaqueta_no_item",
    "gravacao_no_item",
    "etiqueta_embalagem_estoque",
    "observacao_vendedor",
    "etiqueta_oficina_distribuidor",
    "inferencia_visual",
    "nenhuma",
  ]),
  evidence: z.string().describe("Short description of the exact evidence supporting the value."),
});

const VisualIdentificationSchema = z.object({
  contains_identifiable_item: z.boolean(),
  primary_object: z
    .string()
    .describe("Most specific technically defensible object name, or empty string."),
  object_family: z.string().describe("Broad mechanical/electrical/hydraulic object family."),
  confidence: z.enum(["alta", "media", "baixa"]),
  candidates: z
    .array(
      z.object({
        name: z.string(),
        confidence_percent: z.number().int().min(0).max(100),
        supporting_features: z.array(z.string()),
        conflicting_features: z.array(z.string()),
      }),
    )
    .max(3),
  observed_features: z.array(z.string()).max(12),
  visible_markings: z
    .array(
      z.object({
        text: z.string(),
        location: z.string(),
      }),
    )
    .max(15),
  brand: EvidenceFieldSchema,
  model: EvidenceFieldSchema,
  part_number: EvidenceFieldSchema,
  stated_application: EvidenceFieldSchema,
  stated_condition: EvidenceFieldSchema,
  ambiguity_notes: z.array(z.string()).max(8),
});

type VisualIdentification = z.infer<typeof VisualIdentificationSchema>;

const ReviewedListingSchema = z.object({
  identification_verdict: z.enum(["confirmada", "ambigua", "rejeitada"]),
  verification_notes: z.array(z.string()).max(8),
  draft: ListingDraftSchema,
});

const IDENTIFICATION_INSTRUCTIONS =
  "ETAPA 1 — campo `identification`. Você faz a perícia visual de peças e equipamentos de construção " +
  "pesada. Nesta etapa, apenas identifique o OBJETO PRINCIPAL da foto e registre evidências; não escreva anúncio. " +
  "Ignore peças ao fundo, bancadas, caixas e objetos apenas parcialmente visíveis. Considere como principal " +
  "o objeto central, segurado, etiquetado ou fotografado intencionalmente. Primeiro descreva forma, conexões, " +
  "flanges, eixos, dentes, furos, bicos, materiais e inscrições; só depois proponha até três identidades. " +
  "Quando uma caixa, maleta, saco ou plástico é apenas a embalagem e uma etiqueta legível nomeia seu conteúdo, " +
  "trate o CONTEÚDO nomeado como objeto principal, não a embalagem; informe que a identidade veio da etiqueta. " +
  "Uma etiqueta de estoque legível pode sustentar o nome do item, aplicação, marca ou código nela escritos, " +
  "mesmo que a embalagem oculte parte da peça, mas não prova condição nem funcionamento. " +
  "Compare componentes visualmente parecidos: bomba versus motor hidráulico; bico injetor versus eixo; " +
  "polia/roldana versus engrenagem; coroa versus conjunto de engrenagens; válvula/comando versus bloco simples. " +
  "Um eixo exige função de transmissão sustentada por geometria de eixo; uma peça cilíndrica usinada não é " +
  "automaticamente um eixo. Logotipos em etiquetas de oficinas, distribuidores ou listas de marcas NÃO provam " +
  "o fabricante do item. Diferencie plaqueta original, gravação na peça, etiqueta de estoque/embalagem e " +
  "etiqueta de oficina. Bicos injetores podem aparecer em conjuntos e têm corpo longo de precisão, seções " +
  "escalonadas, ponta estreita de injeção e regiões sextavadas ou de conexão; não descarte essa hipótese apenas " +
  "porque plástico-bolha oculta roscas e entradas. Para part number, priorize o valor explicitamente precedido " +
  "por Código, P/N, PN ou Part Number em vez de números sem rótulo. " +
  "Não confunda cilindrada, capacidade ou aplicação do equipamento com o modelo da peça: por exemplo, 30CC é " +
  "uma especificação e BS450 só é modelo da peça se a etiqueta disser explicitamente que é o modelo dela. Em " +
  "stated_application.value registre somente a máquina/motor compatível, sem frases explicativas. " +
  "Use vocabulário do setor de fundações: trado é a ferramenta helicoidal de perfuração e 'limpador de trado' " +
  "é um conjunto comum; em etiquetas de peças MAIT, não transforme TRADO/TRAD. em 'traseiro' sem contexto " +
  "veicular claro. " +
  "Transcreva apenas texto legível. Se a imagem for placeholder, estiver sem produto ou " +
  "não permitir identificação defensável, marque contains_identifiable_item=false. Nunca invente.";

const REVIEW_INSTRUCTIONS =
  "ETAPA 2 — campo `review`. Agora aja como revisor técnico cético. Reexamine as fotos independentemente e " +
  "tente refutar a identificação da etapa 1 antes de aceitá-la. Compare a hipótese principal com as alternativas " +
  "usando forma, interfaces funcionais e texto visível. Não aprove uma identidade somente porque ela apareceu na " +
  "etapa 1. Em especial, não confunda bicos injetores com eixos, bombas com motores, roldanas com engrenagens " +
  "ou etiqueta de oficina com marca original. Se não houver evidência suficiente, use veredito ambigua; se a " +
  "hipótese contrariar a foto, use rejeitada. Gere o rascunho somente com fatos sustentados pela foto, texto " +
  "legível ou observação do vendedor. Não invente medidas, função, aplicação, compatibilidade, estado, marca, " +
  "modelo ou código. Condição deve ficar vazia, a menos que tenha sido declarada explicitamente pelo vendedor. " +
  "Compatibilidade só pode ser preenchida quando estiver explicitamente escrita na peça/etiqueta ou declarada " +
  "pelo vendedor. Se uma embalagem oculta o produto mas a etiqueta legível nomeia claramente o conteúdo, use " +
  "esse nome no título com a ressalva 'conforme etiqueta'; não anuncie a embalagem como se fosse o produto e " +
  "não reduza um nome específico e legível a 'item' ou 'componente'. Use missing_info para tudo que ainda " +
  "precise de confirmação. Responda em português do Brasil.";

function fieldHasReliableTextEvidence(field: z.infer<typeof EvidenceFieldSchema>) {
  return (
    !!field.value &&
    field.confidence !== "baixa" &&
    field.source !== "inferencia_visual" &&
    field.source !== "etiqueta_oficina_distribuidor" &&
    field.source !== "nenhuma"
  );
}

function cleanEvidenceValue(value: string) {
  return value.trim().replace(/^["“”'‘’]+|["“”'‘’]+$/g, "");
}

function normalizedEvidence(value: string) {
  return cleanEvidenceValue(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function reviewedEvidenceValue(field: z.infer<typeof EvidenceFieldSchema>, reviewedValue: string) {
  if (!fieldHasReliableTextEvidence(field) || !reviewedValue) return "";
  const evidence = normalizedEvidence(field.value);
  const reviewed = normalizedEvidence(reviewedValue);
  return evidence === reviewed || evidence.includes(reviewed) || reviewed.includes(evidence)
    ? cleanEvidenceValue(field.value)
    : "";
}

function supportedIdentityValue(
  field: z.infer<typeof EvidenceFieldSchema>,
  reviewedValue: string,
  leadingCandidate: VisualIdentification["candidates"][number] | undefined,
) {
  const reviewed = reviewedEvidenceValue(field, reviewedValue);
  if (reviewed) return reviewed;
  if (
    fieldHasReliableTextEvidence(field) &&
    leadingCandidate !== undefined &&
    leadingCandidate.confidence_percent >= 80 &&
    normalizedEvidence(leadingCandidate.name).includes(normalizedEvidence(field.value))
  ) {
    return cleanEvidenceValue(field.value);
  }
  return "";
}

function explicitPartNumber(identification: VisualIdentification) {
  for (const marking of identification.visible_markings) {
    const match = marking.text.match(
      /(?:c[oó]digo|part\s*number|p\s*\/?\s*n)\s*[:#-]?\s*([a-z0-9][a-z0-9._/-]*)/i,
    );
    if (match?.[1]) {
      const candidate = cleanEvidenceValue(match[1]);
      if (!/^(?:n\/?a|na|nenhum|none)$/i.test(candidate)) return candidate;
    }
  }
  return "";
}

function isGenericTitle(title: string) {
  return /^(?:item|pe[cç]a|componente|unidade|conjunto\s+(?:com\s+\d+\s+)?(?:de\s+)?(?:pe[cç]as|componentes))\b/i.test(
    title.trim(),
  );
}

function emptyDraft(categories: { slug: string; name: string }[]): ListingDraft {
  return {
    category_slug: fallbackCategory(categories),
    title: "",
    brand: "",
    model: "",
    part_number: "",
    condition: "",
    description: "",
    compatible_with: [],
    specs: [],
    missing_info: [
      "Envie uma foto nítida do item inteiro",
      "Inclua uma foto aproximada da plaqueta, etiqueta ou código gravado",
      "Informe o nome ou a aplicação da peça, se souber",
    ],
  };
}

const DraftAnalysisSchema = z.object({
  identification: VisualIdentificationSchema,
  review: ReviewedListingSchema,
});

const DRAFT_INSTRUCTIONS =
  "Responda com um único JSON em duas etapas, preenchendo `identification` antes de `review`.\n\n" +
  IDENTIFICATION_INSTRUCTIONS +
  "\n\n" +
  REVIEW_INSTRUCTIONS;

function fallbackCategory(categories: { slug: string }[]) {
  return categories.some((category) => category.slug === "outros")
    ? "outros"
    : (categories[0]?.slug ?? "");
}

type DraftInput = z.infer<typeof DraftInputSchema>;
type SpecInput = z.infer<typeof SpecInputSchema>;
type VoiceInput = z.infer<typeof VoiceInputSchema>;

/** Photo/note → listing draft. One multimodal call; identity fields are then evidence-filtered. */
export async function draftListing(
  data: DraftInput,
  call: AiCall,
  signal?: AbortSignal,
): Promise<ListingDraft> {
  const images = data.images;
  const categoryList = data.categories.map((c) => `${c.slug} (${c.name})`).join(", ");
  const imageContent = images.map(
    (img): OpenAI.Chat.Completions.ChatCompletionContentPartImage => ({
      type: "image_url",
      image_url: { url: `data:${img.mediaType};base64,${img.base64}`, detail: "high" },
    }),
  );
  const sellerContext = data.note.trim()
    ? `Observação do vendedor: "${data.note.trim()}"`
    : "O vendedor não forneceu observação; não presuma aplicação nem condição.";

  const response = await call("draft", (provider) =>
    provider.client.chat.completions.parse(
      {
        model: provider.model,
        max_completion_tokens: 6000,
        messages: [
          { role: "system", content: DRAFT_INSTRUCTIONS },
          {
            role: "user",
            content: [
              ...imageContent,
              {
                type: "text",
                text:
                  `Categorias válidas (use exatamente um destes slugs): ${categoryList}\n\n` +
                  `${sellerContext}\n\n` +
                  (images.length > 0
                    ? "Faça a perícia visual do objeto principal, revise-a e monte o rascunho seguro."
                    : "Sem foto, extraia somente o que foi declarado pelo vendedor."),
              },
            ],
          },
        ],
        response_format: zodResponseFormat(DraftAnalysisSchema, "listing_analysis"),
      },
      { signal },
    ),
  );

  const analysis = response.choices[0]?.message.parsed;
  if (!analysis) {
    throw new Error(
      "Não foi possível interpretar as fotos. Tente novamente ou preencha manualmente.",
    );
  }
  const { identification, review: reviewed } = analysis;

  if (images.length > 0 && !identification.contains_identifiable_item) {
    return emptyDraft(data.categories);
  }
  if (reviewed.identification_verdict === "rejeitada") {
    const draft = emptyDraft(data.categories);
    draft.missing_info = [...reviewed.verification_notes, ...draft.missing_info].slice(0, 8);
    return draft;
  }

  const draft = reviewed.draft;
  if (!data.categories.some((category) => category.slug === draft.category_slug)) {
    draft.category_slug = fallbackCategory(data.categories);
  }

  // High-risk identity fields must come from readable evidence, never visual resemblance.
  const leadingCandidate = identification.candidates[0];
  draft.brand = supportedIdentityValue(identification.brand, draft.brand, leadingCandidate);
  draft.model = supportedIdentityValue(identification.model, draft.model, leadingCandidate);
  draft.part_number =
    explicitPartNumber(identification) ||
    supportedIdentityValue(identification.part_number, draft.part_number, leadingCandidate);
  draft.condition =
    identification.stated_condition.source === "observacao_vendedor" &&
    identification.stated_condition.confidence === "alta"
      ? draft.condition
      : "";
  const statedApplication = normalizedEvidence(identification.stated_application.value);
  draft.compatible_with = fieldHasReliableTextEvidence(identification.stated_application)
    ? draft.compatible_with.filter((item) => {
        const reviewedApplication = normalizedEvidence(item);
        return (
          !!reviewedApplication &&
          (statedApplication.includes(reviewedApplication) ||
            reviewedApplication.includes(statedApplication))
        );
      })
    : [];

  if (
    reviewed.identification_verdict === "ambigua" &&
    leadingCandidate !== undefined &&
    leadingCandidate.confidence_percent >= 75 &&
    isGenericTitle(draft.title)
  ) {
    draft.title = `Possível ${leadingCandidate.name} — confirmar`;
  }

  const confidenceWarning =
    identification.confidence === "alta" && reviewed.identification_verdict === "confirmada"
      ? []
      : [
          `Confirme o tipo da peça: identificação ${identification.confidence}` +
            (identification.candidates.length > 1
              ? `; alternativas consideradas: ${identification.candidates
                  .slice(1)
                  .map((candidate) => candidate.name)
                  .join(", ")}`
              : ""),
        ];
  draft.missing_info = [
    ...confidenceWarning,
    ...reviewed.verification_notes.slice(0, 2),
    ...identification.ambiguity_notes.slice(0, 2),
    ...draft.missing_info,
  ]
    .filter((item, index, list) => item && list.indexOf(item) === index)
    .slice(0, 10);

  return draft;
}

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

const SPEC_INSTRUCTIONS =
  "Você é um especialista técnico em máquinas, peças e ferramentas de engenharia geotécnica " +
  "e construção pesada. Dado o tipo de item que alguém está anunciando, sugira quais campos " +
  "técnicos específicos fariam sentido perguntar para ESSE tipo de item — não uma lista genérica. " +
  "Exemplo: para uma célula de carga, sugira capacidade nominal, precisão, indicador utilizado, " +
  "última calibração; para uma bomba hidráulica, sugira vazão, pressão, cilindrada, flange, eixo, " +
  "equipamento de origem. Responda sempre em português do Brasil.";

/** Text-only, no image: suggests which technical fields to ask for, based on category + item name. */
export async function suggestSpecs(
  data: SpecInput,
  call: AiCall,
  signal?: AbortSignal,
): Promise<SpecSuggestion> {
  const response = await call("specs", (provider) =>
    provider.client.chat.completions.parse(
      {
        model: provider.model,
        max_completion_tokens: 1200,
        messages: [
          { role: "system", content: SPEC_INSTRUCTIONS },
          {
            role: "user",
            content: `Categoria: ${data.categoryName}\nO que está sendo vendido: "${data.itemName}"\n\nSugira os campos técnicos.`,
          },
        ],
        response_format: zodResponseFormat(SpecSuggestionSchema, "spec_suggestion"),
      },
      { signal },
    ),
  );
  const parsed = response.choices[0]?.message.parsed;
  if (!parsed) throw new Error("Não foi possível sugerir campos. Tente novamente.");
  return parsed.specs;
}

const AUDIO_EXTENSION_BY_MIME: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
};

/** Transcribes a voice note recorded in the browser, for the cadastro-por-voz flow. */
export async function transcribe(
  data: VoiceInput,
  call: AiCall,
  signal?: AbortSignal,
): Promise<string> {
  const mediaType = data.mediaType.split(";")[0];
  const extension = AUDIO_EXTENSION_BY_MIME[mediaType];
  const buffer = Buffer.from(data.base64, "base64");
  const transcription = await call("transcription", async (provider) =>
    provider.client.audio.transcriptions.create(
      {
        file: await toFile(buffer, `voice-note.${extension}`, { type: mediaType }),
        model: provider.model,
        language: "pt",
      },
      { signal },
    ),
  );
  return transcription.text;
}
