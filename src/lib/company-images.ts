import gontijoLogo from "@/assets/verified-companies/gontijo.png";
import geotesteLogo from "@/assets/verified-companies/geoteste.jpg";

// Company profile pictures used across product cards and company pages.
// Each company slug picks one deterministically so the same company
// always shows the same picture across the app.
const companyPhotoPool: string[] = [gontijoLogo, geotesteLogo];

// Exact logo per company slug; anything else falls back to the pool.
const companyPhotoBySlug: Record<string, string> = {
  "gontijo-fundacoes": gontijoLogo,
  geoteste: geotesteLogo,
};

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic profile picture for a company, or null when the pool is empty. */
export function getCompanyPhotoUrl(slug: string): string | null {
  if (companyPhotoBySlug[slug]) return companyPhotoBySlug[slug];
  if (companyPhotoPool.length === 0) return null;
  return companyPhotoPool[hashSlug(slug) % companyPhotoPool.length];
}
