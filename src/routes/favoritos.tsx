import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EquipmentCard } from "@/components/equipment-card";
import { useAuth } from "@/components/auth-provider";
import { fetchCategories, fetchFavoriteEquipment } from "@/lib/queries";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [{ title: "Favoritos — Mercado Geotécnico" }, { name: "robots", content: "noindex" }],
  }),
  component: Favoritos,
});

function Favoritos() {
  const { session, loading } = useAuth();
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const { data: favs = [], isLoading } = useQuery({
    queryKey: ["favorite-equipment", session?.user.id],
    queryFn: () => fetchFavoriteEquipment(session!.user.id),
    enabled: !!session,
  });

  if (loading) {
    return <div className="container-page py-16 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!session) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Heart className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-bold">Entre para ver seus favoritos</h1>
        <Button asChild><Link to="/entrar">Entrar</Link></Button>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Favoritos</h1>
      <p className="mt-1 text-muted-foreground">Equipamentos que você salvou.</p>
      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {favs.map((e, i) => (
            <EquipmentCard
              key={e.id}
              item={e}
              index={i}
              categoryName={categories.find((c) => c.slug === e.category_slug)?.name}
            />
          ))}
        </div>
      )}
      {!isLoading && favs.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          Nenhum favorito ainda. Clique no coração dos anúncios para salvar.
        </p>
      )}
    </div>
  );
}
