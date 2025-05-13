import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gold Price in Egypt",
    short_name: "Gold Price",
    description: "Live gold prices in Egypt and around the world. Check the latest gold prices by karat and currency.",
    start_url: "/",
    display: "standalone",
    background_color: "#fcd34d",
    theme_color: "#fbbf24",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-256x256.png",
        sizes: "256x256",
        type: "image/png",
      },
      {
        src: "/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
} 