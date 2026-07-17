import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Mercado Geotécnico" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RecuperarSenha,
});

function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);
    if (error) {
      setError("Não foi possível enviar o e-mail. Tente novamente em alguns minutos.");
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
          <h1 className="text-lg font-bold">Verifique seu e-mail</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Se existir uma conta para <strong>{email}</strong>, enviamos um link para redefinir a
            senha.
          </p>
          <Button asChild variant="outline" className="mt-5 w-full">
            <Link to="/entrar">Voltar ao login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold">Recuperar senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Informe seu e-mail e enviaremos um link para redefinir a senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar link"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Lembrou a senha?{" "}
          <Link to="/entrar" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
