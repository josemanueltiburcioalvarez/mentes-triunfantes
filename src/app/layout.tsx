import type { Metadata, Viewport } from "next";
import { Geist_Mono, Nunito } from "next/font/google";
import "./globals.css";
import RegistrarSw from "@/components/registrar-sw";

// Nunito: redondeada y amigable para los estudiantes, sin dejar de verse seria para los padres.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

// Geist Mono se mantiene para los digitos de las operaciones verticales: al ser monoespaciada,
// las cifras quedan alineadas en columna.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mentes Triunfantes",
  description: "Practica de cálculo mental por niveles, a mano y paso a paso",
  applicationName: "Mentes Triunfantes",
  // al instalarla en iPhone se abre como app, con la barra de estado oscura
  appleWebApp: { capable: true, title: "Mentes Triunfantes", statusBarStyle: "black" },
};

// Color de la barra del navegador / de la app en el celular, segun el modo claro u oscuro.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${nunito.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <RegistrarSw />
      </body>
    </html>
  );
}
