import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Package,
  Settings,
  MessageSquare,
  Bell,
  Building2,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { fetchMyCompany } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { CompanyApproval } from "@/components/company-approval";
import { SupportContact } from "@/components/support-contact";

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [
      { title: "Painel — Mercado Geotécnico" },
      { name: "description", content: "Gerencie seus anúncios, favoritos e configurações." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PainelLayout,
});

const nav = [
  { to: "/painel", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/painel/pecas", label: "Minhas peças", icon: Package },
  { to: "/painel/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/painel/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/mensagens", label: "Mensagens", icon: MessageSquare },
  { to: "/notificacoes", label: "Notificações", icon: Bell },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

function PainelLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, profile, loading } = useAuth();
  const {
    data: company,
    isLoading: companyLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["my-company", session?.user.id],
    queryFn: () => fetchMyCompany(session!.user.id),
    enabled: !!session,
  });

  if (loading || (session && companyLoading)) {
    return (
      <div className="container-page py-16 text-center text-muted-foreground">Carregando...</div>
    );
  }

  if (!session) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-xl font-bold">Área da empresa</h1>
        <p className="text-muted-foreground">
          Entre com sua conta de empresa para acessar o painel.
        </p>
        <Button asChild>
          <Link to="/entrar" search={{ redirect: pathname }}>
            Entrar
          </Link>
        </Button>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 py-10 text-center">
        <p role="alert">
          Não foi possível carregar sua empresa. Confira sua conexão e tente novamente.
        </p>
        <Button onClick={() => void refetch()} disabled={isFetching}>
          Tentar novamente
        </Button>
        <SupportContact />
      </div>
    );
  }

  if (profile?.role !== "company" || !company) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Building2 className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-bold">Área exclusiva para empresas</h1>
        <p className="max-w-md text-muted-foreground">
          Cadastre sua empresa para anunciar peças e acessar o painel de gestão.
        </p>
        <Button asChild>
          <Link to="/cadastro/empresa">Cadastrar empresa</Link>
        </Button>
      </div>
    );
  }

  if (company.status === "pending" || company.status === "rejected") {
    return (
      <CompanyApproval
        status={company.status}
        companyName={company.name}
        onRefresh={() => void refetch()}
        refreshing={isFetching}
      />
    );
  }

  return (
    <div className="container-page grid gap-8 py-8 lg:grid-cols-[240px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {nav.map((n) => {
            const active = "exact" in n && n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
