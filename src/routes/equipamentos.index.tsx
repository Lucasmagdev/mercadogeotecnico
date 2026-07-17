import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, Search, X, LayoutGrid, List, SearchX } from "lucide-react";
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
import {
  EQUIPMENT_PAGE_SIZE,
  fetchCategories,
  fetchEquipmentPage,
  type EquipmentSort,
} from "@/lib/queries";
import { brands, states } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

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
  head: () => ({
    meta: [
      { title: "Equipamentos — Mercado Geotécnico" },
      {
        name: "description",
        content:
          "Encontre equipamentos de engenharia para compra e locação: escavadeiras, geradores, guindastes e mais.",
      },
    ],
  }),
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
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);
}

function toggleInArray<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

function EquipmentList() {
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q ?? "");
  const [categoriasSel, setCategoriasSel] = useState<string[]>(
    search.categoria ? [search.categoria] : [],
  );
  const [modosSel, setModosSel] = useState<string[]>(search.modo ? [search.modo] : []);
  const [condicoesSel, setCondicoesSel] = useState<string[]>([]);
  const [marca, setMarca] = useState(search.marca ?? "todas");
  const [estado, setEstado] = useState(search.estado ?? "todos");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_PRICE]);
  const [sort, setSort] = useState<EquipmentSort>("relevance");
  const [view, setView] = useState<"grid" | "list">("grid");

  const debouncedQ = useDebounced(q);
  const debouncedPrice = useDebounced(priceRange);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const filters = useMemo(
    () => ({
      q: debouncedQ || undefined,
      categorias: categoriasSel.length ? categoriasSel : undefined,
      modos: modosSel.length ? modosSel : undefined,
      condicoes: condicoesSel.length ? condicoesSel : undefined,
      marca,
      estado,
      minPrice: debouncedPrice[0],
      maxPrice: debouncedPrice[1] === MAX_PRICE ? undefined : debouncedPrice[1],
      sort,
    }),
    [debouncedQ, categoriasSel, modosSel, condicoesSel, marca, estado, debouncedPrice, sort],
  );

  const {
    data: pages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["equipment-page", filters],
    queryFn: ({ pageParam }) => fetchEquipmentPage(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((n, p) => n + p.items.length, 0);
      return loaded < last.total ? all.length : undefined;
    },
  });

  const filtered = useMemo(() => pages?.pages.flatMap((p) => p.items) ?? [], [pages]);
  const total = pages?.pages[0]?.total ?? 0;

  const categoryNameBySlug = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.slug, c.name])),
    [categories],
  );

  const hasActiveFilters =
    categoriasSel.length > 0 ||
    modosSel.length > 0 ||
    condicoesSel.length > 0 ||
    marca !== "todas" ||
    estado !== "todos" ||
    priceRange[0] !== 0 ||
    priceRange[1] !== MAX_PRICE;

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...categoriasSel.map((slug) => ({
      key: `cat-${slug}`,
      label: categoryNameBySlug[slug] ?? slug,
      onRemove: () => setCategoriasSel((s) => s.filter((c) => c !== slug)),
    })),
    ...modosSel.map((m) => ({
      key: `modo-${m}`,
      label: m === "venda" ? "Venda" : "Locação",
      onRemove: () => setModosSel((s) => s.filter((x) => x !== m)),
    })),
    ...condicoesSel.map((c) => ({
      key: `cond-${c}`,
      label: c,
      onRemove: () => setCondicoesSel((s) => s.filter((x) => x !== c)),
    })),
    ...(marca !== "todas"
      ? [{ key: "marca", label: marca, onRemove: () => setMarca("todas") }]
      : []),
    ...(estado !== "todos"
      ? [{ key: "estado", label: estado, onRemove: () => setEstado("todos") }]
      : []),
    ...(priceRange[0] !== 0 || priceRange[1] !== MAX_PRICE
      ? [
          {
            key: "preco",
            label: `${currency(priceRange[0])} – ${currency(priceRange[1])}`,
            onRemove: () => setPriceRange([0, MAX_PRICE]),
          },
        ]
      : []),
  ];

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
              {(
                [
                  ["venda", "Venda"],
                  ["locacao", "Locação"],
                ] as const
              ).map(([value, label]) => (
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
                <label
                  key={c.slug}
                  className="flex cursor-pointer items-center justify-between gap-2 text-sm"
                >
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
            <div className="mt-3 flex items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={MAX_PRICE}
                aria-label="Preço mínimo"
                placeholder="Mín"
                className="h-9"
                value={priceRange[0] || ""}
                onChange={(e) => {
                  const v = Math.max(0, Number(e.target.value) || 0);
                  setPriceRange([Math.min(v, priceRange[1]), priceRange[1]]);
                }}
              />
              <span className="text-xs text-muted-foreground">até</span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={MAX_PRICE}
                aria-label="Preço máximo"
                placeholder="Máx"
                className="h-9"
                value={priceRange[1] === MAX_PRICE ? "" : priceRange[1]}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const v = raw > 0 ? Math.min(raw, MAX_PRICE) : MAX_PRICE;
                  setPriceRange([priceRange[0], Math.max(v, priceRange[0])]);
                }}
              />
            </div>
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
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="estado" className="border-b-0">
          <AccordionTrigger>Estado</AccordionTrigger>
          <AccordionContent>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {states.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
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
        <p className="mt-1 text-primary">{total} anúncios encontrados</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, marca ou modelo..."
            className="pl-10"
          />
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
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="mt-6">{filtersContent}</div>
              </SheetContent>
            </Sheet>

            <div className="ml-auto flex items-center gap-2">
              <Select value={sort} onValueChange={(v) => setSort(v as EquipmentSort)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
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
                <ToggleGroupItem
                  value="grid"
                  aria-label="Visualização em grade"
                  className="h-8 w-8 p-0"
                >
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="list"
                  aria-label="Visualização em lista"
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onRemove}
                  className="group flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 py-1 pl-3 pr-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  {chip.label}
                  <X className="h-3.5 w-3.5 rounded-full transition-colors group-hover:bg-primary group-hover:text-primary-foreground" />
                </button>
              ))}
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
              >
                Limpar tudo
              </button>
            </div>
          )}

          {isLoading ? (
            <div
              className={cn(
                "grid gap-5",
                view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1",
              )}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="aspect-[4/3] animate-pulse bg-muted" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-24 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <SearchX className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold">Nenhum equipamento encontrado</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Não achamos resultados para essa combinação. Tente remover filtros ou buscar por
                outro termo.
              </p>
              {(hasActiveFilters || q) && (
                <Button
                  variant="outline"
                  className="mt-5 rounded-full"
                  onClick={() => {
                    clearFilters();
                    setQ("");
                  }}
                >
                  Limpar busca e filtros
                </Button>
              )}
            </div>
          ) : (
            <>
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
                    index={i % EQUIPMENT_PAGE_SIZE}
                    layout={view}
                    categoryName={categoryNameBySlug[item.category_slug ?? ""]}
                  />
                ))}
              </div>
              {hasNextPage && (
                <div className="mt-8 text-center">
                  <Button
                    variant="outline"
                    className="rounded-full px-8"
                    disabled={isFetchingNextPage}
                    onClick={() => fetchNextPage()}
                  >
                    {isFetchingNextPage
                      ? "Carregando..."
                      : `Carregar mais (${total - filtered.length} restantes)`}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
