import { CircleCheck, FileText, Wrench, BadgeCheck } from "lucide-react";
import type { EquipmentRow } from "@/lib/supabase";
import { computeListingQuality } from "@/lib/listing-quality";

type Badge = { icon: typeof FileText; label: string };

export function ListingTrustBadges({ item }: { item: EquipmentRow }) {
  const quality = computeListingQuality({
    title: item.title,
    description: item.description ?? "",
    brand: item.brand ?? "",
    model: item.model ?? "",
    price: item.price,
    city: item.city ?? "",
    state: item.state ?? "",
    condition: item.condition,
    photosCount: item.images.length,
    specs: item.specs,
    compatibleWith: item.compatible_with,
  });

  const badges: Badge[] = [
    ...(item.has_invoice ? [{ icon: FileText, label: "Nota fiscal disponível" }] : []),
    ...(item.has_calibration_cert
      ? [{ icon: BadgeCheck, label: "Certificado de calibração disponível" }]
      : []),
    ...(item.maintenance_history_informed
      ? [{ icon: Wrench, label: "Histórico de manutenção informado" }]
      : []),
    ...(quality.score >= 90
      ? [{ icon: CircleCheck, label: "Anúncio tecnicamente completo" }]
      : []),
  ];

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <span
          key={b.label}
          className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
        >
          <b.icon className="h-3.5 w-3.5 shrink-0" />
          {b.label}
        </span>
      ))}
    </div>
  );
}
