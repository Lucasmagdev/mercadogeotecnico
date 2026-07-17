import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CompanyAvatar } from "@/components/company-avatar";
import { GeoSelosVerification } from "@/components/geoselos-verification";
import { fetchApprovedCompanies } from "@/lib/queries";

export const Route = createFileRoute("/empresas/")({
  head: () => ({
    meta: [
      { title: "Empresas — Mercado Geotécnico" },
      {
        name: "description",
        content: "Encontre empresas de engenharia verificadas e com reputação comprovada.",
      },
    ],
  }),
  component: Companies,
});

function Companies() {
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: fetchApprovedCompanies,
  });

  return (
    <div className="container-page py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Empresas</h1>
        <p className="mt-1 text-muted-foreground">
          Empresas de engenharia com reputação comprovada.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      <div className="grid gap-5 md:grid-cols-2">
        {companies.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Link
              to="/empresas/$slug"
              params={{ slug: c.slug }}
              className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <CompanyAvatar name={c.name} slug={c.slug} className="h-16 w-16 text-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate font-semibold">{c.name}</h3>
                  {c.verified && <GeoSelosVerification />}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {c.city}/{c.state}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {c.rating} ({c.reviews}
                    )
                  </span>
                  <span>{c.years_on_market} anos</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.services.slice(0, 3).map((s) => (
                    <Badge key={s} variant="outline" className="rounded-full text-xs font-normal">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
