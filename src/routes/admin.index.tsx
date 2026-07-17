import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Clock, CheckCircle2 } from "lucide-react";
import { fetchAllCompaniesAdmin } from "@/lib/queries";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const { data: companies } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: fetchAllCompaniesAdmin,
  });

  const pending = companies?.filter((c) => c.status === "pending").length ?? 0;
  const approved = companies?.filter((c) => c.status === "approved").length ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold">Visão geral</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <Building2 className="h-5 w-5 text-primary" />
          <p className="mt-3 text-2xl font-bold">{companies?.length ?? "–"}</p>
          <p className="text-sm text-muted-foreground">Empresas cadastradas</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <Clock className="h-5 w-5 text-accent" />
          <p className="mt-3 text-2xl font-bold">{pending}</p>
          <p className="text-sm text-muted-foreground">Aguardando aprovação</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <p className="mt-3 text-2xl font-bold">{approved}</p>
          <p className="text-sm text-muted-foreground">Aprovadas</p>
        </div>
      </div>

      {pending > 0 && (
        <Link
          to="/admin/empresas"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Revisar empresas pendentes
        </Link>
      )}
    </div>
  );
}
