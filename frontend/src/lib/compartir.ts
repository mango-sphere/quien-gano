import type { Metadata } from "next";

import { metaDatos } from "./resultados";
import type { Fila } from "./vista";

/** Dominio público. Las redes sociales necesitan URLs completas para la imagen y el enlace. */
export const URL_SITIO = process.env.NEXT_PUBLIC_URL_SITIO ?? "https://quiengano.mangosphere.tech";

export const NOMBRE_SITIO = "¿Quién ganó?";

/** Cada página tiene su imagen en `compartir.png`, generada en el build (ver `src/og/`). */
const ARCHIVO_IMAGEN = "compartir.png";

/**
 * WhatsApp, Facebook y LinkedIn guardan la imagen por días. Con la fecha de los datos en la URL,
 * cada actualización (p. ej. la segunda vuelta) es una imagen nueva para ellos y no reusan la vieja.
 */
const VERSION_DATOS = metaDatos.generadoEn.replace(/\D/g, "").slice(0, 12);

export function imagenCompartir(url: string, alt: string) {
  return { url: `${url}${ARCHIVO_IMAGEN}?v=${VERSION_DATOS}`, width: 1200, height: 630, alt, type: "image/png" };
}

export const DESCRIPCION_SITIO =
  "Resultados de las Elecciones Regionales y Municipales 2026 del Perú: quién ganó o quiénes van a segunda vuelta en tu región, provincia y distrito.";

const porcentaje = (pct: string) => `${pct} %`;

/** Una línea con el resultado: descripción de la vista previa y texto del botón de compartir. */
export function resumenResultado(fila: Fila | undefined, cargo: string): string {
  if (!fila) return `Todavía no hay datos de ${cargo}.`;
  const { a, b } = fila.resultado;
  if (fila.segundaVuelta && b) {
    return `${cargo}: segunda vuelta entre ${a.name} (${a.party}, ${porcentaje(a.pct)}) y ${b.name} (${b.party}, ${porcentaje(b.pct)}).`;
  }
  return `${cargo}: ganó ${a.name} (${a.party}) con ${porcentaje(a.pct)} de los votos válidos.`;
}

/** Título y descripción de la página, repetidos en Open Graph y en la tarjeta de X. */
export function metadatosPagina(titulo: string, descripcion: string, ruta: string): Metadata {
  const tituloCompleto = `${titulo} — ${NOMBRE_SITIO}`;
  // El sitio se publica con trailingSlash: la URL canónica de /cusco es /cusco/.
  const url = ruta.endsWith("/") ? ruta : `${ruta}/`;
  const imagen = imagenCompartir(url, descripcion);
  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: url },
    openGraph: {
      title: tituloCompleto,
      description: descripcion,
      url,
      siteName: NOMBRE_SITIO,
      locale: "es_PE",
      type: "website",
      images: [imagen],
    },
    twitter: { card: "summary_large_image", title: tituloCompleto, description: descripcion, images: [imagen] },
  };
}
