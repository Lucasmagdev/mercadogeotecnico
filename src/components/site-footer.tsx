import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";

const columns = [
  {
    title: "Plataforma",
    links: [
      { to: "/equipamentos", label: "Equipamentos" },
      { to: "/servicos", label: "Serviços" },
      { to: "/empresas", label: "Empresas" },
      { to: "/fornecedores", label: "Fornecedores" },
    ],
  },
  {
    title: "Para Empresas",
    links: [
      { to: "/publicar", label: "Anunciar Equipamento" },
      { to: "/painel", label: "Painel da Empresa" },
      { to: "/painel/analytics", label: "Analytics" },
      { to: "/painel/pedidos", label: "Pedidos" },
    ],
  },
  {
    title: "Recursos",
    links: [
      { to: "/equipamentos", label: "Comprar" },
      { to: "/equipamentos", label: "Alugar" },
      { to: "/empresas", label: "Reputação" },
      { to: "/mensagens", label: "Mensagens" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/termos", label: "Termos de Uso" },
      { to: "/privacidade", label: "Política de Privacidade" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="container-page grid grid-cols-2 gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            O maior ecossistema digital para empresas de engenharia. Compre, venda, alugue
            equipamentos e conecte-se com fornecedores confiáveis.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-4 text-sm font-semibold">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map((l, i) => (
                <li key={i}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-sm text-muted-foreground sm:flex-row">
          <p>© 2025 Mercado Geotécnico. Todos os direitos reservados.</p>
          <p>Feito para o setor de engenharia.</p>
        </div>
      </div>
    </footer>
  );
}
