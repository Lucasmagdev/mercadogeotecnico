import { CircleCheck, TrendingUp } from "lucide-react";
import type { ListingQuality } from "@/lib/listing-quality";
import { cn } from "@/lib/utils";

export function ListingQualityMeter({ quality }: { quality: ListingQuality }) {
  const { score, suggestions } = quality;
  const tone =
    score >= 80
      ? "text-success"
      : score >= 50
        ? "text-accent"
        : "text-destructive";
  const barTone =
    score >= 80 ? "bg-success" : score >= 50 ? "bg-accent" : "bg-destructive";

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-semibold">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          Qualidade do anúncio
        </span>
        <span className={cn("text-lg font-bold", tone)}>{score}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all duration-300", barTone)}
          style={{ width: `${score}%` }}
        />
      </div>

      {suggestions.length > 0 ? (
        <div className="mt-4 space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">Para melhorar:</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {suggestions.map((s) => (
              <li key={s} className="flex items-start gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 flex items-center gap-1.5 text-sm text-success">
          <CircleCheck className="h-4 w-4" />
          Anúncio tecnicamente completo!
        </p>
      )}
    </div>
  );
}
