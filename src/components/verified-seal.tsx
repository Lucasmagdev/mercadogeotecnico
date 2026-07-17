import { cn } from "@/lib/utils";

export function VerifiedSeal({
  className,
  label = "Verificada pela GeoSelos",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("inline-block shrink-0", className)}
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <circle cx="12" cy="12" r="10.25" fill="#F6B91E" stroke="#14265C" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="7.75" fill="none" stroke="#14265C" strokeWidth="0.75" />
      <path
        d="m7.35 12.1 3.05 3.15 6.45-7"
        fill="none"
        stroke="#14265C"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
