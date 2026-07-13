import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Tag,
  CalendarClock,
  Building2,
  ArrowRight,
  ShieldCheck,
  Zap,
  MessagesSquare,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EquipmentCard } from "@/components/equipment-card";
import { categories, equipment } from "@/lib/mock-data";
import heroImg from "@/assets/hero-machinery.png";

export const Route = createFileRoute("/")({
  component: Home,
});

const actions = [
  { icon: ShoppingCart, label: "Comprar Equipamentos", to: "/equipamentos", search: { modo: "venda" as const } },
  { icon: Tag, label: "Vender Equipamentos", to: "/publicar", search: undefined },
  { icon: CalendarClock, label: "Alugar Equipamentos", to: "/equipamentos", search: { modo: "locacao" as const } },
  { icon: Building2, label: "Encontrar Fornecedores", to: "/fornecedores", search: undefined },
];

const stats = [
  { value: "12.4k+", label: "Equipamentos anunciados" },
  { value: "3.200+", label: "Empresas verificadas" },
  { value: "27", label: "Estados atendidos" },
  { value: "R$ 1,8bi", label: "Negociado na plataforma" },
];

const features = [
  { icon: ShieldCheck, title: "Empresas verificadas", desc: "Selo de verificação e reputação construída por avaliações reais entre empresas." },
  { icon: Zap, title: "Busca inteligente", desc: "Encontre exatamente o equipamento certo com filtros técnicos avançados." },
  { icon: MessagesSquare, title: "Negociação direta", desc: "Converse, envie propostas e feche negócios sem intermediários." },
];

function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="container-page grid items-center gap-10 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              O maior ecossistema de engenharia do Brasil
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              A plataforma que conecta{" "}
              <span className="text-primary">empresas de engenharia.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Compre, venda, alugue equipamentos e encontre fornecedores em um único lugar.
            </p>

            <div className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-background p-2 shadow-soft">
              <Search className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" />
              <Input
                placeholder="Qual equipamento você procura?"
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
              <Button asChild className="shrink-0 rounded-xl">
                <Link to="/equipamentos">Buscar</Link>
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {actions.map((a) => (
                <Button
                  key={a.label}
                  variant="outline"
                  asChild
                  className="gap-2 rounded-full border-border bg-background"
                >
                  <Link to={a.to} search={a.search as never}>
                    <a.icon className="h-4 w-4 text-primary" />
                    {a.label}
                  </Link>
                </Button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <img
              src={heroImg}
              alt="Máquinas pesadas de engenharia: escavadeira, guindaste e pá carregadeira"
              width={1408}
              height={1008}
              className="w-full drop-shadow-2xl"
            />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border">
        <div className="container-page grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center md:text-left">
              <p className="text-3xl font-bold text-primary">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Explore por categoria</h2>
            <p className="mt-2 text-muted-foreground">Do canteiro ao laboratório, tudo em um só lugar.</p>
          </div>
          <Button variant="ghost" asChild className="hidden gap-1 sm:inline-flex">
            <Link to="/equipamentos">Ver tudo <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.slice(0, 12).map((c, i) => (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
            >
              <Link
                to="/equipamentos"
                search={{ categoria: c.slug }}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-4 transition-all hover:border-primary/40 hover:shadow-soft"
              >
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.count}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured equipment */}
      <section className="container-page py-4 pb-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-bold sm:text-3xl">Em destaque</h2>
          <Button variant="ghost" asChild className="gap-1">
            <Link to="/equipamentos">Ver todos <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {equipment.slice(0, 4).map((item, i) => (
            <EquipmentCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-card">
        <div className="container-page py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Feito para o setor de engenharia</h2>
            <p className="mt-3 text-muted-foreground">
              Confiança, tecnologia e reputação em uma experiência premium.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-2xl border border-border bg-background p-6 shadow-soft"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5.5 w-5.5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-20">
        <div className="relative overflow-hidden rounded-3xl bg-secondary px-8 py-14 text-center text-secondary-foreground sm:px-16">
          <TrendingUp className="mx-auto mb-4 h-8 w-8 text-accent" />
          <h2 className="mx-auto max-w-2xl text-3xl font-bold sm:text-4xl">
            Anuncie seus equipamentos e alcance milhares de empresas
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-secondary-foreground/80">
            Publique em minutos, receba propostas e construa sua reputação no maior ecossistema de engenharia.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/publicar">Anunciar Equipamento</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-secondary-foreground/25 bg-transparent text-secondary-foreground hover:bg-secondary-foreground/10">
              <Link to="/painel">Acessar Painel</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
