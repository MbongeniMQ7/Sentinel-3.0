import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SentinelAI Workforce",
    short_name: "SentinelAI",
    description: "Workforce management, attendance and fatigue monitoring.",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f2a4a",
    icons: [
      { src: "/pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}