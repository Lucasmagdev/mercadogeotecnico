import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, MailCheck } from "lucide-react";
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
import { supabase } from "@/lib/supabase";
import { states } from "@/lib/mock-data";

export const Route = createFileRoute("/cadastro/empresa")({
  head: () => ({
    meta: [{ title: "Cadastro de empresa — Mercado Geotécnico" }, { name: "robots", content: "noindex" }],
  }),
  component: CadastroEmpresa,
});

function CadastroEmpresa() {
  const [form, setForm] = useState({
    companyName: "",
    cnpj: "",
    city: "",
    state: "",
    phone: "",
    whatsapp: "",
    description: "",
    fullName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          account_type: "company",
          full_name: form.fullName,
          company_name: form.companyName,
          cnpj: form.cnpj,
          city: form.city,
          state: form.state,
          phone: form.phone,
          whatsapp: form.whatsapp,
          description: form.description,
        },
      },
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
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
            <MailCheck className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-bold">Confirme seu e-mail</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enviamos um link de confirmação para <strong>{form.email}</strong>. Depois de confirmar, sua empresa
            entra na fila de aprovação do administrador — você poderá anunciar assim que for aprovada.
          </p>
          <Button asChild className="mt-5 w-full"><Link to="/entrar">Ir para o login</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <Building2 className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold">Cadastrar empresa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seu cadastro passa por aprovação do administrador antes de anunciar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nome da empresa</Label>
              <Input required value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input required value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input required value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.state} onValueChange={(v) => set("state", v)}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>WhatsApp (com DDI, ex: 5511999990000)</Label>
              <Input required value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Descrição da empresa</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-sm font-medium">Dados de acesso</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Seu nome</Label>
                <Input required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>E-mail</Label>
                <Input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Senha</Label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Cadastrar empresa"}
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
