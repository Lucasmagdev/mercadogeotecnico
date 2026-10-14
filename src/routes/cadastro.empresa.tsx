import { useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ImagePlus, MapPin, Phone, Sparkles } from "lucide-react";
import { toast } from "sonner";
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
import { fetchMyCompany, registerCompany, updateCompany } from "@/lib/queries";
import { uploadCompanyImage } from "@/lib/company-images";
import { supabase } from "@/lib/supabase";
import { states } from "@/lib/mock-data";
import { formatPhoneBR } from "@/lib/utils";
import { EmailConfirmation } from "@/components/email-confirmation";
import { CompanyApproval } from "@/components/company-approval";
import { SupportContact } from "@/components/support-contact";
import { confirmationRedirectUrl, safeInternalRedirect } from "@/lib/auth-redirect";

export const Route = createFileRoute("/cadastro/empresa")({
  head: () => ({
    meta: [
      { title: "Cadastro de empresa — Mercado Geotécnico" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CadastroEmpresa,
});

type CompanyFields = {
  companyName: string;
  cnpj: string;
  city: string;
  state: string;
  phone: string;
  whatsapp: string;
  description: string;
};

function CompanyFieldsGrid({
  form,
  set,
}: {
  form: CompanyFields;
  set: <K extends keyof CompanyFields>(key: K, value: CompanyFields[K]) => void;
}) {
  return (
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
  );
}

function CompanyPreview({
  form,
  logoPreview,
}: {
  form: CompanyFields;
  logoPreview?: string | null;
}) {
  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Assim vai aparecer
      </p>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="h-16 bg-gradient-to-r from-secondary to-primary" />
        <div className="-mt-8 flex flex-col items-start gap-2 p-4">
          {logoPreview ? (
            <img
              src={logoPreview}
              alt="Logo"
              className="h-14 w-14 rounded-full border-4 border-card object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-card bg-secondary text-sm font-bold text-secondary-foreground">
              {(form.companyName || "?").slice(0, 2).toUpperCase()}
            </span>
          )}
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
  );
}

function CadastroEmpresa() {
  const { session, loading } = useAuth();
  const {
    data: company,
    isLoading: companyLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["my-company", session?.user.id],
    queryFn: () => fetchMyCompany(session!.user.id),
    enabled: !!session,
  });

  if (loading || (session && companyLoading)) {
    return (
      <div className="container-page py-16 text-center text-muted-foreground">Carregando...</div>
    );
  }

  if (session && isError) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 py-10 text-center">
        <p role="alert">Não foi possível consultar o cadastro da empresa. Confira sua conexão.</p>
        <Button onClick={() => void refetch()} disabled={isFetching}>
          Tentar novamente
        </Button>
        <SupportContact />
      </div>
    );
  }

  if (company?.status === "pending" || company?.status === "rejected") {
    return (
      <CompanyApproval
        status={company.status}
        companyName={company.name}
        onRefresh={() => void refetch()}
        refreshing={isFetching}
      />
    );
  }

  if (company) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 py-10 text-center">
        <h1 className="text-xl font-bold">Sua empresa já está cadastrada</h1>
        <p className="max-w-md text-muted-foreground">
          {company.name} está aprovada. Publique um item com fotos reais e informações técnicas.
        </p>
        <Button asChild>
          <Link to="/publicar">Publicar anúncio</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/painel">Acessar painel</Link>
        </Button>
      </div>
    );
  }

  return session ? (
    <EmpresaForm email={session.user.email ?? ""} userId={session.user.id} />
  ) : (
    <SignupAndEmpresaForm />
  );
}

/** New visitor: create account + company in a single step (one email confirmation). */
function SignupAndEmpresaForm() {
  const search = Route.useSearch();
  const redirect = safeInternalRedirect(search.redirect, "/painel");
  const [form, setForm] = useState<CompanyFields>({
    companyName: "",
    cnpj: "",
    city: "",
    state: "",
    phone: "",
    whatsapp: "",
    description: "",
  });
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function set<K extends keyof CompanyFields>(key: K, value: CompanyFields[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

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
          data: {
            account_type: "company",
            full_name: fullName,
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
    return <EmailConfirmation email={email} redirect={redirect} company />;
  }

  return (
    <div className="container-page py-12">
      <div className="mx-auto mb-8 max-w-lg text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
          <Building2 className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold">Cadastrar empresa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crie sua conta e cadastre a empresa em um só passo. O cadastro passa por aprovação do
          administrador antes de anunciar.
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_320px]">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft"
        >
          <CompanyFieldsGrid form={form} set={set} />

          <div className="space-y-4 border-t border-border pt-4">
            <p className="text-sm font-medium">Dados de acesso</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Seu nome</Label>
                <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Senha</Label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Cadastrando..." : "Criar conta e cadastrar empresa"}
          </Button>
        </form>

        <CompanyPreview form={form} />
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link
          to="/entrar"
          search={{ redirect: "/cadastro/empresa" }}
          className="font-medium text-primary hover:underline"
        >
          Entrar
        </Link>{" "}
        e cadastre sua empresa depois de logar.
      </p>
    </div>
  );
}

/** Already logged in: just add the company to the existing account. */
function EmpresaForm({ email, userId }: { email: string; userId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();
  const [form, setForm] = useState<CompanyFields>({
    companyName: "",
    cnpj: "",
    city: "",
    state: "",
    phone: "",
    whatsapp: "",
    description: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof CompanyFields>(key: K, value: CompanyFields[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    let newId: string;
    try {
      newId = await registerCompany({
        name: form.companyName,
        cnpj: form.cnpj,
        city: form.city,
        state: form.state,
        phone: form.phone,
        whatsapp: form.whatsapp,
        description: form.description,
      });
    } catch (err) {
      setError(
        err instanceof Error && err.message === "company_already_exists"
          ? "Sua conta já tem uma empresa cadastrada."
          : "Não foi possível cadastrar a empresa. Tente novamente.",
      );
      setLoading(false);
      return;
    }

    if (logoFile) {
      try {
        const path = await uploadCompanyImage(userId, logoFile, "logo");
        await updateCompany(newId, { logo_path: path });
      } catch {
        toast.warning(
          "Empresa cadastrada. O logo não foi enviado; você pode adicioná-lo depois em Configurações.",
        );
      }
    }
    await Promise.allSettled([
      refreshProfile(),
      queryClient.invalidateQueries({ queryKey: ["my-company", userId] }),
    ]);
    void navigate({ to: "/painel" });
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
          <CompanyFieldsGrid form={form} set={set} />

          <div className="space-y-2">
            <Label>Logo da empresa (opcional)</Label>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" />
                {logoPreview ? "Trocar" : "Adicionar"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (logoPreview) URL.revokeObjectURL(logoPreview);
                  setLogoFile(file);
                  setLogoPreview(URL.createObjectURL(file));
                  e.target.value = "";
                }}
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

        <CompanyPreview form={form} logoPreview={logoPreview} />
      </div>
    </div>
  );
}
