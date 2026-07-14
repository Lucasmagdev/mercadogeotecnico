import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, Search, X, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EquipmentCard } from "@/components/equipment-card";
import { fetchCategories, fetchEquipmentList } from "@/lib/queries";
import { brands, states } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Search = {
  categoria?: string;
  modo?: "venda" | "locacao";
  marca?: string;
  estado?: string;
  q?: string;
};

const MAX_PRICE = 2000000;
const CONDITIONS = ["Novo", "Seminovo", "Usado"] as const;

export const Route = createFileRoute("/equipamentos/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    categoria: typeof s.categoria === "string" ? s.categoria : undefined,
    modo: s.modo === "venda" || s.modo === "locacao" ? s.modo : undefined,
    marca: typeof s.marca === "string" ? s.marca : undefined,
    estado: typeof s.estado === "string" ? s.estado : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  component: EquipmentList,
});

function currency(v: number) {
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1)} mi`;
  if (v >= 1000) return `R$ ${Math.round(v / 1000)} mil`;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}

function toggleInArray<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

function EquipmentList() {
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q ?? "");
  const [categoriasSel, setCategoriasSel] = useState<string[]>(search.categoria ? [search.categoria] : []);
  const [modosSel, setModosSel] = useState<string[]>(search.modo ? [search.modo] : []);
  const [condicoesSel, setCondicoesSel] = useState<string[]>([]);
  const [marca, setMarca] = useState(search.marca ?? "todas");
  const [estado, setEstado] = useState(search.estado ?? "todos");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_PRICE]);
  const [sort, setSort] = useState("relevance");
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const { data: equipmentData = [], isLoading } = useQuery({
    queryKey: ["equipment"],
    queryFn: () => fetchEquipmentList(),
  });

  const categoryNameBySlug = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.slug, c.name])),
    [categories],
  );

  const filtered = useMemo(() => {
    let list = equipmentData.filter((e) => {
      if (q && !`${e.title} ${e.brand} ${e.model}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (categoriasSel.length && !categoriasSel.includes(e.category_slug ?? "")) return false;
      if (modosSel.length && !modosSel.includes(e.mode)) return false;
      if (condicoesSel.length && !condicoesSel.includes(e.condition)) return false;
      if (marca !== "todas" && e.brand !== marca) return false;
      if (estado !== "todos" && e.state !== estado) return false;
      if (e.price < priceRange[0] || e.price > priceRange[1]) return false;
      return true;
    });
    if (sort === "menor") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "maior") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "ano") list = [...list].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    return list;
  }, [equipmentData, q, categoriasSel, modosSel, condicoesSel, marca, estado, priceRange, sort]);

  const hasActiveFilters =
    categoriasSel.length > 0 ||
    modosSel.length > 0 ||
    condicoesSel.length > 0 ||
    marca !== "todas" ||
    estado !== "todos" ||
    priceRange[0] !== 0 ||
    priceRange[1] !== MAX_PRICE;

  function clearFilters() {
    setCategoriasSel([]);
    setModosSel([]);
    setCondicoesSel([]);
    setMarca("todas");
    setEstado("todos");
    setPriceRange([0, MAX_PRICE]);
  }

  const filtersContent = (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold">Filtros</span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-primary hover:underline"
          >
            Limpar tudo
          </button>
        )}
      </div>

      <Accordion type="multiple" defaultValue={["tipo", "categoria", "preco", "condicao"]}>
        <AccordionItem value="tipo">
          <AccordionTrigger>Tipo de oferta</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2.5">
              {([
                ["venda", "Venda"],
                ["locacao", "Locação"],
              ] as const).map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={modosSel.includes(value)}
                    onCheckedChange={() => setModosSel((s) => toggleInArray(s, value))}
                  />
                  {label}
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="categoria">
          <AccordionTrigger>Categoria</AccordionTrigger>
          <AccordionContent>
            <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
              {categories.map((c) => (
                <label key={c.slug} className="flex cursor-pointer items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Checkbox
                      checked={categoriasSel.includes(c.slug)}
                      onCheckedChange={() => setCategoriasSel((s) => toggleInArray(s, c.slug))}
                    />
                    {c.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{c.count}</span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="preco">
          <AccordionTrigger>Faixa de preço</AccordionTrigger>
          <AccordionContent>
            <Slider
              value={priceRange}
              min={0}
              max={MAX_PRICE}
              step={10000}
              onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
              className="mt-2"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{currency(priceRange[0])}</span>
              <span>{currency(priceRange[1])}</span>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="condicao">
          <AccordionTrigger>Condição</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2.5">
              {CONDITIONS.map((c) => (
                <label key={c} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={condicoesSel.includes(c)}
                    onCheckedChange={() => setCondicoesSel((s) => toggleInArray(s, c))}
                  />
                  {c}
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="marca">
          <AccordionTrigger>Marca</AccordionTrigger>
          <AccordionContent>
            <Select value={marca} onValueChange={setMarca}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="estado" className="border-b-0">
          <AccordionTrigger>Estado</AccordionTrigger>
          <AccordionContent>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Equipamentos</h1>
        <p className="mt-1 text-primary">{filtered.length} anúncios encontrados</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, marca ou modelo..." className="pl-10" />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-5">
            {filtersContent}
          </div>
        </aside>

        <div>
          <div className="mb-5 flex items-center justify-between gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" /> Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
                <div className="mt-6">{filtersContent}</div>
              </SheetContent>
            </Sheet>

            <div className="ml-auto flex items-center gap-2">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevância</SelectItem>
                  <SelectItem value="menor">Menor preço</SelectItem>
                  <SelectItem value="maior">Maior preço</SelectItem>
                  <SelectItem value="ano">Mais novos</SelectItem>
                </SelectContent>
              </Select>
              <ToggleGroup
                type="single"
                value={view}
                onValueChange={(v) => v && setView(v as "grid" | "list")}
                className="rounded-md border border-input p-0.5"
              >
                <ToggleGroupItem value="grid" aria-label="Visualização em grade" className="h-8 w-8 p-0">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="Visualização em lista" className="h-8 w-8 p-0">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {isLoading ? (
            <p className="py-24 text-center text-sm text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
              <X className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Nenhum equipamento encontrado</p>
              <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca.</p>
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-5",
                view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1",
              )}
            >
              {filtered.map((item, i) => (
                <EquipmentCard
                  key={item.id}
                  item={item}
                  index={i}
                  layout={view}
                  categoryName={categoryNameBySlug[item.category_slug ?? ""]}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
