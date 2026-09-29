import type { Metadata } from "next";
import { Geist_Mono, Nunito } from "next/font/google";
import "./globals.css";

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
  description: "Practica de matematicas por niveles",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
