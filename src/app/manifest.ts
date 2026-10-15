import type { MetadataRoute } from "next";

// Datos de la app instalable (PWA). Con esto Chrome ofrece «Instalar app» y el APK de Android
// (que envuelve esta misma web) toma el nombre, los iconos y los colores.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Mentes Triunfantes",
    short_name: "Mentes T.",
    description: "Practica de cálculo mental por niveles, a mano y paso a paso",
    lang: "es",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
