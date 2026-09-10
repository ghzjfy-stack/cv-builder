import type { MetadataRoute } from "next";
import { listCategories } from "./lib/categories";
import { SITE_URL, absUrl } from "./lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absUrl("/templates/"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...listCategories().map((cat) => ({
      url: absUrl(`/templates/${cat.slug}/`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
