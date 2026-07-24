import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CircleCheck,
  Clock,
  ShieldAlert,
  ImagePlus,
  ImageOff,
  Lock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GeoSelosVerification } from "@/components/geoselos-verification";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { fetchMyCompany, updateCompany, updateProfile } from "@/lib/queries";
import { getCompanyImageUrl, uploadCompanyImage } from "@/lib/company-images";
import { states } from "@/lib/mock-data";
import { formatPhoneBR } from "@/lib/utils";
import type { Company } from "@/lib/supabase";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [{ title: "Configurações — Mercado Geotécnico" }, { name: "robots", content: "noindex" }],
  }),
  component: Configuracoes,
});

function Configuracoes() {
  const { session, profile, loading, refreshProfile } = useAuth();

  if (loading) {
    return (
      <div className="container-page py-16 text-center text-muted-foreground">Carregando...</div>
    );
  }

  if (!session) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-xl font-bold">Entre para gerenciar sua conta</h1>
        <Button asChild>
          <Link to="/entrar">Entrar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Configurações</h1>
      <p className="mt-1 text-muted-foreground">Gerencie os dados da sua conta.</p>

      {profile?.role === "company" ? (
        <Tabs defaultValue="empresa" className="mt-6">
          <TabsList>
            <TabsTrigger value="empresa">Empresa</TabsTrigger>
            <TabsTrigger value="aparencia">Aparência</TabsTrigger>
            <TabsTrigger value="conta">Minha conta</TabsTrigger>
          </TabsList>
          <TabsContent value="empresa">
            <CompanySettings ownerId={session.user.id} />
          </TabsContent>
          <TabsContent value="aparencia">
            <CompanyAppearance ownerId={session.user.id} />
          </TabsContent>
          <TabsContent value="conta">
            <ProfileSettings userId={session.user.id} refreshProfile={refreshProfile} />
          </TabsContent>
        </Tabs>
      ) : (
        <>
          <ProfileSettings userId={session.user.id} refreshProfile={refreshProfile} />
          <div className="mt-4 rounded-2xl border border-dashed border-border p-4 text-sm">
            <p className="font-medium">Tem uma empresa?</p>
            <p className="mt-0.5 text-muted-foreground">
              Cadastre sua empresa e comece a anunciar peças.
            </p>
            <Link
              to="/cadastro/empresa"
              className="mt-1.5 inline-block font-semibold text-primary hover:underline"
            >
              Cadastrar minha empresa →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function ProfileSettings({
  userId,
  refreshProfile,
}: {
  userId: string;
  refreshProfile: () => Promise<void>;
}) {
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
    onError: () => toast.error("Não foi possível salvar. Tente novamente."),
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
          <Input value={phone} onChange={(e) => setPhone(formatPhoneBR(e.target.value))} />
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
    onError: () => toast.error("Não foi possível salvar. Tente novamente."),
  });

  if (isLoading) {
    return <p className="mt-6 text-sm text-muted-foreground">Carregando...</p>;
  }

  if (!company) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Você ainda não tem uma empresa cadastrada.</p>
        <Button asChild>
          <Link to="/cadastro/empresa">Cadastrar empresa</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6 rounded-2xl border border-border bg-card p-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-1.5" asChild>
          <Link to="/empresas/$slug" params={{ slug: company.slug }} target="_blank">
            <ExternalLink className="h-4 w-4" /> Ver meu perfil
          </Link>
        </Button>
      </div>
      {company.status === "approved" && (
        <div className="flex items-center gap-2 text-sm font-medium text-success">
          {company.verified ? (
            <GeoSelosVerification variant="icon" />
          ) : (
            <CircleCheck className="h-4 w-4" aria-hidden />
          )}
          Empresa aprovada{company.verified && " e verificada pela GeoSelos"}
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
          <Input value={form.phone} onChange={(e) => set("phone", formatPhoneBR(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>WhatsApp</Label>
          <Input
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, ""))}
          />
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
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          rows={4}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
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

function CompanyAppearance({ ownerId }: { ownerId: string }) {
  const queryClient = useQueryClient();
  const { data: company, isLoading } = useQuery({
    queryKey: ["my-company", ownerId],
    queryFn: () => fetchMyCompany(ownerId),
  });

  if (isLoading) {
    return <p className="mt-6 text-sm text-muted-foreground">Carregando...</p>;
  }

  if (!company) return null;

  return (
    <div className="mt-6 space-y-6">
      <ImageUploadCard
        title="Logo da empresa"
        description="Aparece nos seus anúncios e no seu perfil público."
        kind="logo"
        company={company}
        ownerId={ownerId}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["my-company", ownerId] })}
      />
      <ImageUploadCard
        title="Capa do perfil"
        description="Imagem de fundo do seu perfil público."
        kind="banner"
        company={company}
        ownerId={ownerId}
        locked={!company.verified}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["my-company", ownerId] })}
      />
    </div>
  );
}

function ImageUploadCard({
  title,
  description,
  kind,
  company,
  ownerId,
  locked,
  onSaved,
}: {
  title: string;
  description: string;
  kind: "logo" | "banner";
  company: Company;
  ownerId: string;
  locked?: boolean;
  onSaved: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const currentPath = kind === "logo" ? company.logo_path : company.banner_path;
  const previewUrl = pendingPreview ?? getCompanyImageUrl(currentPath);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const path = await uploadCompanyImage(ownerId, file, kind);
      await updateCompany(
        company.id,
        kind === "logo" ? { logo_path: path } : { banner_path: path },
      );
    },
    onSuccess: () => {
      setPendingFile(null);
      setPendingPreview(null);
      toast.success("Imagem salva!");
      onSaved();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar a imagem."),
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {!locked && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={mutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              {currentPath || pendingPreview ? "Trocar" : "Adicionar"}
            </Button>
            {pendingFile && (
              <Button
                type="button"
                size="sm"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(pendingFile)}
              >
                {mutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (pendingPreview) URL.revokeObjectURL(pendingPreview);
          setPendingFile(file);
          setPendingPreview(URL.createObjectURL(file));
          e.target.value = "";
        }}
      />

      {locked ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0" />
          Disponível para empresas verificadas pela GeoSelos.
        </div>
      ) : (
        <div
          className={
            kind === "logo"
              ? "mt-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-muted"
              : "mt-4 flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-muted"
          }
        >
          {previewUrl ? (
            <img src={previewUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <ImageOff
              className="h-6 w-6 shrink-0 text-muted-foreground"
              aria-label="Nenhuma imagem"
            />
          )}
        </div>
      )}
    </div>
  );
}
