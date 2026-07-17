import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, MapPin, Clock, Calendar, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GeoSelosVerification } from "@/components/geoselos-verification";
import { CompanyAvatar } from "@/components/company-avatar";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/mock-data";
import { getEquipmentCoverUrl } from "@/lib/equipment-images";
import type { EquipmentRow } from "@/lib/supabase";
import { useFavoriteToggle } from "@/hooks/use-favorite";

export function EquipmentCard({
  item,
  index = 0,
  layout = "grid",
  categoryName,
}: {
  item: EquipmentRow;
  index?: number;
  layout?: "grid" | "list";
  categoryName?: string;
}) {
  const navigate = useNavigate();
  const { isFavorite, toggle, loggedIn } = useFavoriteToggle(item.id);
  const company = item.companies;
  const coverUrl = getEquipmentCoverUrl(item);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link
        to="/equipamentos/$slug"
        params={{ slug: item.slug }}
        className={cn(
          "group block overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift",
          layout === "list" && "sm:flex sm:hover:-translate-y-0",
        )}
      >
        <div
          className={cn(
            "relative aspect-[4/3] overflow-hidden bg-muted",
            layout === "list" && "sm:aspect-auto sm:h-full sm:w-64 sm:shrink-0",
          )}
        >
          <img
            src={coverUrl}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge
              className={cn(
                "rounded-full border-0 font-medium",
                item.mode === "locacao"
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {item.mode === "locacao" ? "Locação" : "Venda"}
            </Badge>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (!loggedIn) {
                navigate({ to: "/entrar" });
                return;
              }
              toggle();
            }}
            aria-label="Favoritar"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft backdrop-blur transition-colors hover:text-accent"
          >
            <Heart className={cn("h-4.5 w-4.5", isFavorite && "fill-accent text-accent")} />
          </button>
        </div>

        <div className="flex-1 p-4">
          <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="line-clamp-1">{categoryName}</span>
            <Badge
              variant="outline"
              className="shrink-0 rounded-full px-2 py-0 text-[11px] font-normal"
            >
              {item.condition}
            </Badge>
          </div>
          <h3 className="line-clamp-1 font-semibold">{item.title}</h3>
          <p className="mt-2 text-xl font-bold text-primary">
            {formatPrice(item.price, item.mode)}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {item.year}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {item.hours.toLocaleString("pt-BR")} h
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {item.city}, {item.state}
            </span>
          </div>

          {company && (
            <div className="mt-4 flex items-center gap-2.5 border-t border-border pt-3">
              <CompanyAvatar
                name={company.name}
                slug={company.slug}
                className="h-8 w-8 text-[11px]"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold" title={company.name}>
                  {company.name}
                </span>
                <span className="mt-0.5 flex min-w-0 items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                    {company.rating > 0 && (
                      <>
                        <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-foreground">
                          {company.rating.toFixed(1)}
                        </span>
                        {company.reviews > 0 && <span>({company.reviews})</span>}
                        <span aria-hidden>·</span>
                      </>
                    )}
                    <span className="truncate">{company.years_on_market} anos no mercado</span>
                  </span>
                  {company.verified && <GeoSelosVerification />}
                </span>
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
