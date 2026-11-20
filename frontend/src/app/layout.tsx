import type { Metadata } from "next";
import { Poppins, Space_Mono } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--fuente-base",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceMono = Space_Mono({
  variable: "--fuente-mono",
  subsets: ["latin"],
  weight: "700",
});

export const metadata: Metadata = {
  title: {
    default: "¿Quién ganó? — Elecciones 2026",
    template: "%s — ¿Quién ganó?",
  },
  description:
    "Resultados de las Elecciones Regionales y Municipales 2026 del Perú: quién ganó o quiénes van a segunda vuelta en tu región, provincia y distrito.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${poppins.variable} ${spaceMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
