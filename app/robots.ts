import type { MetadataRoute } from "next";

// Private committee site: ask search engines not to crawl any of it.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
