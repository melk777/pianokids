import type { MetadataRoute } from "next";
import { getURL } from "@/lib/utils/url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getURL();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/professores", "/contato", "/termos", "/privacidade", "/reembolso"],
      disallow: ["/api/", "/auth/", "/dashboard/", "/login"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
