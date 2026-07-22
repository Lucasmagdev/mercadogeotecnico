import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  MapPin,
  Star,
  Globe,
  Phone,
  MessageCircle,
  Calendar,
  ChevronLeft,
  Lock,
  Send,
  Check,
} from "lucide-react";
import { CompanyAvatar } from "@/components/company-avatar";
import { getCompanyImageUrl } from "@/lib/company-images";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EquipmentCard } from "@/components/equipment-card";
import { CompanyReviews } from "@/components/company-reviews";
import { GeoSelosVerification } from "@/components/geoselos-verification";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import {
  fetchCategories,
  fetchCompanyBySlug,
  fetchCompanyEquipment,
  startConversation,
  unlockCompanyContact,
} from "@/lib/queries";

export const Route = createFileRoute("/empresas/$slug")({
  head: () => ({ meta: [{ title: "Empresa — Mercado Geotécnico" }] }),
  component: CompanyProfile,
});

function CompanyProfile() {
  const { slug } = Route.useParams();
  const { session } = useAuth();
  const [contact, setContact] = useState<{ phone: string; whatsapp: string; site: string } | null>(
    null,
  );
  const [messageDraft, setMessageDraft] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", slug],
    queryFn: () => fetchCompanyBySlug(slug),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const { data: items = [] } = useQuery({
    queryKey: ["company-equipment", company?.id],
    queryFn: () => fetchCompanyEquipment(company!.id),
    enabled: !!company,
  });

  const unlock = useMutation({
    mutationFn: () => unlockCompanyContact(company!.id),
    onSuccess: (data) => setContact(data),
    onError: () => toast.error("Não foi possível liberar o contato. Tente novamente."),
  });

  const sendMessage = useMutation({
    mutationFn: () => startConversation(company!.id, null, messageDraft.trim()),
    onSuccess: () => {
      setMessageSent(true);
      setMessageDraft("");
    },
    onError: () => toast.error("Não foi possível enviar a mensagem. Tente novamente."),
  });

  if (isLoading) {
    return (
      <div className="container-page py-24 text-center text-muted-foreground">Carregando...</div>
    );
  }

  if (!company) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-2xl font-bold">Empresa não encontrada</h1>
        <Button asChild className="mt-6">
          <Link to="/empresas">Ver empresas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Cover */}
      {company.verified && company.banner_path ? (
        <div
          className="h-40 w-full bg-cover bg-center sm:h-52"
          style={{ backgroundImage: `url(${getCompanyImageUrl(company.banner_path)})` }}
        />
      ) : (
        <div className="h-40 w-full bg-gradient-to-r from-secondary to-primary sm:h-52" />
      )}
      <div className="container-page">
        <Button variant="ghost" size="sm" asChild className="mt-4 gap-1 text-muted-foreground">
          <Link to="/empresas">
            <ChevronLeft className="h-4 w-4" /> Empresas
          </Link>
        </Button>

        <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
          <CompanyAvatar
            name={company.name}
            slug={company.slug}
            logoPath={company.logo_path}
            className="h-24 w-24 border-4 border-background text-2xl shadow-card"
          />
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{company.name}</h1>
              {company.verified && (
                <GeoSelosVerification variant="full" />
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {company.city}/{company.state}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {company.rating} ·{" "}
                {company.reviews} avaliações
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {company.years_on_market} anos no mercado
              </span>
            </div>
          </div>
          <div className="flex gap-2 pb-1">
            {contact ? (
              <Button
                variant="outline"
                asChild
                className="gap-2 border-success/40 text-success hover:bg-success/10"
              >
                <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" /> {contact.phone}
                </a>
              </Button>
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
          </div>
        </div>

        <div className="mt-6 grid gap-8 py-6 lg:grid-cols-[1fr_300px]">
          <div>
            <Tabs defaultValue="equipamentos">
              <TabsList>
                <TabsTrigger value="equipamentos">Almoxarifado</TabsTrigger>
                <TabsTrigger value="servicos">Serviços</TabsTrigger>
                <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
              </TabsList>
              <TabsContent value="equipamentos" className="mt-6">
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((it, i) => (
                    <EquipmentCard
                      key={it.id}
                      item={it}
                      index={i}
                      categoryName={categories.find((c) => c.slug === it.category_slug)?.name}
                    />
                  ))}
                </div>
                {items.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum equipamento anunciado ainda.
                  </p>
                )}
              </TabsContent>
              <TabsContent value="servicos" className="mt-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {company.services.map((s) => (
                    <div
                      key={s}
                      className="rounded-xl border border-border bg-card p-4 font-medium"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="avaliacoes" className="mt-6">
                <CompanyReviews
                  companyId={company.id}
                  ownerId={company.owner_id}
                  companySlug={company.slug}
                />
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
              {contact ? (
                <div className="space-y-2 text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Globe className="h-4 w-4" /> {contact.site}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> {contact.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" /> WhatsApp disponível
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {session ? (
                    'Clique em "Ver contato" para revelar.'
                  ) : (
                    <Link to="/entrar" className="font-medium text-primary hover:underline">
                      Entre
                    </Link>
                  )}
                  {!session && " para ver os dados de contato."}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-3 font-semibold">Enviar mensagem</h3>
              {!session ? (
                <Button asChild variant="outline" className="w-full gap-2">
                  <Link to="/entrar">
                    <Lock className="h-4 w-4" /> Entrar para enviar mensagem
                  </Link>
                </Button>
              ) : messageSent ? (
                <p className="flex items-center gap-2 text-sm text-success">
                  <Check className="h-4 w-4" /> Mensagem enviada!
                </p>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    rows={3}
                    placeholder={`Olá, gostaria de falar com ${company.name}...`}
                    value={messageDraft}
                    onChange={(e) => setMessageDraft(e.target.value)}
                  />
                  <Button
                    className="w-full gap-2"
                    disabled={!messageDraft.trim() || sendMessage.isPending}
                    onClick={() => sendMessage.mutate()}
                  >
                    <Send className="h-4 w-4" /> {sendMessage.isPending ? "Enviando..." : "Enviar"}
                  </Button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
