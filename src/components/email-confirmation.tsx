import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupportContact } from "@/components/support-contact";
import { supabase } from "@/lib/supabase";
import { confirmationRedirectUrl } from "@/lib/auth-redirect";

export function ResendConfirmation({ email, redirect }: { email: string; redirect: string }) {
  const [remaining, setRemaining] = useState(0);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (remaining === 0) return;
    const timer = window.setTimeout(() => setRemaining((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  async function resend() {
    setSending(true);
    setMessage("");
    setFailed(false);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: confirmationRedirectUrl(redirect) },
      });
      if (error) throw error;
      setMessage("Solicitação enviada. Confira sua caixa de entrada e a pasta de spam.");
      setRemaining(60);
    } catch {
      setFailed(true);
      setMessage("Não foi possível reenviar agora. Aguarde um momento e tente novamente.");
      setRemaining(60);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Não encontrou o e-mail? Confira também o spam e se o endereço está correto.
      </p>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={sending || remaining > 0 || !email.trim()}
        onClick={resend}
      >
        {sending
          ? "Reenviando..."
          : remaining > 0
            ? `Reenviar em ${remaining}s`
            : "Reenviar confirmação"}
      </Button>
      {message && (
        <p
          role={failed ? "alert" : "status"}
          className={`text-sm ${failed ? "text-destructive" : "text-muted-foreground"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export function EmailConfirmation({
  email,
  redirect = "/",
  company = false,
}: {
  email: string;
  redirect?: string;
  company?: boolean;
}) {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
          <MailCheck className="h-5 w-5" />
        </div>
        <h1 className="text-lg font-bold">Confirme seu e-mail</h1>
        <p className="break-words text-sm text-muted-foreground">
          Enviamos um link de confirmação para <strong>{email}</strong>. Abra o link para ativar sua
          conta.
          {company &&
            " Depois, acompanhe a análise da empresa no painel. A publicação fica disponível após a aprovação."}
        </p>
        <ResendConfirmation email={email} redirect={redirect} />
        <Button asChild className="w-full">
          <Link to="/entrar" search={{ redirect }}>
            Já confirmei, entrar
          </Link>
        </Button>
        <SupportContact />
      </div>
    </div>
  );
}
