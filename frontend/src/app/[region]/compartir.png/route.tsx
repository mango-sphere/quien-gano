import { imagenLugar } from "@/og/ImagenCompartir";
import { regionPorSlug, regiones } from "@/lib/resultados";
import { aSlug } from "@/lib/texto";
import { vistaRegion } from "@/lib/vista";

export const dynamic = "force-static";

export function generateStaticParams() {
  return regiones().map((region) => ({ region: aSlug(region) }));
}

/** Imagen para compartir una región: su ganador, o los dos que van a segunda vuelta. */
export async function GET(_solicitud: Request, { params }: RouteContext<"/[region]/compartir.png">) {
  const region = regionPorSlug((await params).region);
  if (!region) return new Response("Región no encontrada", { status: 404 });
  return imagenLugar({ titulo: region, cargo: "Gobierno regional", fila: vistaRegion(region).destacada });
}
