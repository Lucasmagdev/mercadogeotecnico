import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LockKeyhole, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Mercado Geotécnico" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RedefinirSenha,
});

function RedefinirSenha() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // The recovery link signs the user in with a temporary session; wait for it.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/" }), 2000);
  }

  if (done) {
    return (
      <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
            <Check className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-bold">Senha alterada!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Você já está conectado. Redirecionando...
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
          <h1 className="text-lg font-bold">Link inválido ou expirado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Abra esta página pelo link enviado ao seu e-mail. Se o link expirou, solicite um novo.
          </p>
          <Button asChild className="mt-5 w-full">
            <Link to="/recuperar-senha">Solicitar novo link</Link>
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
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold">Nova senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">Escolha sua nova senha de acesso.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nova senha</Label>
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Confirmar senha</Label>
            <Input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      </div>
    </div>
  );
}
