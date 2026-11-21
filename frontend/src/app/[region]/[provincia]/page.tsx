import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PantallaResultados } from "@/components/PantallaResultados";
import { metadatosPagina, resumenResultado } from "@/lib/compartir";
import { provinciaPorSlug, provincias, regionPorSlug, regiones, rutas } from "@/lib/resultados";
import { aSlug } from "@/lib/texto";
import { estadoDatos, vistaProvincia } from "@/lib/vista";

export function generateStaticParams() {
  return regiones().flatMap((region) =>
    provincias(region).map((provincia) => ({ region: aSlug(region), provincia: aSlug(provincia) })),
  );
}

async function buscar(params: PageProps<"/[region]/[provincia]">["params"]) {
  const slugs = await params;
  const region = regionPorSlug(slugs.region);
  const provincia = region && provinciaPorSlug(region, slugs.provincia);
  return region && provincia ? { region, provincia } : null;
}

export async function generateMetadata({ params }: PageProps<"/[region]/[provincia]">): Promise<Metadata> {
  const lugar = await buscar(params);
  if (!lugar) return { title: "Provincia no encontrada" };
  const { region, provincia } = lugar;
  const fila = vistaProvincia(region, provincia).destacada;
  return metadatosPagina(
    `${provincia}, ${region}`,
    resumenResultado(fila, `Alcaldía provincial de ${provincia}`),
    rutas.provincia(region, provincia),
  );
}

export default async function Page({ params }: PageProps<"/[region]/[provincia]">) {
  const lugar = await buscar(params);
  if (!lugar) notFound();

  return (
    <PantallaResultados
      key={`${lugar.region}|${lugar.provincia}`}
      vista={vistaProvincia(lugar.region, lugar.provincia)}
      estadoDatos={estadoDatos()}
    />
  );
}
