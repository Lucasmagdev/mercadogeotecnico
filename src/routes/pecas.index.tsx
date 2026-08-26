import { createFileRoute } from "@tanstack/react-router";
import { EquipmentBrowser, type EquipmentBrowserSearch } from "@/components/equipment-browser";

export const Route = createFileRoute("/pecas/")({
  head: () => ({
    meta: [
      { title: "Peças — Mercado Geotécnico" },
      {
        name: "description",
        content:
          "Encontre peças, ferramentas e acessórios de engenharia, novos ou usados, para compra e locação.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): EquipmentBrowserSearch => ({
    categoria: typeof s.categoria === "string" ? s.categoria : undefined,
    modo: s.modo === "venda" || s.modo === "locacao" ? s.modo : undefined,
    marca: typeof s.marca === "string" ? s.marca : undefined,
    estado: typeof s.estado === "string" ? s.estado : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  component: EquipmentList,
});

function EquipmentList() {
  const search = Route.useSearch();
  return (
    <div className="container-page py-8">
      <EquipmentBrowser initialSearch={search} />
    </div>
  );
}
