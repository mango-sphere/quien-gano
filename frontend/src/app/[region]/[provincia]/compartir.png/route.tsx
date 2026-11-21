import { imagenLugar } from "@/og/ImagenCompartir";
import { provinciaPorSlug, provincias, regionPorSlug, regiones } from "@/lib/resultados";
import { aSlug } from "@/lib/texto";
import { vistaProvincia } from "@/lib/vista";

export const dynamic = "force-static";

export function generateStaticParams() {
  return regiones().flatMap((region) =>
    provincias(region).map((provincia) => ({ region: aSlug(region), provincia: aSlug(provincia) })),
  );
}

/** Imagen para compartir una provincia: quién ganó la alcaldía provincial. */
export async function GET(_solicitud: Request, { params }: RouteContext<"/[region]/[provincia]/compartir.png">) {
  const slugs = await params;
  const region = regionPorSlug(slugs.region);
  const provincia = region && provinciaPorSlug(region, slugs.provincia);
  if (!region || !provincia) return new Response("Provincia no encontrada", { status: 404 });
  return imagenLugar({
    titulo: provincia,
    cargo: `Alcaldía provincial · ${region}`,
    fila: vistaProvincia(region, provincia).destacada,
  });
}
