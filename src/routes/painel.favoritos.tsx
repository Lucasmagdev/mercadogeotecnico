import { createFileRoute } from "@tanstack/react-router";
import { EquipmentCard } from "@/components/equipment-card";
import { equipment } from "@/lib/mock-data";

export const Route = createFileRoute("/painel/favoritos")({
  component: PainelFavoritos,
});

function PainelFavoritos() {
  const favs = equipment.slice(0, 3);

  return (
    <div>
      <h1 className="text-2xl font-bold">Favoritos</h1>
      <p className="text-muted-foreground">Equipamentos que você salvou.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {favs.map((e, i) => <EquipmentCard key={e.id} item={e} index={i} />)}
      </div>
    </div>
  );
}
