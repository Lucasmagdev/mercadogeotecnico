import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronLeft, Check, Plus, X } from "lucide-react";
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
import { toast } from "sonner";
import { fetchCategories, fetchEquipmentById, updateEquipment } from "@/lib/queries";
import { computeListingQuality } from "@/lib/listing-quality";
import { ListingQualityMeter } from "@/components/listing-quality-meter";
import { brands, states } from "@/lib/mock-data";

export const Route = createFileRoute("/painel/pecas/$id")({
  component: EditarEquipamento,
});

function EditarEquipamento() {
  const { id } = Route.useParams();
  const { data: item, isLoading } = useQuery({
    queryKey: ["equipment-by-id", id],
    queryFn: () => fetchEquipmentById(id),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const [form, setForm] = useState({
    title: "",
    brand: "",
    model: "",
    category_slug: "",
    year: "",
    condition: "" as "Novo" | "Seminovo" | "Usado" | "",
    description: "",
    mode: "venda" as "venda" | "locacao",
    rentalPeriod: "dia" as "dia" | "semana" | "mes",
    price: "",
    city: "",
    state: "",
    status: "active" as "active" | "paused" | "removed",
  });
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>([]);
  const [compatibleWithText, setCompatibleWithText] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title,
        brand: item.brand ?? "",
        model: item.model ?? "",
        category_slug: item.category_slug ?? "",
        year: String(item.year ?? ""),
        condition: item.condition,
        description: item.description ?? "",
        mode: item.mode,
        rentalPeriod: item.rental_period ?? "dia",
        price: String(item.price),
        city: item.city ?? "",
        state: item.state ?? "",
        status: item.status,
      });
      setSpecs(item.specs.length > 0 ? item.specs : [{ label: "", value: "" }]);
      setCompatibleWithText(item.compatible_with.join(", "));
    }
  }, [item]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const mutation = useMutation({
    mutationFn: () =>
      updateEquipment(id, {
        title: form.title,
        brand: form.brand,
        model: form.model,
        category_slug: form.category_slug,
        price: Number(form.price),
        mode: form.mode,
        rental_period: form.mode === "locacao" ? form.rentalPeriod : null,
        condition: form.condition as "Novo" | "Seminovo" | "Usado",
        year: Number(form.year),
        city: form.city,
        state: form.state,
        description: form.description,
        status: form.status,
        specs: specs.filter((s) => s.label.trim() && s.value.trim()),
        compatible_with: compatibleWithText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => toast.error("Não foi possível salvar. Tente novamente."),
  });

  if (isLoading) {
    return <div className="py-16 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!item) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Anúncio não encontrado.</p>
        <Button asChild className="mt-4">
          <Link to="/painel/pecas">Voltar</Link>
        </Button>
      </div>
    );
  }

  const listingQuality = computeListingQuality({
    title: form.title,
    description: form.description,
    brand: form.brand,
    model: form.model,
    price: Number(form.price) || 0,
    city: form.city,
    state: form.state,
    condition: form.condition,
    photosCount: item.images.length,
    specs,
    compatibleWith: compatibleWithText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  });

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="mb-4 gap-1 text-muted-foreground">
        <Link to="/painel/pecas">
          <ChevronLeft className="h-4 w-4" /> Minhas peças
        </Link>
      </Button>
      <h1 className="text-2xl font-bold">Editar anúncio</h1>

      <div className="mt-6">
        <ListingQualityMeter quality={listingQuality} />
      </div>

      <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-2">
          <Label>Título do anúncio</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={form.category_slug} onValueChange={(v) => set("category_slug", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Marca</Label>
            <Input
              list="brand-options"
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
            />
            <datalist id="brand-options">
              {brands.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label>Modelo</Label>
            <Input value={form.model} onChange={(e) => set("model", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Ano</Label>
            <Input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Condição</Label>
            <Select
              value={form.condition}
              onValueChange={(v) => set("condition", v as typeof form.condition)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Novo">Novo</SelectItem>
                <SelectItem value="Seminovo">Seminovo</SelectItem>
                <SelectItem value="Usado">Usado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => set("status", v as typeof form.status)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="removed">Removido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <Label>Especificações técnicas</Label>
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
        <div className="space-y-2">
          <Label>Compatível com</Label>
          <Input
            placeholder="Ex: Doosan DX225, Doosan DX225LC"
            value={compatibleWithText}
            onChange={(e) => setCompatibleWithText(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Modelos de máquina/equipamento em que essa peça encaixa, separados por vírgula.
          </p>
        </div>
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
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </div>
          {form.mode === "locacao" && (
            <div className="space-y-2">
              <Label>Por</Label>
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
            <Label>Cidade</Label>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={form.state} onValueChange={(v) => set("state", v)}>
              <SelectTrigger>
                <SelectValue />
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
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-success">
              <Check className="h-4 w-4" /> Salvo!
            </span>
          )}
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </div>
  );
}
