/** Accept only same-origin paths, including their query and fragment. */
export function safeInternalRedirect(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  try {
    const decoded = decodeURIComponent(value);
    const hasUnsafeCharacter = [...decoded].some((character) => {
      const code = character.charCodeAt(0);
      return character === "\\" || code < 32 || code === 127;
    });
    if (decoded.startsWith("//") || hasUnsafeCharacter) return fallback;
    const url = new URL(value, "https://internal.invalid");
    const pathname = decodeURIComponent(url.pathname);
    if (url.origin !== "https://internal.invalid" || /^\/entrar\/?$/i.test(pathname))
      return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export type AuthSearch = { redirect?: string };

export function validateAuthSearch(search: Record<string, unknown>): AuthSearch {
  return typeof search.redirect === "string"
    ? { redirect: safeInternalRedirect(search.redirect) }
    : {};
}

export function confirmationRedirectUrl(destination: string): string {
  return `${window.location.origin}/entrar?redirect=${encodeURIComponent(safeInternalRedirect(destination))}`;
}
