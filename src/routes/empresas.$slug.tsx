import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  BadgeCheck,
  MapPin,
  Star,
  Globe,
  Phone,
  MessageCircle,
  Calendar,
  ChevronLeft,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EquipmentCard } from "@/components/equipment-card";
import { companies, equipment } from "@/lib/mock-data";

export const Route = createFileRoute("/empresas/$slug")({
  loader: ({ params }) => {
    const company = companies.find((c) => c.slug === params.slug);
    if (!company) throw notFound();
    return { company };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.company.name} — EngiMercado` },
          { name: "description", content: loaderData.company.description },
        ]
      : [{ title: "Empresa não encontrada" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <div className="container-page py-24 text-center">
      <h1 className="text-2xl font-bold">Empresa não encontrada</h1>
      <Button asChild className="mt-6"><Link to="/empresas">Ver empresas</Link></Button>
    </div>
  ),
  component: CompanyProfile,
});

const reviews = [
  { name: "Construtora Alvo", rating: 5, text: "Equipamento entregue no prazo e em ótimo estado. Recomendo!" },
  { name: "Obras & Cia", rating: 5, text: "Atendimento excelente e negociação transparente." },
  { name: "EngeSul", rating: 4, text: "Boa experiência, apenas a logística demorou um pouco." },
];

function CompanyProfile() {
  const { company } = Route.useLoaderData();
  const items = equipment.filter((e) => e.companyId === company.id);

  return (
    <div>
      {/* Cover */}
      <div className="h-40 w-full bg-gradient-to-r from-secondary to-primary sm:h-52" />
      <div className="container-page">
        <Button variant="ghost" size="sm" asChild className="mt-4 gap-1 text-muted-foreground">
          <Link to="/empresas"><ChevronLeft className="h-4 w-4" /> Empresas</Link>
        </Button>

        <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
          <Avatar className="h-24 w-24 border-4 border-background shadow-card">
            <AvatarFallback className="bg-secondary text-2xl font-bold text-secondary-foreground">
              {company.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{company.name}</h1>
              {company.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verificada
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {company.city}/{company.state}</span>
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-accent text-accent" /> {company.rating} · {company.reviews} avaliações</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {company.yearsOnMarket} anos no mercado</span>
            </div>
          </div>
          <div className="flex gap-2 pb-1">
            <Button className="gap-2"><Phone className="h-4 w-4" /> Contato</Button>
            <Button variant="outline" className="gap-2 border-success/40 text-success hover:bg-success/10">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-8 py-6 lg:grid-cols-[1fr_300px]">
          <div>
            <Tabs defaultValue="equipamentos">
              <TabsList>
                <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
                <TabsTrigger value="servicos">Serviços</TabsTrigger>
                <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
              </TabsList>
              <TabsContent value="equipamentos" className="mt-6">
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((it, i) => <EquipmentCard key={it.id} item={it} index={i} />)}
                </div>
              </TabsContent>
              <TabsContent value="servicos" className="mt-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {company.services.map((s) => (
                    <div key={s} className="rounded-xl border border-border bg-card p-4 font-medium">{s}</div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="avaliacoes" className="mt-6 space-y-3">
                {reviews.map((r, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{r.name}</span>
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: r.rating }).map((_, j) => (
                          <Star key={j} className="h-3.5 w-3.5 fill-accent text-accent" />
                        ))}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold">Sobre</h3>
              <p className="mt-2 text-sm text-muted-foreground">{company.description}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 text-sm">
              <h3 className="mb-3 font-semibold">Contato</h3>
              <div className="space-y-2 text-muted-foreground">
                <p className="flex items-center gap-2"><Globe className="h-4 w-4" /> {company.site}</p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {company.phone}</p>
                <p className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> WhatsApp</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
