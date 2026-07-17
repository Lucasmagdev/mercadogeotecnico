import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EquipmentCard } from "@/components/equipment-card";
import { fetchCategories, fetchEquipmentList } from "@/lib/queries";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — Mercado Geotécnico" },
      {
        name: "description",
        content: "Encontre serviços de engenharia oferecidos por empresas verificadas.",
      },
    ],
  }),
  component: Servicos,
});

function Servicos() {
  const [q, setQ] = useState("");
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const { data: equipmentData = [], isLoading } = useQuery({
    queryKey: ["equipment"],
    queryFn: () => fetchEquipmentList(),
  });

  const services = useMemo(
    () =>
      equipmentData.filter(
        (e) =>
          e.category_slug === "servicos" && (!q || e.title.toLowerCase().includes(q.toLowerCase())),
      ),
    [equipmentData, q],
  );

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Serviços</h1>
        <p className="mt-1 text-muted-foreground">
          Serviços de engenharia oferecidos por empresas verificadas.
        </p>
      </div>
      <div className="relative mb-8 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar serviço..."
          className="pl-10"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : services.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum serviço encontrado.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((s, i) => (
            <EquipmentCard
              key={s.id}
              item={s}
              index={i}
              categoryName={categories.find((c) => c.slug === s.category_slug)?.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
