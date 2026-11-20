import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PantallaResultados } from "@/components/PantallaResultados";
import { regionPorSlug, regiones } from "@/lib/resultados";
import { aSlug } from "@/lib/texto";
import { textoEstadoDatos, vistaRegion } from "@/lib/vista";

export function generateStaticParams() {
  return regiones().map((region) => ({ region: aSlug(region) }));
}

export async function generateMetadata({ params }: PageProps<"/[region]">): Promise<Metadata> {
  const region = regionPorSlug((await params).region);
  return { title: region ?? "Región no encontrada" };
}

export default async function Page({ params }: PageProps<"/[region]">) {
  const region = regionPorSlug((await params).region);
  if (!region) notFound();

  return (
    <PantallaResultados
      key={region}
      vista={vistaRegion(region)}
      estadoDatos={textoEstadoDatos()}
    />
  );
}
