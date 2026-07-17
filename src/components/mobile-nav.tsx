import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, PlusCircle, MessageSquare, User } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Início", icon: Home, exact: true },
  { to: "/equipamentos", label: "Buscar", icon: Search },
  { to: "/publicar", label: "Anunciar", icon: PlusCircle, highlight: true },
  { to: "/mensagens", label: "Mensagens", icon: MessageSquare },
] as const;

export function MobileNav() {
  const { session } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const profileTo = session ? "/configuracoes" : "/entrar";
  const profileLabel = session ? "Perfil" : "Entrar";

  function isActive(to: string, exact?: boolean) {
    return exact ? pathname === to : pathname.startsWith(to);
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        {items.map((item) => {
          const active = isActive(item.to, "exact" in item ? item.exact : false);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {"highlight" in item && item.highlight ? (
                <span className="flex h-9 w-9 -translate-y-0.5 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lift">
                  <item.icon className="h-5 w-5" />
                </span>
              ) : (
                <item.icon className="h-5 w-5" />
              )}
              <span className={cn("highlight" in item && item.highlight && "-translate-y-0.5")}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <Link
          to={profileTo}
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
            isActive(profileTo) ? "text-primary" : "text-muted-foreground",
          )}
        >
          <User className="h-5 w-5" />
          <span>{profileLabel}</span>
        </Link>
      </div>
    </nav>
  );
}
