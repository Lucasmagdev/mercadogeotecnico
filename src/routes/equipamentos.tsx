import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EquipmentCard } from "@/components/equipment-card";
import { equipment, categories, brands, states } from "@/lib/mock-data";

type Search = {
  categoria?: string;
  modo?: "venda" | "locacao";
  marca?: string;
  estado?: string;
};

export const Route = createFileRoute("/equipamentos")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    categoria: typeof s.categoria === "string" ? s.categoria : undefined,
    modo: s.modo === "venda" || s.modo === "locacao" ? s.modo : undefined,
    marca: typeof s.marca === "string" ? s.marca : undefined,
    estado: typeof s.estado === "string" ? s.estado : undefined,
  }),
  component: EquipmentList,
});

function EquipmentList() {
  const search = Route.useSearch();
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState(search.categoria ?? "todas");
  const [modo, setModo] = useState<string>(search.modo ?? "todos");
  const [marca, setMarca] = useState(search.marca ?? "todas");
  const [estado, setEstado] = useState(search.estado ?? "todos");
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState("relevancia");

  const filtered = useMemo(() => {
    let list = equipment.filter((e) => {
      if (q && !`${e.title} ${e.brand} ${e.model}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (categoria !== "todas" && e.category !== categoria) return false;
      if (modo !== "todos" && e.mode !== modo) return false;
      if (marca !== "todas" && e.brand !== marca) return false;
      if (estado !== "todos" && e.state !== estado) return false;
      if (e.price > maxPrice) return false;
      return true;
    });
    if (sort === "menor") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "maior") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "ano") list = [...list].sort((a, b) => b.year - a.year);
    return list;
  }, [q, categoria, modo, marca, estado, maxPrice, sort]);

  const filtersContent = (
    <div className="space-y-6">
      <div>
        <Label className="mb-2 block text-sm font-semibold">Categoria</Label>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {categories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="mb-2 block text-sm font-semibold">Tipo</Label>
        <Select value={modo} onValueChange={setModo}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Venda e Locação</SelectItem>
            <SelectItem value="venda">Venda</SelectItem>
            <SelectItem value="locacao">Locação</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="mb-2 block text-sm font-semibold">Marca</Label>
        <Select value={marca} onValueChange={setMarca}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="mb-2 block text-sm font-semibold">Estado</Label>
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="mb-3 block text-sm font-semibold">
          Preço máximo: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(maxPrice)}
        </Label>
        <Slider value={[maxPrice]} min={1000} max={1000000} step={1000} onValueChange={(v) => setMaxPrice(v[0])} />
      </div>
      <label className="flex items-center gap-2 text-sm font-medium">
        <Checkbox checked={verifiedOnly} onCheckedChange={(v) => setVerifiedOnly(!!v)} />
        Apenas empresas verificadas
      </label>
    </div>
  );

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Equipamentos</h1>
        <p className="mt-1 text-muted-foreground">{filtered.length} resultados encontrados</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, marca ou modelo..." className="pl-10" />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="relevancia">Mais relevantes</SelectItem>
            <SelectItem value="menor">Menor preço</SelectItem>
            <SelectItem value="maior">Maior preço</SelectItem>
            <SelectItem value="ano">Mais novos</SelectItem>
          </SelectContent>
        </Select>
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
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2 font-semibold">
              <SlidersHorizontal className="h-4 w-4" /> Filtros
            </div>
            {filtersContent}
          </div>
        </aside>

        <div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
              <X className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Nenhum equipamento encontrado</p>
              <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item, i) => (
                <EquipmentCard key={item.id} item={item} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
