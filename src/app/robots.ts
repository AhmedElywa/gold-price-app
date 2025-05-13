import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://gold.ahmedelywa.com/sitemap.xml", // Replace with your actual domain
  };
} 