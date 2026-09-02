type Spec = { label: string; value: string };

export type ListingQualityInput = {
  title: string;
  description: string;
  brand: string;
  model: string;
  price: number;
  city: string;
  state: string;
  condition: string;
  photosCount: number;
  specs: Spec[];
};

export type ListingQuality = {
  score: number;
  suggestions: string[];
};

function hasSpecMatching(specs: Spec[], keywords: string[]): boolean {
  return specs.some((s) => {
    const label = s.label.toLowerCase();
    return s.value.trim() && keywords.some((k) => label.includes(k));
  });
}

export function computeListingQuality(input: ListingQualityInput): ListingQuality {
  const checks: { ok: boolean; suggestion: string }[] = [
    { ok: input.title.trim().length > 0, suggestion: "Adicione um título" },
    {
      ok: input.description.trim().length >= 40,
      suggestion: "Escreva uma descrição mais completa (histórico, estado, diferenciais)",
    },
    { ok: input.brand.trim().length > 0, suggestion: "Informe a marca ou fabricante" },
    { ok: input.model.trim().length > 0, suggestion: "Informe o modelo" },
    { ok: input.price > 0, suggestion: "Informe o preço" },
    { ok: input.city.trim().length > 0 && input.state.trim().length > 0, suggestion: "Informe a localização" },
    { ok: input.condition.trim().length > 0, suggestion: "Informe o estado de conservação" },
    { ok: input.photosCount > 0, suggestion: "Adicione ao menos uma foto" },
    { ok: input.specs.filter((s) => s.label.trim() && s.value.trim()).length >= 2, suggestion: "Adicione especificações técnicas" },
    {
      ok: hasSpecMatching(input.specs, ["part number", "código da peça", "código"]),
      suggestion: "Informe o Part Number / código da peça",
    },
    {
      ok: hasSpecMatching(input.specs, ["compatível", "compatibilidade"]),
      suggestion: "Informe com quais equipamentos/máquinas essa peça é compatível",
    },
  ];

  const passed = checks.filter((c) => c.ok).length;
  const score = Math.round((passed / checks.length) * 100);
  const suggestions = checks.filter((c) => !c.ok).map((c) => c.suggestion);

  return { score, suggestions };
}
