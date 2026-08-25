import { Building2 } from "lucide-react";
import { getCompanyImageUrl } from "@/lib/company-images";
import { cn } from "@/lib/utils";

type CompanyAvatarProps = {
  name: string;
  slug: string;
  logoPath?: string | null;
  className?: string;
};

export function CompanyAvatar({ name, logoPath, className }: CompanyAvatarProps) {
  const photo = getCompanyImageUrl(logoPath);

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={cn("h-12 w-12 shrink-0 rounded-full bg-white object-contain p-1", className)}
      />
    );
  }

  return (
    <span
      aria-label={`${name} sem logotipo`}
      role="img"
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground",
        className,
      )}
    >
      <Building2 aria-hidden="true" className="h-1/2 w-1/2" />
    </span>
  );
}
