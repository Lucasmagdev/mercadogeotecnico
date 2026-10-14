import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, ShieldCheck, Zap, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { ResendConfirmation } from "@/components/email-confirmation";
import { safeInternalRedirect, validateAuthSearch } from "@/lib/auth-redirect";

export const Route = createFileRoute("/entrar")({
  validateSearch: validateAuthSearch,
  head: () => ({
    meta: [{ title: "Entrar — Mercado Geotécnico" }, { name: "robots", content: "noindex" }],
  }),
  component: Entrar,
});

const highlights = [
  { icon: ShieldCheck, text: "Empresas verificadas com selo de confiança" },
  { icon: Zap, text: "Busca por peças e equipamentos do setor" },
  { icon: MessagesSquare, text: "Negociação direta, sem intermediários" },
];

function Entrar() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const search = Route.useSearch();
  const redirect = safeInternalRedirect(search.redirect);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  useEffect(() => {
    if (!authLoading && session) void navigate({ href: redirect, replace: true });
  }, [authLoading, session, redirect, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNeedsConfirmation(false);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const unconfirmed = error.code === "email_not_confirmed";
        setNeedsConfirmation(unconfirmed);
        setError(
          unconfirmed
            ? "Confirme seu e-mail antes de entrar."
            : "Não foi possível entrar. Confira os dados e sua conexão e tente novamente.",
        );
        return;
      }
      void navigate({ href: redirect, replace: true });
    } catch {
      setError("Não foi possível entrar agora. Confira sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-10 lg:py-16">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl border border-border shadow-card lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-secondary p-10 text-secondary-foreground lg:flex">
          <div
            className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-40"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/30 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 top-1/4 h-48 w-48 rounded-full bg-accent/20 blur-3xl"
            aria-hidden
          />
          <div className="relative">
            <Logo />
          </div>
          <div className="relative">
            <h2 className="text-2xl font-bold leading-snug">
              Peças e equipamentos para geotecnia e fundações.
            </h2>
            <ul className="mt-6 space-y-4">
              {highlights.map((h) => (
                <li
                  key={h.text}
                  className="flex items-center gap-3 text-sm text-secondary-foreground/85"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary-foreground/10">
                    <h.icon className="h-4 w-4 text-accent" />
                  </span>
                  {h.text}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative text-xs text-secondary-foreground/60">Mercado Geotécnico</p>
        </div>

        {/* Form */}
        <div className="bg-card p-6 sm:p-10">
          <h1 className="text-2xl font-bold">Entrar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesse sua conta Mercado Geotécnico.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com.br"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            {needsConfirmation && <ResendConfirmation email={email} redirect={redirect} />}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-center text-sm">
              <Link
                to="/recuperar-senha"
                className="text-muted-foreground hover:text-primary hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </p>
          </form>

          <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link
              to="/cadastro"
              search={{ redirect }}
              className="font-medium text-primary hover:underline"
            >
              Cadastre-se grátis
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
