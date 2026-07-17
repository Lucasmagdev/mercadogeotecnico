import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Heart,
  Share2,
  Phone,
  MessageCircle,
  Send,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Lock,
  Eye,
  Check,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyAvatar } from "@/components/company-avatar";
import { Textarea } from "@/components/ui/textarea";
import { EquipmentCard } from "@/components/equipment-card";
import { GeoSelosVerification } from "@/components/geoselos-verification";
import { useAuth } from "@/components/auth-provider";
import { useFavoriteToggle } from "@/hooks/use-favorite";
import {
  fetchCategories,
  fetchEquipmentBySlug,
  fetchRelatedEquipment,
  incrementEquipmentViews,
  startConversation,
  unlockEquipmentContact,
} from "@/lib/queries";
import { formatPrice } from "@/lib/mock-data";
import { getEquipmentImageUrls } from "@/lib/equipment-images";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/equipamentos/$slug")({
  head: () => ({
    meta: [{ title: "Equipamento — Mercado Geotécnico" }],
  }),
  component: EquipmentDetail,
});

function EquipmentDetail() {
  const { slug } = Route.useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [contact, setContact] = useState<{ phone: string; whatsapp: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  const { data: item, isLoading } = useQuery({
    queryKey: ["equipment", slug],
    queryFn: () => fetchEquipmentBySlug(slug),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const { data: related = [] } = useQuery({
    queryKey: ["equipment-related", item?.category_slug, item?.id],
    queryFn: () => fetchRelatedEquipment(item!.category_slug!, item!.id),
    enabled: !!item,
  });

  const { isFavorite, toggle: toggleFavorite, loggedIn } = useFavoriteToggle(item?.id ?? "");

  useEffect(() => {
    if (item) incrementEquipmentViews(item.id).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  useEffect(() => {
    if (item) document.title = `${item.title} — Mercado Geotécnico`;
  }, [item]);

  const unlock = useMutation({
    mutationFn: () => unlockEquipmentContact(item!.id),
    onSuccess: (data) => setContact(data),
  });

  const sendMessage = useMutation({
    mutationFn: () => startConversation(item!.company_id, item!.id, messageDraft.trim()),
    onSuccess: () => {
      setMessageSent(true);
      setMessageDraft("");
    },
  });

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: item?.title, url });
        return;
      } catch {
        /* user cancelled, fall through to clipboard */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="container-page py-8">
        <div className="h-5 w-64 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
          <div className="space-y-4">
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
            <div className="h-9 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
            <div className="h-11 animate-pulse rounded-lg bg-muted" />
            <div className="h-32 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-2xl font-bold">Equipamento não encontrado</h1>
        <Button asChild className="mt-6">
          <Link to="/equipamentos">Ver equipamentos</Link>
        </Button>
      </div>
    );
  }

  const company = item.companies;
  const categoryName = categories.find((c) => c.slug === item.category_slug)?.name;
  const gallery = getEquipmentImageUrls(item);
  const activeImage = gallery[Math.min(active, gallery.length - 1)];

  return (
    <div className="container-page py-8">
      <nav
        aria-label="Breadcrumb"
        className="mb-5 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
      >
        <Link to="/" className="transition-colors hover:text-primary">
          Início
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <Link to="/equipamentos" className="transition-colors hover:text-primary">
          Equipamentos
        </Link>
        {categoryName && (
          <>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <Link
              to="/equipamentos"
              search={{ categoria: item.category_slug! }}
              className="transition-colors hover:text-primary"
            >
              {categoryName}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="max-w-[220px] truncate font-medium text-foreground sm:max-w-none">
          {item.title}
        </span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        {/* Gallery */}
        <div>
          <div className="group overflow-hidden rounded-2xl border border-border bg-muted">
            <img
              src={activeImage}
              alt={item.title}
              className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto">
              {gallery.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={cn(
                    "h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-colors",
                    active === i ? "border-primary" : "border-border",
                  )}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center gap-2">
            <Badge
              className={
                item.mode === "locacao"
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-secondary-foreground"
              }
            >
              {item.mode === "locacao" ? "Locação" : "Venda"}
            </Badge>
            <Badge variant="outline">{item.condition}</Badge>
            {categoryName && <Badge variant="outline">{categoryName}</Badge>}
            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5" /> {item.views}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{item.title}</h1>
          <p className="mt-1 text-muted-foreground">
            {item.brand} · {item.model}
          </p>
          <p className="mt-4 text-3xl font-bold text-primary">
            {formatPrice(item.price, item.mode)}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { icon: Calendar, label: "Ano", value: String(item.year ?? "–") },
              { icon: Clock, label: "Horas", value: item.hours.toLocaleString("pt-BR") },
              { icon: MapPin, label: "Local", value: `${item.city}/${item.state}` },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-card p-3 text-center"
              >
                <s.icon className="mx-auto mb-1 h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-sm font-semibold">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {contact ? (
              <div className="flex flex-col gap-2 rounded-xl border border-success/40 bg-success/5 p-3">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Phone className="h-4 w-4 text-success" /> {contact.phone}
                </p>
                <Button
                  variant="outline"
                  asChild
                  className="gap-2 border-success/40 text-success hover:bg-success/10"
                >
                  <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4" /> Chamar no WhatsApp
                  </a>
                </Button>
              </div>
            ) : session ? (
              <Button className="gap-2" onClick={() => unlock.mutate()} disabled={unlock.isPending}>
                <Phone className="h-4 w-4" />{" "}
                {unlock.isPending ? "Desbloqueando..." : "Ver contato"}
              </Button>
            ) : (
              <Button asChild className="gap-2">
                <Link to="/entrar">
                  <Lock className="h-4 w-4" /> Entrar para ver o contato
                </Link>
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (!loggedIn) {
                    navigate({ to: "/entrar" });
                    return;
                  }
                  toggleFavorite();
                }}
                aria-label="Favoritar"
                className="flex-1 gap-2"
              >
                <Heart className={cn("h-4 w-4", isFavorite && "fill-accent text-accent")} />
                {isFavorite ? "Favoritado" : "Favoritar"}
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                aria-label="Compartilhar"
                className="flex-1 gap-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                {copied ? "Link copiado" : "Compartilhar"}
              </Button>
            </div>
          </div>

          {/* Message composer */}
          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <p className="mb-2 text-sm font-semibold">Enviar mensagem ao anunciante</p>
            {!session ? (
              <Button asChild variant="outline" className="w-full gap-2">
                <Link to="/entrar">
                  <Lock className="h-4 w-4" /> Entrar para enviar mensagem
                </Link>
              </Button>
            ) : messageSent ? (
              <p className="flex items-center gap-2 text-sm text-success">
                <Check className="h-4 w-4" /> Mensagem enviada! Acompanhe em Mensagens.
              </p>
            ) : (
              <div className="space-y-2">
                <Textarea
                  rows={3}
                  placeholder={`Olá, tenho interesse no ${item.title}...`}
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                />
                <Button
                  className="w-full gap-2"
                  disabled={!messageDraft.trim() || sendMessage.isPending}
                  onClick={() => sendMessage.mutate()}
                >
                  <Send className="h-4 w-4" />{" "}
                  {sendMessage.isPending ? "Enviando..." : "Enviar mensagem"}
                </Button>
              </div>
            )}
          </div>

          {/* Company */}
          {company && (
            <Link
              to="/empresas/$slug"
              params={{ slug: company.slug }}
              className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <CompanyAvatar name={company.name} slug={company.slug} className="text-sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-semibold">{company.name}</p>
                  {company.verified && <GeoSelosVerification />}
                </div>
                <p className="text-sm text-muted-foreground">
                  {company.city}/{company.state} · {company.years_on_market} anos no mercado
                </p>
              </div>
            </Link>
          )}

          {/* Safety notice */}
          <div className="mt-4 flex gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4">
            <ShieldAlert className="h-5 w-5 shrink-0 text-accent" />
            <div className="text-sm">
              <p className="font-semibold">Negocie com segurança</p>
              <p className="mt-1 text-muted-foreground">
                Nunca faça pagamentos antecipados fora da plataforma. Verifique o equipamento
                pessoalmente e prefira empresas com selo de verificação.
              </p>
            </div>
          </div>
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
              <div
                key={i}
                className={`flex justify-between px-4 py-3 text-sm ${i % 2 ? "bg-card" : "bg-background"}`}
              >
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
            {related.map((r, i) => (
              <EquipmentCard
                key={r.id}
                item={r}
                index={i}
                categoryName={categories.find((c) => c.slug === r.category_slug)?.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
