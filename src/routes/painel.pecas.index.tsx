import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Eye, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { deleteEquipment, fetchMyCompany, fetchMyEquipment } from "@/lib/queries";
import { formatPrice } from "@/lib/mock-data";

export const Route = createFileRoute("/painel/pecas/")({
  component: PainelEquipamentos,
});

function PainelEquipamentos() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { data: company } = useQuery({
    queryKey: ["my-company", session?.user.id],
    queryFn: () => fetchMyCompany(session!.user.id),
    enabled: !!session,
  });
  const { data: mine = [] } = useQuery({
    queryKey: ["my-equipment", company?.id],
    queryFn: () => fetchMyEquipment(company!.id),
    enabled: !!company,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteEquipment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-equipment", company?.id] }),
    onError: () => toast.error("Não foi possível excluir o anúncio. Tente novamente."),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Minhas peças</h1>
        <Button asChild className="gap-1.5">
          <Link to="/publicar">
            <Plus className="h-4 w-4" /> Novo anúncio
          </Link>
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {mine.map((e) => (
          <div
            key={e.id}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold">{e.title}</p>
                <Badge variant="outline" className="shrink-0">
                  {e.mode === "locacao" ? "Locação" : "Venda"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatPrice(e.price, e.mode, e.rental_period)} · {e.city}/{e.state}
              </p>
            </div>
            <div className="flex gap-1.5">
              <Button variant="outline" size="icon" asChild aria-label="Ver">
                <Link to="/pecas/$slug" params={{ slug: e.slug }}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="icon" asChild aria-label="Editar">
                <Link to="/painel/pecas/$id" params={{ id: e.id }}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Excluir"
                className="text-destructive hover:bg-destructive/10"
                disabled={remove.isPending}
                onClick={() => {
                  if (window.confirm(`Excluir "${e.title}"? Essa ação não pode ser desfeita.`)) {
                    remove.mutate(e.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {mine.length === 0 && (
          <p className="text-sm text-muted-foreground">Você ainda não anunciou nenhuma peça.</p>
        )}
      </div>
    </div>
  );
}
