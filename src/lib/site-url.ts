const configuredUrl = import.meta.env.VITE_SITE_URL || "https://mercadogeotecnico.com";

export const SITE_URL = new URL(configuredUrl).origin;

export function absoluteSiteUrl(path: string) {
  return new URL(path.startsWith("/") && !path.startsWith("//") ? path : "/", SITE_URL).href;
}
