export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="text-lg font-bold tracking-tight">
        Mercado <span className="text-primary">Geotécnico</span>
      </span>
    </span>
  );
}
