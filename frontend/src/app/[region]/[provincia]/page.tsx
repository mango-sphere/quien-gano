import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Cargando } from "@/components/Cargando";
import { PantallaResultados } from "@/components/PantallaResultados";
import { provinciaPorSlug, provincias, regionPorSlug, regiones } from "@/lib/resultados";
import { aSlug } from "@/lib/texto";
import { regionesMapa, textoEstadoDatos, vistaProvincia } from "@/lib/vista";

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

export default function Page({ params }: PageProps<"/[region]/[provincia]">) {
  return (
    <Suspense fallback={<Cargando />}>
      <Provincia params={params} />
    </Suspense>
  );
}

async function Provincia({ params }: Pick<PageProps<"/[region]/[provincia]">, "params">) {
  const lugar = await buscar(params);
  if (!lugar) notFound();

  return (
    <PantallaResultados
      vista={vistaProvincia(lugar.region, lugar.provincia)}
      regionesMapa={regionesMapa()}
      estadoDatos={textoEstadoDatos()}
    />
  );
}
