import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Heart,
  Settings,
  MessageSquare,
  Bell,
} from "lucide-react";

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [
      { title: "Painel — EngiMercado" },
      { name: "description", content: "Gerencie seus anúncios, favoritos e configurações." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PainelLayout,
});

const nav = [
  { to: "/painel", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/painel/equipamentos", label: "Meus equipamentos", icon: Package },
  { to: "/painel/favoritos", label: "Favoritos", icon: Heart },
  { to: "/mensagens", label: "Mensagens", icon: MessageSquare },
  { to: "/notificacoes", label: "Notificações", icon: Bell },
  { to: "/painel/configuracoes", label: "Configurações", icon: Settings },
] as const;

function PainelLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="container-page grid gap-8 py-8 lg:grid-cols-[240px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
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
