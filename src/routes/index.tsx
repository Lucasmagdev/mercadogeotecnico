import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search,
  ArrowRight,
  Zap,
  TrendingUp,
  Construction,
  Tractor,
  Drill,
  Cable,
  Cog,
  Droplets,
  Package,
  Wrench,
  Layers,
  Ruler,
  FlaskConical,
  Forklift,
  Truck,
  Briefcase,
  UserPlus,
  Handshake,
  ShieldCheck,
  ExternalLink,
  Star,
  MapPin,
  CalendarClock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EquipmentCard } from "@/components/equipment-card";
import { AnimatedCounter } from "@/components/animated-counter";
import { GeoSelosVerification } from "@/components/geoselos-verification";
import { VerifiedSeal } from "@/components/verified-seal";
import { CompanyAvatar } from "@/components/company-avatar";
import { fetchApprovedCompanies, fetchCategories, fetchEquipmentList } from "@/lib/queries";
import fundaffLogo from "@/assets/verified-companies/fundaff.jpg";
import fastengeLogo from "@/assets/verified-companies/fastenge.png";
import gontijoLogo from "@/assets/verified-companies/gontijo.png";
import geotesteLogo from "@/assets/verified-companies/geoteste.jpg";

export const Route = createFileRoute("/")({
  component: Home,
});

const categoryIcons: Record<string, LucideIcon> = {
  "maquinas-pesadas": Truck,
  bobcat: Forklift,
  escavadeiras: Construction,
  retroescavadeiras: Tractor,
  perfuratrizes: Drill,
  guindastes: Cable,
  geradores: Zap,
  motores: Cog,
  "equipamentos-hidraulicos": Droplets,
  trados: Drill,
  pecas: Package,
  ferramentas: Wrench,
  "equipamentos-fundacao": Layers,
  "equipamentos-sondagem": Ruler,
  "equipamentos-laboratorio": FlaskConical,
  servicos: Briefcase,
};

const geoselosCompanies = [
  { name: "Fundaff Engenharia", logo: fundaffLogo },
  { name: "Fastenge Engenharia Civil", logo: fastengeLogo },
  { name: "Gontijo Fundações", logo: gontijoLogo },
  { name: "Geoteste", logo: geotesteLogo },
];

const stats = [
  { value: 9430, suffix: "+", label: "anúncios ativos" },
  { value: 1240, suffix: "+", label: "empresas verificadas" },
  { value: 870, suffix: "", label: "negócios por mês" },
];

const steps = [
  {
    icon: UserPlus,
    title: "Crie sua conta",
    desc: "Cadastre sua empresa em minutos e ganhe o selo de verificação após a análise.",
  },
  {
    icon: Search,
    title: "Anuncie ou encontre",
    desc: "Publique equipamentos com fotos e especificações, ou busque com filtros técnicos.",
  },
  {
    icon: Handshake,
    title: "Negocie direto",
    desc: "Converse pelo chat, receba propostas e feche negócio sem intermediários.",
  },
];

