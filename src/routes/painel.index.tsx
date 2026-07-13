import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, Eye, Heart, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { equipment, formatPrice } from "@/lib/mock-data";

export const Route = createFileRoute("/painel/")({
  component: PainelIndex,
});

const stats = [
  { label: "Anúncios ativos", value: "8", icon: Package },
  { label: "Visualizações", value: "2.4k", icon: Eye },
  { label: "Favoritos", value: "142", icon: Heart },
  { label: "Propostas", value: "17", icon: TrendingUp },
];

function PainelIndex() {
  const mine = equipment.filter((e) => e.companyId === "c1");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Visão geral</h1>
          <p className="text-muted-foreground">Bem-vindo de volta, TecnoMáquinas.</p>
        </div>
        <Button asChild className="gap-1.5"><Link to="/publicar"><Plus className="h-4 w-4" /> Anunciar</Link></Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <s.icon className="h-5 w-5 text-primary" />
            <p className="mt-3 text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 mb-4 text-lg font-bold">Anúncios recentes</h2>
      <div className="overflow-hidden rounded-2xl border border-border">
        {mine.map((e, i) => (
          <Link
            key={e.id}
            to="/equipamentos/$slug"
            params={{ slug: e.slug }}
            className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50 ${i % 2 ? "bg-card" : "bg-background"}`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{e.title}</p>
              <p className="text-sm text-muted-foreground">{e.city}/{e.state} · {e.condition}</p>
            </div>
            <span className="shrink-0 font-semibold text-primary">{formatPrice(e.price, e.mode)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
