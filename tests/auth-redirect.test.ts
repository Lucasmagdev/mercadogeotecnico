import { describe, expect, test } from "bun:test";
import { safeInternalRedirect, validateAuthSearch } from "../src/lib/auth-redirect";

describe("safeInternalRedirect", () => {
  test("preserves internal destinations, query strings and fragments", () => {
    expect(safeInternalRedirect("/pecas/haste?q=sondagem#contato")).toBe(
      "/pecas/haste?q=sondagem#contato",
    );
    expect(safeInternalRedirect("/publicar")).toBe("/publicar");
    expect(safeInternalRedirect("/pecas?q=https://example.com")).toBe(
      "/pecas?q=https://example.com",
    );
  });

  test.each([
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/%5cexample.com",
    "/%2fexample.com",
    "/safe\npath",
    "/safe%0dpath",
    "/%",
    "javascript:alert(1)",
    "publicar",
    "/entrar",
    "/entrar?redirect=/publicar",
    "/ENTRAR/",
    "/%65ntrar",
  ])("rejects unsafe or looping destination %p", (destination) => {
    expect(safeInternalRedirect(destination, "/painel")).toBe("/painel");
  });

  test("uses the fallback for missing or non-text input", () => {
    expect(safeInternalRedirect(undefined, "/painel")).toBe("/painel");
    expect(safeInternalRedirect({ redirect: "/publicar" })).toBe("/");
  });
});

test("auth search ignores unrelated input and normalizes an external redirect", () => {
  expect(validateAuthSearch({ utm_source: "megaobra" })).toEqual({});
  expect(validateAuthSearch({ redirect: "/publicar" })).toEqual({ redirect: "/publicar" });
  expect(validateAuthSearch({ redirect: "https://example.com" })).toEqual({ redirect: "/" });
});
