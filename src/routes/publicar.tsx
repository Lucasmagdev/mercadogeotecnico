import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Building2,
  Clock,
  ShieldAlert,
  Upload,
  X,
  Plus,
  Wand2,
  AlertTriangle,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/components/auth-provider";
import { createEquipment, fetchCategories, fetchMyCompany } from "@/lib/queries";
import { uploadEquipmentImages } from "@/lib/equipment-images";
import { generateListingDraft, suggestSpecFields } from "@/lib/ai-listing";
import { computeListingQuality } from "@/lib/listing-quality";
import { ListingQualityMeter } from "@/components/listing-quality-meter";
import { brands, states } from "@/lib/mock-data";
import { slugify } from "@/lib/utils";

const AI_MAX_DIM = 1280;

function resizeImageToBase64(file: File): Promise<{ mediaType: "image/jpeg"; base64: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, AI_MAX_DIM / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas indisponível"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      URL.revokeObjectURL(url);
      resolve({ mediaType: "image/jpeg", base64: dataUrl.split(",")[1] });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem"));
    };
    img.src = url;
  });
}

export const Route = createFileRoute("/publicar")({
  head: () => ({
    meta: [
      { title: "Anunciar peça — Mercado Geotécnico" },
      {
        name: "description",
        content: "Publique sua peça, ferramenta ou acessório de engenharia em poucos passos.",
      },
    ],
  }),
  component: Publicar,
});

const steps = ["Categoria", "Detalhes", "Preço & Local", "Fotos", "Revisão"];
const MAX_PHOTOS = 8;

type Spec = { label: string; value: string };

