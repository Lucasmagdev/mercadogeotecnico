import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/auth-provider";
import { fetchMyCompany, updateCompany, updateProfile } from "@/lib/queries";
import { states } from "@/lib/mock-data";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [{ title: "Configurações — Mercado Geotécnico" }, { name: "robots", content: "noindex" }],
  }),
  component: Configuracoes,
});

function Configuracoes() {
  const { session, profile, loading, refreshProfile } = useAuth();

  if (loading) {
    return <div className="container-page py-16 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!session) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-xl font-bold">Entre para gerenciar sua conta</h1>
        <Button asChild><Link to="/entrar">Entrar</Link></Button>
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Configurações</h1>
      <p className="mt-1 text-muted-foreground">Gerencie os dados da sua conta.</p>

      {profile?.role === "company" ? (
        <CompanySettings ownerId={session.user.id} />
      ) : (
        <ProfileSettings userId={session.user.id} refreshProfile={refreshProfile} />
      )}
    </div>
  );
}

function ProfileSettings({ userId, refreshProfile }: { userId: string; refreshProfile: () => Promise<void> }) {
  const { profile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile?.full_name, profile?.phone]);

  const mutation = useMutation({
    mutationFn: () => updateProfile(userId, { full_name: fullName, phone }),
    onSuccess: async () => {
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <div className="mt-6 space-y-6 rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Nome completo</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Telefone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-success">Salvo!</span>}
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}

function CompanySettings({ ownerId }: { ownerId: string }) {
  const queryClient = useQueryClient();
  const { data: company, isLoading } = useQuery({
    queryKey: ["my-company", ownerId],
    queryFn: () => fetchMyCompany(ownerId),
  });

  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    city: "",
    state: "",
    phone: "",
    whatsapp: "",
    site: "",
    description: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name ?? "",
        cnpj: company.cnpj ?? "",
        city: company.city ?? "",
        state: company.state ?? "",
        phone: company.phone ?? "",
        whatsapp: company.whatsapp ?? "",
        site: company.site ?? "",
        description: company.description ?? "",
      });
    }
  }, [company]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const mutation = useMutation({
    mutationFn: () => updateCompany(company!.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-company", ownerId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (isLoading) {
    return <p className="mt-6 text-sm text-muted-foreground">Carregando...</p>;
  }

  if (!company) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Você ainda não tem uma empresa cadastrada.</p>
        <Button asChild><Link to="/cadastro/empresa">Cadastrar empresa</Link></Button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6 rounded-2xl border border-border bg-card p-6">
      {company.status === "approved" && (
        <div className="flex items-center gap-2 text-sm font-medium text-success">
          <BadgeCheck className="h-4 w-4" /> Empresa aprovada{company.verified && " e verificada"}
        </div>
      )}
      {company.status === "pending" && (
        <div className="flex items-center gap-2 text-sm font-medium text-accent-foreground">
          <Clock className="h-4 w-4" /> Cadastro aguardando aprovação
        </div>
      )}
      {company.status === "rejected" && (
        <div className="flex items-center gap-2 text-sm font-medium text-destructive">
          <ShieldAlert className="h-4 w-4" /> Cadastro não aprovado
        </div>
      )}
      <Separator />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Nome da empresa</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>CNPJ</Label>
          <Input value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>WhatsApp</Label>
          <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Site</Label>
          <Input value={form.site} onChange={(e) => set("site", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Cidade</Label>
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
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
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-success">Salvo!</span>}
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}
