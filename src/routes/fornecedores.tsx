import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, MapPin, Star, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { fetchApprovedCompanies } from "@/lib/queries";

export const Route = createFileRoute("/fornecedores")({
  head: () => ({
    meta: [
      { title: "Fornecedores — Mercado Geotécnico" },
      { name: "description", content: "Encontre fornecedores confiáveis de equipamentos, peças e serviços de engenharia." },
    ],
  }),
  component: Suppliers,
});

function Suppliers() {
  const [q, setQ] = useState("");
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: fetchApprovedCompanies });
  const filtered = useMemo(
    () => companies.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase())),
    [companies, q],
  );

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Fornecedores</h1>
        <p className="mt-1 text-muted-foreground">Fornecedores verificados de equipamentos, peças e serviços.</p>
      </div>
      <div className="relative mb-8 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar fornecedor..." className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 && <p className="text-sm text-muted-foreground">Nenhum fornecedor encontrado.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Link
            key={c.id}
            to="/empresas/$slug"
            params={{ slug: c.slug }}
            className="rounded-2xl border border-border bg-card p-5 text-center shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <Avatar className="mx-auto h-16 w-16">
              <AvatarFallback className="bg-secondary text-lg font-bold text-secondary-foreground">
                {c.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <h3 className="font-semibold">{c.name}</h3>
              {c.verified && <BadgeCheck className="h-4 w-4 text-success" />}
            </div>
            <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {c.city}/{c.state}
            </p>
            <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {c.rating} ({c.reviews})
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {c.services.slice(0, 2).map((s) => (
                <Badge key={s} variant="outline" className="rounded-full text-xs font-normal">{s}</Badge>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
