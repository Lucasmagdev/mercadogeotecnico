import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GeoSelosVerification } from "@/components/geoselos-verification";
import { fetchAllCompaniesAdmin, setCompanyStatus } from "@/lib/queries";

export const Route = createFileRoute("/admin/empresas")({
  component: AdminEmpresas,
});

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovada",
  rejected: "Rejeitada",
};

const statusClass: Record<string, string> = {
  pending: "bg-accent/15 text-accent-foreground",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
};

function AdminEmpresas() {
  const queryClient = useQueryClient();
  const {
    data: companies,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: fetchAllCompaniesAdmin,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      setCompanyStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-companies"] }),
    onError: () => toast.error("Não foi possível atualizar o status. Tente novamente."),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Empresas</h1>
      <p className="mt-1 text-muted-foreground">Aprove ou rejeite cadastros de empresas.</p>

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {isError && (
          <p className="text-sm text-destructive">
            Não foi possível carregar as empresas. Recarregue a página.
          </p>
        )}
        {companies?.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{c.name}</p>
                {c.verified && <GeoSelosVerification />}
                <Badge className={`border-0 ${statusClass[c.status]}`}>
                  {statusLabel[c.status]}
                </Badge>
              </div>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {c.city}/{c.state} ·{" "}
                {c.cnpj || "CNPJ não informado"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {c.phone} · {c.whatsapp}
              </p>
            </div>
            {c.status !== "approved" && (
              <Button
                size="sm"
                className="gap-1.5"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ id: c.id, status: "approved" })}
              >
                <Check className="h-4 w-4" /> Aprovar
              </Button>
            )}
            {c.status !== "rejected" && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-destructive hover:bg-destructive/10"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ id: c.id, status: "rejected" })}
              >
                <X className="h-4 w-4" /> Rejeitar
              </Button>
            )}
          </div>
        ))}
        {companies?.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma empresa cadastrada ainda.</p>
        )}
      </div>
    </div>
  );
}