function Publicar() {
  const { session, loading } = useAuth();
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["my-company", session?.user.id],
    queryFn: () => fetchMyCompany(session!.user.id),
    enabled: !!session,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    category: "",
    title: "",
    brand: "",
    model: "",
    year: "",
    condition: "" as "Novo" | "Seminovo" | "Usado" | "",
    description: "",
    mode: "venda" as "venda" | "locacao",
    rentalPeriod: "dia" as "dia" | "semana" | "mes",
    price: "",
    city: "",
    state: "",
  });
  const [customCategory, setCustomCategory] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [specs, setSpecs] = useState<Spec[]>([{ label: "", value: "" }]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [aiPhotos, setAiPhotos] = useState<File[]>([]);
  const [aiNote, setAiNote] = useState("");
  const [aiMissingInfo, setAiMissingInfo] = useState<string[]>([]);
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  const aiCameraInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addPhotos(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setPhotos((prev) => [...prev, ...incoming].slice(0, MAX_PHOTOS));
  }

  const submit = useMutation({
    mutationFn: async () => {
      const slug = `${slugify(form.title)}-${Math.random().toString(36).slice(2, 7)}`;
      const cleanSpecs = specs.filter((s) => s.label.trim() && s.value.trim());
      if (form.category === "outros" && customCategory.trim()) {
        cleanSpecs.unshift({ label: "Categoria", value: customCategory.trim() });
      }
      const finalBrand = form.brand === "outro" ? customBrand.trim() : form.brand;
      const imagePaths =
        photos.length > 0 ? await uploadEquipmentImages(session!.user.id, photos) : [];
      await createEquipment({
        company_id: company!.id,
        slug,
        title: form.title,
        brand: finalBrand,
        model: form.model,
        category_slug: form.category,
        price: Number(form.price),
        mode: form.mode,
        rental_period: form.mode === "locacao" ? form.rentalPeriod : null,
        condition: form.condition as "Novo" | "Seminovo" | "Usado",
        year: Number(form.year),
        city: form.city,
        state: form.state,
        description: form.description,
        image_key: imagePaths.length > 0 ? null : "excavator",
        images: imagePaths,
        specs: cleanSpecs,
      });
      return slug;
    },
    onSuccess: () => setDone(true),
  });

  const aiGenerate = useMutation({
    mutationFn: async () => {
      const images = await Promise.all(aiPhotos.map(resizeImageToBase64));
      return generateListingDraft({
        data: {
          images,
          note: aiNote,
          categories: categories.map((c) => ({ slug: c.slug, name: c.name })),
        },
      });
    },
    onSuccess: (draft) => {
      setPhotos((prev) => (prev.length > 0 ? prev : aiPhotos).slice(0, MAX_PHOTOS));
      const categoryValid = categories.some((c) => c.slug === draft.category_slug);
      const brandMatch = brands.find((b) => b.toLowerCase() === draft.brand.toLowerCase());
      setForm((f) => ({
        ...f,
        category: categoryValid ? draft.category_slug : f.category,
        title: draft.title || f.title,
        brand: brandMatch ?? (draft.brand ? "outro" : f.brand),
        model: draft.model || f.model,
        condition: draft.condition,
        description: draft.description || f.description,
      }));
      if (!brandMatch && draft.brand) setCustomBrand(draft.brand);
      if (!categoryValid && draft.category_slug) {
        setForm((f) => ({ ...f, category: "outros" }));
        setCustomCategory(draft.category_slug);
      }
      const extraSpecs: Spec[] = [];
      if (draft.part_number) extraSpecs.push({ label: "Part Number", value: draft.part_number });
      if (draft.compatible_with.length > 0)
        extraSpecs.push({ label: "Compatível com", value: draft.compatible_with.join(", ") });
      const filledSpecs = [...draft.specs, ...extraSpecs].filter((s) => s.label && s.value);
      if (filledSpecs.length > 0) setSpecs(filledSpecs);
      setAiMissingInfo(draft.missing_info);
      setStep(1);
    },
  });

  const specSuggest = useMutation({
    mutationFn: () => {
      const categoryName =
        form.category === "outros"
          ? customCategory.trim() || "Outros"
          : (categories.find((c) => c.slug === form.category)?.name ?? "");
      return suggestSpecFields({ data: { categoryName, itemName: form.title } });
    },
    onSuccess: (suggested) => {
      setSpecs((current) => {
        const existingLabels = new Set(
          current.filter((s) => s.label.trim()).map((s) => s.label.trim().toLowerCase()),
        );
        const newRows = suggested
          .filter((s) => !existingLabels.has(s.label.trim().toLowerCase()))
          .map((s) => ({ label: s.label, value: "" }));
        const base = current.filter((s) => s.label.trim() || s.value.trim());
        return [...base, ...newRows];
      });
    },
  });

  const listingQuality = computeListingQuality({
    title: form.title,
    description: form.description,
    brand: form.brand === "outro" ? customBrand : form.brand,
    model: form.model,
    price: Number(form.price) || 0,
    city: form.city,
    state: form.state,
    condition: form.condition,
    photosCount: photos.length,
    specs,
  });

  const progress = ((step + 1) / steps.length) * 100;

  if (loading || (session && companyLoading)) {
    return (
      <div className="container-page py-16 text-center text-muted-foreground">Carregando...</div>
    );
  }

  if (!session) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-xl font-bold">Entre para anunciar</h1>
        <p className="text-muted-foreground">
          Você precisa de uma conta de empresa aprovada para publicar anúncios.
        </p>
        <Button asChild>
          <Link to="/entrar">Entrar</Link>
        </Button>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Building2 className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-bold">Cadastre sua empresa</h1>
        <p className="max-w-md text-muted-foreground">
          Somente empresas cadastradas e aprovadas podem anunciar peças.
        </p>
        <Button asChild>
          <Link to="/cadastro/empresa">Cadastrar empresa</Link>
        </Button>
      </div>
    );
  }

  if (company.status !== "approved") {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        {company.status === "pending" ? (
          <>
            <Clock className="h-10 w-10 text-accent" />
            <h1 className="text-xl font-bold">Cadastro em análise</h1>
            <p className="max-w-md text-muted-foreground">
              Sua empresa ainda está aguardando aprovação do administrador para poder anunciar.
            </p>
          </>
        ) : (
          <>
            <ShieldAlert className="h-10 w-10 text-destructive" />
            <h1 className="text-xl font-bold">Cadastro não aprovado</h1>
            <p className="max-w-md text-muted-foreground">
              Fale com o suporte para mais informações.
            </p>
          </>
        )}
      </div>
    );
  }

  if (done) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Sparkles className="h-10 w-10 text-success" />
        <h1 className="text-xl font-bold">Anúncio publicado!</h1>
        <p className="text-muted-foreground">Sua peça já está visível para outras empresas.</p>
        <Button asChild>
          <Link to="/painel/pecas">Ver minhas peças</Link>
        </Button>
      </div>
    );
  }

  const canAdvance =
    (step === 0 && form.category && (form.category !== "outros" || customCategory.trim())) ||
    (step === 1 &&
      form.title &&
      form.condition &&
      (form.brand !== "outro" ? form.brand : customBrand.trim())) ||
    (step === 2 &&
      form.price &&
      form.city &&
      form.state &&
      (form.mode !== "locacao" || form.rentalPeriod)) ||
    step === 3 ||
    step === 4;

  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Anunciar peça</h1>
      <p className="mt-1 text-muted-foreground">
        Preencha as informações para publicar seu anúncio.
      </p>

      {/* Steps */}
      <div className="mt-8 flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col items-center">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                i < step
                  ? "bg-success text-primary-foreground"
                  : i === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className="mt-1.5 hidden text-xs text-muted-foreground sm:block">{s}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {step === 0 && (
        <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Wand2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Fotografe o item e a IA ajuda a criar o anúncio</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Envie fotos (inclusive da plaqueta, se tiver) e conte o que sabe. A IA identifica a
                peça, sugere categoria, marca, modelo e especificações técnicas.
              </p>

              <input
                ref={aiFileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const incoming = Array.from(e.target.files ?? []).filter((f) =>
                    f.type.startsWith("image/"),
                  );
                  setAiPhotos((prev) => [...prev, ...incoming].slice(0, 4));
                  e.target.value = "";
                }}
              />
              <input
                ref={aiCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const incoming = Array.from(e.target.files ?? []).filter((f) =>
                    f.type.startsWith("image/"),
                  );
                  setAiPhotos((prev) => [...prev, ...incoming].slice(0, 4));
                  e.target.value = "";
                }}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {aiPhotos.map((file, i) => (
                  <div key={i} className="group relative h-16 w-16 overflow-hidden rounded-lg border border-border">
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label="Remover foto"
                      onClick={() => setAiPhotos((p) => p.filter((_, j) => j !== i))}
                      className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-background/90 text-foreground"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
                {aiPhotos.length < 4 && (
                  <>
                    <button
                      type="button"
                      onClick={() => aiCameraInputRef.current?.click()}
                      className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                    >
                      <Camera className="h-4 w-4" />
                      <span className="text-[10px] leading-none">Câmera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => aiFileInputRef.current?.click()}
                      className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="text-[10px] leading-none">Galeria</span>
                    </button>
                  </>
                )}
              </div>

              {aiPhotos.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Essas fotos já ficam salvas pro anúncio — não precisa subir de novo depois.
                </p>
              )}

              <Textarea
                className="mt-3"
                rows={2}
                placeholder='Opcional: "Era de uma Doosan 225, estava funcionando quando tiramos."'
                value={aiNote}
                onChange={(e) => setAiNote(e.target.value)}
              />

              {aiGenerate.isError && (
                <p className="mt-2 text-sm text-destructive">
                  {aiGenerate.error instanceof Error
                    ? aiGenerate.error.message
                    : "Não foi possível gerar o rascunho. Tente novamente."}
                </p>
              )}

              <Button
                type="button"
                className="mt-3 gap-1.5"
                disabled={aiPhotos.length === 0 || aiGenerate.isPending}
                onClick={() => aiGenerate.mutate()}
              >
                <Wand2 className="h-4 w-4" />
                {aiGenerate.isPending ? "Analisando fotos..." : "Gerar rascunho com IA"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {aiMissingInfo.length > 0 && step > 0 && (
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">Pra melhorar o anúncio, confirme se possível:</p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              {aiMissingInfo.map((info, i) => (
                <li key={i}>{info}</li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            aria-label="Dispensar aviso"
            onClick={() => setAiMissingInfo([])}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mt-8 rounded-2xl border border-border bg-card p-6"
      >
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              Qual a categoria? <span className="text-destructive">*</span>
            </h2>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {categories
                .filter((c) => c.slug !== "outros")
                .map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => set("category", c.slug)}
                    className={`rounded-xl border p-3 text-left text-sm font-medium transition-colors hover:border-primary hover:bg-primary/5 ${
                      form.category === c.slug ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              <button
                onClick={() => set("category", "outros")}
                className={`rounded-xl border p-3 text-left text-sm font-medium transition-colors hover:border-primary hover:bg-primary/5 ${
                  form.category === "outros" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                Outro
              </button>
            </div>
            {form.category === "outros" && (
              <div className="space-y-2">
                <Label>Descreva a categoria</Label>
                <Input
                  placeholder="Ex: Compactador de solo"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Seu anúncio fica na categoria "Outros"; essa descrição aparece nos detalhes do
                  anúncio.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Detalhes da peça</h2>
            <div className="space-y-2">
              <Label>
                Título do anúncio <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ex: Escavadeira Hidráulica CAT 320"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                rows={4}
                placeholder="Descreva o estado, histórico de manutenção e diferenciais."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Marca <span className="text-destructive">*</span>
                </Label>
                <Select value={form.brand} onValueChange={(v) => set("brand", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                {form.brand === "outro" && (
                  <Input
                    className="mt-2"
                    placeholder="Digite a marca"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input
                  placeholder="Ex: 320 GC"
                  value={form.model}
                  onChange={(e) => set("model", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Ano</Label>
                <Input
                  type="number"
                  placeholder="2021"
                  value={form.year}
                  onChange={(e) => set("year", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Condição <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.condition}
                  onValueChange={(v) => set("condition", v as typeof form.condition)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Novo">Novo</SelectItem>
                    <SelectItem value="Seminovo">Seminovo</SelectItem>
                    <SelectItem value="Usado">Usado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <Label>Especificações técnicas (opcional)</Label>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={!form.title.trim() || specSuggest.isPending}
                    onClick={() => specSuggest.mutate()}
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    {specSuggest.isPending ? "Sugerindo..." : "Sugerir com IA"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => setSpecs((s) => [...s, { label: "", value: "" }])}
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </Button>
                </div>
              </div>
              {specSuggest.isError && (
                <p className="text-sm text-destructive">
                  {specSuggest.error instanceof Error
                    ? specSuggest.error.message
                    : "Não foi possível sugerir campos."}
                </p>
              )}
              <div className="space-y-2">
                {specs.map((spec, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Ex: Potência"
                      value={spec.label}
                      onChange={(e) =>
                        setSpecs((s) =>
                          s.map((sp, j) => (j === i ? { ...sp, label: e.target.value } : sp)),
                        )
                      }
                    />
                    <Input
                      placeholder="Ex: 122 HP"
                      value={spec.value}
                      onChange={(e) =>
                        setSpecs((s) =>
                          s.map((sp, j) => (j === i ? { ...sp, value: e.target.value } : sp)),
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      aria-label="Remover especificação"
                      onClick={() => setSpecs((s) => s.filter((_, j) => j !== i))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Preço e localização</h2>
            <div className="space-y-2">
              <Label>Modalidade</Label>
              <RadioGroup
                value={form.mode}
                onValueChange={(v) => set("mode", v as "venda" | "locacao")}
                className="flex gap-4"
              >
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="venda" /> Venda
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="locacao" /> Locação
                </label>
              </RadioGroup>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-1">
                <Label>
                  Valor (R$) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="685000"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                />
              </div>
              {form.mode === "locacao" && (
                <div className="space-y-2">
                  <Label>
                    Por <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.rentalPeriod}
                    onValueChange={(v) => set("rentalPeriod", v as typeof form.rentalPeriod)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dia">Dia</SelectItem>
                      <SelectItem value="semana">Semana</SelectItem>
                      <SelectItem value="mes">Mês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>
                  Cidade <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="São Paulo"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Estado <span className="text-destructive">*</span>
                </Label>
                <Select value={form.state} onValueChange={(v) => set("state", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Fotos da peça</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addPhotos(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addPhotos(e.dataTransfer.files);
              }}
              className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-12 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Arraste as fotos aqui</p>
              <p className="text-sm text-muted-foreground">
                ou clique para selecionar (até {MAX_PHOTOS} imagens)
              </p>
            </button>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {photos.map((file, i) => (
                  <div
                    key={i}
                    className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        Capa
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label="Remover foto"
                      onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft transition-colors hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {photos.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Sem fotos, o anúncio usa uma imagem ilustrativa padrão.
              </p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                <Sparkles className="h-7 w-7 text-success" />
              </div>
              <h2 className="mt-2 text-lg font-semibold">Tudo pronto!</h2>
              <p className="text-muted-foreground">
                {photos.length > 0 ? `${photos.length} foto(s) serão enviadas. ` : ""}
                Revise as informações e publique seu anúncio para milhares de empresas.
              </p>
            </div>

            <ListingQualityMeter quality={listingQuality} />

            <div className="text-center">
            {submit.isError && (
              <p className="text-sm text-destructive">
                {submit.error instanceof Error
                  ? submit.error.message
                  : "Erro ao publicar. Tente novamente."}
              </p>
            )}
            <Button
              size="lg"
              className="mt-2"
              onClick={() => submit.mutate()}
              disabled={submit.isPending}
            >
              {submit.isPending ? "Publicando..." : "Publicar anúncio"}
            </Button>
            </div>
          </div>
        )}
      </motion.div>

      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Button>
        {step < steps.length - 1 && (
          <Button
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            disabled={!canAdvance}
            className="gap-1"
          >
            Continuar <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
