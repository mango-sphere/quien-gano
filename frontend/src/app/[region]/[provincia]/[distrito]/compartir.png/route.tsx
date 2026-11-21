import { imagenLugar } from "@/og/ImagenCompartir";
import { distritoPorSlug, distritos, provinciaPorSlug, provincias, regionPorSlug, regiones } from "@/lib/resultados";
import { aSlug } from "@/lib/texto";
import { vistaDistrito } from "@/lib/vista";

export const dynamic = "force-static";

export function generateStaticParams() {
  return regiones().flatMap((region) =>
    provincias(region).flatMap((provincia) =>
      distritos(region, provincia).map((distrito) => ({
        region: aSlug(region),
        provincia: aSlug(provincia),
        distrito: aSlug(distrito),
      })),
    ),
  );
}

/** Imagen para compartir un distrito: quién ganó la alcaldía distrital. */
export async function GET(
  _solicitud: Request,
  { params }: RouteContext<"/[region]/[provincia]/[distrito]/compartir.png">,
) {
  const slugs = await params;
  const region = regionPorSlug(slugs.region);
  const provincia = region && provinciaPorSlug(region, slugs.provincia);
  const distrito = region && provincia && distritoPorSlug(region, provincia, slugs.distrito);
  if (!region || !provincia || !distrito) return new Response("Distrito no encontrado", { status: 404 });
  return imagenLugar({
    titulo: distrito,
    cargo: `Alcaldía distrital · ${provincia}, ${region}`,
    fila: vistaDistrito(region, provincia, distrito).destacada,
  });
}
