import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, MapPin, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/auth-provider";
import { registerCompany } from "@/lib/queries";
import { states } from "@/lib/mock-data";
import { formatPhoneBR } from "@/lib/utils";

export const Route = createFileRoute("/cadastro/empresa")({
  head: () => ({
    meta: [
      { title: "Cadastro de empresa — Mercado Geotécnico" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CadastroEmpresa,
});

function CadastroEmpresa() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="container-page py-16 text-center text-muted-foreground">Carregando...</div>
    );
  }

  if (!session) {
    return (
      <div className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
          <Building2 className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold">Crie sua conta antes de cadastrar a empresa</h1>
        <p className="max-w-md text-muted-foreground">
          O cadastro da empresa fica vinculado à sua conta pessoal. Crie sua conta (ou entre, se já
          tiver uma) e volte aqui em seguida.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/cadastro/usuario">Criar conta</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/entrar">Já tenho conta</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <EmpresaForm email={session.user.email ?? ""} />;
}

function EmpresaForm({ email }: { email: string }) {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [form, setForm] = useState({
    companyName: "",
    cnpj: "",
    city: "",
    state: "",
    phone: "",
    whatsapp: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await registerCompany({
        name: form.companyName,
        cnpj: form.cnpj,
        city: form.city,
        state: form.state,
        phone: form.phone,
        whatsapp: form.whatsapp,
        description: form.description,
      });
      await refreshProfile();
      navigate({ to: "/painel" });
    } catch (err) {
      setError(
        err instanceof Error && err.message === "company_already_exists"
          ? "Sua conta já tem uma empresa cadastrada."
          : "Não foi possível cadastrar a empresa. Tente novamente.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-12">
      <div className="mx-auto mb-8 max-w-lg text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
          <Building2 className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold">Cadastrar empresa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seu cadastro passa por aprovação do administrador antes de anunciar.
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_320px]">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nome da empresa</Label>
              <Input
                required
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                required
                value={form.cnpj}
                onChange={(e) => set("cnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                required
                value={form.phone}
                onChange={(e) => set("phone", formatPhoneBR(e.target.value))}
                placeholder="(11) 91234-5678"
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input required value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.state} onValueChange={(v) => set("state", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>WhatsApp (com DDI, ex: 5511999990000)</Label>
              <Input
                required
                value={form.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Descrição da empresa</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-1 text-sm font-medium">Conta vinculada</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Cadastrando..." : "Cadastrar empresa"}
          </Button>
        </form>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Assim vai aparecer
          </p>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="h-16 bg-gradient-to-r from-secondary to-primary" />
            <div className="-mt-8 flex flex-col items-start gap-2 p-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-card bg-secondary text-sm font-bold text-secondary-foreground">
                {(form.companyName || "?").slice(0, 2).toUpperCase()}
              </span>
              <h3 className="font-semibold leading-tight">
                {form.companyName || "Nome da sua empresa"}
              </h3>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {form.city || form.state ? `${form.city || "Cidade"}/${form.state || "UF"}` : "—"}
              </p>
              {form.phone && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" /> {form.phone}
                </p>
              )}
              <p className="line-clamp-3 text-xs text-muted-foreground">
                {form.description || "A descrição da sua empresa aparece aqui."}
              </p>
              <span className="mt-1 flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                <Sparkles className="h-3 w-3" /> Aguardando aprovação
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
