import { useState } from "react";
import { Award, Building2, ExternalLink, ShieldCheck } from "lucide-react";
import { VerifiedSeal } from "@/components/verified-seal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type GeoSelosVerificationProps = {
  variant?: "icon" | "compact" | "full";
  className?: string;
};

export function GeoSelosVerification({
  variant = "compact",
  className,
}: GeoSelosVerificationProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        aria-label="Ver detalhes da verificação GeoSelos"
        aria-haspopup="dialog"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "inline-flex shrink-0 cursor-pointer items-center transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2",
          variant === "icon" && "rounded-full",
          variant === "compact" &&
            "gap-1 rounded-full border border-amber-400/25 bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold leading-none text-[#14265C] dark:text-amber-300",
          variant === "full" &&
            "gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-[#14265C] dark:text-amber-300",
          className,
        )}
      >
        <VerifiedSeal
          className={cn(
            variant === "icon" && "h-4 w-4",
            variant === "compact" && "h-3.5 w-3.5",
            variant === "full" && "h-4 w-4",
          )}
        />
        {variant === "compact" && <span>GeoSelos</span>}
        {variant === "full" && <span>Verificada pela GeoSelos</span>}
      </button>

      <DialogContent
        className="max-w-md overflow-hidden border-amber-400/30 p-0"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-[#14265C] px-6 py-7 text-white">
          <div className="flex items-center gap-4">
            <VerifiedSeal className="h-14 w-14" />
            <DialogHeader className="space-y-2 text-left">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
                Selo de confiança técnica
              </p>
              <DialogTitle className="text-xl text-white">Verificada pela GeoSelos</DialogTitle>
              <DialogDescription className="text-sm text-blue-100">
                Reconhecimento de capacitação técnica para empresas de fundações e geotecnia.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Esta empresa apresenta um selo GeoSelos associado ao reconhecimento de sua capacitação
            técnica no setor.
          </p>

          <div className="grid gap-3">
            <div className="flex gap-3 rounded-xl border border-border bg-muted/40 p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-300">
                <Award className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Capacitação reconhecida</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  O selo destaca empresas com reconhecimento técnico GeoSelos.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-xl border border-border bg-muted/40 p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Building2 className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Especialização setorial</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Identificação voltada ao mercado de fundações e geotecnia.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 rounded-xl bg-primary/5 p-3.5 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              O selo aumenta a confiança na empresa, mas não substitui a análise comercial,
              contratual e técnica de cada negociação.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:space-x-0">
            <Button
              asChild
              className="w-full rounded-full bg-[#14265C] text-white hover:bg-[#1b3475]"
            >
              <a
                href="https://geoselos.com/"
                target="_blank"
                rel="noreferrer"
              >
                Solicite sua verificação GeoSelos
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <DialogClose asChild>
              <Button variant="outline" className="w-full rounded-full">
                Entendi
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
