import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, User } from "lucide-react";

export const Route = createFileRoute("/cadastro/")({
  head: () => ({
    meta: [{ title: "Criar conta — Mercado Geotécnico" }, { name: "robots", content: "noindex" }],
  }),
  component: Cadastro,
});

function Cadastro() {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Criar conta</h1>
        <p className="mt-2 text-muted-foreground">Escolha o tipo de conta que combina com você.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            to="/cadastro/usuario"
            className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Sou usuário</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quero buscar equipamentos e entrar em contato com empresas.
            </p>
          </Link>

          <Link
            to="/cadastro/empresa"
            className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <Building2 className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Sou empresa</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quero anunciar equipamentos. Cadastro sujeito à aprovação.
            </p>
          </Link>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/entrar" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
