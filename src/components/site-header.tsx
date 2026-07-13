import { Link, useRouterState } from "@tanstack/react-router";
import {
  Search,
  MessageSquare,
  Bell,
  Menu,
  Plus,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { Logo } from "@/components/logo";
import { categories } from "@/lib/mock-data";

const nav = [
  { to: "/equipamentos", label: "Equipamentos" },
  { to: "/servicos", label: "Serviços" },
  { to: "/empresas", label: "Empresas" },
  { to: "/fornecedores", label: "Fornecedores" },
];

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Logo />
        </Link>

        <div className="relative hidden flex-1 max-w-md lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Qual equipamento você procura?"
            className="h-10 rounded-full bg-muted pl-10"
          />
        </div>

        <nav className="hidden items-center gap-1 xl:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 text-sm font-medium">
                Categorias <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Categorias</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {categories.slice(0, 8).map((c) => (
                <DropdownMenuItem key={c.slug} asChild>
                  <Link to="/equipamentos" search={{ categoria: c.slug }}>
                    {c.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {nav.map((item) => (
            <Button
              key={item.to}
              variant="ghost"
              size="sm"
              asChild
              className={pathname.startsWith(item.to) ? "text-primary font-semibold" : "font-medium"}
            >
              <Link to={item.to}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" asChild className="relative hidden sm:inline-flex">
            <Link to="/mensagens" aria-label="Mensagens">
              <MessageSquare className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="relative hidden sm:inline-flex">
            <Link to="/notificacoes" aria-label="Notificações">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                3
              </span>
            </Link>
          </Button>

          <Button asChild className="hidden gap-1.5 rounded-full md:inline-flex">
            <Link to="/publicar">
              <Plus className="h-4 w-4" /> Anunciar Equipamento
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden sm:block">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                    TM
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>TecnoMáquinas Eng.</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/painel">Painel</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/painel/equipamentos">Meus Equipamentos</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/painel/favoritos">Favoritos</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/painel/configuracoes">Configurações</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle><Logo /></SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1">
                {nav.map((item) => (
                  <Button key={item.to} variant="ghost" asChild className="justify-start">
                    <Link to={item.to}>{item.label}</Link>
                  </Button>
                ))}
                <Button variant="ghost" asChild className="justify-start"><Link to="/painel">Painel</Link></Button>
                <Button variant="ghost" asChild className="justify-start"><Link to="/mensagens">Mensagens</Link></Button>
                <Button variant="ghost" asChild className="justify-start"><Link to="/notificacoes">Notificações</Link></Button>
                <Button asChild className="mt-4 gap-1.5"><Link to="/publicar"><Plus className="h-4 w-4" /> Anunciar</Link></Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