function SectionHeader({
  title,
  subtitle,
  linkLabel,
  search,
}: {
  title: string;
  subtitle?: string;
  linkLabel?: string;
  search?: Record<string, string>;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {linkLabel && (
        <Button variant="ghost" asChild className="shrink-0 gap-1">
          <Link to="/equipamentos" search={(search ?? {}) as never}>
            {linkLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState("");
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const { data: equipmentData = [], isLoading } = useQuery({
    queryKey: ["equipment"],
    queryFn: () => fetchEquipmentList(),
  });
  const { data: companies = [] } = useQuery({
    queryKey: ["companies-approved"],
    queryFn: fetchApprovedCompanies,
  });

  const recent = equipmentData.slice(0, 8);
  const rentals = equipmentData.filter((e) => e.mode === "locacao").slice(0, 8);
  const topCompanies = [...companies].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const categoryName = (slug: string | null) => categories.find((c) => c.slug === slug)?.name;

  function submitHeroSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/equipamentos", search: heroQuery ? { q: heroQuery } : {} });
  }

  return (
    <div>
      {/* Compact search band */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="bg-grid-pattern pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div className="container-page relative py-8 lg:py-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Equipamentos de engenharia para{" "}
              <span className="text-gradient-primary">comprar e alugar</span>
            </h1>
            <form
              onSubmit={submitHeroSearch}
              className="mt-5 hidden items-center gap-2 rounded-2xl border border-border bg-background p-2 shadow-soft transition-shadow focus-within:shadow-lift lg:flex"
            >
              <Search className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" />
              <Input
                placeholder="Busque por escavadeira, gerador, guindaste..."
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
              />
              <Button type="submit" className="shrink-0 rounded-xl">
                Buscar
              </Button>
            </form>
          </motion.div>

          {/* Category chips */}
          <div className="scrollbar-none -mx-5 mt-6 overflow-x-auto px-5">
            <div className="flex w-max gap-2">
              {categories.map((c) => {
                const Icon = categoryIcons[c.slug] ?? Package;
                return (
                  <Link
                    key={c.slug}
                    to="/equipamentos"
                    search={{ categoria: c.slug }}
                    className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    {c.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Recently listed — the main event */}
      <section className="container-page py-10">
        <SectionHeader
          title="Anunciados recentemente"
          subtitle="Equipamentos publicados por empresas do setor."
          linkLabel="Ver todos"
        />
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="aspect-[4/3] animate-pulse bg-muted" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="h-8 w-full animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((item, i) => (
              <EquipmentCard
                key={item.id}
                item={item}
                index={i}
                categoryName={categoryName(item.category_slug)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Rentals row */}
      {rentals.length > 0 && (
        <section className="border-y border-border bg-card">
          <div className="container-page py-10">
            <SectionHeader
              title="Para alugar por dia"
              subtitle="Locação direta com o proprietário, sem intermediários."
              linkLabel="Ver locações"
              search={{ modo: "locacao" }}
            />
            <div className="scrollbar-none -mx-5 overflow-x-auto px-5 pb-2">
              <div className="flex w-max gap-5">
                {rentals.map((item, i) => (
                  <div key={item.id} className="w-[280px] shrink-0 sm:w-[300px]">
                    <EquipmentCard
                      item={item}
                      index={i}
                      categoryName={categoryName(item.category_slug)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Sellers */}
      {topCompanies.length > 0 && (
        <section className="container-page py-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">Quem está anunciando</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Empresas verificadas com reputação construída na plataforma.
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                asChild
                className="rounded-full border-amber-400/40 bg-amber-400/10 text-xs font-semibold text-[#14265C] hover:bg-amber-400/20 dark:text-amber-300 sm:text-sm"
              >
                <a
                  href="https://solicitacao.geoselos.com.br/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Solicite sua verificação GeoSelos
                </a>
              </Button>
              <Button variant="ghost" asChild className="gap-1">
                <Link to="/empresas">
                  Ver empresas <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {topCompanies.map((company, i) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3) }}
              >
                <Link
                  to="/empresas/$slug"
                  params={{ slug: company.slug }}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift"
                >
                  <div className="flex items-center gap-3">
                    <CompanyAvatar
                      name={company.name}
                      slug={company.slug}
                      logoPath={company.logo_path}
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-semibold">{company.name}</span>
                        {company.verified && (
                          <GeoSelosVerification />
                        )}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {company.city}/{company.state}
                      </span>
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    {company.rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold">{company.rating.toFixed(1)}</span>
                        {company.reviews > 0 && (
                          <span className="text-muted-foreground">({company.reviews})</span>
                        )}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <CalendarClock className="h-4 w-4" />
                      {company.years_on_market} anos
                    </span>
                  </div>
                  {company.services.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {company.services.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-medium text-primary">
                    Ver anúncios
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* GeoSelos verification CTA */}
      <section className="container-page pb-10" aria-label="Verificação GeoSelos">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl border border-amber-400/20 bg-[#0A1735] text-white shadow-2xl shadow-black/20"
        >
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-primary/25 blur-3xl"
            aria-hidden
          />

          <div className="relative grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
            <div>
              <div className="flex items-center gap-3">
                <VerifiedSeal className="h-14 w-14 shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
                    Reconhecimento técnico GeoSelos
                  </p>
                  <p className="mt-1 text-sm text-blue-100">
                    Fundações especiais e geotecnia
                  </p>
                </div>
              </div>

              <h2 className="mt-6 max-w-xl text-2xl font-bold leading-tight sm:text-3xl">
                Confiança técnica que diferencia sua empresa
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100">
                A GeoSelos reconhece empresas tecnicamente qualificadas e comprometidas com
                excelência, segurança e integridade no setor geotécnico.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  "Reconhecimento técnico",
                  "Credibilidade institucional",
                  "Diferenciação competitiva",
                  "Redução de riscos",
                ].map((benefit) => (
                  <span key={benefit} className="flex items-center gap-2 text-sm text-blue-50">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-amber-300" />
                    {benefit}
                  </span>
                ))}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-amber-400 font-bold text-[#14265C] hover:bg-amber-300"
                >
                  <a
                    href="https://solicitacao.geoselos.com.br/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Solicite sua verificação GeoSelos
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <a
                    href="https://solicitacao.geoselos.com.br/buscar"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Consultar empresas reconhecidas
                  </a>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-300">
                Empresas reconhecidas pela GeoSelos
              </p>
              <p className="mt-2 text-xs leading-relaxed text-blue-100">
                Exemplos reais consultados em fontes oficiais.
              </p>

              <div className="mt-5 grid gap-3">
                {geoselosCompanies.map((company) => (
                  <div
                    key={company.name}
                    className="flex min-h-16 items-center gap-3 rounded-xl border border-white/10 bg-white p-3"
                  >
                    <img
                      src={company.logo}
                      alt={`Logo da ${company.name}`}
                      className="h-9 w-9 shrink-0 rounded object-contain"
                    />
                    <span className="flex-1 text-sm font-semibold text-slate-800">
                      {company.name}
                    </span>
                    <VerifiedSeal className="h-5 w-5 shrink-0" />
                  </div>
                ))}
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-blue-200">
                Marcas exibidas apenas como exemplos públicos de reconhecimento GeoSelos. Não
                representam parceria comercial com este marketplace.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="container-page py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-bold sm:text-2xl">Como funciona</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Três passos entre o cadastro e o negócio fechado.
          </p>
        </div>
        <div className="relative mt-10 grid gap-6 md:grid-cols-3">
          <div
            className="pointer-events-none absolute left-[16%] right-[16%] top-9 hidden border-t-2 border-dashed border-border md:block"
            aria-hidden
          />
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              className="relative text-center"
            >
              <div className="relative mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-border bg-background shadow-soft">
                <s.icon className="h-7 w-7 text-primary" />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA with stats */}
      <section className="container-page pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-secondary px-8 py-14 text-center text-secondary-foreground sm:px-16">
          <div
            className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/30 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-accent/25 blur-3xl"
            aria-hidden
          />
          <div className="relative">
            <TrendingUp className="mx-auto mb-4 h-8 w-8 text-accent" />
            <h2 className="mx-auto max-w-2xl text-3xl font-bold sm:text-4xl">
              Anuncie seus equipamentos e alcance milhares de empresas
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-secondary-foreground/80">
              Publique em minutos, receba propostas e construa sua reputação no maior ecossistema de
              engenharia.
            </p>
            <dl className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-x-12 gap-y-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="text-2xl font-bold sm:text-3xl">
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                  </dd>
                  <p className="text-sm text-secondary-foreground/70">{s.label}</p>
                </div>
              ))}
            </dl>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full transition-transform hover:-translate-y-0.5"
              >
                <Link to="/publicar">Anunciar Equipamento</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-secondary-foreground/25 bg-transparent text-secondary-foreground transition-transform hover:-translate-y-0.5 hover:bg-secondary-foreground/10"
              >
                <Link to="/painel">Acessar Painel</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
