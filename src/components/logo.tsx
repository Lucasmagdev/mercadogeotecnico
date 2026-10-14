export function Logo({
  className = "",
  size = "default",
  inverse = false,
}: {
  className?: string;
  size?: "default" | "large";
  inverse?: boolean;
}) {
  const large = size === "large";

  return (
    <span className={`inline-flex shrink-0 items-center gap-2.5 ${className}`}>
      <span
        className={`flex shrink-0 items-center justify-center rounded-xl bg-white ${large ? "h-14 w-14 p-1.5" : "h-10 w-10 p-1"}`}
      >
        <img
          src="/brand/mercado-geotecnico-symbol.png"
          alt=""
          width={128}
          height={128}
          className="h-full w-full object-contain"
          decoding="async"
        />
      </span>
      <span className="flex flex-col gap-0.5 whitespace-nowrap leading-none">
        <span
          className={`${large ? "text-xs" : "text-[10px]"} font-semibold uppercase tracking-[0.18em] ${inverse ? "text-white/75" : "text-foreground/75"}`}
        >
          Mercado
        </span>
        <span
          className={`${large ? "text-xl" : "text-base"} font-bold tracking-tight ${inverse ? "text-white" : "text-primary"}`}
        >
          Geotécnico
        </span>
      </span>
    </span>
  );
}
