import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye, Package, TrendingUp } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { fetchMyCompany, fetchMyEquipment } from "@/lib/queries";
import { formatPrice } from "@/lib/mock-data";

export const Route = createFileRoute("/painel/analytics")({
  component: PainelAnalytics,
});

function PainelAnalytics() {
  const { session } = useAuth();
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

  const totalViews = mine.reduce((sum, e) => sum + e.views, 0);
  const ranked = [...mine].sort((a, b) => b.views - a.views);

  return (
    <div>
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="text-muted-foreground">Desempenho dos seus anúncios.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <Package className="h-5 w-5 text-primary" />
          <p className="mt-3 text-2xl font-bold">{mine.length}</p>
          <p className="text-sm text-muted-foreground">Anúncios publicados</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <Eye className="h-5 w-5 text-primary" />
          <p className="mt-3 text-2xl font-bold">{totalViews}</p>
          <p className="text-sm text-muted-foreground">Visualizações totais</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <TrendingUp className="h-5 w-5 text-primary" />
          <p className="mt-3 text-2xl font-bold">
            {mine.length ? Math.round(totalViews / mine.length) : 0}
          </p>
          <p className="text-sm text-muted-foreground">Média por anúncio</p>
        </div>
      </div>

      <h2 className="mt-10 mb-4 text-lg font-bold">Ranking de visualizações</h2>
      <div className="overflow-hidden rounded-2xl border border-border">
        {ranked.map((e, i) => (
          <Link
            key={e.id}
            to="/equipamentos/$slug"
            params={{ slug: e.slug }}
            className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50 ${i % 2 ? "bg-card" : "bg-background"}`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{e.title}</p>
              <p className="text-sm text-muted-foreground">{formatPrice(e.price, e.mode)}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary">
              <Eye className="h-3.5 w-3.5" /> {e.views}
            </span>
          </Link>
        ))}
        {ranked.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground">Nenhum anúncio publicado ainda.</p>
        )}
      </div>
    </div>
  );
}
