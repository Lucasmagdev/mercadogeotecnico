import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { EmailConfirmation } from "@/components/email-confirmation";
import { confirmationRedirectUrl, safeInternalRedirect } from "@/lib/auth-redirect";

export const Route = createFileRoute("/cadastro/usuario")({
  head: () => ({
    meta: [
      { title: "Cadastro de usuário — Mercado Geotécnico" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CadastroUsuario,
});

function CadastroUsuario() {
  const search = Route.useSearch();
  const redirect = safeInternalRedirect(search.redirect);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: confirmationRedirectUrl(redirect),
          data: { full_name: fullName, account_type: "user" },
        },
      });
      if (error) {
        setError(error.message);
        return;
      }
      setSent(true);
    } catch {
      setError("Não foi possível concluir agora. Confira sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return <EmailConfirmation email={email} redirect={redirect} />;
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold">Criar conta de usuário</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre-se para entrar em contato com anunciantes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Senha</Label>
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link
            to="/entrar"
            search={{ redirect }}
            className="font-medium text-primary hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
