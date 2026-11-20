import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PantallaResultados } from "@/components/PantallaResultados";
import { provinciaPorSlug, provincias, regionPorSlug, regiones } from "@/lib/resultados";
import { aSlug } from "@/lib/texto";
import { textoEstadoDatos, vistaProvincia } from "@/lib/vista";

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
  return { title: lugar ? `${lugar.provincia}, ${lugar.region}` : "Provincia no encontrada" };
}

export default async function Page({ params }: PageProps<"/[region]/[provincia]">) {
  const lugar = await buscar(params);
  if (!lugar) notFound();

  return (
    <PantallaResultados
      key={`${lugar.region}|${lugar.provincia}`}
      vista={vistaProvincia(lugar.region, lugar.provincia)}
      estadoDatos={textoEstadoDatos()}
    />
  );
}
