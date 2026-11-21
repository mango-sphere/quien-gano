import type { Metadata } from "next";
import { Poppins, Space_Mono } from "next/font/google";
import Script from "next/script";
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

/**
 * Cloudflare Web Analytics: cuenta visitas sin cookies ni seguimiento entre sitios. El token solo
 * existe en el build de GitHub Actions, así que en desarrollo y en túneles no se cuenta nada.
 */
const TOKEN_ANALITICA = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

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
        {TOKEN_ANALITICA && (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            // Igual que el fragmento que da Cloudflare.
            type="module"
            // spa: también cuenta las páginas abiertas con navegación del lado del cliente.
            data-cf-beacon={JSON.stringify({ token: TOKEN_ANALITICA, spa: true })}
            strategy="lazyOnload"
          />
        )}
      </body>
    </html>
  );
}
