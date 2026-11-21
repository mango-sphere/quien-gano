import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PantallaResultados } from "@/components/PantallaResultados";
import { metadatosPagina, resumenResultado } from "@/lib/compartir";
import { distritoPorSlug, distritos, provinciaPorSlug, provincias, regionPorSlug, regiones, rutas } from "@/lib/resultados";
import { aSlug } from "@/lib/texto";
import { estadoDatos, vistaDistrito } from "@/lib/vista";

type Params = PageProps<"/[region]/[provincia]/[distrito]">["params"];

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

async function buscar(params: Params) {
  const slugs = await params;
  const region = regionPorSlug(slugs.region);
  const provincia = region && provinciaPorSlug(region, slugs.provincia);
  const distrito = region && provincia && distritoPorSlug(region, provincia, slugs.distrito);
  return region && provincia && distrito ? { region, provincia, distrito } : null;
}

export async function generateMetadata({ params }: PageProps<"/[region]/[provincia]/[distrito]">): Promise<Metadata> {
  const lugar = await buscar(params);
  if (!lugar) return { title: "Distrito no encontrado" };
  const { region, provincia, distrito } = lugar;
  const fila = vistaDistrito(region, provincia, distrito).destacada;
  return metadatosPagina(
    `${distrito}, ${provincia}`,
    resumenResultado(fila, `Alcaldía distrital de ${distrito}`),
    rutas.distrito(region, provincia, distrito),
  );
}

export default async function Page({ params }: PageProps<"/[region]/[provincia]/[distrito]">) {
  const lugar = await buscar(params);
  if (!lugar) notFound();
  const { region, provincia, distrito } = lugar;

  return (
    <PantallaResultados
      key={`${region}|${provincia}|${distrito}`}
      vista={vistaDistrito(region, provincia, distrito)}
      estadoDatos={estadoDatos()}
    />
  );
}
