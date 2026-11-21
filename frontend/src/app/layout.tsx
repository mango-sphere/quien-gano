import type { Metadata } from "next";
import { Poppins, Space_Mono } from "next/font/google";
import { PiePagina } from "@/components/PiePagina";
import { DESCRIPCION_SITIO, imagenCompartir, NOMBRE_SITIO, URL_SITIO } from "@/lib/compartir";

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

const TITULO_INICIO = `${NOMBRE_SITIO} — Elecciones 2026`;
const IMAGEN_INICIO = imagenCompartir("/", DESCRIPCION_SITIO);

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITIO),
  title: {
    default: TITULO_INICIO,
    template: `%s — ${NOMBRE_SITIO}`,
  },
  description: DESCRIPCION_SITIO,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITULO_INICIO,
    description: DESCRIPCION_SITIO,
    url: "/",
    siteName: NOMBRE_SITIO,
    locale: "es_PE",
    type: "website",
    images: [IMAGEN_INICIO],
  },
  twitter: { card: "summary_large_image", title: TITULO_INICIO, description: DESCRIPCION_SITIO, images: [IMAGEN_INICIO] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-scroll-behavior: Next desactiva el desplazamiento suave al cambiar de página; si no,
    // la nueva página puede quedar a mitad de camino (tapada por la barra fija).
    <html lang="es" data-scroll-behavior="smooth" className={`${poppins.variable} ${spaceMono.variable}`}>
      <body>
        {children}
        <PiePagina />
      </body>
    </html>
  );
}
