import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  Heart,
  Share2,
  Phone,
  MessageCircle,
  BadgeCheck,
  MapPin,
  Calendar,
  Clock,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EquipmentCard } from "@/components/equipment-card";
import {
  getEquipment,
  getCompany,
  equipment,
  equipmentImages,
  formatPrice,
} from "@/lib/mock-data";

export const Route = createFileRoute("/equipamentos/$slug")({
  loader: ({ params }) => {
    const item = getEquipment(params.slug);
    if (!item) throw notFound();
    return { item };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.item.title} — EngiMercado` },
          { name: "description", content: loaderData.item.description },
        ]
      : [{ title: "Equipamento não encontrado" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <div className="container-page py-24 text-center">
      <h1 className="text-2xl font-bold">Equipamento não encontrado</h1>
      <Button asChild className="mt-6"><Link to="/equipamentos">Ver equipamentos</Link></Button>
    </div>
  ),
  component: EquipmentDetail,
});

function EquipmentDetail() {
  const { item } = Route.useLoaderData();
  const company = getCompany(item.companyId);
  const [fav, setFav] = useState(false);
  const [active, setActive] = useState(0);
  const gallery = [item.image, "excavator", "crane", "generator"] as const;
  const related = equipment.filter((e) => e.category === item.category && e.id !== item.id).slice(0, 4);

  return (
    <div className="container-page py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4 gap-1 text-muted-foreground">
        <Link to="/equipamentos"><ChevronLeft className="h-4 w-4" /> Voltar</Link>
      </Button>

      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        {/* Gallery */}
        <div>
          <div className="overflow-hidden rounded-2xl border border-border bg-muted">
            <img
              src={equipmentImages[gallery[active]]}
              alt={item.title}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div className="mt-3 flex gap-3">
            {gallery.map((g, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-20 w-24 overflow-hidden rounded-xl border-2 transition-colors ${
                  active === i ? "border-primary" : "border-border"
                }`}
              >
                <img src={equipmentImages[g]} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <Badge className={item.mode === "locacao" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}>
              {item.mode === "locacao" ? "Locação" : "Venda"}
            </Badge>
            <Badge variant="outline">{item.condition}</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{item.title}</h1>
          <p className="mt-1 text-muted-foreground">{item.brand} · {item.model}</p>
          <p className="mt-4 text-3xl font-bold text-primary">{formatPrice(item.price, item.mode)}</p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { icon: Calendar, label: "Ano", value: String(item.year) },
              { icon: Clock, label: "Horas", value: item.hours.toLocaleString("pt-BR") },
              { icon: MapPin, label: "Local", value: `${item.city}/${item.state}` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
                <s.icon className="mx-auto mb-1 h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-sm font-semibold">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <div className="flex gap-2">
              <Button className="flex-1 gap-2"><Phone className="h-4 w-4" /> Entrar em contato</Button>
              <Button variant="outline" size="icon" onClick={() => setFav((v) => !v)} aria-label="Favoritar">
                <Heart className={fav ? "h-4 w-4 fill-accent text-accent" : "h-4 w-4"} />
              </Button>
              <Button variant="outline" size="icon" aria-label="Compartilhar"><Share2 className="h-4 w-4" /></Button>
            </div>
            <Button variant="outline" className="gap-2 border-success/40 text-success hover:bg-success/10">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
          </div>

          {/* Company */}
          {company && (
            <Link
              to="/empresas/$slug"
              params={{ slug: company.slug }}
              className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                  {company.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-semibold">{company.name}</p>
                  {company.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-success" />}
                </div>
                <p className="text-sm text-muted-foreground">
                  {company.city}/{company.state} · {company.yearsOnMarket} anos no mercado
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Description + specs */}
      <div className="mt-12 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <h2 className="text-xl font-bold">Descrição</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{item.description}</p>
        </div>
        <div>
          <h2 className="text-xl font-bold">Especificações técnicas</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-border">
            {item.specs.map((s, i) => (
              <div key={i} className={`flex justify-between px-4 py-3 text-sm ${i % 2 ? "bg-card" : "bg-background"}`}>
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 text-xl font-bold">Equipamentos relacionados</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r, i) => <EquipmentCard key={r.id} item={r} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
