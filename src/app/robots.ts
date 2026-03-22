/**
 * @fileoverview Robots.txt configuration.
 *
 * Defines crawler access rules for search engines.
 * Allows all pages except admin and API routes.
 *
 * @module app/robots
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots|Next.js Robots}
 */

import { MetadataRoute } from "next";

/**
 * Generate robots.txt configuration.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"], // Private routes
      },
    ],
    sitemap: "https://savecounterstrike.com/sitemap.xml",
  };
}
