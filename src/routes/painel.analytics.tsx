import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Eye, Package, TrendingUp, Phone, MessagesSquare, Heart } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useAuth } from "@/components/auth-provider";
import { fetchCompanyAnalytics, fetchMyCompany, fetchMyEquipment } from "@/lib/queries";
import { formatPrice } from "@/lib/mock-data";

export const Route = createFileRoute("/painel/analytics")({
  component: PainelAnalytics,
});

// Palette validated with the dataviz six-checks script (light + dark surfaces).
const chartConfig = {
  views: { label: "Visualizações", theme: { light: "#2f7fd0", dark: "#2f7fd0" } },
  contact_unlocks: { label: "Contatos", theme: { light: "#f97316", dark: "#ea580c" } },
  messages: { label: "Mensagens", theme: { light: "#8b5cf6", dark: "#8b5cf6" } },
  favorites: { label: "Favoritos", theme: { light: "#22c55e", dark: "#16a34a" } },
} satisfies ChartConfig;

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
  const { data: series = [] } = useQuery({
    queryKey: ["company-analytics", company?.id],
    queryFn: () => fetchCompanyAnalytics(company!.id, 30),
    enabled: !!company,
  });

  const totalViews = mine.reduce((sum, e) => sum + e.views, 0);
  const ranked = [...mine].sort((a, b) => b.views - a.views);

  const totals = series.reduce(
    (acc, d) => ({
      views: acc.views + Number(d.views),
      unlocks: acc.unlocks + Number(d.contact_unlocks),
      messages: acc.messages + Number(d.messages),
      favorites: acc.favorites + Number(d.favorites),
    }),
    { views: 0, unlocks: 0, messages: 0, favorites: 0 },
  );

  const chartData = series.map((d) => ({
    ...d,
    label: new Date(`${d.day}T12:00:00`).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }),
  }));

  const funnel = [
    { icon: Eye, label: "Visualizações (30d)", value: totals.views },
    { icon: Phone, label: "Contatos desbloqueados", value: totals.unlocks },
    { icon: MessagesSquare, label: "Conversas iniciadas", value: totals.messages },
    { icon: Heart, label: "Favoritados", value: totals.favorites },
  ];

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

      {/* Funnel (last 30 days) */}
      <h2 className="mt-10 mb-4 text-lg font-bold">Últimos 30 dias</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {funnel.map((f) => (
          <div key={f.label} className="rounded-2xl border border-border bg-card p-5">
            <f.icon className="h-5 w-5 text-primary" />
            <p className="mt-3 text-2xl font-bold">{f.value}</p>
            <p className="text-sm text-muted-foreground">{f.label}</p>
          </div>
        ))}
      </div>

      {/* Daily series */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold">Atividade por dia</h3>
        {chartData.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Sem dados ainda. Os eventos aparecem aqui conforme seus anúncios recebem visitas.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="mt-4 h-64 w-full">
            <LineChart data={chartData} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.35} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
              />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={44} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              {(Object.keys(chartConfig) as (keyof typeof chartConfig)[]).map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={`var(--color-${key})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </div>

      <h2 className="mt-10 mb-4 text-lg font-bold">Ranking de visualizações</h2>
      <div className="overflow-hidden rounded-2xl border border-border">
        {ranked.map((e, i) => (
          <Link
            key={e.id}
            to="/pecas/$slug"
            params={{ slug: e.slug }}
            className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50 ${i % 2 ? "bg-card" : "bg-background"}`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{e.title}</p>
              <p className="text-sm text-muted-foreground">
                {formatPrice(e.price, e.mode, e.rental_period)}
              </p>
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
