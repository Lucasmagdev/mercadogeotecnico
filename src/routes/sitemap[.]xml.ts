import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { fetchApprovedCompanies, fetchEquipmentList } from "@/lib/queries";

const BASE_URL = "";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [equipment, companies] = await Promise.all([
          fetchEquipmentList(),
          fetchApprovedCompanies(),
        ]);
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/pecas", changefreq: "daily", priority: "0.9" },
          { path: "/empresas", changefreq: "weekly", priority: "0.8" },
          { path: "/fornecedores", changefreq: "weekly", priority: "0.7" },
          { path: "/publicar", changefreq: "monthly", priority: "0.5" },
          ...equipment.map((e) => ({
            path: `/pecas/${e.slug}`,
            changefreq: "weekly" as const,
            priority: "0.7",
          })),
          ...companies.map((c) => ({
            path: `/empresas/${c.slug}`,
            changefreq: "weekly" as const,
            priority: "0.6",
          })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
