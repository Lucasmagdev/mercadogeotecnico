import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { User, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, account_type: "user" } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
            <MailCheck className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-bold">Confirme seu e-mail</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enviamos um link de confirmação para <strong>{email}</strong>. Confirme para ativar sua
            conta e entrar.
          </p>
          <Button asChild className="mt-5 w-full">
            <Link to="/entrar">Ir para o login</Link>
          </Button>
          <div className="mt-4 rounded-xl bg-secondary/10 p-3 text-left">
            <p className="text-sm font-medium text-secondary">É dono de uma empresa?</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Depois de entrar, cadastre sua empresa e comece a anunciar equipamentos.
            </p>
            <Link
              to="/cadastro/empresa"
              className="mt-1.5 inline-block text-xs font-semibold text-secondary hover:underline"
            >
              Cadastrar minha empresa →
            </Link>
          </div>
        </div>
      </div>
    );
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
          <Link to="/entrar" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
