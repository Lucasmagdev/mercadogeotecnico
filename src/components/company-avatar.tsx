import { getCompanyPhotoUrl } from "@/lib/company-images";
import { cn } from "@/lib/utils";

type CompanyAvatarProps = {
  name: string;
  slug: string;
  className?: string;
};

export function CompanyAvatar({ name, slug, className }: CompanyAvatarProps) {
  const photo = getCompanyPhotoUrl(slug);

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
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground",
        className,
      )}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
