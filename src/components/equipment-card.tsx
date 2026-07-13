import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, MapPin, BadgeCheck, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  type Equipment,
  equipmentImages,
  formatPrice,
  getCompany,
} from "@/lib/mock-data";

export function EquipmentCard({ item, index = 0 }: { item: Equipment; index?: number }) {
  const [fav, setFav] = useState(false);
  const company = getCompany(item.companyId);

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
        className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={equipmentImages[item.image]}
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
              setFav((v) => !v);
            }}
            aria-label="Favoritar"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft backdrop-blur transition-colors hover:text-accent"
          >
            <Heart className={cn("h-4.5 w-4.5", fav && "fill-accent text-accent")} />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Badge variant="outline" className="rounded-full px-2 py-0 text-[11px] font-normal">
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

          <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
            <span className="line-clamp-1 text-sm font-medium">{company?.name}</span>
            {company?.verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-success" aria-label="Empresa verificada" />
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
